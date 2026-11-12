import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { createServer } from 'node:net';
import { delimiter, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

export const DOCKER_CLI = 'docker';
export const MAVEN_CLI = 'mvn';
export const DATABASE_NETWORK_ALIAS = 'database';

const COMMAND_PATH_ENV = Object.freeze({
  docker: 'BEWT_DOCKER_CLI_PATH',
  mvn: 'BEWT_MAVEN_CLI_PATH',
  git: 'BEWT_GIT_CLI_PATH',
});

function isWithin(parentPath, childPath) {
  const rel = relative(parentPath, childPath);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

function isSafeExecutable(candidate, repoRoot = REPO_ROOT) {
  try {
    const realPath = realpathSync(candidate);
    const info = statSync(realPath);
    if (!info.isFile() || isWithin(repoRoot, realPath) || isWithin(resolve(process.cwd()), realPath)) return false;
    if (process.platform !== 'win32' && (info.mode & 0o111) === 0) return false;
    if (process.platform !== 'win32' && (info.mode & 0o022) !== 0) return false;
    let current = dirname(realPath);
    while (current !== dirname(current)) {
      const parentInfo = statSync(current);
      if (process.platform !== 'win32' && (parentInfo.mode & 0o022) !== 0 && (parentInfo.mode & 0o1000) === 0) return false;
      current = dirname(current);
    }
    return realPath;
  } catch {
    return false;
  }
}

export function resolveCommandPath(commandName, env = process.env) {
  if (!Object.prototype.hasOwnProperty.call(COMMAND_PATH_ENV, commandName)) {
    throw new Error(`Unsupported executable: ${commandName}`);
  }
  const override = env[COMMAND_PATH_ENV[commandName]];
  const candidates = [];
  if (override) {
    if (!isAbsolute(override)) throw new Error(`${COMMAND_PATH_ENV[commandName]} must be an absolute path.`);
    candidates.push(override);
  } else {
    if (process.platform === 'win32') {
      throw new Error(`${COMMAND_PATH_ENV[commandName]} must be set to an absolute executable path on Windows.`);
    }
    const pathEntries = String(env.PATH || '').split(delimiter).filter((entry) => entry && isAbsolute(entry));
    for (const entry of pathEntries) {
      candidates.push(resolve(entry, commandName));
    }
  }
  for (const candidate of candidates) {
    const safePath = isSafeExecutable(candidate);
    if (safePath) return safePath;
  }
  throw new Error(`No trusted absolute executable found for ${commandName}; configure ${COMMAND_PATH_ENV[commandName]} or a safe absolute PATH entry.`);
}

export function resolveCommandInvocation(commandPath, args, env = process.env, platform = process.platform) {
  if (platform !== 'win32' || !['.cmd', '.bat'].includes(extname(commandPath).toLowerCase())) {
    return { executable: commandPath, args };
  }
  const systemRoot = env.SystemRoot || env.SYSTEMROOT;
  if (!systemRoot || !isAbsolute(systemRoot)) throw new Error('SystemRoot must be configured to invoke Windows batch tools safely.');
  const processor = resolve(systemRoot, 'System32', 'cmd.exe');
  const realProcessor = isSafeExecutable(processor);
  if (!realProcessor) throw new Error('Windows command processor is not a trusted executable.');
  if (args.some((arg) => /["&|<>^%!\s]/.test(String(arg)))) throw new Error('Unsafe shell metacharacter or whitespace in Windows batch command arguments.');
  if (/["&|<>^%!\r\n]/.test(commandPath)) throw new Error('Unsafe executable path for Windows batch invocation.');
  const command = `CALL "${commandPath}"${args.length ? ` ${args.map(String).join(' ')}` : ''}`;
  return { executable: realProcessor, args: ['/d', '/s', '/c', command] };
}

export function safeExecFileSync(commandName, args, options = {}) {
  const invocation = resolveCommandInvocation(resolveCommandPath(commandName), args);
  return execFileSync(invocation.executable, invocation.args, options);
}

export function safeSpawnSync(commandName, args, options = {}) {
  const invocation = resolveCommandInvocation(resolveCommandPath(commandName), args);
  return spawnSync(invocation.executable, invocation.args, options);
}

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

export function expressCartTestEnvironment() {
  return {
    BEWT_ADMIN_EMAIL: requiredEnvironment('BEWT_ADMIN_EMAIL'),
    BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
  };
}

export function expressCartAdminBootstrapScript() {
  return [
    "const bcrypt = require('bcryptjs'); const { MongoClient } = require('mongodb');",
    "let input = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', chunk => { input += chunk; });",
    "process.stdin.on('end', async () => {",
    '  const { userEmail, userPassword } = JSON.parse(input);',
    "  if (!userEmail || !userPassword) { process.exitCode = 2; return; }",
    '  const client = await MongoClient.connect(process.env.databaseConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });',
    "  try { await client.db('expresscart').collection('users').updateOne({ userEmail }, { $set: { userPassword: bcrypt.hashSync(userPassword, 10) } }); }",
    '  finally { await client.close(); }',
    '});',
  ].join(' ');
}

export function applicationVersionProvenance(appId, sourceConfig, imageReference) {
  const benchmarkVersionLabel = sourceConfig.benchmarkBaseVersion || 'NOT_AVAILABLE';
  if (appId !== 'expresscart') {
    return { applicationVersion: benchmarkVersionLabel, benchmarkVersionLabel };
  }

  const sourceLockPath = 'experiments/expresscart/SOURCE-LOCK.json';
  const packageJsonPath = 'experiments/expresscart/source/package.json';
  const sourceLockContent = readFileSync(resolve(REPO_ROOT, sourceLockPath));
  const packageJsonContent = readFileSync(resolve(REPO_ROOT, packageJsonPath));
  const sourceLock = JSON.parse(sourceLockContent.toString('utf8'));
  const packageJson = JSON.parse(packageJsonContent.toString('utf8'));
  const exactVersion = sourceLock.packageVersion;
  const configuredCommit = sourceConfig.source?.commit;
  const imageTag = String(imageReference || '').split(':').at(-1) || '';
  const imageVersionPrefix = `${exactVersion}-`;
  const imageCommitFragment = imageTag.startsWith(imageVersionPrefix) ? imageTag.slice(imageVersionPrefix.length) : '';
  if (!exactVersion || packageJson.version !== exactVersion || sourceLock.commit !== configuredCommit
      || imageCommitFragment.length < 7 || !sourceLock.commit.startsWith(imageCommitFragment)) {
    throw new Error('ExpressCart pinned version metadata is inconsistent.');
  }
  return {
    applicationVersion: exactVersion,
    benchmarkVersionLabel,
    applicationVersionEvidence: {
      sourceLockPath,
      sourceLockSha256: sha256(sourceLockContent),
      packageJsonPath,
      packageJsonSha256: sha256(packageJsonContent),
      sourceCommit: sourceLock.commit,
    },
  };
}

export function mediawikiTestEnvironment() {
  const databaseUser = requiredEnvironment('MEDIAWIKI_DB_USER');
  const installerUser = requiredEnvironment('MEDIAWIKI_DB_INSTALL_USER');
  const normalizedDatabaseUser = databaseUser.trim().toLowerCase();
  const normalizedInstallerUser = installerUser.trim().toLowerCase();
  if (normalizedDatabaseUser === 'root' || normalizedDatabaseUser === normalizedInstallerUser) {
    throw new Error('MEDIAWIKI_DB_USER must be a non-root runtime account distinct from MEDIAWIKI_DB_INSTALL_USER.');
  }
  return {
    BEWT_ADMIN_USERNAME: requiredEnvironment('BEWT_ADMIN_USERNAME'),
    BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
    BEWT_DB_USER: databaseUser,
    BEWT_DB_PASSWORD: requiredEnvironment('MEDIAWIKI_DB_PASSWORD'),
    MEDIAWIKI_DB_INSTALL_USER: installerUser,
  };
}

export function containerProvenance(inspectInfo) {
  if (!inspectInfo?.Id || !inspectInfo?.Image || !inspectInfo?.Config?.Image) {
    throw new Error('Docker inspect response is missing container or image identity.');
  }
  return { containerId: inspectInfo.Id, imageReference: inspectInfo.Config.Image, imageId: inspectInfo.Image, createdAt: inspectInfo.Created };
}

export function readinessEvidence(url, status, validator, checkedAtUtc = new Date().toISOString(), redirects = []) {
  return {
    outcome: 'PASS',
    status,
    endpointPath: new URL(url).pathname,
    validator,
    checkedAtUtc,
    redirects,
  };
}

export function readinessFailureEvidence(url, status, validator, checkedAtUtc = new Date().toISOString(), redirects = []) {
  return {
    outcome: 'FAIL',
    status,
    endpointPath: new URL(url).pathname,
    validator,
    checkedAtUtc,
    redirects,
  };
}

export function setupEvidence(outcome, exitCode = null, checkedAtUtc = new Date().toISOString(), errorCode = null, signal = null) {
  return { outcome, exitCode, checkedAtUtc, ...(errorCode ? { errorCode } : {}), ...(signal ? { signal } : {}) };
}

export function setupCommandEvidence(result, secretValues = []) {
  return {
    exitCode: Number.isInteger(result?.status) ? result.status : null,
    signal: result?.signal || null,
    errorCode: result?.error?.code || null,
    stdout: sanitizeEvidenceText(result?.stdout, secretValues),
    stderr: sanitizeEvidenceText(result?.stderr, secretValues),
  };
}

export async function waitAndRecordReadiness(runRecord, stage, url, label, timeoutMs, validator, validatorName, options = {}) {
  try {
    const waiter = options.waiter || waitHttpReady;
    const evidence = await waiter(url, label, timeoutMs, validator, validatorName, options.redirectPolicy || {});
    runRecord.readiness[stage] = { ...evidence, completedBeforeMaven: true };
    return evidence;
  } catch (error) {
    runRecord.readiness[stage] = {
      ...(error.readiness || readinessFailureEvidence(url, null, validatorName)),
      completedBeforeMaven: true,
    };
    throw error;
  }
}

export function hostAppReadinessUrl(appId, port, cfg = getAppConfig(appId)) {
  const path = appId === 'prestashop' ? '/administrator/' : (cfg?.appUrlPath || '/');
  return `http://127.0.0.1:${port}${path}`;
}

export function resolveReadinessRedirect(currentUrl, location, policy = {}, requestHeaders = {}) {
  const current = new URL(currentUrl);
  const target = new URL(location, current);
  if (target.origin === current.origin) return { url: target, requestHeaders, targetKind: 'same-origin' };

  const allowedHost = String(policy.allowedInternalHostname || '').toLowerCase();
  const allowedPort = String(policy.internalPort || 80);
  const targetPort = target.port || (target.protocol === 'http:' ? '80' : '443');
  if (target.protocol !== 'http:' || !allowedHost || target.hostname.toLowerCase() !== allowedHost || targetPort !== allowedPort) {
    throw new Error('cross-origin HTTP redirect rejected');
  }

  const loopbackOrigin = new URL(policy.loopbackOrigin);
  const rewritten = new URL(`${target.pathname}${target.search}`, loopbackOrigin);
  return {
    url: rewritten,
    requestHeaders: { ...requestHeaders, Host: target.host },
    targetKind: 'configured-app-hostname-mapped',
  };
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
  if (!unit) return { status: 'NOT_AVAILABLE', path: 'NOT_AVAILABLE', gitBlobSha1: 'NOT_AVAILABLE' };
  return {
    status: 'MAPPED',
    path: unit.gherkinEvidence.path,
    gitBlobSha1: unit.gherkinEvidence.blobSha,
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
  return safeExecFileSync(DOCKER_CLI, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function withEphemeralEnvFile(environment, callback) {
  if (!environment || typeof environment !== 'object' || Array.isArray(environment)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(environment))) {
    throw new TypeError('environment must be a plain key/value object.');
  }
  if (typeof callback !== 'function') throw new TypeError('callback must be a function.');

  const entries = Object.entries(environment);
  for (const [name, value] of entries) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error('Environment file contains an invalid variable name.');
    if (typeof value !== 'string' || /[\r\n\0]/.test(value)) {
      throw new Error(`Environment variable '${name}' must be a single-line string.`);
    }
  }

  const tempDirectory = mkdtempSync(join(tmpdir(), 'bewt-covext-g0-'));
  const envFilePath = join(tempDirectory, 'runtime.env');
  try {
    chmodSync(tempDirectory, 0o700);
    writeFileSync(envFilePath, entries.map(([name, value]) => `${name}=${value}\n`).join(''), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    chmodSync(envFilePath, 0o600);
    return callback(envFilePath);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
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

export function probeHttp(url, timeoutMs = 3000, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const req = http.get(url, { timeout: timeoutMs, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({
          status: res.statusCode || 0,
          location: res.headers.location,
          text: () => Promise.resolve(data),
        }));
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.on('error', (err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
}

export async function followHttpRedirects(url, timeoutMs = 3000, maxRedirects = 5, redirectPolicy = {}) {
  let currentUrl = new URL(url);
  const redirects = [];
  let requestHeaders = {};
  try {
    for (;;) {
      const response = await probeHttp(currentUrl.href, timeoutMs, requestHeaders);
      const isRedirect = [301, 302, 303, 307, 308].includes(response.status) && Boolean(response.location);
      if (!isRedirect) return { response, finalUrl: currentUrl, redirects };
      if (redirects.length >= maxRedirects) throw new Error('HTTP redirect limit exceeded');
      const resolved = resolveReadinessRedirect(currentUrl.href, response.location, redirectPolicy, requestHeaders);
      redirects.push({ status: response.status, fromPath: currentUrl.pathname, toPath: resolved.url.pathname, targetKind: resolved.targetKind });
      currentUrl = resolved.url;
      requestHeaders = resolved.requestHeaders;
    }
  } catch (error) {
    error.finalUrl = currentUrl.href;
    error.redirects = redirects;
    throw error;
  }
}

export async function waitHttpReady(url, label, timeoutMs = 120000, validator = (body, res) => res.status >= 200 && res.status < 400, validatorName = 'http-status-2xx-3xx', redirectPolicy = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = '';
  let lastStatus = null;
  let lastEndpointUrl = url;
  let lastRedirects = [];
  console.log(`[waitHttpReady] Polling ${label} at ${url}...`);
  while (Date.now() < deadline) {
    try {
      const followed = await followHttpRedirects(url, 3000, 5, redirectPolicy);
      const res = followed.response;
      lastEndpointUrl = followed.finalUrl.href;
      lastRedirects = followed.redirects;
      lastStatus = res.status;
      const body = await res.text();
      if (validator(body, res)) {
        console.log(`[waitHttpReady] ${label} is ready! HTTP ${res.status}`);
        return readinessEvidence(lastEndpointUrl, res.status, validatorName, new Date().toISOString(), lastRedirects);
      }
      lastErr = `HTTP ${res.status}: validator failed`;
    } catch (e) {
      lastErr = e.message;
      lastEndpointUrl = e.finalUrl || lastEndpointUrl;
      lastRedirects = e.redirects || lastRedirects;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  const error = new Error(`${label} readiness timeout (${timeoutMs}ms): ${lastErr}`);
  error.readiness = readinessFailureEvidence(lastEndpointUrl, lastStatus, validatorName, new Date().toISOString(), lastRedirects);
  throw error;
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
    testEnv: () => ({
      CLAROLINE_TEST_USERNAME: requiredEnvironment('CLAROLINE_TEST_USERNAME'),
      CLAROLINE_TEST_PASSWORD: requiredEnvironment('CLAROLINE_TEST_PASSWORD'),
      CLAROLINE_TEST_FIXTURE_USER_PASSWORD: requiredEnvironment('CLAROLINE_TEST_FIXTURE_USER_PASSWORD'),
    }),
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
    testEnv: expressCartTestEnvironment,
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
      MYSQL_DATABASE: 'mediawiki',
    }),
    testEnv: mediawikiTestEnvironment,
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

export function getAppConfig(appId) {
  if (typeof appId !== 'string' || !Object.prototype.hasOwnProperty.call(APPS, appId)) {
    throw new Error(`UNKNOWN_APP_ID: '${String(appId)}'`);
  }
  return APPS[appId];
}

function assertNoSymlinkComponents(targetPath, rootPath) {
  const normalizedRoot = resolve(rootPath);
  const normalizedTarget = resolve(targetPath);
  if (!isWithin(normalizedRoot, normalizedTarget)) throw new Error('Requested path escapes its allowed root.');
  const rel = relative(normalizedRoot, normalizedTarget);
  let current = normalizedRoot;
  for (const segment of rel.split(sep).filter(Boolean)) {
    current = join(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink()) throw new Error('Symlink components are not allowed in protected paths.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

export function resolveAppConfigPath(appId, repoRoot = REPO_ROOT) {
  getAppConfig(appId);
  const configRoot = resolve(repoRoot, 'config', 'apps');
  const configPath = resolve(configRoot, `${appId}.json`);
  if (!isWithin(configRoot, configPath)) throw new Error('App config path escapes config/apps.');
  assertNoSymlinkComponents(configPath, resolve(repoRoot));
  return configPath;
}

export function resolveEvidenceDirectory(evidenceDir, appId, runId, repoRoot = REPO_ROOT) {
  getAppConfig(appId);
  const validRunId = validateRunId(runId);
  const requested = evidenceDir === undefined
    ? `docs/tasks/g0-evidence/${appId}/${validRunId}`
    : evidenceDir;
  if (typeof requested !== 'string' || requested.trim() === '' || requested.includes('\0')) {
    throw new Error('evidenceDir must be a non-empty relative path.');
  }
  if (isAbsolute(requested) || requested.split(/[\\/]/).some((segment) => segment === '..')) {
    throw new Error('evidenceDir must be a contained relative evidence path.');
  }
  const resolved = resolve(repoRoot, requested);
  const allowedRoots = ['docs/tasks/g0-evidence', 'docs/tasks/g3-evidence'].map((path) => resolve(repoRoot, path));
  const allowedRoot = allowedRoots.find((root) => isWithin(root, resolved) && root !== resolved);
  if (!allowedRoot) throw new Error('evidenceDir must be under docs/tasks/g0-evidence or docs/tasks/g3-evidence.');
  assertNoSymlinkComponents(resolved, resolve(repoRoot));
  return resolved;
}

export async function runG0Workflow(appId, rawRunId, options = {}) {
  const cfg = getAppConfig(appId);
  const validRunId = validateRunId(rawRunId);
  const evidenceDir = resolveEvidenceDirectory(options.evidenceDir, appId, validRunId);
  const sourceConfigPath = resolveAppConfigPath(appId);
  const sourceConfig = JSON.parse(readFileSync(sourceConfigPath, 'utf8'));
  const configuredTestEnv = resolveEnvironmentConfig(cfg.testEnv) || {};
  const configuredDbEnv = resolveEnvironmentConfig(cfg.dbEnv) || {};
  const appEnvPreflight = cfg.appEnv ? cfg.appEnv('__BEWT_G0_PREFLIGHT__') : {};
  const evidenceSecrets = credentialValuesFrom(process.env, configuredTestEnv, configuredDbEnv, appEnvPreflight);

  mkdirSync(evidenceDir, { recursive: true });
  assertNoSymlinkComponents(evidenceDir, REPO_ROOT);

  const labels = labelsForRun(appId, validRunId);
  const labelsCli = labelArgs(labels);

  const baselineInventory = snapshotInventory();
  writeFileSync(join(evidenceDir, 'docker-before.json'), `${JSON.stringify(baselineInventory, null, 2)}\n`);

  const netName = `bewt-covext-${appId}-${validRunId}-net`;
  const appName = `bewt-covext-${appId}-${validRunId}`;
  const dbName = `bewt-covext-${appId}-db-${validRunId}`;
  const dbHostAlias = DATABASE_NETWORK_ALIAS;
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
  const repositoryCommit = safeExecFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  const trackedStatus = safeExecFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  const workingTreeDirty = trackedStatus.length > 0;
  const gherkinCatalogPath = resolve(REPO_ROOT, 'docs/tasks/T04-G/evidence/cat.json');
  const gherkinCatalog = existsSync(gherkinCatalogPath) ? readFileSync(gherkinCatalogPath, 'utf8') : null;
  runRecord.source = {
    repositoryCommit,
    workingTreeDirty,
    workingTreeStatusScope: 'tracked-files-only; untracked evidence excluded',
    runnerSha256: sha256(readFileSync(__filename)),
    applicationSourceCommit: sourceConfig.source?.commit || 'NOT_AVAILABLE',
    ...applicationVersionProvenance(appId, sourceConfig, cfg.image),
    applicationImageReference: cfg.image,
    testClass: activeTestClass,
    testSource: existsSync(sourcePath)
      ? { path: sourcePath.slice(REPO_ROOT.length + 1).replaceAll('\\', '/'), sha256: sha256(readFileSync(sourcePath)) }
      : { path: 'NOT_AVAILABLE', sha256: 'NOT_AVAILABLE' },
    baselineGherkin: gherkinCatalog
      ? findBaselineGherkinBinding(JSON.parse(gherkinCatalog), appId, activeTestClass, 'docs/tasks/T04-G/evidence/cat.json', sha256(gherkinCatalog))
      : { status: 'NOT_AVAILABLE', path: 'NOT_AVAILABLE', gitBlobSha1: 'NOT_AVAILABLE' },
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
      withEphemeralEnvFile(configuredDbEnv, (envFilePath) => dockerCli([
        'run', '-d',
        '--name', dbName,
        '--network', netName,
        '--network-alias', dbHostAlias,
        ...labelsCli,
        '--env-file', envFilePath,
        cfg.dbImage,
      ]));
      createdContainers.push(dbName);
      runRecord.containers.push({ role: 'db', name: dbName, networkAliases: [dbHostAlias], ...inspectContainerProvenance(dbName) });
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
    const appEnvObj = cfg.appEnv ? cfg.appEnv(dbHostAlias) : {};
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
      const runAppContainer = (envFilePath) => dockerCli([
        'run', '-d',
        '--name', appName,
        '--network', netName,
        '-p', `127.0.0.1:${appPort}:${cfg.appInternalPort}`,
        ...labelsCli,
        ...(envFilePath ? ['--env-file', envFilePath] : []),
        ...volArgs,
        cfg.image,
      ]);
      if (Object.keys(appEnvObj).length > 0) {
        withEphemeralEnvFile(appEnvObj, runAppContainer);
      } else {
        runAppContainer(null);
      }
    }
    createdContainers.push(appName);
    runRecord.containers.push({ role: 'app', name: appName, port: appPort, ...inspectContainerProvenance(appName) });

    // 5. Readiness verification
    const seleniumStatusUrl = `http://127.0.0.1:${browserPort}/status`;
    await waitAndRecordReadiness(runRecord, 'selenium', seleniumStatusUrl, 'Selenium', 90000, (body) => {
      try {
        return JSON.parse(body)?.value?.ready === true;
      } catch {
        return false;
      }
    }, 'selenium-status-value-ready');

    const hostAppProbeUrl = `http://127.0.0.1:${appPort}${cfg.appUrlPath || '/'}`;
    await waitAndRecordReadiness(runRecord, 'appHttp', hostAppProbeUrl, `${appId} App`, 120000, undefined, 'http-status-2xx-3xx');

    // 6. Application-specific setup fixtures
    if (appId === 'mediawiki') {
      const fixtureState = runRecord.setupFixtures.mediawiki = { steps: [] };
      const runSetupStep = (step, args) => {
        const result = safeSpawnSync(DOCKER_CLI, args, { encoding: 'utf8', timeout: 180000 });
        const safeResult = setupCommandEvidence(result, evidenceSecrets);
        const stdoutPath = `setup-mediawiki-${step}.stdout.log`;
        const stderrPath = `setup-mediawiki-${step}.stderr.log`;
        writeFileSync(join(evidenceDir, stdoutPath), safeResult.stdout);
        writeFileSync(join(evidenceDir, stderrPath), safeResult.stderr);
        fixtureState.steps.push({
          step,
          command: step === 'install' ? 'docker exec app php maintenance/run.php install' : 'docker exec app bash -c <extension setup>',
          exitCode: safeResult.exitCode,
          signal: safeResult.signal,
          errorCode: safeResult.errorCode,
          stdoutPath,
          stderrPath,
        });
        if (safeResult.exitCode !== 0) {
          const error = new Error(`MediaWiki setup step '${step}' failed (exit code ${safeResult.exitCode ?? 'unavailable'}).`);
          error.status = safeResult.exitCode;
          error.signal = safeResult.signal;
          error.code = safeResult.errorCode;
          throw error;
        }
      };
      try {
        const installEnvironment = {
          BEWT_ADMIN_USERNAME: requiredEnvironment('BEWT_ADMIN_USERNAME'),
          BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
          MEDIAWIKI_DB_HOST: dbHostAlias,
          MEDIAWIKI_DB_USER: requiredEnvironment('MEDIAWIKI_DB_USER'),
          MEDIAWIKI_DB_PASSWORD: requiredEnvironment('MEDIAWIKI_DB_PASSWORD'),
          MEDIAWIKI_DB_INSTALL_USER: requiredEnvironment('MEDIAWIKI_DB_INSTALL_USER'),
          MEDIAWIKI_DB_ROOT_PASSWORD: requiredEnvironment('MEDIAWIKI_DB_ROOT_PASSWORD'),
        };
        const installCommand = 'exec php /var/www/html/maintenance/run.php install --dbserver "$MEDIAWIKI_DB_HOST" --dbtype mysql --dbname mediawiki --dbuser "$MEDIAWIKI_DB_USER" --dbpass "$MEDIAWIKI_DB_PASSWORD" --installdbuser "$MEDIAWIKI_DB_INSTALL_USER" --installdbpass "$MEDIAWIKI_DB_ROOT_PASSWORD" --pass "$BEWT_ADMIN_PASSWORD" --scriptpath "" --server "http://' + appName + '" "E2E Web Testing wiki" "$BEWT_ADMIN_USERNAME"';
        withEphemeralEnvFile(installEnvironment, (envFilePath) => runSetupStep('install', [
          'exec', '--workdir', '/var/www/html', '--env-file', envFilePath,
          appName, 'sh', '-lc', installCommand,
        ]));
        runSetupStep('configure-extensions', [
          'exec', appName,
          'bash', '-c',
          'echo "wfLoadExtension( \'WikiEditor\' );" >> /var/www/html/LocalSettings.php && echo "wfLoadExtension( \'VisualEditor\' );" >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-enable"] = 1;\' >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-hidebetawelcome"] = 1;\' >> /var/www/html/LocalSettings.php && echo \'$wgDefaultUserOptions["visualeditor-welcomedialog"] = 0;\' >> /var/www/html/LocalSettings.php'
        ]);
        Object.assign(fixtureState, setupEvidence('PASS', 0));
      } catch (e) {
        Object.assign(fixtureState, setupEvidence('FAIL', Number.isInteger(e.status) ? e.status : null, new Date().toISOString(), typeof e.code === 'string' ? e.code : null, e.signal));
        throw new Error('MediaWiki setup fixture failed. See per-run setup state, sanitized setup stdout/stderr, and app/DB logs.');
      }
    } else if (appId === 'prestashop') {
      try {
        const installEnvironment = {
          PRESTASHOP_DB_SERVER: dbHostAlias,
          PRESTASHOP_DB_USER: requiredEnvironment('PRESTASHOP_DB_USER'),
          PRESTASHOP_DB_PASSWORD: requiredEnvironment('PRESTASHOP_DB_PASSWORD'),
          PRESTASHOP_DB_NAME: requiredEnvironment('PRESTASHOP_DB_NAME'),
          PRESTASHOP_ADMIN_NAME: requiredEnvironment('PRESTASHOP_ADMIN_NAME'),
          BEWT_ADMIN_EMAIL: requiredEnvironment('BEWT_ADMIN_EMAIL'),
          BEWT_ADMIN_PASSWORD: requiredEnvironment('BEWT_ADMIN_PASSWORD'),
        };
        const installCommand = 'exec php /var/www/html/install/index_cli.php --db_server="$PRESTASHOP_DB_SERVER" --db_user="$PRESTASHOP_DB_USER" --db_password="$PRESTASHOP_DB_PASSWORD" --db_name="$PRESTASHOP_DB_NAME" --db_create=1 --domain=' + appName + ' --name="$PRESTASHOP_ADMIN_NAME" --email="$BEWT_ADMIN_EMAIL" --password="$BEWT_ADMIN_PASSWORD"';
        withEphemeralEnvFile(installEnvironment, (envFilePath) => dockerCli([
          'exec', '--workdir', '/var/www/html', '--env-file', envFilePath,
          appName, 'sh', '-lc', installCommand,
        ]));
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
        const bootstrap = safeSpawnSync(DOCKER_CLI, ['exec', '-i', appName, 'node', '-e', expressCartAdminBootstrapScript()], {
          encoding: 'utf8',
          input: JSON.stringify({
            userEmail: configuredTestEnv.BEWT_ADMIN_EMAIL,
            userPassword: configuredTestEnv.BEWT_ADMIN_PASSWORD,
          }),
          timeout: 180000,
        });
        const safeBootstrap = setupCommandEvidence(bootstrap, evidenceSecrets);
        runRecord.setupFixtures.expresscart = setupEvidence(
          safeBootstrap.exitCode === 0 ? 'PASS' : 'FAIL',
          safeBootstrap.exitCode,
          new Date().toISOString(),
          safeBootstrap.errorCode,
          safeBootstrap.signal,
        );
        if (safeBootstrap.exitCode !== 0) throw new Error('ExpressCart fixture bootstrap failed.');
      } catch (error) {
        runRecord.setupFixtures.expresscart ||= setupEvidence(
          'FAIL',
          Number.isInteger(error.status) ? error.status : null,
          new Date().toISOString(),
          typeof error.code === 'string' ? error.code : null,
        );
        throw new Error('ExpressCart fixture setup failed.');
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
        const instRes = safeSpawnSync(MAVEN_CLI, instArgs, {
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
        const instRes = safeSpawnSync(MAVEN_CLI, instArgs, {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          env: {
            ...process.env,
            ...configuredTestEnv,
            BEWT_INSTALL_URL: instUrl,
            BEWT_APP_URL: instUrl,
            BEWT_WEBDRIVER_URL: `http://127.0.0.1:${browserPort}/wd/hub`,
            BEWT_DB_HOST: dbHostAlias,
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
      await waitAndRecordReadiness(runRecord, 'appLogin', hostAppReadinessUrl(appId, appPort, cfg), `${appId} login controls`, 120000, loginReadyValidator, loginValidatorName, {
        redirectPolicy: {
          allowedInternalHostname: appName,
          internalPort: cfg.appInternalPort,
          loopbackOrigin: `http://127.0.0.1:${appPort}`,
        },
      });
    }

    const testEnvVars = {
      ...process.env,
      ...configuredTestEnv,
      BEWT_APP_URL: targetAppUrl,
      BEWT_WEBDRIVER_URL: remoteWebdriverUrl,
      BEWT_DB_HOST: cfg.hasDb ? dbHostAlias : '127.0.0.1',
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

    const mvnRes = safeSpawnSync(MAVEN_CLI, mvnArgs, {
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
