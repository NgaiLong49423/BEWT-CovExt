import test from 'node:test';
import assert from 'node:assert/strict';
import { CleanupBlockedError, inventory, isNotFound, runCleanup, runCleanupWithExitCode } from '../cleanup-bludit-g0.mjs';
import { labelsForRun } from '../bludit-g0.mjs';

const runId = 't03b1-c-20261109-r1';
const appId = 'a'.repeat(64);
const browserId = 'b'.repeat(64);
const networkId = 'c'.repeat(64);
const unrelatedId = 'd'.repeat(64);
const unrelatedNetworkId = 'e'.repeat(64);
const volumeId = 'other-project-volume';
const appName = `bewt-covext-bludit-${runId}`;
const browserName = `bewt-covext-bludit-selenium-${runId}`;
const networkName = `${appName}-net`;
const appImage = 'bludit/docker:2.3.4@sha256:' + 'f'.repeat(64);
const browserImage = 'selenium/standalone-chrome:4.34.0@sha256:' + '9'.repeat(64);
const appDigest = 'sha256:' + 'f'.repeat(64);
const browserDigest = 'sha256:' + '9'.repeat(64);
const labels = labelsForRun(runId);
const error = (message, status = 1) => Object.assign(new Error(message), { status, stderr: Buffer.from(message) });
const baseline = () => ({ containers: [unrelatedId], networks: [unrelatedNetworkId], volumes: [volumeId], images: ['app-image', 'browser-image'] });

function makeRecord(roles = ['app', 'browser'], includeNetwork = true) {
  const containers = roles.map(role => role === 'app'
    ? { role, id: appId, name: appName, imageRef: appImage }
    : { role, id: browserId, name: browserName, imageRef: browserImage });
  return {
    runId, imageDigest: appDigest, browserImageDigest: browserDigest,
    containers,
    network: includeNetwork ? { id: networkId, name: networkName } : null
  };
}

