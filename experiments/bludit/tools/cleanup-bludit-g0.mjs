import { execFileSync } from 'node:child_process';
import { labelsForRun, assertOwnedContainer, assertOwnedNetwork } from './bludit-g0.mjs';

export class CleanupBlockedError extends Error {
  constructor(message, options) { super(message, options); this.name = 'CleanupBlockedError'; this.outcome = 'BLOCKED'; }
}

const detail = e => String(e?.stderr?.toString().trim() || e?.stdout?.toString().trim() || e?.message || e);
const dockerCli = args => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export function isNotFound(error, kind, target) {
  if (error?.status !== 1) return false;
  const message = detail(error).toLowerCase();
  if (kind === 'container') return message === `error: no such object: ${target}`.toLowerCase();
  if (kind === 'network') return message === `error response from daemon: network ${target} not found`.toLowerCase();
  return false;
}

function inspect(exec, kind, target) {
  try {
    const value = JSON.parse(exec(kind === 'container' ? ['inspect', target] : ['network', 'inspect', target]));
    if (!Array.isArray(value) || value.length !== 1) throw new Error('unexpected inspect count');
    return value[0];
  } catch (error) {
    if (isNotFound(error, kind, target)) return null;
    throw new CleanupBlockedError(`${kind} inspect not verified NOT_FOUND: ${detail(error)}`, { cause: error });
  }
}

const filters = labels => Object.entries(labels).flatMap(([key, value]) => ['--filter', `label=${key}=${value}`]);
function listed(exec, args) {
  const value = exec(args);
  return value ? value.split(String.fromCharCode(10)).map(x => x.trim()).filter(Boolean) : [];
}

export function inventory(exec = dockerCli) {
  try {
    return {
      containers: listed(exec, ['ps', '-aq', '--no-trunc']).sort(),
      networks: listed(exec, ['network', 'ls', '-q', '--no-trunc']).sort(),
      volumes: listed(exec, ['volume', 'ls', '-q']).sort(),
      images: listed(exec, ['image', 'ls', '-q', '--no-trunc']).sort()
    };
  } catch (error) {
    throw new CleanupBlockedError(`Docker inventory blocked: ${detail(error)}`, { cause: error });
  }
}

function expectedContainer(record, container) {
  const appName = `bewt-covext-bludit-${record.runId}`;
  const definitions = {
    app: { name: appName, imageRef: `bludit/docker:2.3.4@${record.imageDigest}` },
    browser: { name: `bewt-covext-bludit-selenium-${record.runId}`, imageRef: `selenium/standalone-chrome:4.34.0@${record.browserImageDigest}` }
  };
  const role = container.role || (container.name === appName ? 'app' : container.name === definitions.browser.name ? 'browser' : null);
  const expected = definitions[role];
  if (!expected || container.name !== expected.name || container.imageRef !== expected.imageRef) {
    throw new CleanupBlockedError(`recorded ${role || 'unknown'} container tuple does not match the pinned run identity`);
  }
  if (typeof container.id !== 'string' || !/^[a-f0-9]{64}$/i.test(container.id)) {
    throw new CleanupBlockedError(`recorded ${role} container ID is not a full Docker ID`);
  }
  return { ...container, role };
}

function assertNetworkEndpoints(network, record, resources) {
  const expected = resources.filter(Boolean).map(container => container.Id).sort();
  const actual = Object.keys(network.Containers || {}).sort();
  if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
    throw new CleanupBlockedError('network endpoints differ from the recorded existing containers');
  }
}

