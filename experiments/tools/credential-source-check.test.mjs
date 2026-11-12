import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { scanJavaSource } from './credential-source-check.mjs';
import {
  APPS,
  DATABASE_NETWORK_ALIAS,
  containerProvenance,
  credentialValuesFrom,
  findBaselineGherkinBinding,
  hostAppReadinessUrl,
  loginControlsReady,
  mediawikiTestEnvironment,
  readinessEvidence,
  readinessFailureEvidence,
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

test('non-ExpressCart app configuration resolves lazily and rejects missing credentials', () => {
  const keys = [
    'BLUDIT_TEST_USERNAME','BLUDIT_TEST_PASSWORD','JOOMLA_DB_ROOT_PASSWORD','JOOMLA_DB_USER','JOOMLA_DB_PASSWORD',
    'BEWT_ADMIN_USERNAME','BEWT_ADMIN_PASSWORD','BEWT_ADMIN_EMAIL','BEWT_ADMIN_PASSWORD_ROTATED','BEWT_AUTHOR_USERNAME','BEWT_AUTHOR_PASSWORD',
    'KANBOARD_TEST_USERNAME','KANBOARD_TEST_PASSWORD','MEDIAWIKI_DB_ROOT_PASSWORD','MEDIAWIKI_DB_USER','MEDIAWIKI_DB_PASSWORD','MEDIAWIKI_DB_INSTALL_USER',
    'PRESTASHOP_DB_ROOT_PASSWORD','PRESTASHOP_DB_USER','PRESTASHOP_DB_PASSWORD','PRESTASHOP_DB_NAME','PRESTASHOP_ADMIN_NAME',
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  try {
    for (const app of ['bludit','joomla','kanboard','mantisbt','mediawiki','prestashop']) {
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
  });
  assert.equal('url' in result, false);
});

test('failed readiness is persisted with timestamp, status, validator and endpoint path', async () => {
  const runRecord = { readiness: {} };
  const url = 'http://127.0.0.1:8123/administrator/';
  const failure = new Error('timeout');
  failure.readiness = readinessFailureEvidence(url, 302, 'login-controls', '2026-11-12T00:00:00.000Z');
  await assert.rejects(
    waitAndRecordReadiness(runRecord, 'appLogin', url, 'login', 10, () => false, 'login-controls', async () => { throw failure; }),
    /timeout/,
  );
  assert.deepEqual(runRecord.readiness.appLogin, {
    outcome: 'FAIL',
    status: 302,
    endpointPath: '/administrator/',
    validator: 'login-controls',
    checkedAtUtc: '2026-11-12T00:00:00.000Z',
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

test('evidence sanitization redacts configured usernames and secrets', () => {
  const values = credentialValuesFrom({ BEWT_ADMIN_USERNAME: 'synthetic-user', BEWT_ADMIN_PASSWORD: 'synthetic-pass' });
  const safe = sanitizeEvidenceText('login synthetic-user rejected with synthetic-pass', values);
  assert.equal(safe.includes('synthetic-user'), false);
  assert.equal(safe.includes('synthetic-pass'), false);
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

test('MediaWiki and PrestaShop runtime DB names and app users match their fixtures', () => {
  const keys = [
    'MEDIAWIKI_DB_ROOT_PASSWORD', 'MEDIAWIKI_DB_USER', 'MEDIAWIKI_DB_PASSWORD', 'MEDIAWIKI_DB_INSTALL_USER',
    'PRESTASHOP_DB_ROOT_PASSWORD', 'PRESTASHOP_DB_USER', 'PRESTASHOP_DB_PASSWORD', 'PRESTASHOP_DB_NAME',
    'BEWT_ADMIN_USERNAME', 'BEWT_ADMIN_PASSWORD', 'BEWT_ADMIN_EMAIL', 'PRESTASHOP_ADMIN_NAME',
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  const synthetic = Object.fromEntries(keys.map((key) => [key, `fixture-${key.toLowerCase()}`]));
  Object.assign(process.env, synthetic);
  try {
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
