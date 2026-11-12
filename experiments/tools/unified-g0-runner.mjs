import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

export const DOCKER_CLI = 'docker';
export const MAVEN_CLI = 'mvn';

export function requiredEnvironment(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function resolveEnvironmentConfig(config) {
  return typeof config === 'function' ? config() : config;
}

export function containerProvenance(inspectInfo) {
  if (!inspectInfo?.Id || !inspectInfo?.Image || !inspectInfo?.Config?.Image) {
    throw new Error('Docker inspect response is missing container or image identity.');
  }
  return { containerId: inspectInfo.Id, imageReference: inspectInfo.Config.Image, imageId: inspectInfo.Image, createdAt: inspectInfo.Created };
}

export function readinessEvidence(url, status, validator, checkedAtUtc = new Date().toISOString()) {
  return {
    outcome: 'PASS',
    status,
    endpointPath: new URL(url).pathname,
    validator,
    checkedAtUtc,
  };
}

export function setupEvidence(outcome, exitCode = null, checkedAtUtc = new Date().toISOString(), errorCode = null, signal = null) {
  return { outcome, exitCode, checkedAtUtc, ...(errorCode ? { errorCode } : {}), ...(signal ? { signal } : {}) };
}

export function credentialValuesFrom(...envObjects) {
  return [...new Set(envObjects.flatMap((env) => Object.entries(env || {})
    .filter(([key, value]) => /password|passwd|username|email|(?:^|_)user(?:_|$)|token|secret|api[-_]?key/i.test(key)
      && typeof value === 'string' && value.length > 0)
    .map(([, value]) => value)))];
}

export function findBaselineGherkinBinding(catalog, appId, testClass, catalogPath, catalogSha256) {
  const sourceSuffix = `/src/test/java/${testClass.replaceAll('.', '/')}.java`;
  const unit = (catalog?.units || []).find((entry) => entry.application === appId
    && entry.javaAssertionEvidence?.path?.endsWith(sourceSuffix)
    && entry.gherkinEvidence?.path
    && entry.gherkinEvidence?.blobSha);
  if (!unit) return { status: 'NOT_AVAILABLE', path: 'NOT_AVAILABLE', sha256: 'NOT_AVAILABLE' };
  return {
    status: 'MAPPED',
    path: unit.gherkinEvidence.path,
    sha256: unit.gherkinEvidence.blobSha,
    mappingCatalogPath: catalogPath,
    mappingCatalogSha256: catalogSha256,
    baselineCaseIds: unit.baselineCaseIds || [],
  };
}

export function loginControlsReady(appId, body) {
  if (appId === 'mediawiki') return /id=["']pt-login["']/.test(body);
  if (appId === 'prestashop') return /name=["']email["']/.test(body) && /name=["']passwd["']/.test(body);
  throw new Error(`No login readiness validator is defined for '${appId}'.`);
}

function inspectContainerProvenance(name) {
  const result = JSON.parse(dockerCli(['inspect', name]));
  return containerProvenance(result[0]);
}

export function sanitizeCommandArgv(argv) {
  let redactNext = false;
  return argv.map((rawArg) => {
    const arg = String(rawArg);
    if (redactNext) { redactNext = false; return '<redacted>'; }
    if (/^--?(?:password|passwd|token|secret|api[-_]?key)$/i.test(arg) || /^-D[\w.-]*(?:password|passwd|token|secret|api[-_]?key|username|email)$/i.test(arg)) { redactNext = true; return arg; }
    const equals = arg.indexOf('=');
    if (equals > 0 && /(?:password|passwd|token|secret|api[-_]?key|username|email)/i.test(arg.slice(0, equals))) {
      return arg.slice(0, equals + 1) + '<redacted>';
    }
    return arg.replace(/(https?:\/\/)[^/@\s]+@/i, '$1<redacted>@');
  });
}


export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function validateRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error(`INVALID_RUN_ID: '${runId}' must be 3-63 lowercase alphanumeric/dash characters`);
  }
  return runId;
}

export function labelsForRun(appId, runId) {
  return {
    project: 'bewt-covext',
    owner: 'bewt-covext',
    'managed-by': 'bewt-covext-agent',
    app: appId,
    task: `g0-${appId}`,
    runId,
  };
}

export function labelArgs(labels) {
  return Object.entries(labels).flatMap(([k, v]) => ['--label', `${k}=${v}`]);
}

export function selectLoopbackPort() {
  return new Promise((res, rej) => {
    const s = createServer();
    s.once('error', rej);
    s.listen(0, '127.0.0.1', () => {
      const addr = s.address();
      if (!addr || typeof addr === 'string') {
        s.close();
        rej(new Error('Failed to select loopback port'));
        return;
      }
      const port = addr.port;
      s.close((err) => (err ? rej(err) : res(port)));
    });
  });
}

export function dockerCli(args) {
  return execFileSync(DOCKER_CLI, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function snapshotInventory() {
  const list = (cmd) => {
    try {
      const out = dockerCli(cmd);
      return out ? out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).sort() : [];
    } catch {
      return [];
    }
  };
  return {
    containers: list(['ps', '-aq', '--no-trunc']),
    networks: list(['network', 'ls', '-q', '--no-trunc']),
    volumes: list(['volume', 'ls', '-q']),
    timestamp: new Date().toISOString(),
  };
}

export function probeHttp(url, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    try {
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode || 0, text: () => Promise.resolve(data) }));
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.on('error', (err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
}

export async function waitHttpReady(url, label, timeoutMs = 120000, validator = (body, res) => res.status >= 200 && res.status < 400, validatorName = 'http-status-2xx-3xx') {
  const deadline = Date.now() + timeoutMs;
  let lastErr = '';
  console.log(`[waitHttpReady] Polling ${label} at ${url}...`);
  while (Date.now() < deadline) {
    try {
      const res = await probeHttp(url, 3000);
      const body = await res.text();
      if (validator(body, res)) {
        console.log(`[waitHttpReady] ${label} is ready! HTTP ${res.status}`);
        return readinessEvidence(url, res.status, validatorName);
      }
      lastErr = `HTTP ${res.status}: validator failed`;
    } catch (e) {
      lastErr = e.message;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label} readiness timeout (${timeoutMs}ms): ${lastErr}`);
}

export function sanitizeEvidenceText(text, secretValues = []) {
  let safeText = String(text || '');
  for (const secret of [...new Set(secretValues.filter((value) => typeof value === 'string' && value.length > 0))].sort((a, b) => b.length - a.length)) {
    safeText = safeText.replaceAll(secret, '<REDACTED_CREDENTIAL>');
  }
  return safeText
    .replace(/\bn0tl[\w-]+\b/gi, '<TEST_FIXTURE_SECRET>')
    .replace(/[A-Z]:[\\/][^\r\n"'<>\s]*/gi, '<LOCAL_PATH>')
    .replace(/\/home\/[a-zA-Z0-9._-]+\/[^\r\n"'<>\s]*/g, '<LOCAL_PATH>')
    .replaceAll(REPO_ROOT, '<REPOSITORY_ROOT>')
    .replaceAll(REPO_ROOT.replaceAll('\\', '/'), '<REPOSITORY_ROOT>');
}

export function sanitizeSurefireXml(rawXml) {
  return rawXml
    .replace(/<properties>[\s\S]*?<\/properties>/g, '<properties/>')
    .replace(/<system-out>[\s\S]*?<\/system-out>/g, '<system-out/>')
    .replace(/<system-err>[\s\S]*?<\/system-err>/g, '<system-err/>')
    .replaceAll(REPO_ROOT, '<REPOSITORY_ROOT>')
    .replaceAll(REPO_ROOT.replaceAll('\\', '/'), '<REPOSITORY_ROOT>');
}

export function parseSurefireSummary(xmlContent, expectedClass) {
  const testsMatch = /tests="(\d+)"/.exec(xmlContent);
  const failuresMatch = /failures="(\d+)"/.exec(xmlContent);
  const errorsMatch = /errors="(\d+)"/.exec(xmlContent);
  const skippedMatch = /skipped="(\d+)"/.exec(xmlContent);

  const tests = testsMatch ? parseInt(testsMatch[1], 10) : 0;
  const failures = failuresMatch ? parseInt(failuresMatch[1], 10) : 0;
  const errors = errorsMatch ? parseInt(errorsMatch[1], 10) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

  const outcome = (tests > 0 && failures === 0 && errors === 0) ? 'PASS' : 'FAIL';
  return {
    outcome,
    tests,
    failures,
    errors,
    skipped,
    expectedClass,
  };
}

export const APPS = {
  bludit: {
    appId: 'bludit',
    image: 'bludit/docker:2.3.4@sha256:fa1bfd57ced7638676cef221907cc43d14ec37aa2393e57f2ddd925df3f4fae9',
    appInternalPort: 80,
    suitePath: 'experiments/bludit/bewt-suite',
    testClass: 'tests.AddContentTest',
    installerClass: 'tests.Installer',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remoteUrl',
    getAppUrl: (host, port, appName) => `http://${appName}/admin`,
    installerUrl: (host, port, appName) => `http://${appName}/`,
    testEnv: () => ({ BLUDIT_TEST_USERNAME: requiredEnvironment('BLUDIT_TEST_USERNAME'), BLUDIT_TEST_PASSWORD: requiredEnvironment('BLUDIT_TEST_PASSWORD') }),
  },
  claroline: {
    appId: 'claroline',
    image: 'olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af',
    appInternalPort: 80,
    suitePath: 'experiments/claroline/bewt-suite',
    testClass: 'test.Claroline_AddUserTest',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    appUrlPath: '/claroline11110/claroline/index.php',
    getAppUrl: (host, port, appName) => `http://${appName}/claroline11110/claroline/index.php`,
  },
  expresscart: {
    appId: 'expresscart',
    image: 'bewt-covext/expresscart:1.1.19-b31302f',
    appInternalPort: 1111,
    hasDb: true,
    dbImage: 'mongo:4.4.29',
    dbInternalPort: 27017,
    suitePath: 'experiments/expresscart/bewt-suite',
    testClass: 'tests.AddUserTest',
    appUrlProperty: 'expresscart.baseUrl',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port, appName) => `http://127.0.0.1:${port}`,
    appEnv: (dbHost) => ({
      NODE_ENV: 'production',
      PORT: '1111',
      NODE_PATH: '/var/expressCart',
      databaseConnectionString: `mongodb://${dbHost}:27017/expresscart_experiment`,
    }),
  },
  joomla: {
    appId: 'joomla',
    image: 'joomla:3.10.11@sha256:1cb08c55b99dfe231825291634b814b038f98a85442169d7811731bf43912971',
    appInternalPort: 80,
    hasDb: true,
    dbImage: 'mysql:5.6',
    dbInternalPort: 3306,
    suitePath: 'experiments/joomla/bewt-suite',
    testClass: 'base.AdminLoginTest',
    installerClass: 'base.Installer',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port, appName) => `http://${appName}/`,
    installerUrl: (host, port, appName) => `http://${appName}/`,
    dbEnv: () => ({
      MYSQL_ROOT_PASSWORD: requiredEnvironment('JOOMLA_DB_ROOT_PASSWORD'),
      MYSQL_DATABASE: 'joomla',
    }),
    appEnv: (dbHost) => ({
      JOOMLA_DB_HOST: dbHost,
      JOOMLA_DB_USER: requiredEnvironment('JOOMLA_DB_USER'),
      JOOMLA_DB_PASSWORD: requiredEnvironment('JOOMLA_DB_PASSWORD'),
      JOOMLA_DB_NAME: 'joomla',
    }),
    testEnv: () => ({
      BEWT_ADMIN_USERNAME: requiredEnvironment('BEWT_ADMIN_USERNAME'),
      BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
      BEWT_ADMIN_EMAIL: requiredEnvironment('BEWT_ADMIN_EMAIL'),
      BEWT_ADMIN_PASSWORD_ROTATED: requiredEnvironment('BEWT_ADMIN_PASSWORD_ROTATED'),
      BEWT_DB_USER: requiredEnvironment('JOOMLA_DB_USER'),
      BEWT_DB_PASSWORD: requiredEnvironment('JOOMLA_DB_PASSWORD'),
    }),
  },
  kanboard: {
    appId: 'kanboard',
    image: 'kanboard/kanboard:v1.2.15@sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e',
    appInternalPort: 80,
    suitePath: 'experiments/kanboard/bewt-suite',
    testClass: 'tests.AddNewProject',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port, appName) => `http://${appName}/`,
    testEnv: () => ({ KANBOARD_TEST_USERNAME: requiredEnvironment('KANBOARD_TEST_USERNAME'), KANBOARD_TEST_PASSWORD: requiredEnvironment('KANBOARD_TEST_PASSWORD') }),
    volumes: [
      { suffix: 'data', mount: '/var/www/app/data' },
      { suffix: 'plugins', mount: '/var/www/app/plugins' },
    ],
  },
  mantisbt: {
    appId: 'mantisbt',
    image: 'olianasd/mantisbt-strongpsw:1.2.0@sha256:5c26712d1ade6204613e5a2059d6effbcd0c945bc9a77940b39509ca19d72c01',
    appInternalPort: 80,
    suitePath: 'experiments/mantisbt/bewt-suite',
    testClass: 'base.AddUser',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    appUrlPath: '/mantisbt/',
    getAppUrl: (host, port, appName) => `http://${appName}/mantisbt/`,
    testEnv: () => ({
      BEWT_ADMIN_USERNAME: requiredEnvironment('BEWT_ADMIN_USERNAME'),
      BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
    }),
  },
  mediawiki: {
    appId: 'mediawiki',
    image: 'mediawiki:1.40.0@sha256:5cb83f2b332e05982a8642aff6a4265aa28d11ec66195a2b872cf5f2c234299d',
    appInternalPort: 80,
    hasDb: true,
    dbImage: 'mariadb:10.5',
    dbInternalPort: 3306,
    suitePath: 'experiments/mediawiki/bewt-suite',
    testClass: 'mediawiki.CreatePageTest',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port, appName) => `http://${appName}/`,
    dbEnv: () => ({
      MYSQL_ROOT_PASSWORD: requiredEnvironment('MEDIAWIKI_DB_ROOT_PASSWORD'),
      MYSQL_USER: requiredEnvironment('MEDIAWIKI_DB_USER'),
      MYSQL_PASSWORD: requiredEnvironment('MEDIAWIKI_DB_PASSWORD'),
      MYSQL_DATABASE: 'mediawiki',
    }),
    testEnv: () => ({
      BEWT_ADMIN_USERNAME: requiredEnvironment('BEWT_ADMIN_USERNAME'),
      BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
      BEWT_DB_USER: requiredEnvironment('MEDIAWIKI_DB_USER'),
      BEWT_DB_PASSWORD: requiredEnvironment('MEDIAWIKI_DB_PASSWORD'),
      MEDIAWIKI_DB_INSTALL_USER: requiredEnvironment('MEDIAWIKI_DB_INSTALL_USER'),
    }),
  },
  prestashop: {
    appId: 'prestashop',
    image: 'prestashop/prestashop:1.6.1.23@sha256:c6b779bca959503d25058cec1fa7f6a4cea940694ce099d2e47e4e23a8637b2e',
    appInternalPort: 80,
    hasDb: true,
    dbImage: 'mysql:5.7',
    dbInternalPort: 3306,
    suitePath: 'experiments/prestashop/bewt-suite',
    testClass: 'tests.AddNewCategory',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port, appName) => `http://${appName}/administrator/`,
    dbEnv: () => ({
      MYSQL_ROOT_PASSWORD: requiredEnvironment('PRESTASHOP_DB_ROOT_PASSWORD'),
      MYSQL_USER: requiredEnvironment('PRESTASHOP_DB_USER'),
      MYSQL_PASSWORD: requiredEnvironment('PRESTASHOP_DB_PASSWORD'),
      MYSQL_DATABASE: requiredEnvironment('PRESTASHOP_DB_NAME'),
    }),
    appEnv: (dbHost) => ({
      DB_SERVER: dbHost,
      DB_USER: requiredEnvironment('PRESTASHOP_DB_USER'),
      DB_PASSWD: requiredEnvironment('PRESTASHOP_DB_PASSWORD'),
      DB_NAME: requiredEnvironment('PRESTASHOP_DB_NAME'),
      PS_DEV_MODE: '0',
    }),
    testEnv: () => ({
      BEWT_ADMIN_USERNAME: requiredEnvironment('BEWT_ADMIN_USERNAME'),
      BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
      BEWT_ADMIN_EMAIL: requiredEnvironment('BEWT_ADMIN_EMAIL'),
      BEWT_DB_USER: requiredEnvironment('PRESTASHOP_DB_USER'),
      BEWT_DB_PASSWORD: requiredEnvironment('PRESTASHOP_DB_PASSWORD'),
      BEWT_DB_NAME: requiredEnvironment('PRESTASHOP_DB_NAME'),
      PRESTASHOP_ADMIN_NAME: requiredEnvironment('PRESTASHOP_ADMIN_NAME'),
    }),
  },
};

