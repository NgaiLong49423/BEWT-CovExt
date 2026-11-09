import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DOCKER_CLI_PATH, MAVEN_CLI_PATH, DOCKER_ENV, MAVEN_ENV, verifyLinuxRootExecutable, parseLinuxMeminfoBytes, parseLinuxIpv4Routes, readHostFreeMemoryBytes, readHostIpv4Routes, invokeMaven } from '../child-process-policy.mjs';
import { CleanupBlockedError, isExactNotFound, labelsForRun, namesForRun, recordCreatedResource, APP_IMAGE_REF, BROWSER_IMAGE_REF, SOURCE_COMMIT, EGRESS_LIMITED_NETWORK_POLICY, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY, ROUTE_ISOLATION_METHOD, INTERNAL_NETWORK_POLICY, INTERNAL_IPAM_NETWORK_POLICY, INTERNAL_IPAM_SUBNET_CANDIDATES, classifyEgressProbe, classifyTcpProbe, classifyHostControlProbe, EGRESS_PROBE_TARGETS, buildEgressProbeArgs, assertDockerPortOutput, assertContainerNetworkGateway, routeIsolationApprovalRequest, requestRouteIsolationApproval, assertNetworkPolicy, assertPrivateLogDirectory, assertNoDefaultRoutes, routeIsolationExecArgs, createEvidenceDirectory, parseSurefireXml, selectInternalBridgeIpam, selectLoopbackPort, sanitizeSurefireXml, validateRunId, probeTcpTarget, probeLoopbackPort, assertPublishedLoopbackPort, assertContainerPortNotPublished, isPortBindingConflict } from '../claroline-g0.mjs';
import { runCleanup, runCleanupWithExitCode } from '../cleanup-claroline-g0.mjs';
import { assertAllowedRemoteAction, buildRemoteCommandScript, verifyTerminationSchedule, computeDirectorySha256Manifest, verifySha256Manifest, scrubCloudText } from '../cloud-controller.mjs';
import { validateEvidenceDirectory, scanEvidenceForSecretsAndLeaks } from '../validate-evidence.mjs';

const runId = 't03b2-a-20261109-r1';
const ids = { app: 'a'.repeat(64), browser: 'b'.repeat(64), network: 'c'.repeat(64), other: 'd'.repeat(64), otherNetwork: 'e'.repeat(64) };
const names = namesForRun(runId);
const labels = labelsForRun(runId);
const imageDigest = APP_IMAGE_REF.split('@')[1];
const browserImageDigest = BROWSER_IMAGE_REF.split('@')[1];
const imageLabels = {
  app: {},
  browser: { authors: 'SeleniumHQ', 'org.opencontainers.image.ref.name': 'ubuntu', 'org.opencontainers.image.source': 'https://github.com/SeleniumHQ/docker-selenium', 'org.opencontainers.image.version': '24.04' },
};
const err = (message, status = 1) => Object.assign(new Error(message), { status, stderr: Buffer.from(message) });
const unrelatedLabels = { project: 'other-task', owner: 'other-task' };

function record(roles = ['app', 'browser'], includeNetwork = true) {
  return {
    runId, imageDigest, browserImageDigest, imageLabels, selectedHostPorts: { app: 51001, browser: 51002 }, networkPolicy: EGRESS_LIMITED_NETWORK_POLICY,
    containers: roles.map(role => ({ role, id: ids[role], name: names[role], imageRef: role === 'app' ? APP_IMAGE_REF : BROWSER_IMAGE_REF })),
    network: includeNetwork ? { id: ids.network, name: names.network } : null,
  };
}

function makeContainer(role, overrides = {}) {
  const image = role === 'app' ? APP_IMAGE_REF : BROWSER_IMAGE_REF;
  const hostPort = role === 'app' ? '80/tcp' : '4444/tcp';
  return {
    Id: ids[role], Name: `/${names[role]}`,
    Config: { Image: image, Labels: { ...imageLabels[role], ...labels } },
    State: { Running: true }, Mounts: [],
    HostConfig: { Privileged: false, NetworkMode: names.network, Binds: [], PortBindings: { [hostPort]: [{ HostIp: '127.0.0.1', HostPort: role === 'app' ? '51001' : '51002' }] } },
    NetworkSettings: { Ports: { [hostPort]: [{ HostIp: '127.0.0.1', HostPort: role === 'app' ? '51001' : '51002' }] }, Networks: { [names.network]: { NetworkID: ids.network, EndpointID: `${role}-endpoint` } } },
    ...overrides,
  };
}

function makeNetwork(endpointIds = [], policy = EGRESS_LIMITED_NETWORK_POLICY) {
  const internal = policy === INTERNAL_NETWORK_POLICY || policy === INTERNAL_IPAM_NETWORK_POLICY;
  const ipam = [INTERNAL_IPAM_NETWORK_POLICY, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY].includes(policy) ? [{ Subnet: INTERNAL_IPAM_SUBNET_CANDIDATES[0], Gateway: '172.26.254.1' }] : [];
  return { Id: ids.network, Name: names.network, Driver: 'bridge', Internal: internal, EnableIPv6: false, IPAM: { Config: ipam }, Options: internal ? {} : { 'com.docker.network.bridge.enable_ip_masquerade': 'false' }, Labels: { ...labels }, Containers: Object.fromEntries(endpointIds.map(id => [id, {}])) };
}

