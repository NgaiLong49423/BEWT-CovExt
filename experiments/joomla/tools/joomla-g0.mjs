import { labelsForRun as baseLabelsForRun } from '../../g0-safety/offline-runtime-safety.mjs';

export const APP_ID = 'joomla';
export const APP_VERSION = '3.10.11';
export const SOURCE_COMMIT = '01deee0a7b8cf91fc503b2cc13359c6e43aac47f';
export const BEWT_SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const APP_IMAGE = 'joomla:3.10.11@sha256:1cb08c55b99dfe231825291634b814b038f98a85442169d7811731bf43912971';
export const DB_IMAGE = 'mysql:5.6';
export const TEST_CLASS = 'base.AdminLoginTest';

export function assertRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error('runId must be 3-63 lowercase letters, digits, or hyphens and start with a letter or digit');
  }
  return runId;
}

export function labelsForRun(runId) {
  return baseLabelsForRun(APP_ID, assertRunId(runId), 't03c-joomla-g0');
}

export function namesForRun(runId) {
  const valid = assertRunId(runId);
  return {
    app: `bewt-covext-joomla-${valid}`,
    db: `bewt-covext-joomla-db-${valid}`,
    network: `bewt-covext-joomla-${valid}-net`,
  };
}

export function seleniumTestArguments(hostPort) {
  const port = Number(hostPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('A valid dynamically assigned host port is required');
  }
  return [`-Dtest=${TEST_CLASS}`, `-Dapp.url=http://127.0.0.1:${port}/`, 'test'];
}
