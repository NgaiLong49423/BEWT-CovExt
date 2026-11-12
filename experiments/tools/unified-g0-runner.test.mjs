import assert from 'node:assert/strict';
import test from 'node:test';

import { APPS, requireExpressCartAdminCredentials, resolveTestEnv } from './unified-g0-runner.mjs';

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