function fakeDocker({ roles = ['app', 'browser'], includeNetwork = true, addRun = true, inspectError = null, endpointMismatch = false, labelMismatch = false, imageMetadataMismatch = false, mountMismatch = false, badBinding = false, createdUnstarted = false, residualContainer = false, residualNetwork = false, residualVolume = false, staleName = false, failRemoveRole = null, failNetworkRemove = false } = {}) {
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
      if (createdUnstarted) overrides.State = { Status: 'created', Running: false };
      if (createdUnstarted) overrides.HostConfig = { Privileged: false, NetworkMode: names.network, Binds: [], PortBindings: { [role === 'app' ? '80/tcp' : '4444/tcp']: [{ HostIp: '127.0.0.1', HostPort: '' }] } };
      if (createdUnstarted) overrides.NetworkSettings = { Networks: { [names.network]: { NetworkID: '', EndpointID: '', IPAddress: '', Gateway: '', MacAddress: '' } } };
      if (labelMismatch && role === 'app') overrides.Config = { Image: APP_IMAGE_REF, Labels: { ...imageLabels.app, ...labels, owner: 'incorrect-owner' } };
      if (imageMetadataMismatch && role === 'browser') overrides.Config = { Image: BROWSER_IMAGE_REF, Labels: { ...imageLabels.browser, ...labels, authors: 'unknown' } };
      if (mountMismatch && role === 'app') overrides.Mounts = [{ Type: 'bind', Source: 'C:\\outside', Destination: '/home/claroline', RW: true }];
      if (badBinding && role === 'app') overrides.HostConfig = { Privileged: false, NetworkMode: names.network, Binds: [], PortBindings: { '80/tcp': [{ HostIp: '0.0.0.0', HostPort: '51001' }] } };
      return makeContainer(role, overrides);
    });
    for (const item of runContainers) state.containers.set(item.Id, item);
    const endpoints = endpointMismatch ? [ids.other] : createdUnstarted ? [] : runContainers.map(item => item.Id);
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

test('approved egress-limited bridge profile is checked and legacy internal runs remain cleanable', () => {
  const correct = fakeDocker();
  assert.equal(cleanup(correct).outcome, 'PASS');
  for (const mutate of [
    network => { network.Internal = true; },
    network => { network.EnableIPv6 = true; },
    network => { delete network.EnableIPv6; },
    network => { network.Options['com.docker.network.bridge.enable_ip_masquerade'] = 'true'; },
    network => { delete network.Options['com.docker.network.bridge.enable_ip_masquerade']; },
  ]) {
    const fake = fakeDocker(); mutate(fake.state.networks.get(ids.network));
    assert.throws(() => cleanup(fake), /network policy mismatch/);
    assert.deepEqual(fake.state.mutations, []);
  }
  const legacy = fakeDocker();
  legacy.state.networks.set(ids.network, makeNetwork([ids.app, ids.browser], INTERNAL_NETWORK_POLICY));
  const legacyRecord = record(); legacyRecord.networkPolicy = INTERNAL_NETWORK_POLICY;
  assert.equal(cleanup(legacy, legacyRecord).outcome, 'PASS');
});

test('isolated internal bridge requires the recorded explicit IPAM gateway and exact container endpoints', () => {
  const value = record();
  value.networkPolicy = INTERNAL_IPAM_NETWORK_POLICY;
  value.network = { id: ids.network, name: names.network, subnet: INTERNAL_IPAM_SUBNET_CANDIDATES[0], gateway: '172.26.254.1' };
  const valid = fakeDocker();
  valid.state.networks.set(ids.network, makeNetwork([ids.app, ids.browser], INTERNAL_IPAM_NETWORK_POLICY));
  for (const role of ['app', 'browser']) valid.state.containers.get(ids[role]).NetworkSettings.Networks[names.network].Gateway = value.network.gateway;
  assert.equal(cleanup(valid, value).outcome, 'PASS');
  const omittedGateway = fakeDocker();
  omittedGateway.state.networks.set(ids.network, makeNetwork([ids.app, ids.browser], INTERNAL_IPAM_NETWORK_POLICY));
  assert.equal(cleanup(omittedGateway, value).outcome, 'PASS', 'Docker Desktop may omit the endpoint gateway while network IPAM remains explicit');
  for (const mutate of [
    fake => { fake.state.networks.get(ids.network).Internal = false; },
    fake => { fake.state.networks.get(ids.network).IPAM.Config[0].Gateway = '172.26.254.2'; },
    fake => { fake.state.networks.get(ids.network).IPAM.Config = []; },
    fake => { fake.state.containers.get(ids.app).NetworkSettings.Networks[names.network].Gateway = '172.26.254.9'; },
    fake => { fake.state.containers.get(ids.app).NetworkSettings.Networks[names.network].NetworkID = ids.otherNetwork; },
  ]) {
    const fake = fakeDocker();
    fake.state.networks.set(ids.network, makeNetwork([ids.app, ids.browser], INTERNAL_IPAM_NETWORK_POLICY));
    for (const role of ['app', 'browser']) fake.state.containers.get(ids[role]).NetworkSettings.Networks[names.network].Gateway = value.network.gateway;
    mutate(fake);
    assert.throws(() => cleanup(fake, value), /network policy mismatch|endpoint network ID or gateway/);
    assert.deepEqual(fake.state.mutations, [], 'invalid network ownership blocks before cleanup mutation');
  }
});

test('internal IPAM selector skips overlapping Docker and host route CIDRs', () => {
  assert.deepEqual(selectInternalBridgeIpam(['172.26.0.0/16', '172.27.254.0/24', '0.0.0.0/0']), { subnet: '172.28.254.0/24', gateway: '172.28.254.1' });
  assert.throws(() => selectInternalBridgeIpam(['not-a-cidr']), /invalid IPv4 CIDR/);
  assert.throws(() => selectInternalBridgeIpam(INTERNAL_IPAM_SUBNET_CANDIDATES, ['172.30.0.0/16']), /no non-overlapping/);
});

