import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { test } from 'node:test';
import { scanJavaSource } from './credential-source-check.mjs';
import {
  APPS,
  DATABASE_NETWORK_ALIAS,
  applicationVersionProvenance,
  containerProvenance,
  credentialValuesFrom,
  expressCartAdminBootstrapScript,
  followHttpRedirects,
  findBaselineGherkinBinding,
  getAppConfig,
  hostAppReadinessUrl,
  loginControlsReady,
  mediawikiTestEnvironment,
  readinessEvidence,
  readinessFailureEvidence,
  resolveReadinessRedirect,
  resolveAppConfigPath,
  resolveCommandInvocation,
  resolveCommandPath,
  resolveEvidenceDirectory,
  runG0Workflow,
  requiredEnvironment,
  resolveEnvironmentConfig,
  sanitizeCommandArgv,
  sanitizeEvidenceText,
  sha256,
  setupCommandEvidence,
  setupEvidence,
  waitAndRecordReadiness,
} from './unified-g0-runner.mjs';

test('credential source checker rejects inline login credentials', () => {
  const result = scanJavaSource('new LoginPage(d).loginToKanboard("unit-user", configuredPassword());');
  assert.equal(result.length, 1);
  assert.equal(result[0].reason, 'inline credential literal');
});

test('credential source checker accepts runtime configuration', () => {
  const result = scanJavaSource('new LoginPage(d).loginToKanboard(requiredRuntimeCredential("KANBOARD_TEST_USERNAME"), requiredRuntimeCredential("KANBOARD_TEST_PASSWORD"));');
  assert.deepEqual(result, []);
});

test('required runner configuration fails closed when an environment value is missing', () => {
  const key = 'BEWT_CREDENTIAL_CHECK_SENTINEL';
  const previous = process.env[key];
  delete process.env[key];
  try {
    assert.throws(() => requiredEnvironment(key), new RegExp(key));
  } finally {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
});

test('app configuration uses an own-key allowlist and contained config paths', () => {
  assert.equal(getAppConfig('kanboard').appId, 'kanboard');
  for (const appId of ['unknown-app', '__proto__', 'constructor', 'toString', '../joomla', '..\\joomla']) {
    assert.throws(() => getAppConfig(appId), /UNKNOWN_APP_ID/);
    assert.throws(() => resolveAppConfigPath(appId), /UNKNOWN_APP_ID/);
  }
  assert.equal(resolveAppConfigPath('kanboard').endsWith(join('config', 'apps', 'kanboard.json')), true);
});

test('evidence paths are relative, contained, and limited to known evidence roots', () => {
  const defaultPath = resolveEvidenceDirectory(undefined, 'kanboard', 'run-123');
  assert.ok(defaultPath.endsWith(join('docs', 'tasks', 'g0-evidence', 'kanboard', 'run-123')));
  assert.throws(() => resolveEvidenceDirectory('../outside', 'kanboard', 'run-123'), /contained relative evidence path/);
  assert.throws(() => resolveEvidenceDirectory('docs/tasks/g0-evidence/../../outside', 'kanboard', 'run-123'), /contained relative evidence path/);
  assert.throws(() => resolveEvidenceDirectory(join(tmpdir(), 'outside'), 'kanboard', 'run-123'), /contained relative evidence path/);
  assert.throws(() => resolveEvidenceDirectory('', 'kanboard', 'run-123'), /non-empty relative path/);
  assert.throws(() => resolveEvidenceDirectory('temp/kanboard/run-123', 'kanboard', 'run-123'), /must be under/);
  assert.throws(() => resolveEvidenceDirectory('docs/tasks/g0-evidence/kanboard/run-123', '__proto__', 'run-123'), /UNKNOWN_APP_ID/);
});

test('runner rejects invalid evidence destinations before creating output', async (t) => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'bewt-invalid-evidence-'));
  t.after(() => rmSync(tempRoot, { recursive: true, force: true }));
  const outside = join(tempRoot, 'must-not-exist');
  await assert.rejects(runG0Workflow('kanboard', 'run-123', { evidenceDir: outside }), /contained relative evidence path/);
  assert.equal(existsSync(outside), false);
});

