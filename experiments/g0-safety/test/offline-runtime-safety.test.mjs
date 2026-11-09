import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNetworkIsolatedBeforeStart, assertOwnedContainer, classifyStartupResult, createCleanupPlan, labelsForRun, RuntimeSafetyError } from '../offline-runtime-safety.mjs';

const labels = labelsForRun('joomla', 't03c-joomla-20261110-r1');
const imageRef = 'example.invalid/app@sha256:' + 'a'.repeat(64);
const network = (overrides = {}) => ({ Id: 'net-1234567890', Name: 'run-net', Driver: 'bridge', Internal: true, EnableIPv6: false, Labels: labels, Containers: {}, ...overrides });
const container = (overrides = {}) => ({ Id: 'a'.repeat(64), Name: '/run-app', Config: { Image: imageRef, Labels: labels }, State: { Running: false }, Mounts: [], NetworkSettings: { Networks: { 'run-net': { NetworkID: 'net-1234567890' } } }, HostConfig: { PortBindings: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '51234' }], '3306/tcp': null } }, ...overrides });
const containerExpected = { id: 'a'.repeat(64), name: 'run-app', imageRef, networkId: 'net-1234567890', portBindings: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '51234' }], '3306/tcp': null } };

test('labels bind one run to a recognized app and fail malformed ids closed', () => {
  assert.equal(labelsForRun('joomla', 't03c-joomla-20261110-r1').runId, 't03c-joomla-20261110-r1');
  assert.throws(() => labelsForRun('Joomla', 'run-1'), RuntimeSafetyError);
  assert.throws(() => labelsForRun('joomla', 'bad/run'), RuntimeSafetyError);
});

test('internal IPv4-only network must be inspected before any endpoint exists', () => {
  assert.deepEqual(assertNetworkIsolatedBeforeStart(network(), { id: 'net-1234567890', name: 'run-net', labels }), { verified: true, networkId: 'net-1234567890', policy: 'internal-bridge-ipv6-disabled' });
  assert.throws(() => assertNetworkIsolatedBeforeStart(network({ Internal: false }), { id: 'net-1234567890', name: 'run-net', labels }), /internal bridge/);
  assert.throws(() => assertNetworkIsolatedBeforeStart(network({ EnableIPv6: true }), { id: 'net-1234567890', name: 'run-net', labels }), /IPv6 disabled/);
  assert.throws(() => assertNetworkIsolatedBeforeStart(network({ Containers: { ['a'.repeat(64)]: {} } }), { id: 'net-1234567890', name: 'run-net', labels }), /before the pre-start/);
  assert.throws(() => assertNetworkIsolatedBeforeStart(network({ Containers: undefined }), { id: 'net-1234567890', name: 'run-net', labels }), /must include a Containers object/);
});

test('container ownership requires exact digest, labels, isolated network, and loopback-only ports', () => {
  assert.equal(assertOwnedContainer(container(), { ...containerExpected, labels }), true);
  assert.throws(() => assertOwnedContainer(container(), { ...containerExpected, imageRef: 'example.invalid/app:latest', labels }), /sha256 digest/);
  assert.throws(() => assertOwnedContainer(container({ Config: { Image: imageRef, Labels: { ...labels, runId: 'other' } } }), { ...containerExpected, labels }), /ownership labels/);
  assert.throws(() => assertOwnedContainer(container({ HostConfig: { PortBindings: { '3306/tcp': [{ HostIp: '0.0.0.0', HostPort: '3306' }] } } }), { ...containerExpected, labels }), /PortBindings keys/);
  assert.throws(() => assertOwnedContainer(container({ HostConfig: { PortBindings: { '80/tcp': [{ HostIp: '0.0.0.0', HostPort: '51234' }], '3306/tcp': null } } }), { ...containerExpected, labels }), /loopback-only/);
  assert.throws(() => assertOwnedContainer(container({ HostConfig: { PortBindings: { '80/tcp': null, '3306/tcp': null } } }), { ...containerExpected, labels }), /missing or incomplete/);
  assert.throws(() => assertOwnedContainer(container({ HostConfig: { PortBindings: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '51234' }] } } }), { ...containerExpected, labels }), /PortBindings keys/);
  assert.throws(() => assertOwnedContainer(container({ HostConfig: { PortBindings: null } }), { ...containerExpected, labels }), /must include PortBindings/);
  assert.throws(() => assertOwnedContainer(container({ HostConfig: {} }), { ...containerExpected, labels }), /must include PortBindings/);
  assert.throws(() => assertOwnedContainer(container(), { ...containerExpected, portBindings: undefined, labels }), /Expected complete PortBindings/);
  assert.throws(() => assertOwnedContainer(container({ NetworkSettings: { Networks: undefined } }), { ...containerExpected, labels }), /must include the Networks object/);
  assert.throws(() => assertOwnedContainer(container({ Mounts: [{ Type: 'bind', Name: '', Destination: '/data' }] }), { ...containerExpected, labels, volumes: [] }), /mount blocks cleanup/);
  for (const mounts of [undefined, null, {}]) {
    assert.throws(() => assertOwnedContainer(container({ Mounts: mounts }), { ...containerExpected, labels, volumes: [] }), /must include a Mounts array/);
  }
});