test('TCP probe classification keeps timeout, unreachable, execution failure, and egress distinct', () => {
  const processProbe = (outerStatus, probeStatus, stderr = '', stdout = '') => ({
    source: 'process', status: outerStatus, stderr,
    stdout: `${stdout}${stdout ? '\n' : ''}__BEWT_TCP_PROBE_EXIT__=${probeStatus}`,
  });
  const unreachableText = 'connect: Network is unreachable';
  const genuineUnreachable = processProbe(1, 1, unreachableText);
  const connected = processProbe(0, 0);
  const refused = processProbe(1, 1, 'Connection refused');
  const timedOut = processProbe(124, 124, 'Connection timed out');
  const timeoutAndUnreachable = processProbe(124, 124, 'Connection timed out; Network is unreachable');
  const unreachableAndTimeout = processProbe(1, 1, 'Network is unreachable; Connection timed out');

  // Contradictory successful process exit and unreachable text is never isolation evidence.
  const exitZeroUnreachable = processProbe(0, 0, unreachableText);
  assert.equal(classifyTcpProbe(exitZeroUnreachable), 'INCONCLUSIVE');
  assert.equal(classifyEgressProbe(exitZeroUnreachable), 'INCONCLUSIVE');
  const outerSuccessInnerFailure = processProbe(0, 1, unreachableText);
  assert.equal(classifyTcpProbe(outerSuccessInnerFailure), 'INCONCLUSIVE');
  assert.equal(classifyEgressProbe(outerSuccessInnerFailure), 'INCONCLUSIVE');
  const exit127Unreachable = { source: 'process', status: 127, stderr: unreachableText };
  assert.equal(classifyTcpProbe(exit127Unreachable), 'PROBE_EXECUTION_FAILURE');
  assert.equal(classifyEgressProbe(exit127Unreachable), 'PROBE_EXECUTION_FAILURE');

  const spawnFailure = { source: 'process', status: null, error: Object.assign(new Error('spawn failed'), { code: 'ENOENT' }), stderr: unreachableText };
  assert.equal(classifyTcpProbe(spawnFailure), 'PROBE_EXECUTION_FAILURE');
  assert.equal(classifyEgressProbe(spawnFailure), 'PROBE_EXECUTION_FAILURE');
  assert.equal(classifyTcpProbe({ source: 'process', status: 1, stderr: unreachableText }), 'PROBE_EXECUTION_FAILURE', 'without the in-container probe marker, Docker CLI failure cannot prove isolation');

  assert.equal(classifyTcpProbe(connected), 'CONNECTION_SUCCESS');
  assert.equal(classifyEgressProbe(connected), 'EGRESS_REACHABLE');
  assert.equal(classifyTcpProbe(refused), 'CONNECTION_REFUSED');
  assert.equal(classifyEgressProbe(refused), 'EGRESS_REACHABLE');
  assert.equal(classifyTcpProbe(genuineUnreachable), 'NETWORK_UNREACHABLE');
  assert.equal(classifyEgressProbe(genuineUnreachable), 'NETWORK_UNREACHABLE');
  assert.equal(classifyTcpProbe(timedOut), 'PROBE_TIMEOUT');
  assert.equal(classifyEgressProbe(timedOut), 'TCP_TIMEOUT_INCONCLUSIVE');
  assert.equal(classifyTcpProbe(timeoutAndUnreachable), 'INCONCLUSIVE');
  assert.equal(classifyEgressProbe(timeoutAndUnreachable), 'INCONCLUSIVE');
  assert.equal(classifyTcpProbe(unreachableAndTimeout), 'INCONCLUSIVE');
  assert.equal(classifyEgressProbe(unreachableAndTimeout), 'INCONCLUSIVE');

  assert.equal(classifyTcpProbe(processProbe(0, 0, unreachableText)), 'INCONCLUSIVE', 'probe marker success conflicts with unreachable stderr');
  assert.equal(classifyEgressProbe(processProbe(0, 1, 'Network is unreachable', 'connected')), 'INCONCLUSIVE', 'connection evidence conflicts with unreachable result');
  assert.equal(classifyTcpProbe(processProbe(127, 127, 'bash: command not found; Network is unreachable')), 'PROBE_EXECUTION_FAILURE');
  assert.equal(classifyTcpProbe({}), 'INCONCLUSIVE');
  assert.equal(classifyEgressProbe({}), 'INCONCLUSIVE');
  assert.equal(classifyTcpProbe(null), 'INCONCLUSIVE');
  assert.equal(classifyEgressProbe({ status: 0, stderr: unreachableText }), 'INCONCLUSIVE');
  assert.equal(classifyEgressProbe({ status: 124 }), 'INCONCLUSIVE');
  assert.equal(classifyTcpProbe({ source: 'node-socket', status: 1, error: Object.assign(new Error(unreachableText), { code: 'ENETUNREACH' }) }), 'NETWORK_UNREACHABLE');
  assert.equal(classifyTcpProbe({ source: 'node-socket', status: null, error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) }), 'PROBE_TIMEOUT');
  assert.equal(classifyTcpProbe({ source: 'node-socket', status: 1, error: Object.assign(new Error('socket failure'), { code: 'EIO' }) }), 'INCONCLUSIVE');
});

test('host IPv6 unavailable is distinct from a reachable host control and never proves container isolation', () => {
  assert.equal(classifyHostControlProbe({ source: 'node-socket', status: 0, connectionEstablished: true }, 'ipv6'), 'HOST_CONTROL_REACHABLE');
  assert.equal(classifyHostControlProbe({ source: 'node-socket', status: 1, error: Object.assign(new Error('Network is unreachable'), { code: 'ENETUNREACH' }) }, 'ipv6'), 'HOST_IPV6_UNAVAILABLE');
  assert.equal(classifyHostControlProbe({ source: 'node-socket', status: 1, error: Object.assign(new Error('Network is unreachable'), { code: 'ENETUNREACH' }) }, 'ipv4'), 'HOST_IPV4_UNAVAILABLE');
  assert.equal(classifyHostControlProbe({ source: 'node-socket', status: null, error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) }, 'ipv6'), 'HOST_CONTROL_TIMEOUT_INCONCLUSIVE');
  assert.equal(classifyHostControlProbe({ source: 'node-socket', status: 1, error: Object.assign(new Error('Connection refused'), { code: 'ECONNREFUSED' }) }, 'ipv6'), 'HOST_CONTROL_TARGET_REFUSED');
  assert.equal(classifyHostControlProbe({ source: 'process', status: null, error: Object.assign(new Error('spawn failed'), { code: 'ENOENT' }) }, 'ipv6'), 'HOST_CONTROL_EXECUTION_FAILURE');
});

