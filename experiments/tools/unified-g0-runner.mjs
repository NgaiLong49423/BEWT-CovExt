import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { createServer } from 'node:net';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

export const DOCKER_CLI = 'docker';
export const MAVEN_CLI = 'mvn';

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

export async function waitHttpReady(url, label, timeoutMs = 120000, validator = (body, res) => res.status >= 200 && res.status < 400) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = '';
  console.log(`[waitHttpReady] Polling ${label} at ${url}...`);
  while (Date.now() < deadline) {
    try {
      const res = await probeHttp(url, 3000);
      const body = await res.text();
      if (validator(body, res)) {
        console.log(`[waitHttpReady] ${label} is ready! HTTP ${res.status}`);
        return { outcome: 'PASS', status: res.status, url };
      }
      lastErr = `HTTP ${res.status}: validator failed`;
    } catch (e) {
      lastErr = e.message;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label} readiness timeout (${timeoutMs}ms): ${lastErr}`);
}

export function sanitizeEvidenceText(text) {
  return String(text || '')
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

export function requireExpressCartAdminCredentials(env = process.env) {
  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;
  if (typeof adminEmail !== 'string' || adminEmail.trim() === '') {
    throw new Error('MISSING_REQUIRED_ENV: ADMIN_EMAIL');
  }
  if (typeof adminPassword !== 'string' || adminPassword.trim() === '') {
    throw new Error('MISSING_REQUIRED_ENV: ADMIN_PASSWORD');
  }
  return { ADMIN_EMAIL: adminEmail, ADMIN_PASSWORD: adminPassword };
}

export function resolveTestEnv(cfg, env = process.env) {
  if (typeof cfg.testEnv === 'function') return cfg.testEnv(env);
  return cfg.testEnv || {};
}

export function buildTrustedMavenRuntime(env = process.env, platform = process.platform) {
  const configuredExecutable = env.BEWT_MAVEN_EXECUTABLE;
  if (typeof configuredExecutable !== 'string' || !isAbsolute(configuredExecutable)) {
    throw new Error('MISSING_OR_INVALID_ENV: BEWT_MAVEN_EXECUTABLE must be an absolute path');
  }

  let executable;
  try {
    executable = realpathSync(configuredExecutable);
  } catch {
    throw new Error('INVALID_MAVEN_EXECUTABLE: configured path does not exist');
  }
  const executableStat = statSync(executable);
  if (!executableStat.isFile() || (platform !== 'win32' && ((executableStat.mode & 0o111) === 0 || (executableStat.mode & 0o022) !== 0))) {
    throw new Error('INVALID_MAVEN_EXECUTABLE: path must be an executable file');
  }

  const executableDirectory = dirname(executable);
  const trustedDirectories = [];
  const addTrustedDirectory = (directory) => {
    if (!isAbsolute(directory) || !existsSync(directory) || !statSync(directory).isDirectory()) return;
    const directoryStat = statSync(directory);
    const ownerWritableByRunner = typeof process.getuid === 'function'
      && directoryStat.uid === process.getuid()
      && (directoryStat.mode & 0o200) !== 0;
    if (platform !== 'win32' && ((directoryStat.mode & 0o022) !== 0 || ownerWritableByRunner)) {
      throw new Error('UNTRUSTED_RUNTIME_DIRECTORY: child PATH contains a writable directory');
    }
    if (!trustedDirectories.includes(directory)) trustedDirectories.push(directory);
  };

  addTrustedDirectory(executableDirectory);

  const javaHome = env.JAVA_HOME;
  if (javaHome) {
    if (!isAbsolute(javaHome)) throw new Error('INVALID_JAVA_HOME: JAVA_HOME must be an absolute path');
    addTrustedDirectory(join(javaHome, 'bin'));
  } else if (platform === 'win32') {
    throw new Error('MISSING_REQUIRED_ENV: JAVA_HOME');
  }

  const systemDirectories = platform === 'win32'
    ? [join(env.SystemRoot || env.WINDIR || 'C:\\Windows', 'System32')]
    : ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/usr/bin', '/sbin', '/bin'];
  for (const directory of systemDirectories) addTrustedDirectory(directory);

  if (trustedDirectories.length === 0) throw new Error('UNTRUSTED_RUNTIME_PATH: no trusted child PATH directories found');
  return {
    executable,
    path: trustedDirectories.join(platform === 'win32' ? ';' : ':'),
    shell: platform === 'win32' && /\.(cmd|bat)$/i.test(executable),
  };
}

function runInstallerMaven({ cfg, appPort, browserPort, appName, appTestEnv, evidenceDir, includeInstallUrlEnv = false, appSpecificEnv = {} }) {
  const installUrl = cfg.installerUrl
    ? cfg.installerUrl('127.0.0.1', appPort, appName)
    : `http://${appName}/`;
  const webdriverUrl = `http://127.0.0.1:${browserPort}/wd/hub`;
  const args = [
    '-B',
    '-f', `${cfg.suitePath}/pom.xml`,
    `-Dtest=${cfg.installerClass}`,
    `-D${cfg.appUrlProperty}=${installUrl}`,
    `-D${cfg.webdriverUrlProperty}=${webdriverUrl}`,
    'test',
  ];
  const mavenRuntime = buildTrustedMavenRuntime();
  const childEnv = {
    ...process.env,
    ...appTestEnv,
    ...(includeInstallUrlEnv ? { BEWT_INSTALL_URL: installUrl } : {}),
    ...appSpecificEnv,
    BEWT_APP_URL: installUrl,
    BEWT_WEBDRIVER_URL: webdriverUrl,
  };
  for (const key of Object.keys(childEnv)) {
    if (key.toLowerCase() === 'path') delete childEnv[key];
  }
  childEnv.PATH = mavenRuntime.path;
  const result = spawnSync(mavenRuntime.executable, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: mavenRuntime.shell,
    env: childEnv,
    timeout: 180000,
  });
  writeFileSync(join(evidenceDir, 'installer-maven.stdout.log'), sanitizeEvidenceText(result.stdout));
  writeFileSync(join(evidenceDir, 'installer-maven.stderr.log'), sanitizeEvidenceText(result.stderr));
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
    testEnv: { BLUDIT_TEST_PASSWORD: 'n0tl34k1ngP4ssw0rd' },
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
    testEnv: requireExpressCartAdminCredentials,
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
    dbEnv: {
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_DATABASE: 'joomla',
    },
    appEnv: (dbHost) => ({
      JOOMLA_DB_HOST: dbHost,
      JOOMLA_DB_USER: 'root',
      JOOMLA_DB_PASSWORD: 'root',
      JOOMLA_DB_NAME: 'joomla',
    }),
    testEnv: {
      BEWT_ADMIN_USERNAME: 'administrator',
      BEWT_ADMIN_PASSWORD: 'e2eW3Bt3s71nGB3nchM4rK',
      BEWT_ADMIN_EMAIL: 'admin@example.com',
      BEWT_ADMIN_PASSWORD_ROTATED: 'e2eW3Bt3s71nGB3nchM4rK',
    },
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
    testEnv: { KANBOARD_TEST_PASSWORD: 'admin' },
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
    testEnv: {
      BEWT_ADMIN_USERNAME: 'administrator',
      BEWT_ADMIN_PASSWORD: 'e2eW3Bt3s71nGB3nchM4rK',
    },
  },
  mediawiki: {
    appId: 'mediawiki',
    image: 'mediawiki:1.40.0@sha256:5cb83f2b332e05982a8642aff6a4265aa28d11ec66195a2b872cf5f2c234299d',
    appInternalPort: 80,
    hasDb: true,
    dbImage: 'mariadb:10.5',
    dbInternalPort: 3306,
    suitePath: 'experiments/mediawiki/bewt-suite',
    testClass: 'mediawiki.CreateUserTest',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port, appName) => `http://${appName}/`,
    dbEnv: {
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_DATABASE: 'mediawiki',
    },
    testEnv: {
      BEWT_ADMIN_USERNAME: 'Admin',
      BEWT_ADMIN_PASSWORD: 'adminpassword123',
    },
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
    dbEnv: {
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_DATABASE: 'prestashop',
    },
    appEnv: (dbHost) => ({
      DB_SERVER: dbHost,
      DB_USER: 'root',
      DB_PASSWD: 'root',
      DB_NAME: 'prestashop',
      PS_DEV_MODE: '0',
    }),
    testEnv: {
      BEWT_ADMIN_USERNAME: 'admin@prestashop.com',
      BEWT_ADMIN_PASSWORD: 'adminpassword123',
      BEWT_ADMIN_EMAIL: 'admin@prestashop.com',
    },
  },
};

