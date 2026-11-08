import { parseApplicationManifest } from '../../../framework/src/contracts.ts';
export const APP_ID = 'bludit';
export const IMAGE = 'bludit/docker:2.3.4';
export const TEST_CLASS = 'tests.AddContentTest';
export const LABEL_BASE = Object.freeze({ project: 'bewt-covext', owner: 'bewt-covext', 'managed-by': 'bewt-covext-agent', app: APP_ID, task: 't03b1-g0' });
export function labelsForRun(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) throw new Error('runId must be 3-63 lowercase letters, digits, or hyphens');
  return { ...LABEL_BASE, runId };
}
export function promoteBluditDraft(draft, imageDigest, options = {}) {
  if (typeof imageDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/i.test(imageDigest)) throw new Error('A verified sha256 image digest is required before runtime manifest promotion');
  if (!draft || typeof draft !== 'object' || !draft.manifestType) throw new Error('A Bludit static-audit draft marker is required for runtime promotion');
  const manifest = structuredClone(draft);
  delete manifest.manifestType; delete manifest.source.note;
  manifest.baseSuitePath = options.baseSuitePath ?? 'experiments/bludit/bewt-suite';
  manifest.runtime.imageDigest = imageDigest;
  manifest.fixtureReset.experimentKey = 'bewt-covext-bludit';
  manifest.fixtureReset.resetStrategy = 'Use a fresh labeled container and isolated labeled network per run; publish HTTP only on loopback with a dynamic host port. The image declares no volumes, so each new container gets a distinct writable layer. Remove only recorded resources whose full ownership labels, IDs, names, image digest, mounts, and endpoints match; independently verify no labeled resources remain.';
  return parseApplicationManifest(manifest);
}
export function fullLabelsMatch(actual, expected) { return Object.entries(expected).every(([key, value]) => actual?.[key] === value); }
export function assertOwnedContainer(container, expected) {
  if (!container || container.Id !== expected.id) throw new Error('Container ID differs from recorded run ID');
  if (String(container.Name).slice(1) !== expected.name) throw new Error("Container name differs from recorded name");
  if (container.Config?.Image !== expected.imageRef) throw new Error('Container image reference differs from pinned digest');
  if (!fullLabelsMatch(container.Config?.Labels, expected.labels)) throw new Error('Container ownership labels mismatch');
  if ((container.Mounts ?? []).length !== 0) throw new Error('Unexpected container mount blocks cleanup');
  return true;
}
export function assertOwnedNetwork(network, expected) {
  if (!network || network.Id !== expected.id || network.Name !== expected.name) throw new Error('Network ID or name differs from recorded resource');
  if (!fullLabelsMatch(network.Labels, expected.labels)) throw new Error('Network ownership labels mismatch');
  if (Object.keys(network.Containers ?? {}).some(id => !expected.containerIds.includes(id))) throw new Error('Network includes an unrecorded endpoint');
  return true;
}

