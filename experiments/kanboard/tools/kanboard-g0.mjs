import { parseApplicationManifest } from '../../../framework/src/contracts.ts';

export const APP_ID = 'kanboard';
export const APP_VERSION = '1.2.15';
export const SOURCE_COMMIT = '00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b';
export const BEWT_SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const IMAGE = 'kanboard/kanboard:v1.2.15';
export const TEST_CLASS = 'tests.AddNewProject';
export const LABEL_BASE = Object.freeze({
  project: 'bewt-covext',
  owner: 'bewt-covext',
  'managed-by': 'bewt-covext-agent',
  app: APP_ID,
  task: 't03a-g0',
});

export function labelsForRun(runId) {
  assertRunId(runId);
  return { ...LABEL_BASE, runId };
}

export function assertRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error('runId must be 3-63 lowercase letters, digits, or hyphens and start with a letter or digit');
  }
  return runId;
}

export function promoteKanboardDraft(draft, imageDigest, options = {}) {
  if (typeof imageDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/i.test(imageDigest)) {
    throw new Error('A verified sha256 image digest is required before runtime manifest promotion');
  }
  const manifest = structuredClone(draft);
  delete manifest.manifestType;
  delete manifest.source?.note;
  manifest.baseSuitePath = options.baseSuitePath ?? 'experiments/kanboard/bewt-suite';
  manifest.runtime.imageDigest = imageDigest;
  manifest.fixtureReset.experimentKey = 'bewt-covext-kanboard';
  manifest.fixtureReset.resetStrategy = 'Per-run labeled network and labeled named volumes for every image-declared mount; loopback-only dynamically allocated HTTP port; remove only verified run-owned containers, volumes, and network, then prove their absence.';
  return parseApplicationManifest(manifest);
}

export function requiredLabelsMatch(actual, expected) {
  return Object.entries(expected).every(([key, value]) => actual?.[key] === value);
}

