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
  requireValue(Object.keys(network?.Containers ?? {}).length === 0, 'BLOCKED_NETWORK_NOT_DORMANT', 'Workload endpoints already exist before the pre-start network gate');
  return { verified: true, networkId: network.Id, policy: 'internal-bridge-ipv6-disabled' };
}

export function assertOwnedContainer(container, expected) {
  requireValue(container?.Id === expected.id, 'BLOCKED_CONTAINER_IDENTITY', 'Container ID does not match the run record');
  requireValue(String(container?.Name ?? '').replace(/^\//, '') === expected.name, 'BLOCKED_CONTAINER_IDENTITY', 'Container name does not match the run record');
  requireValue(typeof expected.imageRef === 'string' && expected.imageRef.includes('@') && DIGEST.test(expected.imageRef.split('@').at(-1)), 'BLOCKED_IMAGE_PIN', 'Expected image must be pinned by sha256 digest');
  requireValue(container?.Config?.Image === expected.imageRef, 'BLOCKED_IMAGE_IDENTITY', 'Container image reference does not match the pinned image');
  requireValue(labelsMatch(container?.Config?.Labels, expected.labels), 'BLOCKED_CONTAINER_OWNERSHIP', 'Container ownership labels do not match the run');

  const allowedVolumes = new Map((expected.volumes ?? []).map((volume) => [volume.name, volume.destination]));
  for (const mount of container?.Mounts ?? []) {
    requireValue(mount.Type === 'volume' && allowedVolumes.get(mount.Name) === mount.Destination, 'BLOCKED_CONTAINER_MOUNT', 'Unexpected bind, anonymous, tmpfs, or unrecorded mount blocks cleanup');
  }
  requireValue((container?.Mounts ?? []).length === allowedVolumes.size, 'BLOCKED_CONTAINER_MOUNT', 'Recorded volume inventory does not match actual mounts');

  const networks = Object.values(container?.NetworkSettings?.Networks ?? {});
  requireValue(networks.length === 1 && networks[0].NetworkID === expected.networkId, 'BLOCKED_CONTAINER_NETWORK', 'Container must attach only to the recorded isolated network');

  for (const [port, bindings] of Object.entries(container?.HostConfig?.PortBindings ?? {})) {
    if (bindings === null) continue;
    requireValue(Array.isArray(expected.publishedPorts?.[port]) && bindings.length === expected.publishedPorts[port].length, 'BLOCKED_CONTAINER_PORT', `Unexpected published container port ${port}`);
    const expectedBindings = expected.publishedPorts[port];
    for (const binding of bindings) {
      requireValue(binding.HostIp === '127.0.0.1' && expectedBindings.includes(Number(binding.HostPort)), 'BLOCKED_CONTAINER_PORT', `Published port ${port} is not the recorded loopback binding`);
    }
  }
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
  const actual = Object.keys(network?.Containers ?? {}).sort();
  const wanted = [...(expected.containerIds ?? [])].sort();
  requireValue(JSON.stringify(actual) === JSON.stringify(wanted), 'BLOCKED_NETWORK_ENDPOINTS', 'Network endpoint set does not exactly match the run inventory');
  return true;
}

export function classifyStartupResult(result) {
  if (result?.spawnError || result?.status === null || result?.status === undefined) return 'STARTUP_EXECUTION_FAILURE';
  if (result.status !== 0) return 'STARTUP_COMMAND_FAILED';
  if (typeof result.containerId !== 'string' || !/^[a-f0-9]{12,64}$/i.test(result.containerId)) return 'STARTUP_RESULT_INCONCLUSIVE';
  return 'CONTAINER_CREATED_UNVERIFIED';
}

export function createCleanupPlan({ containers, network, volumes }, expected) {
  requireValue(Array.isArray(containers) && containers.length === expected.containers.length, 'BLOCKED_INVENTORY', 'Container inventory is incomplete or contains unrecorded resources');
  requireValue(Array.isArray(volumes) && volumes.length === expected.volumes.length, 'BLOCKED_INVENTORY', 'Volume inventory is incomplete or contains unrecorded resources');
  const byId = new Map(containers.map((container) => [container.Id, container]));
  for (const record of expected.containers) {
    const resource = byId.get(record.id);
    requireValue(resource, 'BLOCKED_INVENTORY', `Recorded container ${record.id} is missing from inventory`);
    assertOwnedContainer(resource, { ...record, labels: expected.labels, networkId: expected.network.id });
  }
  assertOwnedNetwork(network, { ...expected.network, labels: expected.labels, containerIds: expected.containers.map((x) => x.id) });
  const byName = new Map(volumes.map((volume) => [volume.Name, volume]));
  for (const volume of expected.volumes) assertOwnedVolume(byName.get(volume.name), { ...volume, labels: expected.labels });

  return [
    ...expected.containers.map(({ id }) => ({ executable: 'docker', args: ['stop', id] })),
    ...expected.containers.map(({ id }) => ({ executable: 'docker', args: ['rm', id] })),
    ...expected.volumes.map(({ name }) => ({ executable: 'docker', args: ['volume', 'rm', name] })),
    { executable: 'docker', args: ['network', 'rm', expected.network.id] },
  ];
}