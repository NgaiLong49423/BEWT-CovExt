import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

function docker(args) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function lines(text) {
  return text ? text.split(/\r?\n/).filter(Boolean) : [];
}

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function fingerprint(value) {
  return sha(JSON.stringify(value));
}

function classifyContainer(container) {
  const name = container.Name.replace(/^\//, '');
  const labels = container.Config.Labels ?? {};
  const project = labels['com.docker.compose.project'] ?? '';
  const image = container.Config.Image ?? '';
  if (name.startsWith('bewt-covext-kanboard-') || project === 'bewt-covext-kanboard') return 't03a-kanboard';
  if (name.startsWith('bewt-covext-expresscart-') || project.startsWith('bewt-covext-expresscart')) return 'existing-bewt-expresscart-protected';
  if (project) return 'other-compose-project-protected';
  if (image.includes('kanboard')) return 'kanboard-unowned-protected';
  return 'unclassified-protected';
}

function containerRecord(c) {
  const labels = c.Config.Labels ?? {};
  const mounts = (c.Mounts ?? []).map((m) => ({ type: m.Type, destination: m.Destination, sourceHash: sha(m.Name ?? m.Source ?? '') })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const ports = Object.entries(c.NetworkSettings.Ports ?? {}).flatMap(([containerPort, bindings]) => (bindings ?? []).map((b) => ({ containerPort, hostIp: b.HostIp, hostPort: b.HostPort }))).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const reduced = {
    idHash: sha(c.Id),
    nameHash: sha(c.Name.replace(/^\//, '')),
    imageHash: sha(c.Image),
    composeProjectHash: labels['com.docker.compose.project'] ? sha(labels['com.docker.compose.project']) : null,
    composeServiceHash: labels['com.docker.compose.service'] ? sha(labels['com.docker.compose.service']) : null,
    ownershipLabels: Object.fromEntries(['project', 'owner', 'managed-by', 'app', 'task', 'runId'].filter((key) => labels[key]).map((key) => [key, labels[key]])),
    state: c.State.Status,
    mounts,
    ports,
    networkIdHashes: Object.values(c.NetworkSettings.Networks ?? {}).map((n) => sha(n.NetworkID)).sort(),
  };
  return { role: classifyContainer(c), signature: fingerprint(reduced), ...reduced };
}

function networkRecord(n) {
  const labels = n.Labels ?? {};
  const reduced = {
    idHash: sha(n.Id), nameHash: sha(n.Name), driver: n.Driver, scope: n.Scope,
    composeProjectHash: labels['com.docker.compose.project'] ? sha(labels['com.docker.compose.project']) : null,
    ownershipLabels: Object.fromEntries(['project', 'owner', 'managed-by', 'app', 'task', 'runId'].filter((key) => labels[key]).map((key) => [key, labels[key]])),
  };
  return { signature: fingerprint(reduced), ...reduced };
}

function volumeRecord(v) {
  const labels = v.Labels ?? {};
  const reduced = {
    nameHash: sha(v.Name), driver: v.Driver, scope: v.Scope,
    composeProjectHash: labels['com.docker.compose.project'] ? sha(labels['com.docker.compose.project']) : null,
    ownershipLabels: Object.fromEntries(['project', 'owner', 'managed-by', 'app', 'task', 'runId'].filter((key) => labels[key]).map((key) => [key, labels[key]])),
  };
  return { signature: fingerprint(reduced), ...reduced };
}

function imageRecord(image) {
  const id = image.Id;
  const tags = image.RepoTags ?? [];
  const target = tags.some((tag) => tag.startsWith('kanboard/kanboard:'));
  const reduced = { idHash: sha(id), tagsHash: sha(tags.slice().sort().join('\n')), repoDigestsHash: sha((image.RepoDigests ?? []).slice().sort().join('\n')), size: image.Size };
  return { role: target ? 't03a-kanboard-image' : 'preexisting-image-protected', signature: fingerprint(reduced), ...reduced };
}

const outputPath = process.argv[2];
if (!outputPath) throw new Error('Usage: node docker-inventory.mjs <output.json>');

const server = docker(['info', '--format', '{{json .}}']);
const info = JSON.parse(server);
if (!info.ServerVersion || info.OSType !== 'linux') throw new Error('A reachable Linux Docker daemon is required for an inventory snapshot');

const containerIds = lines(docker(['ps', '-aq', '--no-trunc']));
const containers = containerIds.length ? JSON.parse(docker(['inspect', ...containerIds])) : [];
const networkIds = lines(docker(['network', 'ls', '-q', '--no-trunc']));
const networks = networkIds.length ? JSON.parse(docker(['network', 'inspect', ...networkIds])) : [];
const volumeNames = lines(docker(['volume', 'ls', '-q']));
const volumes = volumeNames.length ? JSON.parse(docker(['volume', 'inspect', ...volumeNames])) : [];
const imagesText = docker(['image', 'ls', '--digests', '--no-trunc', '--format', '{{json .}}']);
const images = lines(imagesText).map((line) => JSON.parse(line));
const uniqueImageIds = [...new Set(images.map((x) => x.ID))];
const imageInspects = uniqueImageIds.length ? JSON.parse(docker(['image', 'inspect', ...uniqueImageIds])) : [];

const snapshot = {
  capturedAt: new Date().toISOString(),
  daemon: { version: info.ServerVersion, osType: info.OSType, architecture: info.Architecture, cpuCount: info.NCPU, memoryBytes: info.MemTotal },
  counts: { containers: containers.length, runningContainers: containers.filter((c) => c.State.Running).length, networks: networks.length, volumes: volumes.length, images: imageInspects.length },
  containers: containers.map(containerRecord).sort((a, b) => `${a.role}:${a.signature}`.localeCompare(`${b.role}:${b.signature}`)),
  networks: networks.map(networkRecord).sort((a, b) => a.signature.localeCompare(b.signature)),
  volumes: volumes.map(volumeRecord).sort((a, b) => a.signature.localeCompare(b.signature)),
  images: imageInspects.map(imageRecord).sort((a, b) => a.signature.localeCompare(b.signature)),
};

writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
process.stdout.write(JSON.stringify({ output: outputPath, counts: snapshot.counts, protectedExpressCartContainers: snapshot.containers.filter((c) => c.role === 'existing-bewt-expresscart-protected').length, t03aContainers: snapshot.containers.filter((c) => c.role === 't03a-kanboard').length }) + '\n');