export function assertOwnedContainer(inspect, expected) {
  if (!inspect || inspect.Id !== expected.containerId) throw new Error('Container ID does not match the recorded run resource');
  if (String(inspect.Name ?? '').replace(/^\//, '') !== expected.name) throw new Error('Container name does not match the recorded run resource');
  if (inspect.Config?.Image !== expected.imageRef) throw new Error('Container image reference does not match the pinned image');
  if (!requiredLabelsMatch(inspect.Config?.Labels, expected.labels)) throw new Error('Container ownership labels do not match this T03-A run');
  if (expected.requireRunning && inspect.State?.Running !== true) throw new Error('Recorded Kanboard container is not running');
  const mounts = inspect.Mounts ?? [];
  if (mounts.some((mount) => mount.Type !== 'volume')) throw new Error('Unexpected bind, tmpfs, or other non-volume mount blocks ownership cleanup');
  const expectedVolumes = new Set(expected.volumeNames ?? []);
  if (mounts.some((mount) => !expectedVolumes.has(mount.Name))) throw new Error('Container references a volume outside the recorded T03-A run inventory');
  if (mounts.length !== expectedVolumes.size) throw new Error('Recorded volume inventory does not match the container mounts');
  return true;
}

export function assertOwnedVolume(volume, expected) {
  if (!volume || volume.Name !== expected.name) throw new Error('Volume name does not match the recorded run resource');
  if (!requiredLabelsMatch(volume.Labels, expected.labels)) throw new Error('Volume ownership labels do not match this T03-A run');
  return true;
}

export function assertOwnedNetwork(network, expected) {
  if (!network || network.Id !== expected.id || network.Name !== expected.name) throw new Error('Network identity does not match the recorded run resource');
  if (!requiredLabelsMatch(network.Labels, expected.labels)) throw new Error('Network ownership labels do not match this T03-A run');
  return true;
}

export function dynamicPublishArguments() {
  return ['--publish', '127.0.0.1::80'];
}

export function getLoopbackHostPort(inspect, containerPort = '80/tcp') {
  const bindings = inspect?.NetworkSettings?.Ports?.[containerPort];
  if (!Array.isArray(bindings) || bindings.length !== 1) throw new Error(`Expected one published binding for ${containerPort}`);
  const [{ HostIp, HostPort }] = bindings;
  const port = Number(HostPort);
  if (HostIp !== '127.0.0.1' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Published HTTP port must be a valid loopback-only host port');
  }
  return port;
}

export function seleniumTestArguments(hostPort) {
  const port = Number(hostPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('A valid dynamically assigned host port is required');
  return [`-Dtest=${TEST_CLASS}`, `-Dapp.url=http://127.0.0.1:${port}`, 'test'];
}

export function assertSelectedTest(args, selectedClass = TEST_CLASS) {
  if (!args.includes(`-Dtest=${selectedClass}`)) throw new Error(`Maven command must select only ${selectedClass}`);
  if (args.some((arg) => arg === '-Dtest=TestSuite' || arg.includes('*'))) throw new Error('Broad suite selection is forbidden for this G0 smoke');
  return true;
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[match[1]] = match[2];
  return attrs;
}

export function parseSurefireSummary(xml, selectedClass = TEST_CLASS) {
  if (typeof xml !== 'string' || xml.trim() === '') return null;
  const suites = [...xml.matchAll(/<testsuite\b[^>]*>/g)].map(([tag]) => parseAttributes(tag));
  const selected = suites.filter((suite) => suite.name === selectedClass || suite.name?.endsWith(`.${selectedClass.split('.').at(-1)}`));
  if (selected.length === 0) return null;
  return selected.reduce((sum, suite) => ({
    tests: sum.tests + Number(suite.tests ?? 0),
    failures: sum.failures + Number(suite.failures ?? 0),
    errors: sum.errors + Number(suite.errors ?? 0),
    skipped: sum.skipped + Number(suite.skipped ?? 0),
    suites: sum.suites + 1,
  }), { tests: 0, failures: 0, errors: 0, skipped: 0, suites: 0 });
}

export function classifyJUnitExecution({ xml, exitCode, output = '', selectedClass = TEST_CLASS }) {
  const summary = parseSurefireSummary(xml, selectedClass);
  if (!summary || summary.tests === 0) return { outcome: 'BLOCKED', category: 'NO_TESTS_DETECTED', summary };
  if (/SessionNotCreatedException|NoSuchDriverException|Chrome failed to start|Unable to obtain.*driver/i.test(output)) {
    return { outcome: 'BLOCKED', category: 'BROWSER_SETUP_FAILURE', summary };
  }
  if (/ERR_CONNECTION_(?:REFUSED|TIMED_OUT)|ConnectException|Connection refused/i.test(output)) {
    return { outcome: 'BLOCKED', category: 'APPLICATION_OR_NETWORK_FAILURE', summary };
  }
  if (summary.failures > 0 || summary.errors > 0 || exitCode !== 0) {
    return { outcome: 'FAIL', category: 'TEST_OR_BUILD_FAILURE', summary };
  }
  if (summary.skipped > 0) return { outcome: 'BLOCKED', category: 'TEST_SKIPPED', summary };
  return { outcome: 'PASS', category: 'ASSERTIONS_PASSED', summary };
}

export function assertIndependentCleanRuns(runA, runB, snapshotBeforeB) {
  if (!runA || !runB || runA.runId === runB.runId) throw new Error('Run A and Run B must have distinct run IDs');
  if (runA.cleanupOutcome !== 'PASS') throw new Error('Run A cleanup was not verified PASS');
  if (snapshotBeforeB.containerIds?.includes(runA.containerId)) throw new Error('Run A container is still present before Run B');
  if (snapshotBeforeB.volumeNames?.some((name) => runA.volumeNames.includes(name))) throw new Error('Run A volume is still present before Run B');
  if (snapshotBeforeB.networkIds?.includes(runA.networkId)) throw new Error('Run A network is still present before Run B');
  if (runB.containerId === runA.containerId || runB.networkId === runA.networkId) throw new Error('Run B reused a Run A Docker resource');
  if (runB.volumeNames.some((name) => runA.volumeNames.includes(name))) throw new Error('Run B reused a Run A data volume');
  if (runB.preTestSentinelPresent !== false) throw new Error('Run A sentinel project must be absent before the Run B Base test');
  return true;
}

export function buildCleanupPlan({ container, volumes, network, recorded }) {
  const actions = [];
  if (container) {
    assertOwnedContainer(container, { ...recorded, requireRunning: false });
    actions.push({ kind: 'container', id: container.Id });
  }
  for (const volume of volumes ?? []) {
    const match = recorded.volumes?.find((item) => item.name === volume.Name);
    if (!match) throw new Error('Refusing cleanup of an unrecorded Docker volume');
    assertOwnedVolume(volume, { name: match.name, labels: recorded.labels });
    actions.push({ kind: 'volume', name: volume.Name });
  }
  if (network) {
    assertOwnedNetwork(network, { id: recorded.networkId, name: recorded.networkName, labels: recorded.labels });
    actions.push({ kind: 'network', id: network.Id });
  }
  return actions;
}

export function assertCleanupComplete(after, recorded) {
  if (after.containerIds?.includes(recorded.containerId)) throw new Error('T03-A container remains after cleanup');
  if (after.volumeNames?.some((name) => recorded.volumeNames.includes(name))) throw new Error('T03-A volume remains after cleanup');
  if (after.networkIds?.includes(recorded.networkId)) throw new Error('T03-A network remains after cleanup');
  return true;
}

export function assertUnrelatedResourcesPreserved(before, after, runResourceIds = []) {
  const allowed = new Set(runResourceIds);
  const beforeIds = new Set(before.resourceIds ?? []);
  const afterIds = new Set(after.resourceIds ?? []);
  const removed = [...beforeIds].filter((id) => !afterIds.has(id));
  const unexpectedRemoval = removed.filter((id) => !allowed.has(id));
  if (unexpectedRemoval.length) throw new Error(`Unrelated Docker resources disappeared: ${unexpectedRemoval.join(', ')}`);
  return true;
}
