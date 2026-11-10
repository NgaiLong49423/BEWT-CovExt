import { labelsForRun as baseLabelsForRun } from '../../g0-safety/offline-runtime-safety.mjs';

export const APP_ID = 'mediawiki';
export const APP_VERSION = '1.40.0';
export const SOURCE_COMMIT = '468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4';
export const BEWT_SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const APP_IMAGE = 'mediawiki:1.40.0@sha256:5cb83f2b332e05982a8642aff6a4265aa28d11ec66195a2b872cf5f2c234299d';
export const TEST_CLASS = 'mediawiki.CreatePageTest';

export function assertRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error('runId must be 3-63 lowercase letters, digits, or hyphens and start with a letter or digit');
  }
  return runId;
}

export function labelsForRun(runId) {
  return baseLabelsForRun(APP_ID, assertRunId(runId), 't03c-mediawiki-g0');
}

export function namesForRun(runId) {
  const valid = assertRunId(runId);
  return {
    app: `bewt-covext-mediawiki-${valid}`,
    db: `bewt-covext-mediawiki-db-${valid}`,
    network: `bewt-covext-mediawiki-${valid}-net`,
  };
}

export function seleniumTestArguments(hostPort) {
  const port = Number(hostPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('A valid dynamically assigned host port is required');
  }
  return [`-Dtest=${TEST_CLASS}`, `-Dapp.url=http://127.0.0.1:${port}/`, 'test'];
}
