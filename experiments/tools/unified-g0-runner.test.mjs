import assert from 'node:assert/strict';
import test from 'node:test';

import { APPS, buildTrustedMavenRuntime, requireExpressCartAdminCredentials, resolveTestEnv, sanitizeEvidenceText } from './unified-g0-runner.mjs';

test('ExpressCart credentials fail closed when either required variable is missing or blank', () => {
  assert.throws(
    () => resolveTestEnv(APPS.expresscart, {}),
    /MISSING_REQUIRED_ENV: ADMIN_EMAIL/,
  );
  assert.throws(
    () => resolveTestEnv(APPS.expresscart, { ADMIN_EMAIL: 'fixture@example.invalid' }),
    /MISSING_REQUIRED_ENV: ADMIN_PASSWORD/,
  );
  assert.throws(
    () => requireExpressCartAdminCredentials({ ADMIN_EMAIL: ' ', ADMIN_PASSWORD: 'synthetic-password' }),
    /MISSING_REQUIRED_ENV: ADMIN_EMAIL/,
  );
  assert.throws(
    () => requireExpressCartAdminCredentials({ ADMIN_EMAIL: 'fixture@example.invalid', ADMIN_PASSWORD: '\t' }),
    /MISSING_REQUIRED_ENV: ADMIN_PASSWORD/,
  );
});

test('ExpressCart test environment propagates supplied process values without fallback', () => {
  const supplied = {
    ADMIN_EMAIL: 'fixture@example.invalid',
    ADMIN_PASSWORD: 'synthetic-password',
  };
  assert.deepEqual(resolveTestEnv(APPS.expresscart, supplied), supplied);
});


test('installer Maven runtime requires an absolute executable and drops inherited PATH entries', () => {
  assert.throws(
    () => buildTrustedMavenRuntime({ PATH: 'attacker-controlled' }, process.platform),
    /MISSING_OR_INVALID_ENV: BEWT_MAVEN_EXECUTABLE/,
  );
  assert.throws(
    () => buildTrustedMavenRuntime({ BEWT_MAVEN_EXECUTABLE: 'mvn', PATH: 'attacker-controlled' }, process.platform),
    /MISSING_OR_INVALID_ENV: BEWT_MAVEN_EXECUTABLE/,
  );

  const runtime = buildTrustedMavenRuntime({
    BEWT_MAVEN_EXECUTABLE: process.execPath,
    JAVA_HOME: process.env.JAVA_HOME,
    SystemRoot: process.env.SystemRoot,
    WINDIR: process.env.WINDIR,
    PATH: 'attacker-controlled',
  }, process.platform);
  assert.equal(runtime.executable, process.execPath);
  assert.ok(runtime.path.length > 0);
  assert.equal(runtime.path.includes('attacker-controlled'), false);
});

test('evidence sanitizer preserves HTTP URLs while redacting Windows paths', () => {
  const input = 'mvn -Dapp.url=http://127.0.0.1:3111 C:\\Users\\Lenovo\\private\\repo';
  const sanitized = sanitizeEvidenceText(input);
  assert.match(sanitized, /http:\/\/127\.0\.0\.1:3111/);
  assert.doesNotMatch(sanitized, /C:\\Users/);
  assert.match(sanitized, /<LOCAL_PATH>/);
});