function removeRun({ record, baseline, dockerExec = dockerCli, captureInventory = () => inventory(dockerExec) }) {
  let labels;
  try { labels = labelsForRun(record?.runId); }
  catch (error) { throw new CleanupBlockedError(`invalid run identity: ${detail(error)}`, { cause: error }); }

  if (!Array.isArray(record.containers) || record.containers.length > 2) {
    throw new CleanupBlockedError('record must include zero to two recorded application/browser containers');
  }
  if (!record.network || typeof record.network.name !== 'string' || !/^[a-f0-9]{64}$/i.test(record.network.id || '')) {
    throw new CleanupBlockedError('a verified recorded network ID and name are required');
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(record.imageDigest || '') || !/^sha256:[a-f0-9]{64}$/i.test(record.browserImageDigest || '')) {
    throw new CleanupBlockedError('both pinned image digests are required');
  }
  if (!baseline?.containers || !baseline.networks || !baseline.volumes || !baseline.images) {
    throw new CleanupBlockedError('pre-run inventory is incomplete');
  }

  const normalized = record.containers.map(container => expectedContainer(record, container));
  if (new Set(normalized.map(container => container.id)).size !== normalized.length || new Set(normalized.map(container => container.role)).size !== normalized.length) {
    throw new CleanupBlockedError('recorded container IDs and roles must be unique');
  }
  const expectedNetworkName = `bewt-covext-bludit-${record.runId}-net`;
  if (record.network.name !== expectedNetworkName) throw new CleanupBlockedError('recorded network name does not match the run identity');

  const resources = [];
  for (const container of normalized) {
    const byId = inspect(dockerExec, 'container', container.id);
    const byName = inspect(dockerExec, 'container', container.name);
    if (byName && byName.Id !== container.id) throw new CleanupBlockedError(`stale recorded name ${container.name} resolves to another ID`);
    if (Boolean(byId) !== Boolean(byName)) throw new CleanupBlockedError(`recorded ID/name lookup mismatch for ${container.name}`);
    if (byId) assertOwnedContainer(byId, { id: container.id, name: container.name, imageRef: container.imageRef, labels });
    resources.push(byId);
  }

  const networkById = inspect(dockerExec, 'network', record.network.id);
  const networkByName = inspect(dockerExec, 'network', record.network.name);
  if (networkByName && networkByName.Id !== record.network.id) throw new CleanupBlockedError('stale network name resolves to another network');
  if (Boolean(networkById) !== Boolean(networkByName)) throw new CleanupBlockedError('recorded network ID/name lookup mismatch');
  if (!networkById && resources.some(Boolean)) throw new CleanupBlockedError('recorded container exists but its recorded network is absent; endpoint ownership cannot be verified');
  if (networkById) {
    assertOwnedNetwork(networkById, { id: record.network.id, name: record.network.name, labels, containerIds: normalized.map(container => container.id) });
    assertNetworkEndpoints(networkById, record, resources);
  }

  for (let index = 0; index < resources.length; index += 1) {
    if (resources[index]?.State?.Running) dockerExec(['stop', normalized[index].id]);
  }
  for (let index = 0; index < resources.length; index += 1) {
    if (resources[index]) dockerExec(['rm', normalized[index].id]);
  }

  if (networkById) {
    const fresh = inspect(dockerExec, 'network', record.network.id);
    if (!fresh) throw new CleanupBlockedError('network disappeared before verified removal');
    assertOwnedNetwork(fresh, { id: record.network.id, name: record.network.name, labels, containerIds: [] });
    dockerExec(['network', 'rm', record.network.id]);
  }

  for (const [kind, args] of [
    ['container', ['ps', '-aq', '--no-trunc', ...filters(labels)]],
    ['network', ['network', 'ls', '-q', '--no-trunc', ...filters(labels)]],
    ['volume', ['volume', 'ls', '-q', ...filters(labels)]]
  ]) {
    if (listed(dockerExec, args).length) throw new CleanupBlockedError(`residual run-owned ${kind} resources remain`);
  }
  for (const container of normalized) {
    if (inspect(dockerExec, 'container', container.id) || inspect(dockerExec, 'container', container.name)) {
      throw new CleanupBlockedError(`recorded container ${container.name} remains`);
    }
  }
  if (inspect(dockerExec, 'network', record.network.id) || inspect(dockerExec, 'network', record.network.name)) {
    throw new CleanupBlockedError('recorded network remains');
  }

  const after = captureInventory();
  for (const key of ['containers', 'networks', 'volumes', 'images']) {
    const beforeSet = new Set(baseline[key]);
    const afterSet = new Set(after[key]);
    const removed = [...beforeSet].filter(id => !afterSet.has(id));
    if (removed.length) throw new CleanupBlockedError(`pre-existing Docker ${key} disappeared: ${removed.join(',')}`);
  }
  return {
    runId: record.runId,
    outcome: 'PASS',
    recordedContainers: normalized.map(container => container.id),
    recordedNetwork: record.network.id,
    residuals: { containers: 0, networks: 0, volumes: 0 },
    protectedExistingResources: 'PRESERVED'
  };
}

export function runCleanup(options) {
  try { return removeRun(options); }
  catch (error) {
    if (error instanceof CleanupBlockedError) throw error;
    throw new CleanupBlockedError(`cleanup BLOCKED: ${detail(error)}`, { cause: error });
  }
}

export function runCleanupWithExitCode(options, proc = process) {
  try { return { outcome: 'PASS', result: runCleanup(options) }; }
  catch (error) {
    proc.exitCode = 1;
    return { outcome: 'BLOCKED', reason: detail(error) };
  }
}