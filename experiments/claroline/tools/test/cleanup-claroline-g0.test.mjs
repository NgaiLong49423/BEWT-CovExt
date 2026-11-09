import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DOCKER_CLI_PATH, MAVEN_CLI_PATH, MAVEN_ENV } from '../child-process-policy.mjs';
import { CleanupBlockedError, isExactNotFound, labelsForRun, namesForRun, recordCreatedResource, APP_IMAGE_REF, BROWSER_IMAGE_REF, createEvidenceDirectory, parseSurefireXml, sanitizeSurefireXml, validateRunId } from '../claroline-g0.mjs';
import { runCleanup, runCleanupWithExitCode } from '../cleanup-claroline-g0.mjs';

const runId = 't03b2-a-20261109-r1';
const ids = { app: 'a'.repeat(64), browser: 'b'.repeat(64), network: 'c'.repeat(64), other: 'd'.repeat(64), otherNetwork: 'e'.repeat(64) };
const names = namesForRun(runId);
const labels = labelsForRun(runId);
const imageDigest = APP_IMAGE_REF.split('@')[1];
const browserImageDigest = BROWSER_IMAGE_REF.split('@')[1];
const err = (message, status = 1) => Object.assign(new Error(message), { status, stderr: Buffer.from(message) });
const unrelatedLabels = { project: 'other-task', owner: 'other-task' };

function record(roles = ['app', 'browser'], includeNetwork = true) {
  return {
    runId, imageDigest, browserImageDigest,
    containers: roles.map(role => ({ role, id: ids[role], name: names[role], imageRef: role === 'app' ? APP_IMAGE_REF : BROWSER_IMAGE_REF })),
    network: includeNetwork ? { id: ids.network, name: names.network } : null,
  };
}

function makeContainer(role, overrides = {}) {
  const image = role === 'app' ? APP_IMAGE_REF : BROWSER_IMAGE_REF;
  const hostPort = role === 'app' ? '80/tcp' : '4444/tcp';
  return {
    Id: ids[role], Name: `/${names[role]}`,
    Config: { Image: image, Labels: { ...labels } },
    State: { Running: true }, Mounts: [],
    HostConfig: { Privileged: false, NetworkMode: names.network, Binds: [], PortBindings: { [hostPort]: [{ HostIp: '127.0.0.1', HostPort: role === 'app' ? '51001' : '51002' }] } },
    NetworkSettings: { Networks: { [names.network]: { NetworkID: ids.network } } },
    ...overrides,
  };
}

function makeNetwork(endpointIds = []) {
  return { Id: ids.network, Name: names.network, Driver: 'bridge', Internal: true, Labels: { ...labels }, Containers: Object.fromEntries(endpointIds.map(id => [id, {}])) };
}