test('Node socket timeout preserves its source and remains an inconclusive host control', async () => {
  const socket = new EventEmitter();
  let destroyed = false;
  socket.setTimeout = (_timeout, callback) => queueMicrotask(callback);
  socket.destroy = () => { destroyed = true; };
  const result = await probeTcpTarget('2001:db8::1', 443, 'ipv6', 1, () => socket);
  assert.equal(result.source, 'node-socket');
  assert.equal(result.status, null);
  assert.equal(result.error.code, 'ETIMEDOUT');
  assert.equal(destroyed, true);
  assert.equal(classifyTcpProbe(result), 'PROBE_TIMEOUT');
  assert.equal(classifyHostControlProbe(result, 'ipv6'), 'HOST_CONTROL_TIMEOUT_INCONCLUSIVE');
});

test('privileged route command stays disabled without independent Team Lead authorization', () => {
  const correct = makeNetwork([], ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY);
  assert.equal(assertNetworkPolicy(correct, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY), correct);
  const request = routeIsolationApprovalRequest(ids.app, 'app', runId);
  assert.equal(request.runId, runId);
  assert.equal(request.containerId, ids.app);
  assert.match(request.command, new RegExp(ids.app));
  assert.equal(request.maxExecutions, 1);
  const candidates = [
    undefined,
    { role: 'app', approverRole: 'Team Lead', approvedBy: 'untrusted-input' },
    { role: 'app', runId: 'wrong-run', containerId: ids.app, command: request.command, scope: request.scope, rollback: request.rollback },
    { role: 'app', runId, containerId: ids.browser, command: request.command, scope: request.scope, rollback: request.rollback },
    { role: 'app', runId, containerId: ids.app, command: 'docker exec --privileged other', scope: request.scope, rollback: request.rollback },
    { role: 'app', runId, containerId: ids.app, command: request.command, scope: 'wrong scope', rollback: request.rollback },
    { role: 'app', runId, containerId: ids.app, command: request.command, scope: request.scope, rollback: 'wrong rollback' },
    { role: 'app', runId, containerId: ids.app, command: request.command, scope: request.scope, rollback: request.rollback, expiresAtUtc: '2000-01-01T00:00:00Z', nonce: 'reused' },
  ];
  for (const candidate of candidates) {
    assert.throws(() => routeIsolationExecArgs(ids.app, candidate, runId), error => error.code === 'BLOCKED_APPROVAL_REQUIRED');
  }
  assert.throws(() => routeIsolationApprovalRequest('bewt-covext-app', 'app', runId), /full recorded Docker container ID/);
  assert.throws(() => requestRouteIsolationApproval(request), error => error.code === 'BLOCKED_APPROVAL_REQUIRED' && error.authorizationRequest === request);
  assert.throws(() => routeIsolationExecArgs(ids.app, undefined, runId), error => error.code === 'BLOCKED_APPROVAL_REQUIRED');
  const diagnosticSource = readFileSync(new URL('../run-claroline-diagnostic.mjs', import.meta.url), 'utf8');
  const g0Source = readFileSync(new URL('../run-claroline-g0.mjs', import.meta.url), 'utf8');
  assert.ok(diagnosticSource.indexOf('requestRouteIsolationApproval(routeRequest)') < diagnosticSource.indexOf("dockerCall(['start', record.containers[0].id]"));
  assert.ok(g0Source.indexOf('requestRouteIsolationApproval(routeRequests.app)') < g0Source.indexOf("dockerCall(['start', appRecord.id]"));
  assert.equal(assertNoDefaultRoutes('192.168.0.0/16 dev eth0 scope link\n'), true);
  assert.equal(assertNoDefaultRoutes(''), true);
  assert.throws(() => assertNoDefaultRoutes('default via 172.26.254.1 dev eth0'), /EGRESS_ROUTE_PRESENT/);
  assert.equal(assertPrivateLogDirectory('/root/.t03b2-logs.A1B2C3D4', '/root'), '/root/.t03b2-logs.A1B2C3D4');
  assert.equal(assertPrivateLogDirectory('/home/seluser/.t03b2-logs.A1B2C3D4', '/home/seluser'), '/home/seluser/.t03b2-logs.A1B2C3D4');
  for (const path of ['/tmp/t03b2.log', '/root/.t03b2-logs../unsafe', '/root/.t03b2-logs.a/../../tmp']) {
    assert.throws(() => assertPrivateLogDirectory(path, '/root'), /private directory below the container home/);
  }
  for (const mutate of [network => { network.Internal = true; }, network => { network.EnableIPv6 = true; }, network => { network.Options['com.docker.network.bridge.enable_ip_masquerade'] = 'true'; }]) {
    const network = makeNetwork([], ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY); mutate(network);
    assert.throws(() => assertNetworkPolicy(network, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY), /network policy mismatch/);
  }
});

test('external TCP probes are generated for fixed IPv4 and IPv6 targets', () => {
  assert.deepEqual(EGRESS_PROBE_TARGETS.ipv4, { family: 'ipv4', address: '1.1.1.1', port: 443 });
  assert.deepEqual(EGRESS_PROBE_TARGETS.ipv6, { family: 'ipv6', address: '2606:4700:4700::1111', port: 443 });
  assert.deepEqual(buildEgressProbeArgs(ids.app, 'ipv4'), ['exec', ids.app, 'bash', '-lc', `timeout 5 bash -c 'echo >/dev/tcp/1.1.1.1/443'; probe_status=$?; printf '\\n__BEWT_TCP_PROBE_EXIT__=%s\\n' "$probe_status"; exit "$probe_status"`]);
  assert.deepEqual(buildEgressProbeArgs(ids.app, 'ipv6'), ['exec', ids.app, 'bash', '-lc', `timeout 5 bash -c 'echo >/dev/tcp/2606:4700:4700::1111/443'; probe_status=$?; printf '\\n__BEWT_TCP_PROBE_EXIT__=%s\\n' "$probe_status"; exit "$probe_status"`]);
  assert.throws(() => buildEgressProbeArgs('short-id', 'ipv4'), /full container ID/);
  assert.throws(() => buildEgressProbeArgs(ids.app, 'all'), /ipv4 or ipv6/);
});

