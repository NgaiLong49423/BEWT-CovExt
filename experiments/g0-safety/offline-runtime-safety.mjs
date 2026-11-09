export class RuntimeSafetyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RuntimeSafetyError';
    this.code = code;
  }
}

const APP_ID = /^[a-z][a-z0-9-]{1,31}$/;
const RUN_ID = /^[a-z0-9][a-z0-9-]{2,62}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/i;

function requireValue(condition, code, message) {
  if (!condition) throw new RuntimeSafetyError(code, message);
}

export function labelsForRun(appId, runId, task = 't03c-g0') {
  requireValue(typeof appId === 'string' && APP_ID.test(appId), 'BLOCKED_IDENTITY', 'appId is malformed');
  requireValue(typeof runId === 'string' && RUN_ID.test(runId), 'BLOCKED_IDENTITY', 'runId is malformed');
  requireValue(typeof task === 'string' && /^[a-z0-9][a-z0-9-]{2,31}$/.test(task), 'BLOCKED_IDENTITY', 'task label is malformed');
  return Object.freeze({ project: 'bewt-covext', owner: 'bewt-covext', 'managed-by': 'bewt-covext-agent', app: appId, task, runId });
}

function labelsMatch(actual, expected) {
  return actual && Object.entries(expected).every(([key, value]) => actual[key] === value);
}

export function assertNetworkIsolatedBeforeStart(network, expected) {
  requireValue(network?.Id === expected.id && network?.Name === expected.name, 'BLOCKED_NETWORK_IDENTITY', 'Network ID or name does not match the run record');
  requireValue(network?.Driver === 'bridge' && network?.Internal === true && network?.EnableIPv6 === false, 'BLOCKED_NETWORK_POLICY', 'Network must be an internal bridge with IPv6 disabled before workload creation');
  requireValue(labelsMatch(network?.Labels, expected.labels), 'BLOCKED_NETWORK_OWNERSHIP', 'Network does not carry the complete run ownership labels');
  requireValue(inspectedNetworkEndpoints(network).length === 0, 'BLOCKED_NETWORK_NOT_DORMANT', 'Workload endpoints already exist before the pre-start network gate');
  return { verified: true, networkId: network.Id, policy: 'internal-bridge-ipv6-disabled' };
}

