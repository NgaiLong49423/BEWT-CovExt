import { execFileSync } from 'node:child_process';
import { DOCKER_CLI_PATH, DOCKER_ENV } from './child-process-policy.mjs';
import { CleanupBlockedError, assertOwnedContainer, assertOwnedNetwork, dockerErrorText, isExactNotFound, labelsForRun, namesForRun, snapshotInventory } from './claroline-g0.mjs';

const dockerCli = args => execFileSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const labelFilters = labels => Object.entries(labels).flatMap(([key, value]) => ['--filter', `label=${key}=${value}`]);
const list = (exec, args) => { const value = exec(args); return value ? value.split(/\r?\n/).map(item => item.trim()).filter(Boolean) : []; };

function inspect(exec, kind, target) {
  try {
    const output = exec(kind === 'container' ? ['inspect', target] : ['network', 'inspect', target]);
    const parsed = JSON.parse(output);
    if (!Array.isArray(parsed) || parsed.length !== 1) throw new Error('inspect did not return exactly one resource');
    return parsed[0];
  } catch (error) {
    if (isExactNotFound(error, kind, target)) return null;
    throw new CleanupBlockedError(`${kind} inspect not verified NOT_FOUND: ${dockerErrorText(error)}`, { cause: error });
  }
}

function imageFor(role, record) {
  if (role === 'app') return `olianasd/claroline-strongpsw@${record.imageDigest}`;
  if (role === 'browser') return `selenium/standalone-chrome@${record.browserImageDigest}`;
  return null;
}

function normalizeContainer(record, item) {
  const names = namesForRun(record.runId);
  const expected = { app: names.app, browser: names.browser };
  if (!item || !['app', 'browser'].includes(item.role) || item.name !== expected[item.role] || item.imageRef !== imageFor(item.role, record)) {
    throw new CleanupBlockedError('recorded container role/name/pinned image tuple does not match this Claroline run');
  }
  if (typeof item.id !== 'string' || !/^[a-f0-9]{64}$/i.test(item.id)) throw new CleanupBlockedError(`recorded ${item.role} ID is not a full Docker ID`);
  return item;
}

function assertContainerSecurity(container, item, networkName) {
  const host = container.HostConfig || {};
  const expectedHostPort = item.role === 'app' ? '80/tcp' : '4444/tcp';
  const bindings = host.PortBindings || {};
  const publishedKeys = Object.keys(bindings).sort((left, right) => left.localeCompare(right, 'en'));
  if (host.Privileged === true || host.NetworkMode !== networkName || (host.Binds || []).length !== 0) {
    throw new CleanupBlockedError(`${item.role} container has privileged, host-network, or bind-mount configuration`);
  }
  if (publishedKeys.length !== 1 || publishedKeys[0] !== expectedHostPort) {
    throw new CleanupBlockedError(`${item.role} container has an unexpected host port mapping`);
  }
  const hostBinding = bindings[expectedHostPort] || [];
  if (hostBinding.length !== 1 || hostBinding[0].HostIp !== '127.0.0.1' || !/^\d+$/.test(hostBinding[0].HostPort || '')) {
    throw new CleanupBlockedError(`${item.role} port is not bound to a single dynamic loopback port`);
  }
  if (item.role === 'app' && Object.keys(bindings).some(key => key.startsWith('3306/'))) {
    throw new CleanupBlockedError('Claroline MySQL port must not be published to the host');
  }
  const networkNames = Object.keys(container.NetworkSettings?.Networks || {});
  if (networkNames.length !== 1 || networkNames[0] !== networkName) {
    throw new CleanupBlockedError(`${item.role} is attached to an unexpected network`);
  }
}

function residualIds(exec, kind, runId) {
  if (kind === 'container') return list(exec, ['ps', '-aq', '--no-trunc', '--filter', `label=runId=${runId}`]);
  if (kind === 'network') return list(exec, ['network', 'ls', '-q', '--no-trunc', '--filter', `label=runId=${runId}`]);
  return list(exec, ['volume', 'ls', '-q', '--filter', `label=runId=${runId}`]);
}

