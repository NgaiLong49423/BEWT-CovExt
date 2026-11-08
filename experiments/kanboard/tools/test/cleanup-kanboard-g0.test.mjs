import test from 'node:test';
import assert from 'node:assert/strict';
import { CleanupBlockedError, isDockerResourceNotFound, runCleanup, runCleanupWithProcessStatus } from '../cleanup-kanboard-g0.mjs';
import { labelsForRun } from '../kanboard-g0.mjs';

const runId = 't03a-fault-001';
const labels = labelsForRun(runId);
const containerId = 'a'.repeat(64);
const networkId = 'b'.repeat(64);
const containerName = `bewt-covext-kanboard-${runId}`;
const networkName = `${containerName}-net`;
const volumeNames = ['ssl', 'data', 'plugins'].map((suffix) => `${containerName}-${suffix}`);
const imageRef = `kanboard/kanboard:v1.2.15@sha256:${'c'.repeat(64)}`;

function dockerError(message, status = 1) {
  const error = new Error('docker command failed');
  error.status = status;
  error.stderr = Buffer.from(message);
  return error;
}

function record() { return { runId, containerId, containerName, imageRef, networkId, networkName, volumeNames, labels }; }
function baseline() { return { containers: [], networks: [], volumes: [], images: [], counts: { containers: 0, networks: 0, volumes: 0, images: 0 } }; }