export async function runG0Workflow(appId, rawRunId, options = {}) {
  const validRunId = validateRunId(rawRunId);
  const cfg = APPS[appId];
  if (!cfg) throw new Error(`UNKNOWN_APP_ID: '${appId}'`);
  // Resolve required app credentials before creating evidence or touching Docker.
  const appTestEnv = resolveTestEnv(cfg);

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
      const dbEnvArgs = Object.entries(cfg.dbEnv || {}).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
      dockerCli([
        'run', '-d',
        '--name', dbName,
        '--network', netName,
        ...labelsCli,
        ...dbEnvArgs,
        cfg.dbImage,
      ]);
      createdContainers.push(dbName);
      runRecord.containers.push({ role: 'db', name: dbName });
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
    runRecord.containers.push({ role: 'browser', name: browserName, port: browserPort });

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
    runRecord.containers.push({ role: 'app', name: appName, port: appPort });

    // 5. Readiness verification
    const seleniumStatusUrl = `http://127.0.0.1:${browserPort}/status`;
    await waitHttpReady(seleniumStatusUrl, 'Selenium', 90000, (body) => {
      try {
        return JSON.parse(body)?.value?.ready === true;
      } catch {
        return false;
      }
    });

    const hostAppProbeUrl = `http://127.0.0.1:${appPort}${cfg.appUrlPath || '/'}`;
    await waitHttpReady(hostAppProbeUrl, `${appId} App`, 120000);

    // 6. Application-specific setup fixtures
    if (appId === 'mediawiki') {
      try {
        dockerCli([
          'exec', appName,
          'php', 'maintenance/install.php',
          '--dbserver', dbName,
          '--dbtype', 'mysql',
          '--dbname', 'mediawiki',
          '--dbuser', 'root',
          '--dbpass', 'root',
          '--installdbuser', 'root',
          '--installdbpass', 'root',
          '--pass', 'adminpassword123',
          '--scriptpath', '',
          '--server', `http://${appName}`,
          'E2E Web Testing wiki',
          'Admin',
        ]);
        dockerCli([
          'exec', appName,
          'bash', '-c',
          'echo "wfLoadExtension( \'WikiEditor\' );" >> /var/www/html/LocalSettings.php && echo "wfLoadExtension( \'VisualEditor\' );" >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-enable"] = 1;\' >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-hidebetawelcome"] = 1;\' >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-welcomedialog"] = 0;\' >> /var/www/html/LocalSettings.php'
        ]);
      } catch (e) {
        console.error(`MediaWiki fixture error: ${e.message}`);
      }
    } else if (appId === 'prestashop') {
      try {
        dockerCli([
          'exec', appName,
          'php', '/var/www/html/install/index_cli.php',
          `--db_server=${dbName}`,
          '--db_user=root',
          '--db_password=root',
          '--db_name=prestashop',
          '--db_create=1',
          `--domain=${appName}`,
          '--name=PrestaShop',
          '--email=admin@prestashop.com',
          '--password=adminpassword123',
        ]);
        dockerCli(['exec', appName, 'rm', '-rf', '/var/www/html/install']);
        dockerCli(['exec', appName, 'mv', '/var/www/html/admin', '/var/www/html/administrator']);
      } catch (e) {
        console.error(`PrestaShop fixture error: ${e.message}`);
      }
    } else if (appId === 'expresscart') {
      try {
        dockerCli(['exec', appName, 'npm', 'run', 'testdata']);
        dockerCli([
          'exec', '-e', 'ADMIN_EMAIL', '-e', 'ADMIN_PASSWORD', appName,
          'node', '-e',
"const bcrypt = require('bcryptjs'); const { MongoClient } = require('mongodb'); const email = process.env.ADMIN_EMAIL; const password = process.env.ADMIN_PASSWORD; if (!email || !email.trim() || !password || !password.trim()) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required'); MongoClient.connect(process.env.databaseConnectionString, { useNewUrlParser: true, useUnifiedTopology: true }).then(async client => { try { const result = await client.db('expresscart_experiment').collection('users').updateOne({ isOwner: true }, { $set: { userEmail: email, userPassword: bcrypt.hashSync(password, 10) } }); if (result.matchedCount !== 1 && result.result?.n !== 1) throw new Error('Expected exactly one seeded owner account'); } finally { await client.close(); } }).catch(error => { console.error('ExpressCart credential fixture failed:', error.message); process.exitCode = 1; });",
        ]);
      } catch (e) {
        console.error(`ExpressCart fixture error: ${e.message}`);
        throw e;
      }
    } else if (appId === 'bludit') {
      if (cfg.installerClass) {
        runInstallerMaven({ cfg, appPort, browserPort, appName, appTestEnv, evidenceDir });
      }
    } else if (appId === 'joomla') {
      if (cfg.installerClass) {
        runInstallerMaven({
          cfg,
          appPort,
          browserPort,
          appName,
          appTestEnv,
          evidenceDir,
          includeInstallUrlEnv: true,
          appSpecificEnv: {
            BEWT_DB_HOST: dbName,
            BEWT_DB_USER: 'root',
            BEWT_DB_PASSWORD: 'root',
            BEWT_DB_NAME: 'joomla',
          },
        });
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

    const testEnvVars = {
      ...process.env,
      ...appTestEnv,
      BEWT_APP_URL: targetAppUrl,
      BEWT_WEBDRIVER_URL: remoteWebdriverUrl,
      BEWT_DB_HOST: cfg.hasDb ? dbName : '127.0.0.1',
      BEWT_DB_USER: 'root',
      BEWT_DB_PASSWORD: 'root',
      BEWT_DB_NAME: cfg.appId,
    };

    const mavenStartTime = Date.now();
    const activeTestClass = options.testClass || cfg.testClass;
    const mvnArgs = [
      '-B',
      '-f', `${cfg.suitePath}/pom.xml`,
      `-Dtest=${activeTestClass}`,
      `-D${cfg.appUrlProperty}=${targetAppUrl}`,
      `-D${cfg.webdriverUrlProperty}=${remoteWebdriverUrl}`,
      `-Dexperiment.evidence.dir=${relative(REPO_ROOT, evidenceDir)}`,
      'clean', 'test',
    ];

    const mvnRes = spawnSync(MAVEN_CLI, mvnArgs, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: testEnvVars,
      timeout: 300000,
    });

    writeFileSync(join(evidenceDir, 'maven.stdout.log'), sanitizeEvidenceText(mvnRes.stdout));
    writeFileSync(join(evidenceDir, 'maven.stderr.log'), sanitizeEvidenceText(mvnRes.stderr));
    writeFileSync(join(evidenceDir, 'maven-exit.json'), JSON.stringify({
      exitCode: mvnRes.status,
      signal: mvnRes.signal,
      command: sanitizeEvidenceText([MAVEN_CLI, ...mvnArgs].join(' ')),
    }, null, 2));

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
    console.error(`[runG0Workflow ERROR] ${appId}:`, err);
    writeFileSync(join(evidenceDir, 'run-failure.txt'), `${err.name}: ${err.message}\n${err.stack || ''}`);
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
