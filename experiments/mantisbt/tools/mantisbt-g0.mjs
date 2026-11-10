import { labelsForRun as baseLabelsForRun } from '../../g0-safety/offline-runtime-safety.mjs';

export const APP_ID = 'mantisbt';
export const APP_VERSION = '1.2.0';
export const SOURCE_COMMIT = 'd06bf60f5ed9f96029bb830a005d4819a4f87b45';
export const BEWT_SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const APP_IMAGE = 'olianasd/mantisbt-strongpsw:1.2.0@sha256:5c26712d1ade6204613e5a2059d6effbcd0c945bc9a77940b39509ca19d72c01';
export const TEST_CLASS = 'base.AddUser';

export function assertRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error('runId must be 3-63 lowercase letters, digits, or hyphens and start with a letter or digit');
  }
  return runId;
}

export function labelsForRun(runId) {
  return baseLabelsForRun(APP_ID, assertRunId(runId), 't03c-mantisbt-g0');
}

export function namesForRun(runId) {
  const valid = assertRunId(runId);
  return {
    app: `bewt-covext-mantisbt-${valid}`,
    network: `bewt-covext-mantisbt-${valid}-net`,
  };
}

export function seleniumTestArguments(hostPort) {
  const port = Number(hostPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('A valid dynamically assigned host port is required');
  }
  return [`-Dtest=${TEST_CLASS}`, `-Dapp.url=http://127.0.0.1:${port}/mantisbt/`, 'test'];
}