test('cleanup of route-isolated containers requires exact bootstrap and no persistent capabilities', () => {
  const value = record();
  value.networkPolicy = ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY;
  value.egressIsolationMethod = ROUTE_ISOLATION_METHOD;
  value.network = { id: ids.network, name: names.network, subnet: INTERNAL_IPAM_SUBNET_CANDIDATES[0], gateway: '172.26.254.1' };
  const valid = fakeDocker();
  valid.state.networks.set(ids.network, makeNetwork([ids.app, ids.browser], ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY));
  for (const role of ['app', 'browser']) {
    const container = valid.state.containers.get(ids[role]);
    container.Config.Entrypoint = ['/bin/sh']; container.Config.Cmd = ['-c', 'sleep infinity'];
    container.HostConfig.CapAdd = [];
    container.NetworkSettings.Networks[names.network].Gateway = value.network.gateway;
  }
  valid.state.containers.get(ids.app).NetworkSettings.Networks[names.network].Gateway = '';
  assert.equal(cleanup(valid, value).outcome, 'PASS', 'an omitted endpoint Gateway is accepted only with the exact NetworkID and inspected IPAM');
  const preStartRouteIsolated = fakeDocker({ roles: ['app'], createdUnstarted: true });
  preStartRouteIsolated.state.networks.set(ids.network, makeNetwork([], ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY));
  const preStartApp = preStartRouteIsolated.state.containers.get(ids.app);
  preStartApp.Config.Entrypoint = ['/bin/sh']; preStartApp.Config.Cmd = ['-c', 'sleep infinity'];
  preStartApp.HostConfig.CapAdd = [];
  preStartApp.HostConfig.PortBindings['80/tcp'][0].HostPort = '51001';
  const preStartRecord = record(['app']);
  preStartRecord.networkPolicy = ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY;
  preStartRecord.egressIsolationMethod = ROUTE_ISOLATION_METHOD;
  preStartRecord.network = { id: ids.network, name: names.network, subnet: INTERNAL_IPAM_SUBNET_CANDIDATES[0], gateway: '172.26.254.1' };
  preStartRecord.selectedHostPorts = { app: 51001 };
  assert.equal(cleanup(preStartRouteIsolated, preStartRecord).outcome, 'PASS', 'created-state route-isolated container blocked before docker start cleans up cleanly');
  for (const mutate of [
    fake => { fake.state.containers.get(ids.app).HostConfig.CapAdd = ['NET_ADMIN']; },
    fake => { fake.state.containers.get(ids.browser).Config.Cmd = ['-c', 'unexpected']; },
    fake => { fake.state.networks.get(ids.network).IPAM.Config[0].Gateway = '172.26.254.2'; },
    fake => { fake.state.containers.get(ids.app).NetworkSettings.Networks[names.network].NetworkID = ids.otherNetwork; },
    fake => { fake.state.containers.get(ids.app).NetworkSettings.Networks[names.network].Gateway = '172.26.254.99'; },
  ]) {
    const fake = fakeDocker();
    fake.state.networks.set(ids.network, makeNetwork([ids.app, ids.browser], ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY));
    for (const role of ['app', 'browser']) {
      const container = fake.state.containers.get(ids[role]);
      container.Config.Entrypoint = ['/bin/sh']; container.Config.Cmd = ['-c', 'sleep infinity'];
      container.HostConfig.CapAdd = [];
      container.NetworkSettings.Networks[names.network].Gateway = value.network.gateway;
    }
    mutate(fake);
    assert.throws(() => cleanup(fake, value), /dormant bootstrap|IPAM|network ID or gateway/);
    assert.deepEqual(fake.state.mutations, [], 'invalid route/isolation ownership blocks before cleanup mutation');
  }
});

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

