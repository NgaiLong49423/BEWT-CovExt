import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertOwnedContainer,
  assertOwnedNetwork,
  assertOwnedVolume,
  labelsForRun,
} from './kanboard-g0.mjs';

export class CleanupBlockedError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'CleanupBlockedError';
    this.outcome = 'BLOCKED';
  }
}

function detail(error) {
  return String(error?.stderr?.toString().trim() || error?.stdout?.toString().trim() || error?.message || error);
}

function escaped(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A failed inspect proves absence only for the exact Docker CLI not-found response
// for the requested resource. All other daemon/permission/transport errors block.
export function isDockerResourceNotFound(error, kind, target) {
  if (error?.status !== 1) return false;
  const output = detail(error);
  const idOrName = escaped(target);
  const patterns = {
    container: new RegExp(`^Error: No such object: ${idOrName}$`),
    network: new RegExp(`^Error response from daemon: network ${idOrName} not found$`),
    volume: new RegExp(`^Error response from daemon: get ${idOrName}: no such volume$`),
  };
  return Boolean(patterns[kind]?.test(output));
}

function dockerCli(args) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function inspect(dockerExec, kind, args, target) {
  try {
    const output = dockerExec(args);
    const values = JSON.parse(output);
    if (!Array.isArray(values) || values.length !== 1) throw new Error('Docker inspect returned an unexpected resource count');
    return values[0];
  } catch (error) {
    if (error instanceof CleanupBlockedError) throw error;
    if (isDockerResourceNotFound(error, kind, target)) return null;
    throw new CleanupBlockedError(`Docker ${kind} inspect for ${target} failed without verified NOT_FOUND: ${detail(error)}`, { cause: error });
  }
}

function compareProtected(before, after, runId) {
  const fields = ['containers', 'networks', 'volumes'];
  const changes = [];
  for (const field of fields) {
    const prior = before[field].filter((item) => item.ownershipLabels?.runId !== runId).map((item) => item.signature).sort();
    const later = after[field].filter((item) => item.ownershipLabels?.runId !== runId).map((item) => item.signature).sort();
    if (JSON.stringify(prior) !== JSON.stringify(later)) changes.push(field);
  }
  if (JSON.stringify(before.images.map((item) => item.signature).sort()) !== JSON.stringify(after.images.map((item) => item.signature).sort())) changes.push('images');
  return changes;
}

function assertCompleteRecord(record, expectedLabels) {
  if (JSON.stringify(record.labels) !== JSON.stringify(expectedLabels)) throw new CleanupBlockedError('Recorded labels do not match the T03-A task and run ID');
  if (record.containerName !== `bewt-covext-kanboard-${record.runId}`) throw new CleanupBlockedError('Recorded container name is not the required run-specific name');
  if (record.volumeNames.length !== 3 || new Set(record.volumeNames).size !== 3 || record.networkName !== `${record.containerName}-net`) {
    throw new CleanupBlockedError('Recorded network or mount inventory is incomplete');
  }
  if (!/^[a-f0-9]{64}$/.test(record.containerId) || !/^[a-f0-9]{64}$/.test(record.networkId)) {
    throw new CleanupBlockedError('Recorded container or network ID is malformed');
  }
}

function labelFilters(labels) {
  return Object.entries(labels).flatMap(([key, value]) => ['--filter', `label=${key}=${value}`]);
}

function nonemptyLines(output) {
  return output.trim() ? output.trim().split(/\r?\n/).filter(Boolean) : [];
}

function verifyNoResidualResources(dockerExec, record, expectedLabels) {
  // Probe every recorded ID/name independently; a missing ID cannot hide a stale name.
  const recordedContainerById = inspect(dockerExec, 'container', ['inspect', record.containerId], record.containerId);
  const recordedContainerByName = inspect(dockerExec, 'container', ['inspect', record.containerName], record.containerName);
  if (recordedContainerById || recordedContainerByName) throw new CleanupBlockedError('Recorded container ID or name remains after cleanup');
  const recordedNetworkById = inspect(dockerExec, 'network', ['network', 'inspect', record.networkId], record.networkId);
  const recordedNetworkByName = inspect(dockerExec, 'network', ['network', 'inspect', record.networkName], record.networkName);
  if (recordedNetworkById || recordedNetworkByName) throw new CleanupBlockedError('Recorded network ID or name remains after cleanup');
  for (const name of record.volumeNames) {
    if (inspect(dockerExec, 'volume', ['volume', 'inspect', name], name)) throw new CleanupBlockedError(`Recorded volume ${name} remains after cleanup`);
  }

  // Three independent post-cleanup inventories filtered by the full ownership tuple.
  const containerIds = nonemptyLines(dockerExec(['ps', '-aq', '--no-trunc', ...labelFilters(expectedLabels)]));
  const networkRows = nonemptyLines(dockerExec(['network', 'ls', '--no-trunc', ...labelFilters(expectedLabels), '--format', '{{.ID}}\t{{.Name}}']));
  const volumeNames = nonemptyLines(dockerExec(['volume', 'ls', '-q', ...labelFilters(expectedLabels)]));

  for (const id of containerIds) {
    const remaining = inspect(dockerExec, 'container', ['inspect', id], id);
    if (!remaining || !Object.entries(expectedLabels).every(([key, value]) => remaining.Config?.Labels?.[key] === value)) {
      throw new CleanupBlockedError(`Owned-container label inventory returned an unverified resource: ${id}`);
    }
  }
  for (const row of networkRows) {
    const [id, name] = row.split('\t');
    const remaining = inspect(dockerExec, 'network', ['network', 'inspect', id], id);
    if (!remaining || remaining.Id !== id || remaining.Name !== name || !Object.entries(expectedLabels).every(([key, value]) => remaining.Labels?.[key] === value)) {
      throw new CleanupBlockedError(`Owned-network label inventory returned an unverified resource: ${row}`);
    }
  }
  for (const name of volumeNames) {
    const remaining = inspect(dockerExec, 'volume', ['volume', 'inspect', name], name);
    if (!remaining || remaining.Name !== name || !Object.entries(expectedLabels).every(([key, value]) => remaining.Labels?.[key] === value)) {
      throw new CleanupBlockedError(`Owned-volume label inventory returned an unverified resource: ${name}`);
    }
  }

  if (containerIds.length || networkRows.length || volumeNames.length) {
    throw new CleanupBlockedError(`Residual run-owned resources remain: containers=${containerIds.length}, networks=${networkRows.length}, volumes=${volumeNames.length}`);
  }
  return { containers: containerIds, networks: networkRows, volumes: volumeNames };
}

function parseRecord(record, expectedLabels) {
  if (!record || typeof record.runId !== 'string') throw new CleanupBlockedError('Recorded run identity is missing');
  assertCompleteRecord(record, expectedLabels);
}

function performCleanup({ record, baseline, outputDir, inventoryFile = null, dockerExec = dockerCli, captureInventory }) {
  const expectedLabels = labelsForRun(record.runId);
  parseRecord(record, expectedLabels);
  if (!baseline?.containers || !baseline?.networks || !baseline?.volumes || !baseline?.images) {
    throw new CleanupBlockedError('Pre-cleanup Docker baseline is incomplete');
  }

  const containerById = inspect(dockerExec, 'container', ['inspect', record.containerId], record.containerId);
  const containerByName = inspect(dockerExec, 'container', ['inspect', record.containerName], record.containerName);
  const networkById = inspect(dockerExec, 'network', ['network', 'inspect', record.networkId], record.networkId);
  const networkByName = inspect(dockerExec, 'network', ['network', 'inspect', record.networkName], record.networkName);
  const volumes = record.volumeNames.map((name) => inspect(dockerExec, 'volume', ['volume', 'inspect', name], name));

  if (containerByName && containerByName.Id !== record.containerId) throw new CleanupBlockedError('Recorded container ID is stale: the recorded name resolves to a different container');
  if (Boolean(containerById) !== Boolean(containerByName)) throw new CleanupBlockedError('Recorded container ID/name lookup is inconsistent');
  if (networkByName && networkByName.Id !== record.networkId) throw new CleanupBlockedError('Recorded network ID is stale: the recorded name resolves to a different network');
  if (Boolean(networkById) !== Boolean(networkByName)) throw new CleanupBlockedError('Recorded network ID/name lookup is inconsistent');
  const container = containerById;
  const network = networkById;
  const existingVolumes = volumes.filter(Boolean);

  if (container) {
    assertOwnedContainer(container, {
      containerId: record.containerId,
      name: record.containerName,
      imageRef: record.imageRef,
      labels: expectedLabels,
      volumeNames: record.volumeNames,
      requireRunning: false,
    });
    if (existingVolumes.length !== record.volumeNames.length) throw new CleanupBlockedError('Container exists but one or more recorded mounted volumes are missing');
  }

  for (let index = 0; index < volumes.length; index += 1) {
    const volume = volumes[index];
    if (!volume) continue;
    const name = record.volumeNames[index];
    assertOwnedVolume(volume, { name, labels: expectedLabels });
    const attached = nonemptyLines(dockerExec(['ps', '-aq', '--no-trunc', '--filter', `volume=${name}`]));
    const allowed = container ? [record.containerId] : [];
    if (attached.some((id) => !allowed.includes(id)) || (container && (attached.length !== 1 || attached[0] !== record.containerId))) {
      throw new CleanupBlockedError(`Volume ${name} is referenced by an unrecorded or unexpected container`);
    }
  }

  if (network) {
    assertOwnedNetwork(network, { id: record.networkId, name: record.networkName, labels: expectedLabels });
    const endpointIds = Object.keys(network.Containers ?? {});
    const allowed = container ? [record.containerId] : [];
    if (endpointIds.some((id) => !allowed.includes(id))) throw new CleanupBlockedError('Run network has an unrecorded endpoint');
  }

  const initiallyAbsent = !container && !network && existingVolumes.length === 0;
  if (container?.State?.Running) dockerExec(['stop', record.containerId]);
  if (container) dockerExec(['rm', record.containerId]);
  for (let index = 0; index < existingVolumes.length; index += 1) {
    const volume = existingVolumes[index];
    const name = volume.Name;
    const fresh = inspect(dockerExec, 'volume', ['volume', 'inspect', name], name);
    if (!fresh) throw new CleanupBlockedError(`Recorded volume ${name} disappeared before verified removal`);
    assertOwnedVolume(fresh, { name, labels: expectedLabels });
    if (nonemptyLines(dockerExec(['ps', '-aq', '--no-trunc', '--filter', `volume=${name}`])).length) {
      throw new CleanupBlockedError(`Recorded volume ${name} remains attached after container removal`);
    }
    dockerExec(['volume', 'rm', name]);
  }
  if (network) {
    const fresh = inspect(dockerExec, 'network', ['network', 'inspect', record.networkName], record.networkName);
    if (!fresh) throw new CleanupBlockedError('Recorded network disappeared before verified removal');
    assertOwnedNetwork(fresh, { id: record.networkId, name: record.networkName, labels: expectedLabels });
    if (Object.keys(fresh.Containers ?? {}).length) throw new CleanupBlockedError('Run network still has endpoints after container removal');
    dockerExec(['network', 'rm', record.networkName]);
  }

  verifyNoResidualResources(dockerExec, record, expectedLabels);

  const after = captureInventory
    ? captureInventory()
    : (() => { throw new CleanupBlockedError('Post-cleanup inventory capture is required'); })();
  const changedProtectedResourceSets = compareProtected(baseline, after, record.runId);
  if (changedProtectedResourceSets.length) throw new CleanupBlockedError(`Protected Docker resources changed: ${changedProtectedResourceSets.join(', ')}`);

  const result = {
    runId: record.runId,
    outcome: 'PASS',
    actionsPerformed: [
      ...(container ? ['stop-if-running', 'remove-container'] : []),
      ...(existingVolumes.length ? [`remove-${existingVolumes.length}-volumes`] : []),
      ...(network ? ['remove-network'] : []),
    ],
    postTeardownInventory: 'PASS',
    ownershipLabelInventory: { containers: 0, networks: 0, volumes: 0 },
    inventoryFile,
    protectedResourceSetsUnchanged: ['containers', 'networks', 'volumes', 'images'],
    beforeCounts: baseline.counts,
    afterCounts: after.counts,
    cleanupWasAlreadyComplete: initiallyAbsent,
  };
  if (outputDir) writeFileSync(path.join(outputDir, 'cleanup-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

export function runCleanup(options) {
  try {
    return performCleanup(options);
  } catch (error) {
    if (error instanceof CleanupBlockedError) throw error;
    throw new CleanupBlockedError(`Cleanup blocked before verified completion: ${detail(error)}`, { cause: error });
  }
}
export function runCleanupWithProcessStatus(options, processState = process) {
  try {
    return { outcome: 'PASS', result: runCleanup(options) };
  } catch (error) {
    processState.exitCode = 1;
    return { outcome: 'BLOCKED', reason: detail(error) };
  }
}
function loadJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const [recordPath, baselinePath, outputDir] = process.argv.slice(2);
  if (!recordPath || !baselinePath || !outputDir) {
    console.error('[BLOCKED] Usage: node cleanup-kanboard-g0.mjs <owned-resources.json> <prestart-snapshot.json> <output-directory>');
    process.exitCode = 1;
  } else {
    try {
      const record = loadJson(recordPath);
      const baseline = loadJson(baselinePath);
      const thisDir = path.dirname(fileURLToPath(import.meta.url));
      const defaultInventoryPath = path.join(outputDir, 'docker-after.json');
      const inventoryPath = existsSync(defaultInventoryPath)
        ? path.join(outputDir, `docker-after-repeat-${Date.now()}.json`)
        : defaultInventoryPath;
      const outcome = runCleanupWithProcessStatus({
        record,
        baseline,
        outputDir,
        inventoryFile: path.basename(inventoryPath),
        captureInventory: () => {
          execFileSync(process.execPath, [path.join(thisDir, 'docker-inventory.mjs'), inventoryPath], { stdio: 'inherit' });
          return loadJson(inventoryPath);
        },
      });
      if (outcome.outcome === 'BLOCKED') console.error(`[BLOCKED] Cleanup did not verify completion: ${outcome.reason}`);
      else process.stdout.write(`${JSON.stringify(outcome.result)}\n`);    } catch (error) {
      console.error(`[BLOCKED] Cleanup did not verify completion: ${detail(error)}`);
      process.exitCode = 1;
    }
  }
}