test('Claroline missing runtime credentials fail before evidence or Docker resource creation', async (t) => {
  const keys = ['CLAROLINE_TEST_USERNAME', 'CLAROLINE_TEST_PASSWORD', 'CLAROLINE_TEST_FIXTURE_USER_PASSWORD'];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  const runId = `preflight-${Date.now()}`;
  const evidenceDir = resolveEvidenceDirectory(undefined, 'claroline', runId);
  try {
    assert.equal(existsSync(evidenceDir), false);
    await assert.rejects(runG0Workflow('claroline', runId), /Missing required environment variable: CLAROLINE_TEST_USERNAME/);
    assert.equal(existsSync(evidenceDir), false);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('tool resolution requires an allowlisted executable and returns a trusted absolute path', (t) => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'bewt-tool-resolution-'));
  t.after(() => rmSync(tempRoot, { recursive: true, force: true }));
  const executable = join(tempRoot, process.platform === 'win32' ? 'docker.exe' : 'docker');
  writeFileSync(executable, 'synthetic executable fixture');
  if (process.platform !== 'win32') chmodSync(executable, 0o755);
  const env = process.platform === 'win32'
    ? { PATH: tempRoot, BEWT_DOCKER_CLI_PATH: executable }
    : { PATH: tempRoot };
  const expected = process.platform === 'win32' ? executable.toLowerCase() : executable;
  if (process.platform === 'win32') {
    assert.throws(() => resolveCommandPath('docker', { PATH: tempRoot }), /must be set to an absolute executable path/);
  }
  const resolvedPath = resolveCommandPath('docker', env);
  assert.equal(process.platform === 'win32' ? resolvedPath.toLowerCase() : resolvedPath, expected);
  assert.throws(() => resolveCommandPath('unknown', env), /Unsupported executable/);
  assert.throws(() => resolveCommandPath('docker', { ...env, BEWT_DOCKER_CLI_PATH: 'relative/docker' }), /absolute path/);
  const explicitPath = resolveCommandPath('docker', { ...env, BEWT_DOCKER_CLI_PATH: executable });
  assert.equal(process.platform === 'win32' ? explicitPath.toLowerCase() : explicitPath, expected);
  assert.throws(() => resolveCommandPath('docker', { PATH: process.cwd() }), process.platform === 'win32'
    ? /must be set to an absolute executable path/
    : /No trusted absolute executable/);
});

test('Windows batch tools use an absolute command processor and reject shell metacharacters', (t) => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'bewt-cmd-resolution-'));
  t.after(() => rmSync(tempRoot, { recursive: true, force: true }));
  const systemRoot = join(tempRoot, 'Windows Root');
  const system32 = join(systemRoot, 'System32');
  const processor = join(system32, 'cmd.exe');
  const batch = join(tempRoot, 'mvn.cmd');
  mkdirSync(system32, { recursive: true });
  writeFileSync(processor, 'synthetic command processor');
  writeFileSync(batch, 'synthetic batch file');
  if (process.platform !== 'win32') chmodSync(processor, 0o755);
  const invocation = resolveCommandInvocation(batch, ['-B', 'verify'], { SystemRoot: systemRoot }, 'win32');
  assert.equal(invocation.executable, processor);
  assert.deepEqual(invocation.args.slice(0, 3), ['/d', '/s', '/c']);
  assert.match(invocation.args[3], /^CALL ".+mvn\.cmd" -B verify$/);
  assert.throws(() => resolveCommandInvocation(batch, ['-Dvalue=a&b'], { SystemRoot: systemRoot }, 'win32'), /shell metacharacter/);
});