test('startup result never treats a successful CLI response alone as readiness', () => {
  assert.equal(classifyStartupResult({ spawnError: new Error('not found'), status: null }), 'STARTUP_EXECUTION_FAILURE');
  assert.equal(classifyStartupResult({ status: 127, stderr: 'docker not found' }), 'STARTUP_COMMAND_FAILED');
  assert.equal(classifyStartupResult({ status: 0, containerId: '' }), 'STARTUP_RESULT_INCONCLUSIVE');
  assert.equal(classifyStartupResult({ status: 0, containerId: 'b'.repeat(64) }), 'CONTAINER_CREATED_UNVERIFIED');
});

test('cleanup plan is emitted only for exact run-owned containers, network, and volumes', () => {
  const containers = [container()];
  const net = network({ Containers: { ['a'.repeat(64)]: {} } });
  const expected = { labels, containers: [{ ...containerExpected }], network: { id: 'net-1234567890', name: 'run-net' }, volumes: [] };
  const plan = createCleanupPlan({ containers, network: net, volumes: [] }, expected);
  assert.equal(plan.cleanupEligible, true);
  assert.equal(plan.networkIsolationVerified, false);
  assert.equal(plan.portForwardingVerified, false);
  assert.deepEqual(plan.actions.map((x) => x.args), [['stop', 'a'.repeat(64)], ['rm', 'a'.repeat(64)], ['network', 'rm', 'net-1234567890']]);
  assert.throws(() => createCleanupPlan({ containers: [...containers, container({ Id: 'c'.repeat(64) })], network: net, volumes: [] }, expected), /inventory/);
  assert.throws(() => createCleanupPlan({ containers, network: network({ Internal: false, Containers: { ['a'.repeat(64)]: {}, ['c'.repeat(64)]: {} } }), volumes: [] }, expected), /endpoint set/);
  assert.throws(() => createCleanupPlan({ containers, network: network({ Containers: undefined }), volumes: [] }, expected), /must include a Containers object/);
});

test('partial-start cleanup tolerates omitted port mappings but does not prove isolation or readiness', () => {
  const id = 'a'.repeat(64);
  const partial = container({ HostConfig: { PortBindings: null }, NetworkSettings: { Networks: {} } });
  const expected = { labels, containers: [{ ...containerExpected, id }], network: { id: 'net-1234567890', name: 'run-net' }, volumes: [] };
  const plan = createCleanupPlan({ containers: [partial], network: network(), volumes: [] }, expected, { partialContainerIds: [id] });
  assert.equal(plan.cleanupEligible, true);
  assert.equal(plan.networkIsolationVerified, false);
  assert.equal(plan.portForwardingVerified, false);
  assert.deepEqual(plan.actions.map((x) => x.args), [['stop', id], ['rm', id], ['network', 'rm', 'net-1234567890']]);
  assert.throws(() => createCleanupPlan({ containers: [container({ State: { Running: true }, HostConfig: { PortBindings: null }, NetworkSettings: { Networks: {} } })], network: network(), volumes: [] }, expected, { partialContainerIds: [id] }), /stopped container/);
  assert.throws(() => createCleanupPlan({ containers: [container({ Mounts: undefined, HostConfig: { PortBindings: null }, NetworkSettings: { Networks: {} } })], network: network(), volumes: [] }, expected, { partialContainerIds: [id] }), /must include a Mounts array/);
});