function fakeDocker({ roles = ['app', 'browser'], includeNetwork = true, addRun = true, inspectError = null, endpointMismatch = false, labelMismatch = false, mountMismatch = false, badBinding = false, residualContainer = false, residualNetwork = false, residualVolume = false, staleName = false, failRemoveRole = null, failNetworkRemove = false } = {}) {
  const state = {
    containers: new Map([[ids.other, { Id: ids.other, Name: '/expresscart-other-task', Config: { Image: 'expresscart:test', Labels: unrelatedLabels }, State: { Running: true }, Mounts: [] }]]),
    networks: new Map([[ids.otherNetwork, { Id: ids.otherNetwork, Name: 'kanboard-other-task', Driver: 'bridge', Internal: false, Labels: unrelatedLabels, Containers: {} }]]),
    volumes: new Map([['unrelated-volume', { Name: 'unrelated-volume', Labels: unrelatedLabels }]]),
    images: new Set(['claroline-pinned-image', 'selenium-pinned-image', 'other-project-image']),
    calls: [], mutations: [], inspectError, failRemoveRole, failNetworkRemove,
  };
  const baseline = {
    containers: [...state.containers.keys()], networks: [...state.networks.keys()],
    volumes: [...state.volumes.keys()], images: [...state.images],
  };
  if (addRun) {
    const runContainers = roles.map(role => {
      const overrides = {};
      if (labelMismatch && role === 'app') overrides.Config = { Image: APP_IMAGE_REF, Labels: { ...labels, owner: 'incorrect-owner' } };
      if (mountMismatch && role === 'app') overrides.Mounts = [{ Type: 'bind', Source: 'C:\\outside', Destination: '/home/claroline', RW: true }];
      if (badBinding && role === 'app') overrides.HostConfig = { Privileged: false, NetworkMode: names.network, Binds: [], PortBindings: { '80/tcp': [{ HostIp: '0.0.0.0', HostPort: '51001' }] } };
      return makeContainer(role, overrides);
    });
    for (const item of runContainers) state.containers.set(item.Id, item);
    const endpoints = endpointMismatch ? [ids.other] : runContainers.map(item => item.Id);
    if (includeNetwork) state.networks.set(ids.network, makeNetwork(endpoints));
  }
  if (residualContainer) state.containers.set('f'.repeat(64), makeContainer('app', { Id: 'f'.repeat(64), Name: `/unrecorded-${runId}` }));
  if (residualNetwork) state.networks.set('1'.repeat(64), { ...makeNetwork([]), Id: '1'.repeat(64), Name: `unrecorded-${runId}` });
  if (residualVolume) state.volumes.set(`volume-${runId}`, { Name: `volume-${runId}`, Labels: { ...labels } });

  const parseFilters = args => Object.fromEntries(args.flatMap((arg, index) => arg === '--filter' && args[index + 1]?.startsWith('label=') ? [[args[index + 1].slice(6).split('=')[0], args[index + 1].slice(6).split('=').slice(1).join('=')]] : []));
  const labelsMatch = (actual, expected) => Object.entries(expected).every(([key, value]) => actual?.[key] === value);
  const exec = args => {
    state.calls.push([...args]);
    if (args[0] === 'inspect' || (args[0] === 'network' && args[1] === 'inspect')) {
      const kind = args[0] === 'network' ? 'network' : 'container';
      const target = args.at(-1);
      if (state.inspectError) throw state.inspectError;
      const map = kind === 'network' ? state.networks : state.containers;
      const found = map.get(target) || [...map.values()].find(item => kind === 'network' ? item.Name === target : item.Name.replace(/^\//, '') === target);
      if (found) return JSON.stringify([found]);
      throw err(kind === 'network' ? `Error response from daemon: network ${target} not found` : `Error: No such object: ${target}`);
    }
    if (args[0] === 'ps') {
      const filter = parseFilters(args); const values = [...state.containers.values()].filter(item => labelsMatch(item.Config?.Labels, filter));
      return values.map(item => item.Id).join('\n');
    }
    if (args[0] === 'network' && args[1] === 'ls') {
      const filter = parseFilters(args); const values = [...state.networks.values()].filter(item => labelsMatch(item.Labels, filter));
      return values.map(item => item.Id).join('\n');
    }
    if (args[0] === 'volume' && args[1] === 'ls') {
      const filter = parseFilters(args); return [...state.volumes.values()].filter(item => labelsMatch(item.Labels, filter)).map(item => item.Name).join('\n');
    }
    if (args[0] === 'image' && args[1] === 'ls') return [...state.images].join('\n');
    if (args[0] === 'stop') {
      state.mutations.push([...args]); const item = state.containers.get(args[1]); if (item) item.State.Running = false; return '';
    }
    if (args[0] === 'rm') {
      state.mutations.push([...args]); const item = state.containers.get(args[1]);
      const role = item?.Config?.Image === APP_IMAGE_REF ? 'app' : 'browser';
      if (state.failRemoveRole === role) throw err('Error response from daemon: injected container rm failure', 2);
      state.containers.delete(args[1]); for (const network of state.networks.values()) delete network.Containers[args[1]]; return '';
    }
    if (args[0] === 'network' && args[1] === 'rm') {
      state.mutations.push([...args]); if (state.failNetworkRemove) throw err('Error response from daemon: injected network rm failure', 2); state.networks.delete(args[2]); return '';
    }
    if (args.includes('prune')) throw new Error('global prune must never be invoked');
    throw new Error(`unexpected Docker command: ${args.join(' ')}`);
  };
  const snapshot = () => ({ containers: [...state.containers.keys()].sort(), networks: [...state.networks.keys()].sort(), volumes: [...state.volumes.keys()].sort(), images: [...state.images].sort() });
  return { state, exec, baseline, snapshot };
}

function cleanup(fake, value = record()) { return runCleanup({ record: value, baseline: fake.baseline, dockerExec: fake.exec, captureInventory: fake.snapshot }); }

for (const roles of [[], ['app'], ['app', 'browser']]) {
  test(`partial-startup cleanup handles ${roles.length} recorded Claroline container(s)`, () => {
    const fake = fakeDocker({ roles, includeNetwork: true });
    const result = cleanup(fake, record(roles));
    assert.equal(result.outcome, 'PASS');
    assert.equal(result.removedContainerIds.length, roles.length);
    assert.equal(fake.state.containers.has(ids.other), true, 'unrelated ExpressCart container is preserved');
    assert.equal(fake.state.networks.has(ids.otherNetwork), true, 'unrelated Kanboard network is preserved');
    assert.equal(fake.state.volumes.has('unrelated-volume'), true, 'unrelated project volume is preserved');
    assert.equal(fake.state.mutations.some(call => call.some(value => String(value).includes('prune'))), false);
    assert.deepEqual(fake.state.images, new Set(fake.baseline.images), 'images are not removed');
  });
}

test('failed network initialization without a returned ID blocks on an unrecorded same-run resource', () => {
  const fake = fakeDocker({ roles: [], includeNetwork: false, addRun: false, residualNetwork: true });
  const result = runCleanupWithExitCode({ record: record([], false), baseline: fake.baseline, dockerExec: fake.exec, captureInventory: fake.snapshot }, { exitCode: 0 });
  assert.equal(result.outcome, 'BLOCKED'); assert.equal(result.reason.includes('unrecorded'), true);
  assert.deepEqual(fake.state.mutations, []); assert.equal(fake.state.networks.has('1'.repeat(64)), true);
});

test('create ID is persisted before nonzero status is classified for network/app/Selenium failures', () => {
  const networkRecord = record([], false); let recorded = 0;
  assert.throws(() => recordCreatedResource({ kind: 'network', name: names.network, result: { status: 1, stdout: `${ids.network}\n`, stderr: 'injected exit after create' }, record: networkRecord, onRecord: () => recorded++ }), /after returning/);
  assert.equal(networkRecord.network.id, ids.network); assert.equal(recorded, 1);
  const appRecord = record([], false); appRecord.network = { id: ids.network, name: names.network };
  assert.throws(() => recordCreatedResource({ kind: 'container', role: 'app', name: names.app, imageRef: APP_IMAGE_REF, result: { status: 1, stdout: '', stderr: 'injected app create failure' }, record: appRecord }), /without returning/);
  assert.equal(appRecord.containers.length, 0, 'app creation failure with no ID leaves network as the only recorded resource');
  const seleniumRecord = record(['app'], true);
  assert.throws(() => recordCreatedResource({ kind: 'container', role: 'browser', name: names.browser, imageRef: BROWSER_IMAGE_REF, result: { status: 1, stdout: '', stderr: 'injected Selenium create failure' }, record: seleniumRecord }), /without returning/);
  assert.deepEqual(seleniumRecord.containers.map(item => item.role), ['app']);
});

test('fault injection: Selenium start failure cleans both containers because their IDs were recorded at create', () => {
  const created = record([], false);
  recordCreatedResource({ kind: 'network', name: names.network, result: { status: 0, stdout: `${ids.network}\n` }, record: created });
  recordCreatedResource({ kind: 'container', role: 'app', name: names.app, imageRef: APP_IMAGE_REF, result: { status: 0, stdout: `${ids.app}\n` }, record: created });
  recordCreatedResource({ kind: 'container', role: 'browser', name: names.browser, imageRef: BROWSER_IMAGE_REF, result: { status: 0, stdout: `${ids.browser}\n` }, record: created });
  const fake = fakeDocker({ roles: ['app', 'browser'] });
  assert.equal(cleanup(fake, created).outcome, 'PASS');
  assert.equal(fake.state.containers.has(ids.app), false); assert.equal(fake.state.containers.has(ids.browser), false);
});

test('exact Docker NOT_FOUND is idempotent while daemon, permission, transport, and unknown inspect errors block', () => {
  assert.equal(isExactNotFound(err(`Error: No such object: ${ids.app}`), 'container', ids.app), true);
  assert.equal(isExactNotFound(err(`Error response from daemon: network ${names.network} not found`), 'network', names.network), true);
  for (const failure of [err('Error response from daemon: connection refused'), err('permission denied'), err('transport is unavailable', 2), err('unclassified inspect error')]) {
    const fake = fakeDocker({ inspectError: failure });
    const proc = { exitCode: 0 };
    const outcome = runCleanupWithExitCode({ record: record(), baseline: fake.baseline, dockerExec: fake.exec, captureInventory: fake.snapshot }, proc);
    assert.equal(outcome.outcome, 'BLOCKED'); assert.equal(proc.exitCode, 1); assert.deepEqual(fake.state.mutations, []);
  }
});

test('stale IDs, wrong images, labels, mounts, bindings, and extra endpoints block before mutation', () => {
  const stale = fakeDocker();
  const staleRecord = record(); staleRecord.containers[0].id = '1'.repeat(64);
  assert.throws(() => cleanup(stale, staleRecord), CleanupBlockedError);
  for (const options of [{ labelMismatch: true }, { mountMismatch: true }, { badBinding: true }, { endpointMismatch: true }]) {
    const fake = fakeDocker(options);
    assert.throws(() => cleanup(fake), CleanupBlockedError);
    assert.deepEqual(fake.state.mutations, []);
  }
  const wrongImage = fakeDocker(); const badRecord = record(); badRecord.containers[0].imageRef = 'olianasd/claroline-strongpsw:latest';
  assert.throws(() => cleanup(wrongImage, badRecord), CleanupBlockedError);
  assert.deepEqual(wrongImage.state.mutations, []);
});

test('unrecorded same-run containers, networks, or volumes prevent PASS and are never deleted', () => {
  for (const options of [{ residualContainer: true }, { residualNetwork: true }, { residualVolume: true }]) {
    const fake = fakeDocker(options);
    const proc = { exitCode: 0 };
    const result = runCleanupWithExitCode({ record: record(), baseline: fake.baseline, dockerExec: fake.exec, captureInventory: fake.snapshot }, proc);
    assert.equal(result.outcome, 'BLOCKED'); assert.equal(proc.exitCode, 1);
    assert.deepEqual(fake.state.mutations, []);
  }
});

test('partial teardown and network removal failure return BLOCKED/nonzero; no false PASS', () => {
  for (const options of [{ failRemoveRole: 'browser' }, { failNetworkRemove: true }]) {
    const fake = fakeDocker(options); const proc = { exitCode: 0 };
    const result = runCleanupWithExitCode({ record: record(), baseline: fake.baseline, dockerExec: fake.exec, captureInventory: fake.snapshot }, proc);
    assert.equal(result.outcome, 'BLOCKED'); assert.equal(proc.exitCode, 1);
  }
});

test('fully absent previously recorded resources are an idempotent PASS', () => {
  const fake = fakeDocker({ roles: [], includeNetwork: false, addRun: false });
  const result = cleanup(fake, record());
  assert.equal(result.outcome, 'PASS');
  assert.deepEqual(fake.state.mutations, []);
});

test('network-only partial run and no-resource network-create failure are safe', () => {
  const networkOnly = fakeDocker({ roles: [], includeNetwork: true });
  assert.equal(cleanup(networkOnly, record([])).outcome, 'PASS');
  const noResources = fakeDocker({ roles: [], includeNetwork: false, addRun: false });
  assert.equal(cleanup(noResources, record([], false)).outcome, 'PASS');
});

test('containers without a recorded network block before any stop or rm', () => {
  const fake = fakeDocker(); const value = record(['app'], false);
  assert.throws(() => cleanup(fake, value), /without a recorded network/);
  assert.deepEqual(fake.state.mutations, []);
});

test('Surefire parser requires exactly one expected passing testcase and blocks missing or empty XML', () => {
  assert.equal(parseSurefireXml('').outcome, 'BLOCKED');
  assert.equal(parseSurefireXml('<testsuite tests="0" failures="0" errors="0" skipped="0"></testsuite>').outcome, 'BLOCKED');
  const pass = '<testsuite tests="1" failures="0" errors="0" skipped="0"><testcase classname="test.Claroline_AddUserTest" name="runTest"/></testsuite>';
  assert.equal(parseSurefireXml(pass).outcome, 'PASS');
  assert.equal(parseSurefireXml("<testsuite tests='1' failures='0' errors='0' skipped='0'><testcase classname='test.Claroline_AddUserTest' name='runTest' /></testsuite>").outcome, 'PASS');
  const longAttribute = '<testsuite tests="1" failures="0" errors="0" skipped="0"><testcase classname="test.Claroline_AddUserTest" name="' + 'x'.repeat(50000) + '"/></testsuite>';
  assert.equal(parseSurefireXml(longAttribute).outcome, 'PASS');
  assert.equal(parseSurefireXml(pass.replace('failures="0"', 'failures="1"')).outcome, 'FAIL');
  assert.equal(parseSurefireXml(pass.replace('test.Claroline_AddUserTest', 'test.Other')).outcome, 'FAIL');
  assert.equal(parseSurefireXml(pass.replace('/></testsuite>', '/><testcase classname="test.Claroline_AddUserTest" name="second"/></testsuite>')).outcome, 'BLOCKED');
});

test('Surefire sanitization removes machine properties/output and local workspace paths', () => {
  const raw = '<testsuite><properties><property name="user.dir" value="D:\\machine\\work"/></properties><testcase classname="test.Claroline_AddUserTest"/><system-out>fixture n0tlexample D:\\machine\\work</system-out></testsuite>';
  const clean = sanitizeSurefireXml(raw, ['D:\\machine\\work']);
  assert.equal(clean.includes('machine'), false);
  assert.equal(clean.includes('n0tlexample'), false);
  assert.equal(clean.includes('<properties>'), false);
  assert.equal(clean.includes('<system-out>'), false);
  assert.equal(clean.includes('classname="test.Claroline_AddUserTest"'), true);
});

test('run ID validation rejects unsafe and duplicate-shape identities', () => {
  assert.equal(validateRunId(runId), runId);
  for (const invalid of ['', '../escape', 't03b2-A-20261109-r1', 't03b2-a-20261109-r0']) assert.throws(() => validateRunId(invalid));
});

test('evidence directory creation is write-once for each run ID', () => {
  const base = mkdtempSync(join(tmpdir(), 't03b2-evidence-test-'));
  try {
    const path = createEvidenceDirectory(base, runId);
    assert.equal(path, join(base, runId));
    assert.throws(() => createEvidenceDirectory(base, runId), error => error.code === 'EEXIST');
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test('native tools resolve to explicit paths and child PATH excludes user-writable AppData', () => {
  assert.match(DOCKER_CLI_PATH, /^[A-Z]:\\/i);
  assert.match(MAVEN_CLI_PATH, /^[A-Z]:\\Program Files\\/i);
  assert.doesNotMatch(MAVEN_ENV.PATH, /AppData|Users/i);
  assert.match(MAVEN_ENV.PATH, /C:\\Windows\\System32/i);
  assert.match(MAVEN_ENV.PATH, /Program Files/i);
});