export async function runG0Workflow(appId, rawRunId, options = {}) {
  const validRunId = validateRunId(rawRunId);
  const cfg = APPS[appId];
  if (!cfg) throw new Error(`UNKNOWN_APP_ID: '${appId}'`);
  const configuredTestEnv = resolveEnvironmentConfig(cfg.testEnv) || {};
  const configuredDbEnv = resolveEnvironmentConfig(cfg.dbEnv) || {};
  const appEnvPreflight = cfg.appEnv ? cfg.appEnv('__BEWT_G0_PREFLIGHT__') : {};
  const evidenceSecrets = credentialValuesFrom(process.env, configuredTestEnv, configuredDbEnv, appEnvPreflight);

  const evidenceDir = resolve(REPO_ROOT, options.evidenceDir || `docs/tasks/g0-evidence/${appId}/${validRunId}`);
  mkdirSync(evidenceDir, { recursive: true });

  const labels = labelsForRun(appId, validRunId);
  const labelsCli = labelArgs(labels);

  const baselineInventory = snapshotInventory();
  writeFileSync(join(evidenceDir, 'docker-before.json'), `${JSON.stringify(baselineInventory, null, 2)}\n`);

  const netName = `bewt-covext-${appId}-${validRunId}-net`;
  const appName = `bewt-covext-${appId}-${validRunId}`;
  const dbName = `bewt-covext-${appId}-db-${validRunId}`;
  const browserName = `bewt-covext-${appId}-selenium-${validRunId}`;

  const createdContainers = [];
  const createdVolumes = [];
  let networkCreated = false;
  let exitCode = 1;
  const runRecord = {
    appId,
    runId: validRunId,
    startedAtUtc: new Date().toISOString(),
    labels,
    containers: [],
    network: null,
    volumes: [],
    readiness: {},
    setupFixtures: {},
  };

  const activeTestClass = options.testClass || cfg.testClass;
  const sourcePath = resolve(REPO_ROOT, cfg.suitePath, 'src/test/java', `${activeTestClass.replaceAll('.', '/')}.java`);
  const sourceConfig = JSON.parse(readFileSync(resolve(REPO_ROOT, `config/apps/${appId}.json`), 'utf8'));
  const repositoryCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  const workingTreeDirty = execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim().length > 0;
  const gherkinCatalogPath = resolve(REPO_ROOT, 'docs/tasks/T04-G/evidence/cat.json');
  const gherkinCatalog = existsSync(gherkinCatalogPath) ? readFileSync(gherkinCatalogPath, 'utf8') : null;
  runRecord.source = {
    repositoryCommit,
    workingTreeDirty,
    runnerSha256: sha256(readFileSync(__filename)),
    applicationSourceCommit: sourceConfig.source?.commit || 'NOT_AVAILABLE',
    applicationVersion: sourceConfig.benchmarkBaseVersion || 'NOT_AVAILABLE',
    applicationImageReference: cfg.image,
    testClass: activeTestClass,
    testSource: existsSync(sourcePath)
      ? { path: sourcePath.slice(REPO_ROOT.length + 1).replaceAll('\\', '/'), sha256: sha256(readFileSync(sourcePath)) }
      : { path: 'NOT_AVAILABLE', sha256: 'NOT_AVAILABLE' },
    baselineGherkin: gherkinCatalog
      ? findBaselineGherkinBinding(JSON.parse(gherkinCatalog), appId, activeTestClass, 'docs/tasks/T04-G/evidence/cat.json', sha256(gherkinCatalog))
      : { status: 'NOT_AVAILABLE', path: 'NOT_AVAILABLE', sha256: 'NOT_AVAILABLE' },
  };

  try {
    // 1. Create network
    dockerCli(['network', 'create', ...labelsCli, netName]);
    networkCreated = true;
    const netInfo = JSON.parse(dockerCli(['network', 'inspect', netName]))[0];
    runRecord.network = { id: netInfo.Id, name: netName };

    // 2. Named volumes if any
    if (cfg.volumes) {
      for (const vol of cfg.volumes) {
        const vName = `bewt-covext-${appId}-${vol.suffix}-${validRunId}`;
        dockerCli(['volume', 'create', ...labelsCli, vName]);
        createdVolumes.push(vName);
        runRecord.volumes.push({ name: vName, mount: vol.mount });
      }
    }

    // 3. Start DB container if needed
    if (cfg.hasDb) {
      const dbEnvArgs = Object.entries(configuredDbEnv).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
      dockerCli([
        'run', '-d',
        '--name', dbName,
        '--network', netName,
        ...labelsCli,
        ...dbEnvArgs,
        cfg.dbImage,
      ]);
      createdContainers.push(dbName);
      runRecord.containers.push({ role: 'db', name: dbName, ...inspectContainerProvenance(dbName) });
      // Wait for DB port to accept connections inside network
      await new Promise((r) => setTimeout(r, 12000));
    }

    // 4. Allocate ports and start App and Selenium containers
    const appPort = await selectLoopbackPort();
    const browserPort = await selectLoopbackPort();
    runRecord.appPort = appPort;
    runRecord.browserPort = browserPort;

    // Browser container
    dockerCli([
      'run', '-d',
      '--name', browserName,
      '--network', netName,
      '-p', `127.0.0.1:${browserPort}:4444`,
      '-e', 'SE_NODE_MAX_SESSIONS=1',
      '-e', 'SCREEN_WIDTH=1920',
      '-e', 'SCREEN_HEIGHT=1080',
      ...labelsCli,
      'selenium/standalone-chrome:latest',
    ]);
    createdContainers.push(browserName);
    runRecord.containers.push({ role: 'browser', name: browserName, port: browserPort, ...inspectContainerProvenance(browserName) });

    // App container
    const appEnvObj = cfg.appEnv ? cfg.appEnv(dbName) : {};
    const appEnvArgs = Object.entries(appEnvObj).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
    const volArgs = (cfg.volumes || []).flatMap((v) => {
      const vName = `bewt-covext-${appId}-${v.suffix}-${validRunId}`;
      return ['-v', `${vName}:${v.mount}`];
    });

    if (appId === 'claroline') {
      // Claroline start
      dockerCli([
        'run', '-d',
        '--name', appName,
        '--network', netName,
        '-p', `127.0.0.1:${appPort}:${cfg.appInternalPort}`,
        ...labelsCli,
        cfg.image,
        '/bin/sh', '-c', './run-services-docker.sh bash && sleep infinity',
      ]);
    } else {
      dockerCli([
        'run', '-d',
        '--name', appName,
        '--network', netName,
        '-p', `127.0.0.1:${appPort}:${cfg.appInternalPort}`,
        ...labelsCli,
        ...appEnvArgs,
        ...volArgs,
        cfg.image,
      ]);
    }
    createdContainers.push(appName);
    runRecord.containers.push({ role: 'app', name: appName, port: appPort, ...inspectContainerProvenance(appName) });

    // 5. Readiness verification
    const seleniumStatusUrl = `http://127.0.0.1:${browserPort}/status`;
    runRecord.readiness.selenium = {
      ...await waitHttpReady(seleniumStatusUrl, 'Selenium', 90000, (body) => {
      try {
        return JSON.parse(body)?.value?.ready === true;
      } catch {
        return false;
      }
      }, 'selenium-status-value-ready'),
      completedBeforeMaven: true,
    };

    const hostAppProbeUrl = `http://127.0.0.1:${appPort}${cfg.appUrlPath || '/'}`;
    runRecord.readiness.appHttp = {
      ...await waitHttpReady(hostAppProbeUrl, `${appId} App`, 120000),
      completedBeforeMaven: true,
    };

    // 6. Application-specific setup fixtures
    if (appId === 'mediawiki') {
      try {
        dockerCli([
          'exec', appName,
          'php', 'maintenance/install.php',
          '--dbserver', dbName,
          '--dbtype', 'mysql',
          '--dbname', 'mediawiki',
          '--dbuser', requiredEnvironment('MEDIAWIKI_DB_USER'),
          '--dbpass', requiredEnvironment('MEDIAWIKI_DB_PASSWORD'),
          '--installdbuser', requiredEnvironment('MEDIAWIKI_DB_INSTALL_USER'),
          '--installdbpass', requiredEnvironment('MEDIAWIKI_DB_ROOT_PASSWORD'),
          '--pass', requiredEnvironment('BEWT_ADMIN_PASSWORD'),
          '--scriptpath', '',
          '--server', `http://${appName}`,
          'E2E Web Testing wiki',
          requiredEnvironment('BEWT_ADMIN_USERNAME'),
        ]);
        dockerCli([
          'exec', appName,
          'bash', '-c',
          'echo "wfLoadExtension( \'WikiEditor\' );" >> /var/www/html/LocalSettings.php && echo "wfLoadExtension( \'VisualEditor\' );" >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-enable"] = 1;\' >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-hidebetawelcome"] = 1;\' >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-welcomedialog"] = 0;\' >> /var/www/html/LocalSettings.php'
        ]);
        runRecord.setupFixtures.mediawiki = setupEvidence('PASS', 0);
      } catch (e) {
        runRecord.setupFixtures.mediawiki = setupEvidence('FAIL', Number.isInteger(e.status) ? e.status : null, new Date().toISOString(), typeof e.code === 'string' ? e.code : null);
        throw new Error('MediaWiki setup fixture failed. See per-run setup state and sanitized app/DB logs.');
      }
    } else if (appId === 'prestashop') {
      try {
        dockerCli([
          'exec', appName,
          'php', '/var/www/html/install/index_cli.php',
          `--db_server=${dbName}`,
          `--db_user=${requiredEnvironment("PRESTASHOP_DB_USER")}`,
          `--db_password=${requiredEnvironment("PRESTASHOP_DB_PASSWORD")}`,
          `--db_name=${requiredEnvironment("PRESTASHOP_DB_NAME")}`,
          '--db_create=1',
          `--domain=${appName}`,
          `--name=${requiredEnvironment("PRESTASHOP_ADMIN_NAME")}`,
          `--email=${requiredEnvironment("BEWT_ADMIN_EMAIL")}`,
          `--password=${requiredEnvironment("BEWT_ADMIN_PASSWORD")}`,
        ]);
        dockerCli(['exec', appName, 'rm', '-rf', '/var/www/html/install']);
        dockerCli(['exec', appName, 'mv', '/var/www/html/admin', '/var/www/html/administrator']);
        runRecord.setupFixtures.prestashop = setupEvidence('PASS', 0);
      } catch (e) {
        runRecord.setupFixtures.prestashop = setupEvidence('FAIL', Number.isInteger(e.status) ? e.status : null, new Date().toISOString(), typeof e.code === 'string' ? e.code : null);
        throw new Error('PrestaShop setup fixture failed. See per-run setup state and sanitized app/DB logs.');
      }
    } else if (appId === 'expresscart') {
      try {
        dockerCli(['exec', appName, 'npm', 'run', 'testdata']);
        dockerCli([
          'exec', appName,
          'node', '-e',
          "const bcrypt = require('bcryptjs'); const { MongoClient } = require('mongodb'); MongoClient.connect(process.env.databaseConnectionString, { useNewUrlParser: true, useUnifiedTopology: true }).then(async client => { await client.db('expresscart_experiment').collection('users').updateOne({ userEmail: 'owner@test.com' }, { $set: { userPassword: bcrypt.hashSync('e2eW3Bt3s71nGB3nchM4rK', 10) } }); await client.close(); });",
        ]);
      } catch (e) {
        console.error(`ExpressCart fixture error: ${e.message}`);
      }
    } else if (appId === 'bludit') {
      if (cfg.installerClass) {
        const instUrl = cfg.installerUrl ? cfg.installerUrl('127.0.0.1', appPort, appName) : `http://${appName}/`;
        const instArgs = [
          '-B',
          '-f', `${cfg.suitePath}/pom.xml`,
          `-Dtest=${cfg.installerClass}`,
          `-D${cfg.appUrlProperty}=${instUrl}`,
          `-D${cfg.webdriverUrlProperty}=http://127.0.0.1:${browserPort}/wd/hub`,
          'test',
        ];
        const instRes = spawnSync(MAVEN_CLI, instArgs, {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          env: {
            ...process.env,
            ...configuredTestEnv,
            BEWT_APP_URL: instUrl,
            BEWT_WEBDRIVER_URL: `http://127.0.0.1:${browserPort}/wd/hub`,
          },
          timeout: 180000,
        });
        writeFileSync(join(evidenceDir, 'installer-maven.stdout.log'), sanitizeEvidenceText(instRes.stdout, evidenceSecrets));
        writeFileSync(join(evidenceDir, 'installer-maven.stderr.log'), sanitizeEvidenceText(instRes.stderr, evidenceSecrets));
        runRecord.setupFixtures.installer = setupEvidence(instRes.status === 0 ? 'PASS' : 'FAIL', instRes.status, undefined, instRes.error?.code || null, instRes.signal);
        if (instRes.status !== 0) throw new Error('Bludit Maven installer failed. See installer exit state and sanitized logs.');
      }
    } else if (appId === 'joomla') {
      if (cfg.installerClass) {
        const instUrl = cfg.installerUrl ? cfg.installerUrl('127.0.0.1', appPort, appName) : `http://${appName}/`;
        const instArgs = [
          '-B',
          '-f', `${cfg.suitePath}/pom.xml`,
          `-Dtest=${cfg.installerClass}`,
          `-D${cfg.appUrlProperty}=${instUrl}`,
          `-D${cfg.webdriverUrlProperty}=http://127.0.0.1:${browserPort}/wd/hub`,
          'test',
        ];
        const instRes = spawnSync(MAVEN_CLI, instArgs, {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          env: {
            ...process.env,
            ...configuredTestEnv,
            BEWT_INSTALL_URL: instUrl,
            BEWT_APP_URL: instUrl,
            BEWT_WEBDRIVER_URL: `http://127.0.0.1:${browserPort}/wd/hub`,
            BEWT_DB_HOST: dbName,
            BEWT_DB_NAME: 'joomla',
          },
          timeout: 180000,
        });
        writeFileSync(join(evidenceDir, 'installer-maven.stdout.log'), sanitizeEvidenceText(instRes.stdout, evidenceSecrets));
        writeFileSync(join(evidenceDir, 'installer-maven.stderr.log'), sanitizeEvidenceText(instRes.stderr, evidenceSecrets));
        runRecord.setupFixtures.installer = setupEvidence(instRes.status === 0 ? 'PASS' : 'FAIL', instRes.status, undefined, instRes.error?.code || null, instRes.signal);
        if (instRes.status !== 0) throw new Error('Joomla Maven installer failed. See installer exit state and sanitized logs.');
        try {
          dockerCli(['exec', appName, 'rm', '-rf', '/var/www/html/installation']);
        } catch {}
      }
    }

    // 7. Execute Base Selenium smoke test
    const targetAppUrl = cfg.getAppUrl
      ? cfg.getAppUrl('127.0.0.1', appPort, appName)
      : `http://127.0.0.1:${appPort}/`;
    const remoteWebdriverUrl = `http://127.0.0.1:${browserPort}/wd/hub`;

    if (appId === 'mediawiki' || appId === 'prestashop') {
      const loginReadyValidator = (body) => loginControlsReady(appId, body);
      const loginValidatorName = appId === 'mediawiki'
        ? 'mediawiki-installed-login-link'
        : 'prestashop-admin-email-and-password-controls';
      runRecord.readiness.appLogin = {
        ...await waitHttpReady(targetAppUrl, `${appId} login controls`, 120000, loginReadyValidator, loginValidatorName),
        completedBeforeMaven: true,
      };
    }

    const testEnvVars = {
      ...process.env,
      ...configuredTestEnv,
      BEWT_APP_URL: targetAppUrl,
      BEWT_WEBDRIVER_URL: remoteWebdriverUrl,
      BEWT_DB_HOST: cfg.hasDb ? dbName : '127.0.0.1',
      BEWT_DB_NAME: configuredTestEnv.BEWT_DB_NAME || cfg.appId,
    };

    const mavenStartTime = Date.now();
    const mvnArgs = [
      '-B',
      '-f', `${cfg.suitePath}/pom.xml`,
      `-Dtest=${activeTestClass}`,
      `-D${cfg.appUrlProperty}=${targetAppUrl}`,
      `-D${cfg.webdriverUrlProperty}=${remoteWebdriverUrl}`,
      'clean', 'test',
    ];

    const mvnRes = spawnSync(MAVEN_CLI, mvnArgs, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: testEnvVars,
      timeout: 300000,
    });

    writeFileSync(join(evidenceDir, 'maven.stdout.log'), sanitizeEvidenceText(mvnRes.stdout, evidenceSecrets));
    writeFileSync(join(evidenceDir, 'maven.stderr.log'), sanitizeEvidenceText(mvnRes.stderr, evidenceSecrets));
    runRecord.maven = {
      executable: MAVEN_CLI,
      argv: sanitizeCommandArgv(mvnArgs),
      cwd: '.',
      cwdBase: 'repository root',
      exitCode: mvnRes.status,
      signal: mvnRes.signal,
    };
    writeFileSync(join(evidenceDir, 'maven-exit.json'), JSON.stringify(runRecord.maven, null, 2));

    // 8. Capture and sanitize Surefire JUnit report
    const surefireXmlName = `TEST-${activeTestClass}.xml`;
    const surefirePath = resolve(REPO_ROOT, cfg.suitePath, 'target/surefire-reports', surefireXmlName);

    let junitOutcome = 'NOT_FOUND';
    let surefireSummary = null;
    if (existsSync(surefirePath) && statSync(surefirePath).mtimeMs >= mavenStartTime - 1000) {
      const rawXml = readFileSync(surefirePath, 'utf8');
      const safeXml = sanitizeSurefireXml(rawXml);
      writeFileSync(join(evidenceDir, surefireXmlName), safeXml);

      surefireSummary = parseSurefireSummary(rawXml, activeTestClass);
      junitOutcome = surefireSummary.outcome;

      writeFileSync(join(evidenceDir, 'surefire-hash.json'), JSON.stringify({
        originalXmlSha256: sha256(rawXml),
        sanitizedXmlSha256: sha256(safeXml),
      }, null, 2));
    }
    writeFileSync(join(evidenceDir, 'junit-result.json'), JSON.stringify({
      outcome: junitOutcome,
      summary: surefireSummary,
    }, null, 2));

    if (mvnRes.status === 0 && junitOutcome === 'PASS') {
      exitCode = 0;
    }
  } catch (err) {
    const safeFailure = sanitizeEvidenceText(`${err.name}: ${err.message}\n${err.stack || ''}`, evidenceSecrets);
    console.error(`[runG0Workflow ERROR] ${appId}:`, safeFailure);
    writeFileSync(join(evidenceDir, 'run-failure.txt'), safeFailure);
  } finally {
    // 9. Fail-closed cleanup
    const cleanupReport = {
      runId: validRunId,
      appId,
      stoppedContainers: [],
      removedContainers: [],
      removedVolumes: [],
      removedNetwork: null,
      zeroResidualVerified: false,
    };

    // Discover all attached volumes (including anonymous volumes) before removing containers
    for (const c of createdContainers) {
      try {
        const out = dockerCli(['inspect', c, '--format', '{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}}\n{{end}}{{end}}']);
        const vNames = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        for (const vn of vNames) {
          if (!createdVolumes.includes(vn)) createdVolumes.push(vn);
        }
      } catch {}
    }

    runRecord.containerLogs = [];
    const roleByContainerName = new Map([[dbName, 'db'], [appName, 'app'], [browserName, 'browser']]);
    for (const name of createdContainers) {
      const container = runRecord.containers.find((entry) => entry.name === name) || { name, role: roleByContainerName.get(name) || 'unknown' };
      const fileName = `container-${container.role}.log`;
      try {
        const logs = dockerCli(['logs', '--timestamps', name]);
        const safeLogs = sanitizeEvidenceText(logs, evidenceSecrets);
        writeFileSync(join(evidenceDir, fileName), safeLogs);
        runRecord.containerLogs.push({ role: container.role, name, outcome: 'CAPTURED', path: fileName, sha256: sha256(safeLogs) });
      } catch (e) {
        runRecord.containerLogs.push({ role: container.role, name, outcome: 'CAPTURE_FAILED', errorCode: typeof e.code === 'string' ? e.code : 'DOCKER_LOGS_FAILED' });
      }
    }

    for (const c of createdContainers) {
      try {
        dockerCli(['stop', c]);
        cleanupReport.stoppedContainers.push(c);
      } catch {}
      try {
        dockerCli(['rm', '-f', '-v', c]);
        cleanupReport.removedContainers.push(c);
      } catch {}
    }

    for (const v of createdVolumes) {
      try {
        dockerCli(['volume', 'rm', '-f', v]);
        cleanupReport.removedVolumes.push(v);
      } catch {}
    }

    if (networkCreated) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          dockerCli(['network', 'rm', netName]);
          cleanupReport.removedNetwork = netName;
          break;
        } catch (e) {
          if (attempt === 4) {
            console.error(`[cleanup] Failed to remove network ${netName}: ${e.message}`);
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    // Verify inventory returns to zero residual with retry backoff to avoid kernel race
    await new Promise((r) => setTimeout(r, 500));
    let postInventory = snapshotInventory();
    let residualContainers = postInventory.containers.filter((c) => !baselineInventory.containers.includes(c));
    let residualNetworks = postInventory.networks.filter((n) => !baselineInventory.networks.includes(n));
    let residualVolumes = postInventory.volumes.filter((v) => !baselineInventory.volumes.includes(v));

    for (let retry = 0; retry < 5 && (residualContainers.length > 0 || residualNetworks.length > 0 || residualVolumes.length > 0); retry++) {
      await new Promise((r) => setTimeout(r, 1000));
      postInventory = snapshotInventory();
      residualContainers = postInventory.containers.filter((c) => !baselineInventory.containers.includes(c));
      residualNetworks = postInventory.networks.filter((n) => !baselineInventory.networks.includes(n));
      residualVolumes = postInventory.volumes.filter((v) => !baselineInventory.volumes.includes(v));
    }

    cleanupReport.residualContainers = residualContainers;
    cleanupReport.residualNetworks = residualNetworks;
    cleanupReport.residualVolumes = residualVolumes;
    cleanupReport.zeroResidualVerified = (
      residualContainers.length === 0 &&
      residualNetworks.length === 0 &&
      residualVolumes.length === 0
    );
    cleanupReport.outcome = cleanupReport.zeroResidualVerified ? 'PASS' : 'FAIL_RESIDUALS_EXIST';
    console.log(`[runG0Workflow] ${appId} cleanup finished. zeroResidualVerified:`, cleanupReport.zeroResidualVerified);

    writeFileSync(join(evidenceDir, 'cleanup-result.json'), JSON.stringify(cleanupReport, null, 2));
    writeFileSync(join(evidenceDir, 'run-record.json'), JSON.stringify(runRecord, null, 2));
  }

  return {
    appId,
    runId: validRunId,
    exitCode,
    outcome: exitCode === 0 ? 'PASS' : 'FAIL',
    evidenceDir,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  const appId = process.argv[2] || '';
  const runId = process.argv[3] || '';
  if (!appId || !runId) {
    console.error('Usage: node unified-g0-runner.mjs <appId> <runId>');
    process.exit(1);
  }
  runG0Workflow(appId, runId)
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