function assertContainerIdentityAndMounts(container, expected) {
  requireValue(container?.Id === expected.id, 'BLOCKED_CONTAINER_IDENTITY', 'Container ID does not match the run record');
  requireValue(String(container?.Name ?? '').replace(/^\//, '') === expected.name, 'BLOCKED_CONTAINER_IDENTITY', 'Container name does not match the run record');
  requireValue(typeof expected.imageRef === 'string' && expected.imageRef.includes('@') && DIGEST.test(expected.imageRef.split('@').at(-1)), 'BLOCKED_IMAGE_PIN', 'Expected image must be pinned by sha256 digest');
  requireValue(container?.Config?.Image === expected.imageRef, 'BLOCKED_IMAGE_IDENTITY', 'Container image reference does not match the pinned image');
  requireValue(labelsMatch(container?.Config?.Labels, expected.labels), 'BLOCKED_CONTAINER_OWNERSHIP', 'Container ownership labels do not match the run');

  requireValue(Array.isArray(container?.Mounts), 'BLOCKED_CONTAINER_MOUNT_INSPECTION', 'Docker container inspection must include a Mounts array');
  const allowedVolumes = new Map((expected.volumes ?? []).map((volume) => [volume.name, volume.destination]));
  for (const mount of container.Mounts) {
    requireValue(mount.Type === 'volume' && allowedVolumes.get(mount.Name) === mount.Destination, 'BLOCKED_CONTAINER_MOUNT', 'Unexpected bind, anonymous, tmpfs, or unrecorded mount blocks cleanup');
  }
  requireValue(container.Mounts.length === allowedVolumes.size, 'BLOCKED_CONTAINER_MOUNT', 'Recorded volume inventory does not match actual mounts');
}

function assertContainerNetworkAttachment(container, networkId, { allowUnattached = false } = {}) {
  const networks = container?.NetworkSettings?.Networks;
  requireValue(networks && typeof networks === 'object' && !Array.isArray(networks), 'BLOCKED_CONTAINER_NETWORK_INSPECTION', 'Docker container inspection must include the Networks object');
  const attached = Object.values(networks);
  if (allowUnattached && attached.length === 0) return;
  requireValue(attached.length === 1 && attached[0].NetworkID === networkId, 'BLOCKED_CONTAINER_NETWORK', 'Container must attach only to the recorded isolated network');
}

function assertCompletePortBindings(container, expected) {
  const actual = container?.HostConfig?.PortBindings;
  const wanted = expected.portBindings;
  requireValue(wanted && typeof wanted === 'object' && !Array.isArray(wanted), 'BLOCKED_CONTAINER_PORT_EXPECTATION', 'Expected complete PortBindings configuration is required');
  requireValue(actual && typeof actual === 'object' && !Array.isArray(actual), 'BLOCKED_CONTAINER_PORT_INSPECTION', 'Docker container inspection must include PortBindings');
  const expectedPorts = Object.keys(wanted).sort((a, b) => a.localeCompare(b));
  const actualPorts = Object.keys(actual).sort((a, b) => a.localeCompare(b));
  requireValue(JSON.stringify(actualPorts) === JSON.stringify(expectedPorts), 'BLOCKED_CONTAINER_PORT', 'Inspected PortBindings keys do not match the complete expected configuration');

  for (const port of expectedPorts) {
    const expectedBindings = wanted[port];
    const actualBindings = actual[port];
    if (expectedBindings === null) {
      requireValue(actualBindings === null, 'BLOCKED_CONTAINER_PORT', `Expected ${port} to have no published binding`);
      continue;
    }
    requireValue(Array.isArray(expectedBindings) && expectedBindings.length > 0, 'BLOCKED_CONTAINER_PORT_EXPECTATION', `Expected bindings for ${port} must be a non-empty array or null`);
    requireValue(Array.isArray(actualBindings) && actualBindings.length === expectedBindings.length, 'BLOCKED_CONTAINER_PORT', `Required published-port bindings for ${port} are missing or incomplete`);
    for (let index = 0; index < expectedBindings.length; index += 1) {
      const wantedBinding = expectedBindings[index];
      const binding = actualBindings[index];
      requireValue(binding.HostIp === '127.0.0.1', 'BLOCKED_CONTAINER_PORT', `Published port ${port} is not loopback-only`);
      requireValue(binding.HostIp === wantedBinding.HostIp && String(binding.HostPort) === String(wantedBinding.HostPort), 'BLOCKED_CONTAINER_PORT', `Published port ${port} does not match its exact expected binding`);
    }
  }
}

export function assertOwnedContainer(container, expected) {
  assertContainerIdentityAndMounts(container, expected);
  assertContainerNetworkAttachment(container, expected.networkId);
  assertCompletePortBindings(container, expected);
  return true;
}

export function assertPartialContainerOwnedForCleanup(container, expected) {
  assertContainerIdentityAndMounts(container, expected);
  requireValue(container?.State?.Running === false, 'BLOCKED_PARTIAL_CONTAINER_STATE', 'Partial-start cleanup only accepts a stopped container');
  assertContainerNetworkAttachment(container, expected.networkId, { allowUnattached: true });
  return true;
}

export function assertOwnedVolume(volume, expected) {
  requireValue(volume?.Name === expected.name, 'BLOCKED_VOLUME_IDENTITY', 'Volume name does not match the run record');
  requireValue(labelsMatch(volume?.Labels, expected.labels), 'BLOCKED_VOLUME_OWNERSHIP', 'Volume ownership labels do not match the run');
  return true;
}

export function assertOwnedNetwork(network, expected) {
  requireValue(network?.Id === expected.id && network?.Name === expected.name, 'BLOCKED_NETWORK_IDENTITY', 'Network ID or name does not match the run record');
  requireValue(labelsMatch(network?.Labels, expected.labels), 'BLOCKED_NETWORK_OWNERSHIP', 'Network ownership labels do not match the run');
  const actual = inspectedNetworkEndpoints(network).sort((a, b) => a.localeCompare(b));
  const wanted = [...(expected.containerIds ?? [])].sort((a, b) => a.localeCompare(b));
  requireValue(JSON.stringify(actual) === JSON.stringify(wanted), 'BLOCKED_NETWORK_ENDPOINTS', 'Network endpoint set does not exactly match the run inventory');
  return true;
}

function inspectedNetworkEndpoints(network) {
  const containers = network?.Containers;
  requireValue(containers && typeof containers === 'object' && !Array.isArray(containers), 'BLOCKED_NETWORK_INSPECTION', 'Docker network inspection must include a Containers object');
  return Object.keys(containers);
}

function assertNetworkCleanupInventory(network, expected, partialContainerIds) {
  requireValue(network?.Id === expected.id && network?.Name === expected.name, 'BLOCKED_NETWORK_IDENTITY', 'Network ID or name does not match the run record');
  requireValue(labelsMatch(network?.Labels, expected.labels), 'BLOCKED_NETWORK_OWNERSHIP', 'Network does not carry the complete run ownership labels');
  const actual = inspectedNetworkEndpoints(network).sort((a, b) => a.localeCompare(b));
  const wanted = [...(expected.containerIds ?? [])].sort((a, b) => a.localeCompare(b));
  const required = wanted.filter((id) => !partialContainerIds.has(id));
  requireValue(actual.every((id) => wanted.includes(id)) && required.every((id) => actual.includes(id)), 'BLOCKED_NETWORK_ENDPOINTS', 'Network endpoints are not a safe subset of the run inventory for cleanup');
}

export function classifyStartupResult(result) {
  if (result?.spawnError || result?.status === null || result?.status === undefined) return 'STARTUP_EXECUTION_FAILURE';
  if (result.status !== 0) return 'STARTUP_COMMAND_FAILED';
  if (typeof result.containerId !== 'string' || !/^[a-f0-9]{12,64}$/i.test(result.containerId)) return 'STARTUP_RESULT_INCONCLUSIVE';
  return 'CONTAINER_CREATED_UNVERIFIED';
}

export function createCleanupPlan({ containers, network, volumes }, expected, { partialContainerIds = [] } = {}) {
  requireValue(Array.isArray(containers) && containers.length === expected.containers.length, 'BLOCKED_INVENTORY', 'Container inventory is incomplete or contains unrecorded resources');
  requireValue(Array.isArray(volumes) && volumes.length === expected.volumes.length, 'BLOCKED_INVENTORY', 'Volume inventory is incomplete or contains unrecorded resources');
  requireValue(Array.isArray(partialContainerIds), 'BLOCKED_PARTIAL_INVENTORY', 'Partial container IDs must be an explicit array');
  const partial = new Set(partialContainerIds);
  requireValue(partial.size === partialContainerIds.length && partialContainerIds.every((id) => expected.containers.some((record) => record.id === id)), 'BLOCKED_PARTIAL_INVENTORY', 'Partial container IDs must be unique and part of the run inventory');
  const byId = new Map(containers.map((container) => [container.Id, container]));
  for (const record of expected.containers) {
    const resource = byId.get(record.id);
    requireValue(resource, 'BLOCKED_INVENTORY', `Recorded container ${record.id} is missing from inventory`);
    const owned = { ...record, labels: expected.labels, networkId: expected.network.id };
    if (partial.has(record.id)) assertPartialContainerOwnedForCleanup(resource, owned);
    else assertOwnedContainer(resource, owned);
  }
  const expectedNetwork = { ...expected.network, labels: expected.labels, containerIds: expected.containers.map((x) => x.id) };
  if (partial.size > 0) assertNetworkCleanupInventory(network, expectedNetwork, partial);
  else assertOwnedNetwork(network, expectedNetwork);
  const byName = new Map(volumes.map((volume) => [volume.Name, volume]));
  for (const volume of expected.volumes) assertOwnedVolume(byName.get(volume.name), { ...volume, labels: expected.labels });

  return {
    cleanupEligible: true,
    networkIsolationVerified: false,
    portForwardingVerified: false,
    actions: [
      ...expected.containers.map(({ id }) => ({ executable: 'docker', args: ['stop', id] })),
      ...expected.containers.map(({ id }) => ({ executable: 'docker', args: ['rm', id] })),
      ...expected.volumes.map(({ name }) => ({ executable: 'docker', args: ['volume', 'rm', name] })),
      { executable: 'docker', args: ['network', 'rm', expected.network.id] },
    ],
  };
}
