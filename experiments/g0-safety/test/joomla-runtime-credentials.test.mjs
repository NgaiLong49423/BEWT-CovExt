import test from 'node:test';
import assert from 'node:assert/strict';

import { APPS, resolveTestEnvironment } from '../../tools/unified-g0-runner.mjs';
import { createJoomlaRuntimeCredentials, safeCredentialMetadata } from '../../joomla/tools/jo-gap004-runtime-credentials.mjs';

const credentialNames = [
  'BEWT_ADMIN_USERNAME',
  'BEWT_ADMIN_EMAIL',
  'BEWT_ADMIN_PASSWORD',
  'BEWT_ADMIN_PASSWORD_ROTATED',
  'BEWT_DB_PASSWORD',
];

function withRuntimeEnvironment(environment, action) {
  const previous = new Map(credentialNames.map((name) => [name, process.env[name]]));
  try {
    for (const name of credentialNames) delete process.env[name];
    Object.assign(process.env, environment);
    return action();
  } finally {
    for (const name of credentialNames) {
      if (previous.get(name) === undefined) delete process.env[name];
      else process.env[name] = previous.get(name);
    }
  }
}

test('Joomla G0 runtime credentials fail closed when any required value is missing', () => {
  const generated = createJoomlaRuntimeCredentials('jo-gap-004-unit-test');
  for (const missingName of credentialNames) {
    const incomplete = Object.fromEntries(Object.entries(generated).filter(([name]) => name !== missingName));
    withRuntimeEnvironment(incomplete, () => {
      assert.throws(() => resolveTestEnvironment(APPS.joomla), new RegExp(`MISSING_RUNTIME_ENV: ${missingName}`));
    });
  }
});

test('Joomla installer and Selenium receive the same per-run credential values without persisting them', () => {
  const generated = createJoomlaRuntimeCredentials('jo-gap-004-unit-test');
  withRuntimeEnvironment(generated, () => {
    assert.deepEqual(resolveTestEnvironment(APPS.joomla), generated);
  });

  assert.match(generated.BEWT_ADMIN_EMAIL, /^jo-gap-004-jo-gap-004-unit-test-[a-f0-9]+@example\.test$/);
  for (const name of ['BEWT_ADMIN_PASSWORD', 'BEWT_ADMIN_PASSWORD_ROTATED', 'BEWT_DB_PASSWORD']) {
    assert.ok(generated[name].length >= 40);
  }
  const safeEvidence = JSON.stringify(safeCredentialMetadata());
  for (const name of credentialNames) assert.equal(safeEvidence.includes(generated[name]), false);
  assert.equal(safeCredentialMetadata().rawCredentialValuesRecorded, false);
});