test('Docker create port bind race is classified after any returned ID is recorded', () => {
  const value = record([], false); value.network = { id: ids.network, name: names.network };
  assert.throws(() => recordCreatedResource({
    kind: 'container', role: 'app', name: names.app, imageRef: APP_IMAGE_REF,
    result: { status: 1, stdout: `${ids.app}\n`, stderr: Buffer.from('Bind for 127.0.0.1:51001 failed: port is already allocated') },
    record: value,
  }), /PORT_BIND_CONFLICT/);
  assert.equal(value.containers[0].id, ids.app);
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

test('pre-start cleanup safely removes created containers with empty dynamic ports and no network endpoints', () => {
  for (const roles of [['app'], ['app', 'browser']]) {
    const fake = fakeDocker({ roles, createdUnstarted: true });
    const result = cleanup(fake, record(roles));
    assert.equal(result.outcome, 'PASS');
    assert.equal(result.removedContainerIds.length, roles.length);
    assert.equal(fake.state.containers.has(ids.other), true, 'unrelated ExpressCart container is preserved');
    assert.equal(fake.state.networks.has(ids.otherNetwork), true, 'unrelated Kanboard network is preserved');
    assert.equal(fake.state.volumes.has('unrelated-volume'), true, 'unrelated project volume is preserved');
  }
});

test('running containers with an explicitly unallocated host port are safely cleaned by recorded ownership', () => {
  const fake = fakeDocker();
  for (const role of ['app', 'browser']) {
    const item = fake.state.containers.get(ids[role]);
    const key = role === 'app' ? '80/tcp' : '4444/tcp';
    item.HostConfig.PortBindings[key][0].HostPort = '';
    item.NetworkSettings.Ports = { [key]: [] };
  }
  const result = cleanup(fake);
  assert.equal(result.outcome, 'PASS');
  assert.equal(fake.state.containers.has(ids.app), false);
  assert.equal(fake.state.containers.has(ids.browser), false);
  assert.equal(fake.state.containers.has(ids.other), true, 'unrelated ExpressCart container is preserved');
  assert.equal(fake.state.networks.has(ids.otherNetwork), true, 'unrelated Kanboard network is preserved');
  assert.equal(fake.state.volumes.has('unrelated-volume'), true, 'unrelated project volume is preserved');
});

test('an empty HostConfig port is blocked if Docker reports an assigned external port', () => {
  const fake = fakeDocker();
  const app = fake.state.containers.get(ids.app);
  app.HostConfig.PortBindings['80/tcp'][0].HostPort = '';
  app.NetworkSettings.Ports = { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '51001' }] };
  assert.throws(() => cleanup(fake), CleanupBlockedError);
  assert.deepEqual(fake.state.mutations, []);
});
test('stopped exit-137 container with detached endpoint and no published port is safely removed', () => {
  const fake = fakeDocker();
  const app = fake.state.containers.get(ids.app);
  app.State = { Status: 'exited', Running: false, ExitCode: 137 };
  app.HostConfig.PortBindings['80/tcp'][0].HostPort = '';
  app.NetworkSettings.Ports = {};
  app.NetworkSettings.Networks[names.network] = { NetworkID: ids.network, EndpointID: '', IPAddress: '', Gateway: '', MacAddress: '' };
  fake.state.networks.get(ids.network).Containers = { [ids.browser]: {} };
  const result = cleanup(fake);
  assert.equal(result.outcome, 'PASS');
  assert.equal(fake.state.containers.has(ids.app), false);
  assert.equal(fake.state.containers.has(ids.browser), false);
  assert.equal(fake.state.networks.has(ids.network), false);
  assert.equal(fake.state.containers.has(ids.other), true, 'unrelated ExpressCart container is preserved');
  assert.equal(fake.state.networks.has(ids.otherNetwork), true, 'unrelated Kanboard network is preserved');
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
  for (const options of [{ labelMismatch: true }, { imageMetadataMismatch: true }, { mountMismatch: true }, { badBinding: true }, { endpointMismatch: true }]) {
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

test('app-only diagnostic can safely clean an exact loopback record when Docker omits the active port report', () => {
  const fake = fakeDocker({ roles: ['app'] });
  const value = record(['app']);
  value.selectedHostPorts = { app: 51001 };
  const item = fake.state.containers.get(ids.app);
  item.NetworkSettings.Ports['80/tcp'] = [];
  const result = cleanup(fake, value);
  assert.equal(result.outcome, 'PASS');
  assert.equal(fake.state.containers.has(ids.other), true, 'unrelated ExpressCart container is preserved');
  assert.equal(fake.state.networks.has(ids.otherNetwork), true, 'unrelated Kanboard network is preserved');
  assert.equal(fake.state.volumes.has('unrelated-volume'), true);
});

test('selected port mismatch or active external binding blocks cleanup without mutation', () => {
  for (const change of [
    item => { item.HostConfig.PortBindings['80/tcp'][0].HostPort = '51003'; },
    item => { item.NetworkSettings.Ports['80/tcp'] = [{ HostIp: '0.0.0.0', HostPort: '51001' }]; },
    item => { item.NetworkSettings.Ports['3306/tcp'] = [{ HostIp: '0.0.0.0', HostPort: '3306' }]; },
  ]) {
    const fake = fakeDocker({ roles: ['app'] });
    const value = record(['app']);
    value.selectedHostPorts = { app: 51001 };
    change(fake.state.containers.get(ids.app));
    assert.throws(() => cleanup(fake, value), /HostConfig port|does not match|unexpected active Docker port/);
    assert.deepEqual(fake.state.mutations, []);
  }
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
  if (process.platform === 'win32') {
    assert.match(DOCKER_CLI_PATH, /^[A-Z]:\\/i);
    assert.match(MAVEN_CLI_PATH, /^[A-Z]:\\Program Files\\/i);
    assert.doesNotMatch(MAVEN_ENV.PATH, /AppData|Users/i);
    assert.match(MAVEN_ENV.PATH, /C:\\Windows\\System32/i);
    assert.match(MAVEN_ENV.PATH, /Program Files/i);
    assert.equal(DOCKER_ENV.DOCKER_CONTEXT, 'desktop-linux');
  } else {
    assert.equal(DOCKER_CLI_PATH, '/usr/bin/docker');
    assert.equal(MAVEN_CLI_PATH, '/usr/bin/mvn');
    assert.doesNotMatch(MAVEN_ENV.PATH, /AppData|Users|\/home|\/tmp/i);
    assert.match(MAVEN_ENV.PATH, /\/usr\/bin/);
    assert.match(MAVEN_ENV.PATH, /\/usr\/lib\/jvm\/java-21-openjdk/);
    assert.equal(DOCKER_ENV.DOCKER_CONTEXT, undefined);
  }
  assert.equal(MAVEN_ENV.TEMP, undefined, 'child environment must not inherit a publicly writable TEMP path');
  assert.equal(MAVEN_ENV.TMP, undefined, 'child environment must not inherit a publicly writable TMP path');
  assert.equal(DOCKER_ENV.TEMP, undefined);
  assert.equal(DOCKER_ENV.TMP, undefined);
});
test('loopback port selector returns an available host-only ephemeral port', async () => {
  const port = await selectLoopbackPort();
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535);
  const { createServer } = await import('node:net');
  const server = createServer();
  await new Promise((resolvePort, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolvePort); });
  await new Promise((resolvePort, reject) => server.close(error => error ? reject(error) : resolvePort()));
});

test('selected loopback port probe detects occupied port and does not claim reservation', async () => {
  const { createServer } = await import('node:net');
  const server = createServer();
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const port = server.address().port;
  try { assert.deepEqual(await probeLoopbackPort(port), { port, available: false, errorCode: 'EADDRINUSE' }); }
  finally { await new Promise(resolveClose => server.close(resolveClose)); }
  const available = await probeLoopbackPort(port);
  assert.equal(available.available, true);
  assert.equal(available.reservationHeld, false);
});

test('Docker port verification requires exact loopback HostConfig and NetworkSettings match', () => {
  const sample = { HostConfig: { PortBindings: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '51001' }] } }, NetworkSettings: { Ports: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '51001' }] } } };
  assert.equal(assertPublishedLoopbackPort(sample, '80/tcp', 51001), true);
  assert.equal(assertDockerPortOutput('127.0.0.1:51001\n', '127.0.0.1', 51001), true);
  for (const dockerPortOutput of ['', '127.0.0.1:51002', '0.0.0.0:51001', '[::]:51001', '127.0.0.1:51001\n0.0.0.0:51001']) {
    assert.throws(() => assertDockerPortOutput(dockerPortOutput, '127.0.0.1', 51001), /DOCKER_PORT_MISMATCH/);
  }
  for (const changed of [
    { ...sample, HostConfig: { PortBindings: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '51002' }] } } },
    { ...sample, NetworkSettings: { Ports: { '80/tcp': [{ HostIp: '0.0.0.0', HostPort: '51001' }] } } },
    { ...sample, NetworkSettings: { Ports: {} } },
  ]) assert.throws(() => assertPublishedLoopbackPort(changed, '80/tcp', 51001), /PORT_BINDING_MISMATCH/);
  assert.equal(isPortBindingConflict('Error starting proxy: listen tcp: address already in use'), true);
  assert.equal(isPortBindingConflict('container exited with status 137'), false);
  assert.equal(assertContainerPortNotPublished(sample, '3306/tcp'), true);
  assert.throws(() => assertContainerPortNotPublished({ HostConfig: { PortBindings: { '3306/tcp': [{ HostIp: '127.0.1', HostPort: '3306' }] } } }, '3306/tcp'), /must not be published/);
});