function fakeDocker({ roles = ['app', 'browser'], emptyRun = false, inspectFailure = null, residual = false, stale = false, partialRemove = false, mismatchLabels = false, mismatchEndpoints = false, orphanRunNetwork = false } = {}) {
  const state = { containers: new Map(), networks: new Map(), volumes: new Map([[volumeId, { Name: volumeId, Labels: { project: 'kanboard-other-task' } }]]), calls: [], mutations: [], inspectFailure, residual, partialRemove };
  const runContainers = roles.map(role => {
    const id = role === 'app' ? appId : browserId;
    const name = role === 'app' ? appName : browserName;
    const image = role === 'app' ? appImage : browserImage;
    return {
      Id: stale && role === 'app' ? '1'.repeat(64) : id,
      Name: '/' + name,
      Config: { Image: image, Labels: mismatchLabels && role === 'app' ? { ...labels, owner: 'someone-else' } : labels },
      State: { Running: true },
      Mounts: [],
      NetworkSettings: { Networks: { [networkName]: { NetworkID: networkId } } }
    };
  });
  if (!emptyRun) for (const container of runContainers) state.containers.set(container.Id, container);
  state.containers.set(unrelatedId, {
    Id: unrelatedId, Name: '/expresscart-owned-by-another-task',
    Config: { Image: 'expresscart@sha256:' + '1'.repeat(64), Labels: { project: 'bewt-covext', owner: 'bewt-covext', app: 'expresscart', task: 't02' } },
    State: { Running: true }, Mounts: []
  });
  const endpointIds = emptyRun ? [] : runContainers.map(container => container.Id);
  const runNetwork = {
    Id: networkId, Name: networkName, Labels: labels,
    Containers: Object.fromEntries((mismatchEndpoints ? ['1'.repeat(64)] : endpointIds).map(id => [id, {}]))
  };
  if (!emptyRun) state.networks.set(networkId, runNetwork);
  if (orphanRunNetwork) state.networks.set('2'.repeat(64), { Id: '2'.repeat(64), Name: networkName, Labels: labels, Containers: {} });
  state.networks.set(unrelatedNetworkId, { Id: unrelatedNetworkId, Name: 'kanboard-other-task', Labels: { project: 'kanboard-other-task' }, Containers: {} });

  const parseFilters = args => {
    const expected = {};
    for (let i = 0; i < args.length; i += 1) if (args[i] === '--filter' && args[i + 1]?.startsWith('label=')) {
      const [key, ...rest] = args[i + 1].slice(6).split('=');
      expected[key] = rest.join('='); i += 1;
    }
    return expected;
  };
  const labelsMatch = (actual, expected) => Object.entries(expected).every(([key, value]) => actual?.[key] === value);
  const exec = args => {
    state.calls.push(args);
    if (args[0] === 'inspect' || (args[0] === 'network' && args[1] === 'inspect')) {
      if (state.inspectFailure) throw state.inspectFailure;
      const kind = args[0] === 'network' ? 'network' : 'container';
      const target = args.at(-1);
      const map = kind === 'network' ? state.networks : state.containers;
      const value = map.get(target) || [...map.values()].find(item => kind === 'network' ? item.Name === target : item.Name.replace(/^\//, '') === target);
      if (value) return JSON.stringify([value]);
      throw error(kind === 'network' ? `Error response from daemon: network ${target} not found` : `Error: No such object: ${target}`);
    }
    if (args[0] === 'ps') {
      const expected = parseFilters(args);
      const values = [...state.containers.values()].filter(item => !Object.keys(expected).length || labelsMatch(item.Config?.Labels, expected));
      return values.map(item => item.Id).concat(state.residual && Object.keys(expected).length ? ['6'.repeat(64)] : []).join('\n');
    }
    if (args[0] === 'network' && args[1] === 'ls') {
      const expected = parseFilters(args);
      const values = [...state.networks.values()].filter(item => !Object.keys(expected).length || labelsMatch(item.Labels, expected));
      return values.map(item => item.Id).join('\n');
    }
    if (args[0] === 'volume' && args[1] === 'ls') {
      const expected = parseFilters(args);
      const values = [...state.volumes.values()].filter(item => !Object.keys(expected).length || labelsMatch(item.Labels, expected));
      return values.map(item => item.Name).join('\n');
    }
    if (args[0] === 'image' && args[1] === 'ls') return ['app-image', 'browser-image'].join('\n');
    if (args[0] === 'stop') {
      state.mutations.push(args);
      const container = state.containers.get(args[1]); if (container) container.State.Running = false;
      return '';
    }
    if (args[0] === 'rm') {
      state.mutations.push(args);
      if (state.partialRemove && args[1] === browserId) throw error('daemon failure', 2);
      state.containers.delete(args[1]);
      for (const network of state.networks.values()) delete network.Containers[args[1]];
      return '';
    }
    if (args[0] === 'network' && args[1] === 'rm') {
      state.mutations.push(args); state.networks.delete(args[2]); return '';
    }
    return '';
  };
  return { state, exec, snapshot: () => inventory(exec) };
}

function clean(fake, record = makeRecord()) {
  return runCleanup({ record, baseline: baseline(), dockerExec: fake.exec, captureInventory: fake.snapshot });
}

for (const roles of [[], ['app'], ['app', 'browser']]) {
  test(`partial startup cleanup safely handles ${roles.length} recorded container(s)`, () => {
    const fake = fakeDocker({ roles });
    const result = clean(fake, makeRecord(roles));
    assert.equal(result.outcome, 'PASS');
    assert.equal(result.recordedContainers.length, roles.length);
    assert.deepEqual(fake.state.mutations.filter(call => call[0] === 'rm').map(call => call[1]), roles.map(role => role === 'app' ? appId : browserId));
    assert.equal(fake.state.containers.has(unrelatedId), true, 'ExpressCart container is preserved');
    assert.equal(fake.state.networks.has(unrelatedNetworkId), true, 'Kanboard network is preserved');
    assert.equal(fake.state.volumes.has(volumeId), true, 'unrelated volume is preserved');
  });
}

test('fault injection: network initialization without a recorded ID blocks and never deletes an unverified network', () => {
  const fake = fakeDocker({ roles: [], emptyRun: true, orphanRunNetwork: true });
  const proc = { exitCode: 0 };
  const outcome = runCleanupWithExitCode({ record: makeRecord([], false), baseline: fake.snapshot(), dockerExec: fake.exec, captureInventory: fake.snapshot }, proc);
  assert.equal(outcome.outcome, 'BLOCKED'); assert.equal(proc.exitCode, 1);
  assert.deepEqual(fake.state.mutations, []);
  assert.equal(fake.state.networks.has('2'.repeat(64)), true);
});

test('fault injection: failed network initialization with a recorded network ID cleans the network-only partial run', () => {
  const fake = fakeDocker({ roles: [], emptyRun: false });
  const result = clean(fake, makeRecord([]));
  assert.equal(result.outcome, 'PASS');
  assert.equal(result.recordedContainers.length, 0);
  assert.equal(fake.state.networks.has(networkId), false);
  assert.equal(fake.state.networks.has(unrelatedNetworkId), true);
});

test('fault injection: app container creation failure after network creation cleans the zero-container partial run', () => {
  const fake = fakeDocker({ roles: [] });
  assert.equal(fake.state.networks.has(networkId), true, 'network was created before app-container creation failed');
  assert.equal(clean(fake, makeRecord([])).outcome, 'PASS');
  assert.equal(fake.state.networks.has(networkId), false);
});

test('fault injection: Selenium container creation failure cleans only the recorded app container', () => {
  const fake = fakeDocker({ roles: ['app'] });
  const result = clean(fake, makeRecord(['app']));
  assert.deepEqual(result.recordedContainers, [appId]);
  assert.equal(fake.state.containers.has(unrelatedId), true);
  assert.equal(fake.state.networks.has(unrelatedNetworkId), true);
});

test('fault injection: Selenium startup failure after create cleans both immediately recorded containers', () => {
  const fake = fakeDocker({ roles: ['app', 'browser'] });
  assert.equal(clean(fake).outcome, 'PASS');
  assert.equal(fake.state.containers.has(appId), false);
  assert.equal(fake.state.containers.has(browserId), false);
});

test('only exact NOT_FOUND is idempotent; daemon, permission, transport and unknown inspect errors block without mutation', () => {
  assert.equal(isNotFound(error(`Error: No such object: ${appId}`), 'container', appId), true);
  for (const failure of [error('Error response from daemon: connection refused'), error('permission denied'), error('unknown failure', 2)]) {
    const fake = fakeDocker({ inspectFailure: failure });
    assert.throws(() => clean(fake), CleanupBlockedError);
    assert.deepEqual(fake.state.mutations, []);
  }
});

test('partial teardown and stale IDs block; cleanup never converts either into PASS', () => {
  const partial = fakeDocker({ partialRemove: true });
  assert.throws(() => clean(partial), CleanupBlockedError);
  const stale = fakeDocker({ stale: true });
  assert.throws(() => clean(stale), CleanupBlockedError);
  assert.deepEqual(stale.state.mutations, []);
});

test('ownership label or endpoint mismatch blocks before any resource mutation', () => {
  for (const options of [{ mismatchLabels: true }, { mismatchEndpoints: true }]) {
    const fake = fakeDocker(options);
    assert.throws(() => clean(fake), CleanupBlockedError);
    assert.deepEqual(fake.state.mutations, []);
  }
});

test('residual labeled resource prevents cleanup PASS', () => {
  const fake = fakeDocker({ residual: true });
  assert.throws(() => clean(fake), /residual run-owned/);
});

test('verified absence is idempotent for all recorded resources', () => {
  const fake = fakeDocker({ emptyRun: true, roles: [] });
  const result = clean(fake);
  assert.equal(result.outcome, 'PASS');
  assert.equal(result.recordedContainers.length, 2, 'both recorded IDs remain represented in the idempotent result');
});

test('blocked cleanup sets a nonzero process exit code', () => {
  const fake = fakeDocker({ inspectFailure: error('error during connect: pipe missing', 2) });
  const proc = { exitCode: 0 };
  const outcome = runCleanupWithExitCode({ record: makeRecord(), baseline: fake.snapshot(), dockerExec: fake.exec, captureInventory: fake.snapshot }, proc);
  assert.equal(outcome.outcome, 'BLOCKED'); assert.equal(proc.exitCode, 1);
});