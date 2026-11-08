import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertOwnedContainer,
  assertOwnedNetwork,
  assertOwnedVolume,
  buildCleanupPlan,
  labelsForRun,
} from './kanboard-g0.mjs';

function docker(args, { allowMissing = false } = {}) {
  try {
    return execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowMissing && error.status !== 0) return null;
    throw new Error(`docker ${args[0]} failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

function optionalInspect(args) {
  const output = docker(args, { allowMissing: true });
  return output ? JSON.parse(output)[0] : null;
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

const [recordPath, baselinePath, outputDir] = process.argv.slice(2);
if (!recordPath || !baselinePath || !outputDir) throw new Error('Usage: node cleanup-kanboard-g0.mjs <owned-resources.json> <prestart-snapshot.json> <output-directory>');

const record = JSON.parse(readFileSync(recordPath, 'utf8'));
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const expectedLabels = labelsForRun(record.runId);
if (JSON.stringify(record.labels) !== JSON.stringify(expectedLabels)) throw new Error('Recorded labels do not match the T03-A task and run ID');
if (record.containerName !== `bewt-covext-kanboard-${record.runId}`) throw new Error('Recorded container name is not the required run-specific name');
if (record.volumeNames.length !== 3 || record.networkName !== `${record.containerName}-net`) throw new Error('Recorded network or mount inventory is incomplete');

const container = optionalInspect(['inspect', record.containerId]);
const network = optionalInspect(['network', 'inspect', record.networkName]);
const volumes = record.volumeNames.map((name) => optionalInspect(['volume', 'inspect', name]));
const presence = [container !== null, network !== null, ...volumes.map(Boolean)];
if (presence.every((value) => !value)) {
  // Idempotent case: verify the recorded resources are already absent below.
} else if (presence.some((value) => !value)) {
  throw new Error('Partial resource set found; refusing cleanup because the recorded run inventory is incomplete');
} else {
  assertOwnedContainer(container, {
    containerId: record.containerId,
    name: record.containerName,
    imageRef: record.imageRef,
    labels: expectedLabels,
    volumeNames: record.volumeNames,
    requireRunning: false,
  });
  for (let index = 0; index < volumes.length; index += 1) {
    assertOwnedVolume(volumes[index], { name: record.volumeNames[index], labels: expectedLabels });
    const attached = docker(['ps', '-aq', '--no-trunc', '--filter', `volume=${record.volumeNames[index]}`]).split(/\r?\n/).filter(Boolean);
    if (attached.length !== 1 || attached[0] !== record.containerId) throw new Error(`Volume ${record.volumeNames[index]} is referenced by an unrecorded container`);
  }
  assertOwnedNetwork(network, { id: record.networkId, name: record.networkName, labels: expectedLabels });
  const networkContainerIds = Object.keys(network.Containers ?? {});
  if (networkContainerIds.length !== 1 || networkContainerIds[0] !== record.containerId) throw new Error('Run network has an unrecorded endpoint');
  const recorded = { ...record, name: record.containerName, labels: expectedLabels, volumes: record.volumeNames.map((name) => ({ name })) };
  buildCleanupPlan({ container, volumes, network, recorded });
  if (container.State.Running) docker(['stop', record.containerId]);
  docker(['rm', record.containerId]);
  for (const name of record.volumeNames) {
    const remaining = optionalInspect(['volume', 'inspect', name]);
    if (!remaining) throw new Error(`Recorded volume ${name} disappeared before its verified removal`);
    assertOwnedVolume(remaining, { name, labels: expectedLabels });
    if (docker(['ps', '-aq', '--no-trunc', '--filter', `volume=${name}`]).length !== 0) throw new Error(`Recorded volume ${name} remains attached after container removal`);
    docker(['volume', 'rm', name]);
  }
  const remainingNetwork = optionalInspect(['network', 'inspect', record.networkName]);
  if (!remainingNetwork) throw new Error('Recorded network disappeared before its verified removal');
  assertOwnedNetwork(remainingNetwork, { id: record.networkId, name: record.networkName, labels: expectedLabels });
  if (Object.keys(remainingNetwork.Containers ?? {}).length !== 0) throw new Error('Run network still has endpoints after container removal');
  docker(['network', 'rm', record.networkName]);
}

if (optionalInspect(['inspect', record.containerId]) || optionalInspect(['network', 'inspect', record.networkName]) || record.volumeNames.some((name) => optionalInspect(['volume', 'inspect', name]))) {
  throw new Error('One or more run-owned Docker resources remain after cleanup');
}

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const defaultInventoryPath = path.join(outputDir, 'docker-after.json');
const inventoryPath = existsSync(defaultInventoryPath)
  ? path.join(outputDir, `docker-after-repeat-${Date.now()}.json`)
  : defaultInventoryPath;
execFileSync(process.execPath, [path.join(thisDir, 'docker-inventory.mjs'), inventoryPath], { stdio: 'inherit' });
const after = JSON.parse(readFileSync(inventoryPath, 'utf8'));
const changedProtectedResourceSets = compareProtected(baseline, after, record.runId);
if (changedProtectedResourceSets.length) throw new Error(`Protected Docker resources changed: ${changedProtectedResourceSets.join(', ')}`);

const result = {
  runId: record.runId,
  outcome: 'PASS',
  actionsPerformed: presence.every((value) => !value)
    ? []
    : ['stop-if-running', 'remove-container', `remove-${record.volumeNames.length}-volumes`, 'remove-network'],
  postTeardownInventory: 'PASS',
  inventoryFile: path.basename(inventoryPath),
  protectedResourceSetsUnchanged: ['containers', 'networks', 'volumes', 'images'],
  beforeCounts: baseline.counts,
  afterCounts: after.counts,
  cleanupWasAlreadyComplete: presence.every((value) => !value),
};
writeFileSync(path.join(outputDir, 'cleanup-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(result)}\n`);