test('Linux executable verification enforces root ownership, trusted prefixes, and non-writable permissions', () => {
  const validSt = { isFile: () => true, uid: 0, mode: 0o100755 };
  const validDirSt = { isFile: () => false, uid: 0, mode: 0o40755 };
  assert.equal(verifyLinuxRootExecutable('/usr/bin/docker', {
    existsFn: () => true,
    realpathFn: p => p,
    statFn: p => (p === '/usr/bin' ? validDirSt : validSt),
  }), '/usr/bin/docker');

  assert.throws(() => verifyLinuxRootExecutable('relative/docker', { existsFn: () => true, realpathFn: p => p, statFn: () => validSt }), /non-absolute/);
  assert.throws(() => verifyLinuxRootExecutable('/usr/bin/docker', { existsFn: () => false, realpathFn: p => p, statFn: () => validSt }), /not found/);
  assert.throws(() => verifyLinuxRootExecutable('/usr/bin/docker', { existsFn: () => true, realpathFn: () => '/tmp/evil-docker', statFn: () => validSt }), /outside trusted system prefixes/);
  assert.throws(() => verifyLinuxRootExecutable('/usr/bin/docker', { existsFn: () => true, realpathFn: p => p, statFn: p => (p === '/usr/bin' ? validDirSt : { ...validSt, uid: 1000 }) }), /non-root-owned/);
  assert.throws(() => verifyLinuxRootExecutable('/usr/bin/docker', { existsFn: () => true, realpathFn: p => p, statFn: p => (p === '/usr/bin' ? validDirSt : { ...validSt, mode: 0o100777 }) }), /group\/world-writable/);
  assert.throws(() => verifyLinuxRootExecutable('/usr/bin/docker', { existsFn: () => true, realpathFn: p => p, statFn: p => (p === '/usr/bin' ? validDirSt : { ...validSt, mode: 0o100644 }) }), /not executable/);
  assert.throws(() => verifyLinuxRootExecutable('/usr/bin/docker', { existsFn: () => true, realpathFn: p => p, statFn: p => (p === '/usr/bin' ? { ...validDirSt, mode: 0o40777 } : validSt) }), /untrusted parent directory/);
});

test('cross-platform memory and IPv4 route readers parse Linux and Windows formats and fail closed on invalid input', () => {
  const sampleMeminfo = 'MemTotal:       65947260 kB\nMemFree:        62100000 kB\nMemAvailable:   63604480 kB\n';
  const parsedMem = parseLinuxMeminfoBytes(sampleMeminfo);
  assert.equal(parsedMem.availableBytes, 63604480 * 1024);
  assert.equal(parsedMem.totalBytes, 65947260 * 1024);
  assert.throws(() => parseLinuxMeminfoBytes('MemTotal: 1000 kB\n'), /MemAvailable kB entry is missing/);
  assert.throws(() => parseLinuxMeminfoBytes('MemAvailable: 0 kB\n'), /non-positive/);

  assert.equal(readHostFreeMemoryBytes({ platform: 'linux', readFileSyncFn: () => sampleMeminfo }), 63604480 * 1024);
  assert.equal(readHostFreeMemoryBytes({ platform: 'win32', powershellPath: 'powershell.exe', spawnSyncFn: () => ({ status: 0, stdout: '8388608\n' }) }), 8388608 * 1024);
  assert.throws(() => readHostFreeMemoryBytes({ platform: 'win32', powershellPath: 'powershell.exe', spawnSyncFn: () => ({ status: 1, stdout: '' }) }), /HOST_MEMORY_QUERY_FAILED/);

  const sampleLinuxRoutes = [
    'default via 10.148.0.1 dev ens4 proto dhcp src 10.148.0.3 metric 100',
    '10.148.0.1 dev ens4 proto dhcp scope link src 10.148.0.3 metric 100',
    '172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown',
  ].join('\n');
  assert.deepEqual(parseLinuxIpv4Routes(sampleLinuxRoutes), ['0.0.0.0/0', '10.148.0.1/32', '172.17.0.0/16']);
  assert.throws(() => parseLinuxIpv4Routes(''), /no IPv4 route prefixes parsed/);

  assert.deepEqual(readHostIpv4Routes({ platform: 'linux', ipCliPath: '/usr/sbin/ip', spawnSyncFn: () => ({ status: 0, stdout: sampleLinuxRoutes }) }), ['0.0.0.0/0', '10.148.0.1/32', '172.17.0.0/16']);
  assert.deepEqual(readHostIpv4Routes({ platform: 'win32', powershellPath: 'powershell.exe', spawnSyncFn: () => ({ status: 0, stdout: '0.0.0.0/0\r\n172.26.254.0/24\r\n' }) }), ['0.0.0.0/0', '172.26.254.0/24']);
  assert.throws(() => readHostIpv4Routes({ platform: 'linux', ipCliPath: '/usr/sbin/ip', spawnSyncFn: () => ({ status: 1, stderr: 'ip failed' }) }), /HOST_ROUTE_INVENTORY_FAILED/);

  let linuxCall = null;
  invokeMaven(['-B', 'clean', 'test-compile'], {
    platform: 'linux',
    mavenCliPath: '/usr/bin/mvn',
    cwd: '/work',
    spawnSyncFn: (cmd, args) => { linuxCall = { cmd, args }; return { status: 0 }; },
  });
  assert.deepEqual(linuxCall, { cmd: '/usr/bin/mvn', args: ['-B', 'clean', 'test-compile'] });
  assert.throws(() => invokeMaven(['-B\nmalicious'], { platform: 'linux' }), /Unsafe or non-string Maven argument/);
});

