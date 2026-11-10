import { labelsForRun as baseLabelsForRun } from '../../g0-safety/offline-runtime-safety.mjs';

export const APP_ID = 'prestashop';
export const APP_VERSION = '1.6.1.23';
export const SOURCE_COMMIT = '475d65fbda93403cd1afde0db09764c5295e952c';
export const BEWT_SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const APP_IMAGE = 'prestashop/prestashop:1.6.1.23@sha256:c6b779bca959503d25058cec1fa7f6a4cea940694ce099d2e47e4e23a8637b2e';
export const DB_IMAGE = 'mysql:5.7';
export const TEST_CLASS = 'tests.AddNewCategory';

export function assertRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error('runId must be 3-63 lowercase letters, digits, or hyphens and start with a letter or digit');
  }
  return runId;
}

export function labelsForRun(runId) {
  return baseLabelsForRun(APP_ID, assertRunId(runId), 't03c-prestashop-g0');
}

export function namesForRun(runId) {
  const valid = assertRunId(runId);
  return {
    app: `bewt-covext-prestashop-${valid}`,
    db: `bewt-covext-prestashop-db-${valid}`,
    network: `bewt-covext-prestashop-${valid}-net`,
  };
}

export function seleniumTestArguments(hostPort) {
  const port = Number(hostPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('A valid dynamically assigned host port is required');
  }
  return [`-Dtest=${TEST_CLASS}`, `-Dapp.url=http://127.0.0.1:${port}/administrator/`, 'test'];
}