test('non-ExpressCart app configuration resolves lazily and rejects missing credentials', () => {
  const keys = [
    'BLUDIT_TEST_USERNAME','BLUDIT_TEST_PASSWORD','CLAROLINE_TEST_USERNAME','CLAROLINE_TEST_PASSWORD','CLAROLINE_TEST_FIXTURE_USER_PASSWORD',
    'JOOMLA_DB_ROOT_PASSWORD','JOOMLA_DB_USER','JOOMLA_DB_PASSWORD',
    'BEWT_ADMIN_USERNAME','BEWT_ADMIN_PASSWORD','BEWT_ADMIN_EMAIL','BEWT_ADMIN_PASSWORD_ROTATED','BEWT_AUTHOR_USERNAME','BEWT_AUTHOR_PASSWORD',
    'KANBOARD_TEST_USERNAME','KANBOARD_TEST_PASSWORD','MEDIAWIKI_DB_ROOT_PASSWORD','MEDIAWIKI_DB_USER','MEDIAWIKI_DB_PASSWORD','MEDIAWIKI_DB_INSTALL_USER',
    'PRESTASHOP_DB_ROOT_PASSWORD','PRESTASHOP_DB_USER','PRESTASHOP_DB_PASSWORD','PRESTASHOP_DB_NAME','PRESTASHOP_ADMIN_NAME',
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  try {
    for (const app of ['bludit','claroline','joomla','kanboard','mantisbt','mediawiki','prestashop']) {
      assert.equal(typeof APPS[app].testEnv, 'function');
      assert.throws(() => resolveEnvironmentConfig(APPS[app].testEnv), /Missing required environment variable/);
    }
    for (const app of ['joomla','mediawiki','prestashop']) {
      assert.throws(() => resolveEnvironmentConfig(APPS[app].dbEnv), /Missing required environment variable/);
    }
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('ExpressCart admin credentials are required at runtime and bootstrap input is stdin-only', () => {
  const keys = ['BEWT_ADMIN_EMAIL', 'BEWT_ADMIN_PASSWORD'];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  try {
    assert.throws(() => APPS.expresscart.testEnv(), /Missing required environment variable/);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  const script = expressCartAdminBootstrapScript();
  assert.match(script, /process\.stdin/);
  assert.match(script, /userEmail, userPassword/);
  assert.match(script, /hashSync\(userPassword, 10\)/);
  assert.doesNotMatch(script, /userEmail\s*:\s*['"][^'"]+['"]/);
  assert.doesNotMatch(script, /hashSync\(\s*['"][^'"]+['"]/);
  const source = readFileSync(new URL('./unified-g0-runner.mjs', import.meta.url), 'utf8');
  const start = source.indexOf("} else if (appId === 'expresscart') {");
  const end = source.indexOf('} else if (appId === ', start + 1);
  assert.ok(start >= 0 && end > start);
  const fixtureBlock = source.slice(start, end);
  assert.match(fixtureBlock, /input:\s*JSON\.stringify/);
  assert.match(fixtureBlock, /configuredTestEnv\.BEWT_ADMIN_PASSWORD/);
  assert.doesNotMatch(fixtureBlock, /(?:userEmail|userPassword)\s*:\s*['"][^'"]+['"]/);
  const java = readFileSync(new URL('../expresscart/bewt-suite/src/test/java/tests/AddUserTest.java', import.meta.url), 'utf8');
  const loginPrefix = java.slice(0, java.indexOf('.doLogin()'));
  assert.match(loginPrefix, /setEmail\(requiredEnvironment\("BEWT_ADMIN_EMAIL"\)\)/);
  assert.match(loginPrefix, /setPassword\(requiredEnvironment\("BEWT_ADMIN_PASSWORD"\)\)/);
  assert.equal(/\.setEmail\(["'][^"']+["']\)/.test(loginPrefix), false);
  assert.equal(/\.setPassword\(["'][^"']+["']\)/.test(loginPrefix), false);
  assert.match(java, /UUID\.randomUUID\(\)/);
  assert.equal(/\.set(?:Confirm)?Password\(["'][^"']+["']\)/.test(java), false);
});

test('ExpressCart run provenance distinguishes exact pinned version from benchmark shorthand', () => {
  const result = applicationVersionProvenance(
    'expresscart',
    { benchmarkBaseVersion: '1.19', source: { commit: 'b31302f4e99c3293bd742c6d076a721e168118b0' } },
    'bewt-covext/expresscart:1.1.19-b31302f',
  );
  assert.equal(result.applicationVersion, '1.1.19');
  assert.equal(result.benchmarkVersionLabel, '1.19');
  assert.match(result.applicationVersionEvidence.sourceLockSha256, /^[a-f0-9]{64}$/);
  assert.match(result.applicationVersionEvidence.packageJsonSha256, /^[a-f0-9]{64}$/);
  assert.throws(() => applicationVersionProvenance(
    'expresscart',
    { benchmarkBaseVersion: '1.19', source: { commit: 'not-the-pinned-commit' } },
    'bewt-covext/expresscart:1.1.19-b31302f',
  ), /metadata is inconsistent/);
});

test('baseline Gherkin remains explicitly unavailable when the catalog has no app mapping', () => {
  assert.deepEqual(findBaselineGherkinBinding({ units: [] }, 'kanboard', 'tests.AddNewProject', 'catalog.json', 'a'.repeat(64)), {
    status: 'NOT_AVAILABLE',
    path: 'NOT_AVAILABLE',
    gitBlobSha1: 'NOT_AVAILABLE',
  });
});
test('non-ExpressCart runner credential fields have no inline defaults', () => {
  const source = readFileSync(new URL('./unified-g0-runner.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('export const APPS = {');
  const end = source.indexOf('\n};', start);
  assert.ok(start >= 0 && end > start);
  let apps = source.slice(start, end);
  const expressStart = apps.indexOf('  expresscart: {');
  const joomlaStart = apps.indexOf('  joomla: {', expressStart);
  assert.ok(expressStart >= 0 && joomlaStart > expressStart);
  apps = apps.slice(0, expressStart) + apps.slice(joomlaStart);
  const inlineCredentialField = /(?:PASSWORD|PASSWD|USERNAME|EMAIL|DB_USER|DB_PASSWD)\s*:\s*['"][^'"]*['"]/i;
  assert.equal(inlineCredentialField.test(apps), false);
  const inlineInstallerCredential = /['"]--(?:dbuser|dbpass|installdbuser|installdbpass|pass)['"]\s*,\s*['"][^'"]*['"]|['"]--(?:db_user|db_password|db_name|name|email|password)=[^'"]*['"]/i;
  assert.equal(inlineInstallerCredential.test(source), false);
});

test('run record container provenance captures resolved image identity', () => {
  const result = containerProvenance({
    Id: 'container-id',
    Image: 'sha256:image-id',
    Config: { Image: 'example/app:tag' },
    Created: '2026-11-12T00:00:00Z',
  });
  assert.equal(result.containerId, 'container-id');
  assert.equal(result.imageReference, 'example/app:tag');
  assert.equal(result.imageId, 'sha256:image-id');
});

test('Maven argv metadata preserves order while redacting credential values', () => {
  const actual = sanitizeCommandArgv(['-B', '-Ddb.password=synthetic-secret', '--token', 'synthetic-token', '-Dapp.password', 'synthetic-property-value', '-Dtest=Suite']);
  assert.deepEqual(actual, ['-B', '-Ddb.password=<redacted>', '--token', '<redacted>', '-Dapp.password', '<redacted>', '-Dtest=Suite']);
  assert.equal(actual.some((arg) => arg.includes('synthetic')), false);
});

test('app and login readiness evidence records path, timestamp, status and validator without host data', () => {
  const result = readinessEvidence('http://127.0.0.1:8421/administrator/', 200, 'prestashop-admin-login', '2026-11-12T00:00:00.000Z');
  assert.deepEqual(result, {
    outcome: 'PASS',
    status: 200,
    endpointPath: '/administrator/',
    validator: 'prestashop-admin-login',
    checkedAtUtc: '2026-11-12T00:00:00.000Z',
    redirects: [],
  });
  assert.equal('url' in result, false);
});

test('failed readiness is persisted with timestamp, status, validator and endpoint path', async () => {
  const runRecord = { readiness: {} };
  const url = 'http://127.0.0.1:8123/administrator/';
  const failure = new Error('timeout');
  failure.readiness = readinessFailureEvidence(url, 302, 'login-controls', '2026-11-12T00:00:00.000Z');
  await assert.rejects(
    waitAndRecordReadiness(runRecord, 'appLogin', url, 'login', 10, () => false, 'login-controls', { waiter: async () => { throw failure; } }),
    /timeout/,
  );
  assert.deepEqual(runRecord.readiness.appLogin, {
    outcome: 'FAIL',
    status: 302,
    endpointPath: '/administrator/',
    validator: 'login-controls',
    checkedAtUtc: '2026-11-12T00:00:00.000Z',
    redirects: [],
    completedBeforeMaven: true,
  });
});

test('setup evidence persists installer or fixture exit state', () => {
  assert.deepEqual(setupEvidence('PASS', 0, '2026-11-12T00:00:00.000Z'), {
    outcome: 'PASS', exitCode: 0, checkedAtUtc: '2026-11-12T00:00:00.000Z',
  });
  assert.equal(setupEvidence('FAIL', 1).outcome, 'FAIL');
});

test('MediaWiki setup command evidence records exit state and redacts stdout and stderr', () => {
  const result = setupCommandEvidence({
    status: 1,
    signal: null,
    stdout: 'installer output synthetic-password',
    stderr: 'connection failure for synthetic-user',
  }, ['synthetic-password', 'synthetic-user']);
  assert.equal(result.exitCode, 1);
  assert.equal(result.stdout.includes('synthetic-password'), false);
  assert.equal(result.stderr.includes('synthetic-user'), false);
});

test('MediaWiki and PrestaShop login readiness validates installed login controls', () => {
  assert.equal(loginControlsReady('mediawiki', '<a id="pt-login">Log in</a>'), true);
  assert.equal(loginControlsReady('mediawiki', '<title>Install MediaWiki</title>'), false);
  assert.equal(loginControlsReady('prestashop', '<input name="email"><input name="passwd">'), true);
  assert.equal(loginControlsReady('prestashop', '<title>Install PrestaShop</title>'), false);
});

test('host-side login readiness uses loopback paths while Maven keeps internal app URLs', () => {
  assert.equal(hostAppReadinessUrl('prestashop', 8910), 'http://127.0.0.1:8910/administrator/');
  assert.equal(hostAppReadinessUrl('mediawiki', 8920), 'http://127.0.0.1:8920/');
  const source = readFileSync(new URL('./unified-g0-runner.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes("waitAndRecordReadiness(runRecord, 'appLogin', hostAppReadinessUrl(appId, appPort, cfg)"));
  assert.ok(source.includes('BEWT_APP_URL: targetAppUrl'));
});

test('login readiness maps only the configured app hostname to loopback and records safe redirect metadata', async () => {
  const configuredHost = 'mediawiki-run-123';
  const observedHosts = [];
  const server = createServer((req, res) => {
    observedHosts.push(req.headers.host);
    if (req.url === '/admin-start') {
      res.writeHead(302, { Location: '/administrator/' }).end();
    } else if (req.url === '/administrator/') {
      res.writeHead(301, { Location: `http://${configuredHost}/login?fixture=query-secret` }).end();
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' }).end('<input name="email"><input name="passwd">');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const result = await waitAndRecordReadiness(
      { readiness: {} },
      'appLogin',
      `http://127.0.0.1:${port}/admin-start`,
      'PrestaShop login',
      1000,
      (body, response) => response.status === 200 && loginControlsReady('prestashop', body),
      'prestashop-admin-email-and-password-controls',
      { redirectPolicy: {
        allowedInternalHostname: configuredHost,
        internalPort: 80,
        loopbackOrigin: `http://127.0.0.1:${port}`,
      } },
    );
    assert.equal(result.endpointPath, '/login');
    assert.deepEqual(result.redirects, [
      { status: 302, fromPath: '/admin-start', toPath: '/administrator/', targetKind: 'same-origin' },
      { status: 301, fromPath: '/administrator/', toPath: '/login', targetKind: 'configured-app-hostname-mapped' },
    ]);
    assert.deepEqual(observedHosts, [`127.0.0.1:${port}`, `127.0.0.1:${port}`, configuredHost]);
    const evidence = JSON.stringify(result);
    assert.equal(evidence.includes('query-secret'), false);
    assert.equal(evidence.includes(configuredHost), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('redirect helper maps the exact configured host and rejects other cross-origin targets', () => {
  const policy = {
    allowedInternalHostname: 'expected-app',
    internalPort: 80,
    loopbackOrigin: 'http://127.0.0.1:8000',
  };
  const mapped = resolveReadinessRedirect('http://127.0.0.1:8000/admin/', 'http://expected-app/login', policy);
  assert.equal(mapped.url.href, 'http://127.0.0.1:8000/login');
  assert.deepEqual(mapped.requestHeaders, { Host: 'expected-app' });
  assert.equal(mapped.targetKind, 'configured-app-hostname-mapped');
  assert.throws(() => resolveReadinessRedirect('http://127.0.0.1:8000/admin/', 'http://expected-app.attacker/login', policy), /cross-origin/);
  assert.throws(() => resolveReadinessRedirect('http://127.0.0.1:8000/admin/', 'http://example.test/login', policy), /cross-origin/);
  assert.throws(() => resolveReadinessRedirect('http://127.0.0.1:8000/admin/', 'https://expected-app/login', policy), /cross-origin/);
  assert.throws(() => resolveReadinessRedirect('http://127.0.0.1:8000/admin/', 'http://expected-app:8080/login', policy), /cross-origin/);
});

test('redirect following stops at the configured hop bound', async () => {
  const server = createServer((req, res) => {
    const index = Number(new URL(req.url, 'http://localhost').pathname.split('/').pop());
    res.writeHead(302, { Location: `/hop/${index + 1}` }).end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    await assert.rejects(followHttpRedirects(`http://127.0.0.1:${port}/hop/0`, 1000, 2), /redirect limit exceeded/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('evidence sanitization redacts configured usernames and secrets', () => {
  const values = credentialValuesFrom({ BEWT_ADMIN_USERNAME: 'synthetic-user', BEWT_ADMIN_PASSWORD: 'synthetic-pass' });
  const safe = sanitizeEvidenceText('login synthetic-user rejected with synthetic-pass', values);
  assert.equal(safe.includes('synthetic-user'), false);
  assert.equal(safe.includes('synthetic-pass'), false);
});

test('setup logs and persisted run metadata never contain configured secret values', () => {
  const values = credentialValuesFrom({ BEWT_ADMIN_PASSWORD: 'synthetic-admin-secret', PRESTASHOP_DB_PASSWORD: 'synthetic-db-secret' });
  const setup = setupCommandEvidence({ status: 1, stdout: 'installer echoed synthetic-admin-secret', stderr: 'DB refused synthetic-db-secret' }, values);
  const evidence = JSON.stringify({ setupFixtures: { prestashop: setup }, logs: sanitizeEvidenceText('app log synthetic-admin-secret synthetic-db-secret', values) });
  assert.equal(evidence.includes('synthetic-admin-secret'), false);
  assert.equal(evidence.includes('synthetic-db-secret'), false);
  assert.match(evidence, /REDACTED_CREDENTIAL/);
});

test('baseline Gherkin binding returns the catalog path and source blob hash', () => {
  const catalog = {
    units: [{
      application: 'prestashop',
      baselineCaseIds: ['prestashop-14-addnewcategory'],
      javaAssertionEvidence: { path: 'prestashop/baseline/prestashop-1.6.1.23/src/test/java/tests/AddNewCategory.java' },
      gherkinEvidence: { path: 'prestashop/gherkin/14_AddNewCategory.feature', blobSha: 'f'.repeat(40) },
    }],
  };
  const result = findBaselineGherkinBinding(catalog, 'prestashop', 'tests.AddNewCategory', 'catalog.json', 'a'.repeat(64));
  assert.equal(result.status, 'MAPPED');
  assert.equal(result.path, 'prestashop/gherkin/14_AddNewCategory.feature');
  assert.equal(result.gitBlobSha1, 'f'.repeat(40));
  assert.equal(result.mappingCatalogPath, 'catalog.json');
});

test('runtime classes bind to available baseline Gherkin catalog entries', () => {
  const catalogPath = new URL('../../docs/tasks/T04-G/evidence/cat.json', import.meta.url);
  const catalogText = readFileSync(catalogPath, 'utf8');
  const catalog = JSON.parse(catalogText);
  const catalogHash = sha256(catalogText);
  const mediawiki = findBaselineGherkinBinding(catalog, 'mediawiki', 'mediawiki.CreatePageTest', 'docs/tasks/T04-G/evidence/cat.json', catalogHash);
  const prestashop = findBaselineGherkinBinding(catalog, 'prestashop', 'tests.AddNewCategory', 'docs/tasks/T04-G/evidence/cat.json', catalogHash);
  assert.equal(mediawiki.path, 'mediawiki/gherkin/03_CreatePageTest.feature');
  assert.equal(mediawiki.gitBlobSha1, 'd4a1d563069fdf3a5223d9b160539a398dc8a463');
  assert.equal(prestashop.path, 'prestashop/gherkin/14_AddNewCategory.feature');
  assert.equal(prestashop.gitBlobSha1, '193ff284dc574d1810593c1e3acde399967dc228');
});

test('container logs are sanitized before any container stop or removal', () => {
  const source = readFileSync(new URL('./unified-g0-runner.mjs', import.meta.url), 'utf8');
  const capture = source.indexOf("dockerCli(['logs', '--timestamps', name])");
  const stop = source.indexOf("dockerCli(['stop', c])");
  const remove = source.indexOf("dockerCli(['rm', '-f', '-v', c])");
  assert.ok(capture >= 0 && stop > capture && remove > capture);
  assert.ok(source.includes('sanitizeEvidenceText(logs, evidenceSecrets)'));
  assert.ok(source.includes("setupFixtures.prestashop = setupEvidence('FAIL'"));
  assert.ok(source.includes('PrestaShop setup fixture failed.'));
  assert.ok(source.includes("git', ['status', '--porcelain', '--untracked-files=no']"));
  assert.ok(source.includes('workingTreeStatusScope:'));
  assert.ok(source.includes('php maintenance/run.php install'));
  assert.ok(source.includes('setup-mediawiki-${step}.stdout.log'));
  assert.ok(source.includes('setup-mediawiki-${step}.stderr.log'));
});

test('Claroline, MediaWiki, and PrestaShop runtime credential config matches fixtures', () => {
  const keys = [
    'CLAROLINE_TEST_USERNAME', 'CLAROLINE_TEST_PASSWORD', 'CLAROLINE_TEST_FIXTURE_USER_PASSWORD',
    'MEDIAWIKI_DB_ROOT_PASSWORD', 'MEDIAWIKI_DB_USER', 'MEDIAWIKI_DB_PASSWORD', 'MEDIAWIKI_DB_INSTALL_USER',
    'PRESTASHOP_DB_ROOT_PASSWORD', 'PRESTASHOP_DB_USER', 'PRESTASHOP_DB_PASSWORD', 'PRESTASHOP_DB_NAME',
    'BEWT_ADMIN_USERNAME', 'BEWT_ADMIN_PASSWORD', 'BEWT_ADMIN_EMAIL', 'PRESTASHOP_ADMIN_NAME',
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  const synthetic = Object.fromEntries(keys.map((key) => [key, `fixture-${key.toLowerCase()}`]));
  Object.assign(process.env, synthetic);
  try {
    const clarolineTest = resolveEnvironmentConfig(APPS.claroline.testEnv);
    assert.equal(clarolineTest.CLAROLINE_TEST_USERNAME, synthetic.CLAROLINE_TEST_USERNAME);
    assert.equal(clarolineTest.CLAROLINE_TEST_PASSWORD, synthetic.CLAROLINE_TEST_PASSWORD);
    assert.equal(clarolineTest.CLAROLINE_TEST_FIXTURE_USER_PASSWORD, synthetic.CLAROLINE_TEST_FIXTURE_USER_PASSWORD);

    const mediawikiDb = resolveEnvironmentConfig(APPS.mediawiki.dbEnv);
    const mediawikiTest = resolveEnvironmentConfig(APPS.mediawiki.testEnv);
    assert.equal(mediawikiDb.MYSQL_DATABASE, 'mediawiki');
    assert.equal('MYSQL_USER' in mediawikiDb, false);
    assert.equal('MYSQL_PASSWORD' in mediawikiDb, false);
    assert.equal(mediawikiTest.BEWT_DB_USER, synthetic.MEDIAWIKI_DB_USER);
    assert.equal(mediawikiTest.BEWT_DB_PASSWORD, synthetic.MEDIAWIKI_DB_PASSWORD);

    const prestashopDb = resolveEnvironmentConfig(APPS.prestashop.dbEnv);
    const prestashopApp = APPS.prestashop.appEnv('db-host');
    const prestashopTest = resolveEnvironmentConfig(APPS.prestashop.testEnv);
    assert.equal(prestashopDb.MYSQL_DATABASE, synthetic.PRESTASHOP_DB_NAME);
    assert.equal(prestashopDb.MYSQL_USER, synthetic.PRESTASHOP_DB_USER);
    assert.equal(prestashopDb.MYSQL_PASSWORD, synthetic.PRESTASHOP_DB_PASSWORD);
    assert.equal(prestashopApp.DB_NAME, prestashopDb.MYSQL_DATABASE);
    assert.equal(prestashopTest.BEWT_DB_NAME, prestashopDb.MYSQL_DATABASE);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('MediaWiki runtime DB user is separate from install privileges and must not be root', () => {
  const keys = ['MEDIAWIKI_DB_USER', 'MEDIAWIKI_DB_INSTALL_USER', 'MEDIAWIKI_DB_PASSWORD', 'BEWT_ADMIN_USERNAME', 'BEWT_ADMIN_PASSWORD'];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  const setFixture = (databaseUser, installerUser) => Object.assign(process.env, {
    MEDIAWIKI_DB_USER: databaseUser,
    MEDIAWIKI_DB_INSTALL_USER: installerUser,
    MEDIAWIKI_DB_PASSWORD: 'fixture-db-password',
    BEWT_ADMIN_USERNAME: 'fixture-admin',
    BEWT_ADMIN_PASSWORD: 'fixture-admin-password',
  });
  try {
    setFixture('wiki-runtime', 'root-installer');
    assert.equal(mediawikiTestEnvironment().BEWT_DB_USER, 'wiki-runtime');
    setFixture('root', 'root-installer');
    assert.throws(() => mediawikiTestEnvironment(), /non-root runtime account/);
    setFixture('wiki-runtime', 'wiki-runtime');
    assert.throws(() => mediawikiTestEnvironment(), /distinct from MEDIAWIKI_DB_INSTALL_USER/);
    setFixture('Wiki-Runtime', 'wiki-runtime');
    assert.throws(() => mediawikiTestEnvironment(), /distinct from MEDIAWIKI_DB_INSTALL_USER/);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('all database clients use a short per-network alias rather than the generated container name', () => {
  assert.equal(DATABASE_NETWORK_ALIAS, 'database');
  const source = readFileSync(new URL('./unified-g0-runner.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes("'--network-alias', dbHostAlias"));
  assert.ok(source.includes('cfg.appEnv(dbHostAlias)'));
  assert.ok(source.includes("'--dbserver', dbHostAlias"));
  assert.ok(source.includes('`--db_server=${dbHostAlias}`'));
  assert.ok(source.includes('BEWT_DB_HOST: cfg.hasDb ? dbHostAlias'));
});