function fakeDocker({ empty = false, residualKind = null, failVolumeRemoveOnce = false, staleContainer = false, staleNetwork = false, inspectFailure = null } = {}) {
  const state = { containers: new Map(), networks: new Map(), volumes: new Map(), calls: [], mutations: [], residualKind, failVolumeRemoveOnce, inspectFailure };
  const c = { Id: staleContainer ? 'd'.repeat(64) : containerId, Name: `/${containerName}`, Config: { Image: imageRef, Labels: labels }, State: { Running: true }, Mounts: volumeNames.map((name, i) => ({ Type: 'volume', Name: name, Destination: ['/etc/nginx/ssl', '/var/www/app/data', '/var/www/app/plugins'][i] })) };
  const n = { Id: staleNetwork ? 'd'.repeat(64) : networkId, Name: networkName, Labels: labels, Containers: { [c.Id]: {} } };
  if (!empty) {
    state.containers.set(c.Id, c); state.networks.set(n.Id, n);
    for (const name of volumeNames) state.volumes.set(name, { Name: name, Labels: labels });
  }
  const ghosts = {
    container: { ...c, Id: 'e'.repeat(64), Name: `/unexpected-${containerName}` },
    network: { ...n, Id: 'f'.repeat(64), Name: `unexpected-${networkName}`, Containers: {} },
    volume: { Name: `unexpected-${volumeNames[0]}`, Labels: labels },
  };
  const lookup = (map, target, kind) => {
    const value = map.get(target) ?? [...map.values()].find((item) => item.Name?.replace(/^\//, '') === target);
    if (value) return value;
    const msg = kind === 'container' ? `Error: No such object: ${target}` : kind === 'network' ? `Error response from daemon: network ${target} not found` : `Error response from daemon: get ${target}: no such volume`;
    throw dockerError(msg);
  };
  const matchesLabels = (args, objectLabels) => Object.entries(labels).every(([k, v]) => args.includes(`label=${k}=${v}`) && objectLabels[k] === v);
  const exec = (args) => {
    state.calls.push(args.slice());
    if (args[0] === 'inspect') {
      if (state.inspectFailure) throw state.inspectFailure;
      return JSON.stringify([lookup(state.containers, args[1], 'container')]);
    }
    if (args[0] === 'network' && args[1] === 'inspect') return JSON.stringify([lookup(state.networks, args[2], 'network')]);
    if (args[0] === 'volume' && args[1] === 'inspect') return JSON.stringify([lookup(state.volumes, args[2], 'volume')]);
    if (args[0] === 'ps' && args.some((arg) => arg.startsWith('volume='))) {
      const name = args.find((arg) => arg.startsWith('volume=')).slice(7);
      return [...state.containers.values()].filter((item) => item.Mounts.some((mount) => mount.Name === name)).map((item) => item.Id).join('\n');
    }
    if (args[0] === 'ps' && args.includes('-aq')) {
      const ids = [...state.containers.values()].filter((item) => matchesLabels(args, item.Config.Labels)).map((item) => item.Id);
      if (state.residualKind === 'container') ids.push(ghosts.container.Id);
      return ids.join('\n');
    }
    if (args[0] === 'network' && args[1] === 'ls') {
      const rows = [...state.networks.values()].filter((item) => matchesLabels(args, item.Labels)).map((item) => `${item.Id}\t${item.Name}`);
      if (state.residualKind === 'network') rows.push(`${ghosts.network.Id}\t${ghosts.network.Name}`);
      return rows.join('\n');
    }
    if (args[0] === 'volume' && args[1] === 'ls') {
      const names = [...state.volumes.values()].filter((item) => matchesLabels(args, item.Labels)).map((item) => item.Name);
      if (state.residualKind === 'volume') names.push(ghosts.volume.Name);
      return names.join('\n');
    }
    if (args[0] === 'stop') { const item = state.containers.get(args[1]); if (item) item.State.Running = false; state.mutations.push('stop'); return args[1]; }
    if (args[0] === 'rm') { state.containers.delete(args[1]); for (const item of state.networks.values()) delete item.Containers[args[1]]; state.mutations.push('container'); return args[1]; }
    if (args[0] === 'volume' && args[1] === 'rm') {
      if (state.failVolumeRemoveOnce) { state.failVolumeRemoveOnce = false; throw dockerError('Error response from daemon: permission denied'); }
      state.volumes.delete(args[2]); state.mutations.push('volume'); return args[2];
    }
    if (args[0] === 'network' && args[1] === 'rm') { const item = [...state.networks.values()].find((value) => value.Id === args[2] || value.Name === args[2]); if (item) state.networks.delete(item.Id); state.mutations.push('network'); return args[2]; }
    throw new Error(`Unexpected docker command: ${args.join(' ')}`);
  };
  const wrapped = (args) => {
    const target = args.at(-1);
    if (state.residualKind === 'container' && args[0] === 'inspect' && target === ghosts.container.Id) return JSON.stringify([ghosts.container]);
    if (state.residualKind === 'network' && args[0] === 'network' && args[1] === 'inspect' && target === ghosts.network.Id) return JSON.stringify([ghosts.network]);
    if (state.residualKind === 'volume' && args[0] === 'volume' && args[1] === 'inspect' && target === ghosts.volume.Name) return JSON.stringify([ghosts.volume]);
    return exec(args);
  };
  return { state, exec: wrapped };
}

const run = (fake) => runCleanup({ record: record(), baseline: baseline(), dockerExec: fake.exec, captureInventory: baseline });

test('only exact NOT_FOUND errors prove absence; daemon, permission and transport errors BLOCK', () => {
  assert.equal(isDockerResourceNotFound(dockerError(`Error: No such object: ${containerId}`), 'container', containerId), true);
  assert.equal(isDockerResourceNotFound(dockerError(`Error response from daemon: network ${networkName} not found`), 'network', networkName), true);
  assert.equal(isDockerResourceNotFound(dockerError(`Error response from daemon: get ${volumeNames[0]}: no such volume`), 'volume', volumeNames[0]), true);
  assert.equal(isDockerResourceNotFound(dockerError(`Error: No such object: ${containerId}`), 'container', 'another-id'), false);
  assert.equal(isDockerResourceNotFound(dockerError('Error response from daemon: connection refused'), 'container', containerId), false);
  for (const error of [dockerError('Error response from daemon: permission denied'), dockerError('error during connect: access denied'), Object.assign(new Error('unknown inspect failure'), { status: 2 })]) {
    const fake = fakeDocker({ inspectFailure: error });
    assert.throws(() => run(fake), (caught) => caught instanceof CleanupBlockedError && caught.outcome === 'BLOCKED');
    assert.deepEqual(fake.state.mutations, []);
  }
});

test('blocked cleanup maps to a nonzero process exit status', () => {
  const fake = fakeDocker({ inspectFailure: dockerError('Error response from daemon: connection refused') });
  const processState = { exitCode: 0 };
  const outcome = runCleanupWithProcessStatus({ record: record(), baseline: baseline(), dockerExec: fake.exec, captureInventory: baseline }, processState);
  assert.equal(outcome.outcome, 'BLOCKED');
  assert.equal(processState.exitCode, 1);
  assert.deepEqual(fake.state.mutations, []);
});
test('idempotent cleanup passes only after all recorded probes and three independent full-label lists are empty', () => {
  const fake = fakeDocker({ empty: true });
  const result = run(fake);
  assert.equal(result.outcome, 'PASS'); assert.equal(result.cleanupWasAlreadyComplete, true); assert.deepEqual(result.actionsPerformed, []);
  const lists = fake.state.calls.filter((args) => args.includes('--filter'));
  assert.equal(lists.length, 3);
  assert(lists.every((args) => Object.entries(labels).every(([k, v]) => args.includes(`label=${k}=${v}`))));
});

test('partial teardown error BLOCKS; retry safely cleans the remaining recorded resources', () => {
  const fake = fakeDocker({ failVolumeRemoveOnce: true });
  assert.throws(() => run(fake), (caught) => caught instanceof CleanupBlockedError && caught.outcome === 'BLOCKED');
  assert.equal(fake.state.containers.size, 0); assert.equal(fake.state.volumes.size, 3);
  assert.equal(run(fake).outcome, 'PASS');
  assert.equal(fake.state.containers.size, 0); assert.equal(fake.state.volumes.size, 0); assert.equal(fake.state.networks.size, 0);
});

test('stale recorded container or network IDs resolving by recorded name block before mutation', () => {
  const staleContainer = fakeDocker({ staleContainer: true });
  assert.throws(() => run(staleContainer), /recorded container ID is stale/i);
  assert.deepEqual(staleContainer.state.mutations, []);
  const staleNetwork = fakeDocker({ staleNetwork: true });
  assert.throws(() => run(staleNetwork), /recorded network ID is stale/i);
  assert.deepEqual(staleNetwork.state.mutations, []);
});
test('residual container, network, or volume in its full-label inventory blocks PASS', async (t) => {
  for (const kind of ['container', 'network', 'volume']) await t.test(kind, () => {
    const fake = fakeDocker({ residualKind: kind });
    assert.throws(() => run(fake), (caught) => caught instanceof CleanupBlockedError && /Residual run-owned resources|label inventory/.test(caught.message));
  });
});