test('Cloud Controller enforces allowlisted actions, VM termination schedule, and SHA-256 manifests', () => {
  assert.equal(assertAllowedRemoteAction('preflight-probe').action, 'preflight-probe');
  assert.equal(assertAllowedRemoteAction('run-diagnostic', { runId }).runId, runId);
  assert.throws(() => assertAllowedRemoteAction('rm -rf /'), /UNALLOWED_REMOTE_ACTION/);
  assert.throws(() => assertAllowedRemoteAction('run-diagnostic', { runId: '../bad' }), /runId must be a unique t03b2-\*/);
  assert.throws(() => assertAllowedRemoteAction('preflight-probe', { runId }), /UNEXPECTED_RUN_ID/);
  assert.match(buildRemoteCommandScript('run-diagnostic', { runId }), /run-claroline-diagnostic\.mjs t03b2-a-20261109-r1$/);

  const validVm = {
    id: '3042402845209891905',
    name: 'bewt-covext-runner',
    status: 'RUNNING',
    machineType: 'zones/asia-southeast1-a/machineTypes/c4d-highmem-8',
    zone: 'zones/asia-southeast1-a',
    creationTimestamp: '2026-11-09T12:18:54.625-08:00',
    scheduling: { maxRunDuration: { seconds: '21600' }, instanceTerminationAction: 'STOP' },
  };
  const createdMs = Date.parse(validVm.creationTimestamp);
  const schedule = verifyTerminationSchedule(validVm, createdMs + 3600 * 1000);
  assert.equal(schedule.remainingSeconds, 18000);
  assert.equal(schedule.terminationTimestampUtc, '2026-11-10T02:18:54.625Z');
  assert.throws(() => verifyTerminationSchedule({ ...validVm, status: 'TERMINATED' }, createdMs + 1000), /VM_STOPPED_OR_NOT_RUNNING/);
  assert.throws(() => verifyTerminationSchedule(validVm, createdMs + 21500 * 1000), /VM_DEADLINE_INSUFFICIENT/);
  assert.equal(scrubCloudText('token=ya29.a0AfH6SMBx and /home/runner/BEWT-CovExt/file'), 'token=[REDACTED] and <REMOTE_REPO>/file');
});

test('Deterministic Evidence Validator detects contradictions, secret leaks, and validates SHA-256 manifests', () => {
  const base = mkdtempSync(join(tmpdir(), 't03b2-validator-test-'));
  const dir = join(base, runId);
  try {
    createEvidenceDirectory(base, runId);
    writeFileSync(join(dir, 'run-record.json'), JSON.stringify({
      runId,
      benchmarkRepositoryCommit: SOURCE_COMMIT,
      imageDigest,
      browserImageDigest,
      networkPolicy: ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY,
      containers: [{ role: 'app', id: ids.app, name: names.app, imageRef: APP_IMAGE_REF }],
      network: { id: ids.network, name: names.network },
    }, null, 2));
    writeFileSync(join(dir, 'memory-preflight.json'), JSON.stringify({
      samples: [
        { capturedAtUtc: '2026-11-10T03:00:00.000Z', freeBytes: 60 * 1024 ** 3 },
        { capturedAtUtc: '2026-11-10T03:00:05.000Z', freeBytes: 60 * 1024 ** 3 },
      ],
      outcome: 'PASS',
    }, null, 2));
    writeFileSync(join(dir, 'image-inspect-sanitized.json'), JSON.stringify({
      app: { repoDigests: [APP_IMAGE_REF] },
      browser: { repoDigests: [BROWSER_IMAGE_REF] },
    }, null, 2));
    writeFileSync(join(dir, 'network-policy-verification.json'), JSON.stringify({
      outcome: 'PASS',
      policy: ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY,
      ipv6Enabled: false,
      ipMasquerade: 'false',
    }, null, 2));
    writeFileSync(join(dir, 'cleanup-result.json'), JSON.stringify({
      outcome: 'PASS',
      residualCount: 0,
      removedContainerIds: [ids.app],
      removedNetworkId: ids.network,
    }, null, 2));
    writeFileSync(join(dir, 'docker-inventory-sanitized-summary.json'), JSON.stringify({
      countsEqual: true,
      fingerprintsEqual: true,
    }, null, 2));
    writeFileSync(join(dir, 'diagnostic-result.json'), JSON.stringify({
      runId,
      outcome: 'BLOCKED_APPROVAL_REQUIRED',
      reason: 'awaiting approval',
      selenium: 'NOT_RUN',
    }, null, 2));
    const manifest = computeDirectorySha256Manifest(dir, { runId });
    writeFileSync(join(dir, 'sha256-manifest.json'), JSON.stringify(manifest, null, 2));

    const validRes = validateEvidenceDirectory(dir);
    assert.equal(validRes.valid, true);
    assert.equal(validRes.status, 'VALID');
    assert.equal(validRes.seleniumE2eStatus, 'NOT_RUN');
    assert.equal(validRes.cleanupStatus, 'PASS');

    // Inject DB contradiction: DB failed but diagnostic claims PASS
    writeFileSync(join(dir, 'database-readiness.json'), JSON.stringify({ exitCode: 1, expectedDatabasePresent: false }, null, 2));
    writeFileSync(join(dir, 'diagnostic-result.json'), JSON.stringify({ runId, outcome: 'PASS', selenium: 'NOT_RUN' }, null, 2));
    const contradicted = validateEvidenceDirectory(dir, { requireManifest: false });
    assert.equal(contradicted.valid, false);
    assert.equal(contradicted.status, 'EVIDENCE_CONTRADICTION');

    // Inject secret leak
    writeFileSync(join(dir, 'leak.txt'), 'leaked token ya29.SecretToken12345');
    const leakScan = scanEvidenceForSecretsAndLeaks(dir);
    assert.equal(leakScan.outcome, 'FAIL');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
