import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { scanJavaSource } from './credential-source-check.mjs';
import { APPS, requiredEnvironment, resolveEnvironmentConfig } from './unified-g0-runner.mjs';

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