function removeRun({ record, baseline, dockerExec = dockerCli, captureInventory = () => snapshotInventory(dockerExec) }) {
  let labels; let names;
  try { labels = labelsForRun(record?.runId); names = namesForRun(record.runId); }
  catch (error) { throw new CleanupBlockedError(`invalid run identity: ${dockerErrorText(error)}`, { cause: error }); }
  if (!Array.isArray(record.containers) || record.containers.length > 2) throw new CleanupBlockedError('record must allow zero to two partial-startup containers');
  if (!/^sha256:[a-f0-9]{64}$/i.test(record.imageDigest || '') || !/^sha256:[a-f0-9]{64}$/i.test(record.browserImageDigest || '')) throw new CleanupBlockedError('both app and Selenium registry digests are required');
  if (!baseline || !['containers', 'networks', 'volumes', 'images'].every(key => Array.isArray(baseline[key]))) throw new CleanupBlockedError('complete pre-run Docker inventory is required');
  const containers = record.containers.map(item => normalizeContainer(record, item));
  if (new Set(containers.map(x => x.id)).size !== containers.length || new Set(containers.map(x => x.role)).size !== containers.length) throw new CleanupBlockedError('recorded IDs and container roles must be unique');
  const networkRecord = record.network;
  if (networkRecord && (networkRecord.name !== names.network || !/^[a-f0-9]{64}$/i.test(networkRecord.id || ''))) throw new CleanupBlockedError('recorded network ID/name does not match the run identity');
  if (!networkRecord && containers.length > 0) throw new CleanupBlockedError('recorded containers exist without a recorded network; endpoint ownership cannot be verified');

  const foundContainers = [];
  for (const item of containers) {
    const byId = inspect(dockerExec, 'container', item.id);
    const byName = inspect(dockerExec, 'container', item.name);
    if (byName && byName.Id !== item.id) throw new CleanupBlockedError(`stale recorded name ${item.name} resolves to another ID`);
    if (Boolean(byId) !== Boolean(byName)) throw new CleanupBlockedError(`recorded ID/name lookup mismatch for ${item.name}`);
    if (byId) {
      assertOwnedContainer(byId, { ...item, labels });
      assertContainerSecurity(byId, item, names.network);
    }
    foundContainers.push(byId);
  }
  const networkById = networkRecord ? inspect(dockerExec, 'network', networkRecord.id) : null;
  const networkByName = networkRecord ? inspect(dockerExec, 'network', networkRecord.name) : null;
  if (networkByName && networkByName.Id !== networkRecord.id) throw new CleanupBlockedError('stale recorded network name resolves to another ID');
  if (Boolean(networkById) !== Boolean(networkByName)) throw new CleanupBlockedError('recorded network ID/name lookup mismatch');
  if (!networkById && foundContainers.some(Boolean)) throw new CleanupBlockedError('recorded container exists while its recorded network is absent');
  if (networkById) {
    if (networkById.Driver !== 'bridge' || networkById.Internal !== true) throw new CleanupBlockedError('recorded network is not the required internal bridge');
    assertOwnedNetwork(networkById, { id: networkRecord.id, name: networkRecord.name, labels, containerIds: foundContainers.filter(Boolean).map(x => x.Id).sort((left, right) => left.localeCompare(right, 'en')) });
  }

  // Validate all existing run-scoped resources before the first mutation.
  const seenContainers = residualIds(dockerExec, 'container', record.runId);
  const seenNetworks = residualIds(dockerExec, 'network', record.runId);
  const seenVolumes = residualIds(dockerExec, 'volume', record.runId);
  const allowedContainerIds = foundContainers.filter(Boolean).map(x => x.Id).sort((left, right) => left.localeCompare(right, 'en'));
  if (seenContainers.some(id => !allowedContainerIds.includes(id))) throw new CleanupBlockedError('unrecorded or incorrectly labelled runId container exists; no resource was removed');
  if (seenNetworks.some(id => !networkRecord || id !== networkRecord.id)) throw new CleanupBlockedError('unrecorded or incorrectly labelled runId network exists; no resource was removed');
  if (seenVolumes.length) throw new CleanupBlockedError('runId volume exists although Claroline declares no persistent mounts; no resource was removed');
  if (networkRecord && !networkById && seenNetworks.includes(networkRecord.id)) throw new CleanupBlockedError('recorded network could not be inspected; no resource was removed');

  for (let index = 0; index < containers.length; index += 1) {
    const item = containers[index];
    let current = inspect(dockerExec, 'container', item.id);
    if (!current) continue;
    assertOwnedContainer(current, { ...item, labels });
    assertContainerSecurity(current, item, names.network);
    if (current.State?.Running) dockerExec(['stop', item.id]);
    current = inspect(dockerExec, 'container', item.id);
    if (!current) continue;
    assertOwnedContainer(current, { ...item, labels });
    assertContainerSecurity(current, item, names.network);
    dockerExec(['rm', item.id]);
    if (inspect(dockerExec, 'container', item.id) || inspect(dockerExec, 'container', item.name)) throw new CleanupBlockedError(`recorded container ${item.name} remains after rm`);
  }

  if (networkRecord && networkById) {
    const current = inspect(dockerExec, 'network', networkRecord.id);
    if (!current) throw new CleanupBlockedError('recorded network disappeared before verified removal');
    if (current.Driver !== 'bridge' || current.Internal !== true) throw new CleanupBlockedError('network configuration changed before removal');
    assertOwnedNetwork(current, { id: networkRecord.id, name: networkRecord.name, labels, containerIds: [] });
    dockerExec(['network', 'rm', networkRecord.id]);
    if (inspect(dockerExec, 'network', networkRecord.id) || inspect(dockerExec, 'network', networkRecord.name)) throw new CleanupBlockedError('recorded network remains after rm');
  }

  for (const kind of ['container', 'network', 'volume']) {
    const ids = residualIds(dockerExec, kind, record.runId);
    const exact = list(dockerExec, kind === 'container'
      ? ['ps', '-aq', '--no-trunc', ...labelFilters(labels)]
      : kind === 'network'
        ? ['network', 'ls', '-q', '--no-trunc', ...labelFilters(labels)]
        : ['volume', 'ls', '-q', ...labelFilters(labels)]);
    if (ids.length || exact.length) throw new CleanupBlockedError(`residual ${kind} resources remain for this run`);
  }
  for (const item of containers) {
    if (inspect(dockerExec, 'container', item.id) || inspect(dockerExec, 'container', item.name)) throw new CleanupBlockedError(`recorded container ${item.name} remains`);
  }
  if (networkRecord && (inspect(dockerExec, 'network', networkRecord.id) || inspect(dockerExec, 'network', networkRecord.name))) throw new CleanupBlockedError('recorded network remains');

  const after = captureInventory();
  for (const kind of ['containers', 'networks', 'volumes', 'images']) {
    const absent = baseline[kind].filter(id => !after[kind].includes(id));
    if (absent.length) throw new CleanupBlockedError(`pre-existing Docker ${kind} disappeared: ${absent.join(',')}`);
  }
  return { runId: record.runId, outcome: 'PASS', removedContainerIds: containers.map(x => x.id), removedNetworkId: networkById ? networkRecord.id : null, residuals: { containers: 0, networks: 0, volumes: 0 }, protectedExistingResources: 'PRESERVED' };
}

export function runCleanup(options) {
  try { return removeRun(options); }
  catch (error) {
    if (error instanceof CleanupBlockedError) throw error;
    throw new CleanupBlockedError(`cleanup BLOCKED: ${dockerErrorText(error)}`, { cause: error });
  }
}

export function runCleanupWithExitCode(options, proc = process) {
  try { return { outcome: 'PASS', result: runCleanup(options) }; }
  catch (error) { proc.exitCode = 1; return { outcome: 'BLOCKED', reason: dockerErrorText(error) }; }
}
