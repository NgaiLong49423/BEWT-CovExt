import { randomBytes } from 'node:crypto';

export function createJoomlaRuntimeCredentials(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error('INVALID_RUN_ID_FOR_RUNTIME_CREDENTIALS');
  }

  return {
    BEWT_ADMIN_USERNAME: 'administrator',
    BEWT_ADMIN_EMAIL: `jo-gap-004-${runId}-${randomBytes(6).toString('hex')}@example.test`,
    BEWT_ADMIN_PASSWORD: randomBytes(32).toString('base64url'),
    BEWT_ADMIN_PASSWORD_ROTATED: randomBytes(32).toString('base64url'),
    BEWT_DB_PASSWORD: randomBytes(32).toString('base64url'),
  };
}

export function safeCredentialMetadata() {
  return {
    generation: 'EPHEMERAL_PER_RUN',
    adminEmailDomain: 'example.test',
    rawCredentialValuesRecorded: false,
  };
}
