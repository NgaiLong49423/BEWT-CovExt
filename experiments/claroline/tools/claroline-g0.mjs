import { createServer } from 'node:net';
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DOCKER_CLI_PATH, DOCKER_ENV } from './child-process-policy.mjs';

export const APP_IMAGE_REF = 'olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af';
export const BROWSER_IMAGE_REF = 'selenium/standalone-chrome@sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f';
export const SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const SOURCE_VERSION = '1.11.10';
export const APP_TEST_CLASS = 'test.Claroline_AddUserTest';
export const INTERNAL_NETWORK_POLICY = 'internal-bridge-v1';
export const EGRESS_LIMITED_NETWORK_POLICY = 'egress-limited-bridge-no-masquerade-v1';
export const INTERNAL_IPAM_NETWORK_POLICY = 'internal-bridge-explicit-ipam-v1';
export const ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY = 'published-bridge-default-route-removed-v1';
export const ROUTE_ISOLATION_METHOD = 'container-netns-default-route-drop-v1';
export const EGRESS_PROBE_TARGETS = Object.freeze({
  ipv4: Object.freeze({ family: 'ipv4', address: '1.1.1.1', port: 443 }),
  ipv6: Object.freeze({ family: 'ipv6', address: '2606:4700:4700::1111', port: 443 }),
});
const ROUTE_APPROVAL_SCOPE = 'one privileged exec in this exact container network namespace before services start; no host routing, Docker daemon, or other-container changes';
const ROUTE_APPROVAL_ROLLBACK = 'if route removal or any probe fails, do not start services; remove only the exact recorded run-owned containers and network; discard the container rather than restoring its route';
const issuedRouteApprovals = new WeakMap();

function approvalRequired(message) {
  const error = new Error(`BLOCKED_APPROVAL_REQUIRED: ${message}`);
  error.code = 'BLOCKED_APPROVAL_REQUIRED';
  return error;
}

export function routeIsolationApprovalRequest(containerId, role, runId) {
  if (typeof containerId !== 'string' || !/^[a-f0-9]{64}$/i.test(containerId)) throw approvalRequired('a full recorded Docker container ID is required');
  if (!['app', 'browser'].includes(role)) throw approvalRequired('container role must be app or browser');
  try { validateRunId(runId); } catch { throw approvalRequired('a valid unique T03-B2 run ID is required'); }
  return {
    runId,
    containerName: namesForRun(runId)[role],
    containerId,
    role,
    command: `docker exec --privileged --user 0 ${containerId} /bin/sh -c 'ip route del default'`,
    maxExecutions: 1,
    scope: ROUTE_APPROVAL_SCOPE,
    rollback: ROUTE_APPROVAL_ROLLBACK,
  };
}

export function routeIsolationApprovalPhrase(request) {
  return `APPROVE ${request.runId} ${request.containerId} ONCE; SCOPE=CONTAINER_NETNS_ONLY; ROLLBACK=REMOVE_EXACT_RUN_RESOURCES`;
}

export function validateRouteIsolationApproval(approval, request) {
  if (!approval || !request || approval.approvalId === undefined || !/^[0-9a-f-]{36}$/i.test(approval.approvalId) ||
      approval.runId !== request.runId || approval.containerId !== request.containerId || approval.role !== request.role || approval.command !== request.command ||
      approval.maxExecutions !== 1 || approval.scope !== request.scope || approval.rollback !== request.rollback ||
      typeof approval.approvedBy !== 'string' || !approval.approvedBy.trim() || approval.approverRole !== 'Team Lead' ||
      typeof approval.approvedAtUtc !== 'string' || !Number.isFinite(Date.parse(approval.approvedAtUtc)) ||
      approval.confirmation !== routeIsolationApprovalPhrase(request)) {
    throw approvalRequired('approval must identify this exact full container ID, one command, scope, rollback, and Team Lead confirmation');
  }
  return approval;
}

export async function requestRouteIsolationApproval(containerId, role, runId, {
  interactive = process.stdin.isTTY === true,
  input = process.stdin,
  output = process.stdout,
} = {}) {
  const request = routeIsolationApprovalRequest(containerId, role, runId);
  if (!interactive) throw approvalRequired('interactive Team Lead confirmation is unavailable; no privileged command was run');
  output.write(`\nPrivileged operation approval required:\n${JSON.stringify(request, null, 2)}\n`);
  const readline = createInterface({ input, output });
  try {
    const approvedBy = await readline.question('Team Lead GitHub handle: ');
    const approverRole = await readline.question('Type role exactly as Team Lead: ');
    const confirmation = await readline.question(`Type exactly “${routeIsolationApprovalPhrase(request)}”: `);
    const approval = Object.freeze(validateRouteIsolationApproval({
      ...request,
      approvalId: randomUUID(),
      approvedBy: approvedBy.trim(),
      approverRole: approverRole.trim(),
      approvedAtUtc: new Date().toISOString(),
      confirmation: confirmation.trim(),
    }, request));
    issuedRouteApprovals.set(approval, 'unused');
    return approval;
  } finally {
    readline.close();
  }
}

export const INTERNAL_IPAM_SUBNET_CANDIDATES = Object.freeze([
  '172.26.254.0/24', '172.27.254.0/24', '172.28.254.0/24',
  '172.29.254.0/24', '172.30.254.0/24', '172.31.254.0/24',
]);

function ipv4Range(cidr) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(String(cidr));
  if (!match) throw new Error(`invalid IPv4 CIDR in network preflight: ${cidr}`);
  const octets = match.slice(1, 5).map(Number);
  const prefix = Number(match[5]);
  if (octets.some(value => value > 255) || prefix > 32) throw new Error(`invalid IPv4 CIDR in network preflight: ${cidr}`);
  const address = octets.reduce((value, octet) => (value << 8n) | BigInt(octet), 0n);
  if (prefix === 0) return { first: 0n, last: 0xffffffffn };
  const mask = (0xffffffffn << BigInt(32 - prefix)) & 0xffffffffn;
  return { first: address & mask, last: (address & mask) | (0xffffffffn ^ mask) };
}

export function selectInternalBridgeIpam(occupiedCidrs, candidates = INTERNAL_IPAM_SUBNET_CANDIDATES) {
  if (!Array.isArray(occupiedCidrs) || !Array.isArray(candidates)) throw new Error('IPv4 CIDR inventories are required to select internal network IPAM');
  const occupied = occupiedCidrs.filter(Boolean).filter(cidr => cidr !== '0.0.0.0/0').map(ipv4Range);
  for (const subnet of candidates) {
    const range = ipv4Range(subnet);
    if (!occupied.some(item => range.first <= item.last && item.first <= range.last)) {
      const gateway = `${subnet.split('/')[0].split('.').slice(0, 3).join('.')}.1`;
      return { subnet, gateway };
    }
  }
  throw new Error('NETWORK_IPAM_BLOCKED: no non-overlapping internal bridge subnet is available');
}

export function assertNetworkPolicy(network, policy) {
  if (!network || network.Driver !== 'bridge') throw new Error('network policy requires a user-defined bridge');
  if (network.EnableIPv6 !== false) throw new Error('network policy mismatch: IPv6 must be explicitly disabled');
  if (policy === INTERNAL_NETWORK_POLICY) {
    if (network.Internal !== true) throw new Error('network policy mismatch: expected internal bridge');
    return network;
  }
  if (policy === INTERNAL_IPAM_NETWORK_POLICY) {
    const ipam = network.IPAM?.Config;
    const subnet = ipam?.[0]?.Subnet;
    const expectedGateway = INTERNAL_IPAM_SUBNET_CANDIDATES.includes(subnet)
      ? `${subnet.split('/')[0].split('.').slice(0, 3).join('.')}.1`
      : null;
    if (network.Internal !== true || !Array.isArray(ipam) || ipam.length !== 1 || !expectedGateway || ipam[0]?.Gateway !== expectedGateway) {
      throw new Error('network policy mismatch: expected isolated internal bridge with explicit IPv4 subnet and gateway');
    }
    return network;
  }
  if (policy === EGRESS_LIMITED_NETWORK_POLICY) {
    if (network.Internal !== false || network.Options?.['com.docker.network.bridge.enable_ip_masquerade'] !== 'false') {
      throw new Error('network policy mismatch: expected non-internal bridge with IP masquerading disabled');
    }
    return network;
  }
  if (policy === ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY) {
    if (network.Internal !== false || network.Options?.['com.docker.network.bridge.enable_ip_masquerade'] !== 'false') {
      throw new Error('network policy mismatch: expected published-port bridge with IP masquerading disabled');
    }
    return network;
  }
  throw new Error('unknown or missing recorded network policy');
}

export function assertRecordedNetworkIpam(network, networkRecord) {
  const actual = network?.IPAM?.Config?.[0];
  if (!actual || actual.Subnet !== networkRecord?.subnet || actual.Gateway !== networkRecord?.gateway) {
    throw new Error('network policy mismatch: inspected IPAM does not match recorded subnet and gateway');
  }
  return actual;
}

export function assertContainerNetworkGateway(container, networkName, gateway, networkId) {
  const endpoint = container?.NetworkSettings?.Networks?.[networkName];
  if (!gateway || !endpoint || (networkId && endpoint.NetworkID !== networkId) || (endpoint.Gateway && endpoint.Gateway !== gateway)) {
    throw new Error('container endpoint network ID or gateway does not match the recorded isolated network');
  }
  return endpoint;
}

/** Build the route command only after validating an explicit per-container Team Lead approval. */
export function routeIsolationExecArgs(containerId, approval, runId) {
  const request = routeIsolationApprovalRequest(containerId, approval?.role, runId);
  validateRouteIsolationApproval(approval, request);
  if (issuedRouteApprovals.get(approval) !== 'unused') throw approvalRequired('approval is not an unused interactive grant or has already been consumed');
  issuedRouteApprovals.set(approval, 'consumed');
  return ['exec', '--privileged', '--user', '0', containerId, '/bin/sh', '-c', 'ip route del default'];
}

/** Validate that startup logs stay in a fresh private directory below the container user's home. */
export function assertPrivateLogDirectory(directory, homeDirectory) {
  if (typeof directory !== 'string' || typeof homeDirectory !== 'string' || !/^\/(?:root|home\/[A-Za-z0-9_-]+)$/.test(homeDirectory) ||
      !directory.startsWith(`${homeDirectory}/.t03b2-logs.`) || !/^[A-Za-z0-9]+$/.test(directory.slice(`${homeDirectory}/.t03b2-logs.`.length))) {
    throw new Error('startup log directory must be a fresh private directory below the container home');
  }
  return directory;
}

/** Fail closed unless the inspected IPv4 and IPv6 route tables contain no default route. */
export function assertNoDefaultRoutes(routeOutput) {
  if (typeof routeOutput !== 'string') throw new Error('route isolation verification output is missing');
  if (routeOutput.split(/\r?\n/).some(line => line.trimStart().split(/\s+/, 1)[0] === 'default')) {
    throw new Error('EGRESS_ROUTE_PRESENT: container still has a default route');
  }
  return true;
}

/** Ensure the container remains unprivileged; only the exact one-shot route command uses elevated exec. */
export function assertRouteIsolationContainer(container, networkName) {
  const host = container?.HostConfig || {};
  const entrypoint = container?.Config?.Entrypoint;
  const command = container?.Config?.Cmd;
  if (host.Privileged === true || (host.CapAdd || []).length !== 0 || host.NetworkMode !== networkName || (host.Binds || []).length !== 0 ||
      !Array.isArray(entrypoint) || entrypoint.length !== 1 || entrypoint[0] !== '/bin/sh' ||
      !Array.isArray(command) || command.length !== 2 || command[0] !== '-c' || command[1] !== 'sleep infinity') {
    throw new Error('route-isolation container must use the recorded dormant bootstrap with no persistent capabilities, mounts, or privileged mode');
  }
  return true;
}

/** Classify a no-payload outbound TCP probe; a host control probe must pass first. */
export function classifyEgressProbe(result) {
  if (!result || result.error || result.status === null || result.status === undefined) return 'BLOCKED';
  const output = `${result.stderr || ''} ${result.stdout || ''}`;
  if (result.status === 0 || /connection refused|connected/i.test(output)) return 'FAIL';
  if (result.status === 124 || /network is unreachable|no route to host|connection timed out|operation timed out/i.test(output)) return 'PASS';
  return 'BLOCKED';
}

export function validateRunId(runId) {
  if (typeof runId !== 'string' || !/^t03b2-[a-z0-9]{1,20}-\d{8}-r[1-9]\d*$/.test(runId)) {
    throw new Error('runId must be a unique t03b2-* date/run identity');
  }
  return runId;
}

/** Create an exclusive run evidence directory; existing run IDs are immutable. */
export function createEvidenceDirectory(baseDir, runId) {
  validateRunId(runId);
  const directory = resolve(baseDir, runId);
  mkdirSync(directory, { recursive: false });
  return directory;
}

export function labelsForRun(runId) {
  validateRunId(runId);
  return {
    project: 'bewt-covext', owner: 'bewt-covext', 'managed-by': 'bewt-covext-agent',
    app: 'claroline', task: 't03b2-g0', runId,
  };
}

export function namesForRun(runId) {
  validateRunId(runId);
  const base = `bewt-covext-claroline-${runId}`;
  return { app: `${base}-app`, browser: `${base}-selenium`, network: `${base}-net` };
}

function normalizedName(value) { return String(value || '').replace(/^\//, ''); }
function sameLabels(actual, expected) {
  if (!actual || typeof actual !== 'object') return false;
  const keys = Object.keys(expected).sort((left, right) => left.localeCompare(right, 'en'));
  return keys.every(key => actual[key] === expected[key]) && Object.keys(actual).length === keys.length;
}

function readTagAttributes(xml, startIndex, tagName) {
  const opening = `<${tagName}`;
  let cursor = startIndex;
  while ((cursor = xml.indexOf(opening, cursor)) !== -1) {
    const boundary = xml[cursor + opening.length];
    if (boundary && !/[\s/>]/.test(boundary)) { cursor += opening.length; continue; }
    let end = cursor + opening.length;
    let quote = '';
    for (; end < xml.length; end += 1) {
      const character = xml[end];
      if (quote) { if (character === quote) quote = ''; continue; }
      if (character === '"' || character === "'") { quote = character; continue; }
      if (character === '>') break;
    }
    if (end >= xml.length) return null;
    const attributes = {};
    let index = cursor + opening.length;
    while (index < end) {
      while (index < end && /\s|\//.test(xml[index])) index += 1;
      const nameStart = index;
      while (index < end && /[\w:-]/.test(xml[index])) index += 1;
      if (index === nameStart) { index += 1; continue; }
      const name = xml.slice(nameStart, index);
      while (index < end && /\s/.test(xml[index])) index += 1;
      if (xml[index] !== '=') continue;
      index += 1;
      while (index < end && /\s/.test(xml[index])) index += 1;
      const delimiter = xml[index];
      if (delimiter !== '"' && delimiter !== "'") continue;
      index += 1;
      const valueStart = index;
      while (index < end && xml[index] !== delimiter) index += 1;
      attributes[name] = xml.slice(valueStart, index);
      if (xml[index] === delimiter) index += 1;
    }
    return { attributes, nextIndex: end + 1 };
  }
  return null;
}

function readAllTagAttributes(xml, tagName) {
  const tags = [];
  let cursor = 0;
  while (cursor < xml.length) {
    const tag = readTagAttributes(xml, cursor, tagName);
    if (!tag) break;
    tags.push(tag.attributes);
    cursor = tag.nextIndex;
  }
  return tags;
}

export class CleanupBlockedError extends Error {
  constructor(message, options) { super(message, options); this.name = 'CleanupBlockedError'; this.outcome = 'BLOCKED'; }
}

export function dockerErrorText(error) {
  const stderr = error?.stderr?.toString?.().trim();
  const stdout = error?.stdout?.toString?.().trim();
  return stderr || stdout || error?.message || String(error);
}

export function isExactNotFound(error, kind, target) {
  if (!error || Number(error.status) !== 1) return false;
  const text = dockerErrorText(error).trim().replace(/\r?\n/g, ' ');
  const escaped = String(target).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = kind === 'container'
    ? new RegExp(`^Error: No such object: ${escaped}$`, 'i')
    : kind === 'network'
      ? new RegExp(`^Error response from daemon: network ${escaped} not found$`, 'i')
      : null;
  return Boolean(pattern?.test(text));
}

export function parseSurefireXml(xml, expectedClass = APP_TEST_CLASS) {
  if (typeof xml !== 'string' || !xml.trim()) return { outcome: 'BLOCKED', reason: 'Surefire XML missing or empty' };
  const suite = readTagAttributes(xml, 0, 'testsuite');
  if (!suite) return { outcome: 'BLOCKED', reason: 'Surefire XML has no testsuite element' };
  const attributes = suite.attributes;
  const cases = readAllTagAttributes(xml, 'testcase');
  const counters = {
    tests: Number(attributes.tests ?? cases.length),
    failures: Number(attributes.failures ?? 0),
    errors: Number(attributes.errors ?? 0),
    skipped: Number(attributes.skipped ?? 0),
  };
  const classNames = [...new Set(cases.map(testCase => testCase.classname).filter(Boolean))];
  if (cases.length !== 1 || counters.tests !== 1) return { outcome: 'BLOCKED', reason: `expected exactly one testcase; saw ${cases.length}`, ...counters, classNames };
  if (classNames.length !== 1 || classNames[0] !== expectedClass) return { outcome: 'FAIL', reason: `unexpected testcase class: ${classNames.join(',') || 'missing'}`, ...counters, classNames };
  if (counters.failures !== 0 || counters.errors !== 0 || counters.skipped !== 0) return { outcome: 'FAIL', reason: 'testcase has failure, error, or skip', ...counters, classNames };
  return { outcome: 'PASS', ...counters, classNames };
}

export function sanitizeSurefireXml(xml, localRoots = []) {
  let output = String(xml)
    .replace(/<properties\b[^>]*>[\s\S]*?<\/properties>/gi, '')
    .replace(/<system-out\b[^>]*>[\s\S]*?<\/system-out>/gi, '')
    .replace(/<system-err\b[^>]*>[\s\S]*?<\/system-err>/gi, '');
  for (const root of localRoots.filter(Boolean)) {
    const normalized = String(root).replace(/[\\/]+/g, '[\\\\/]');
    output = output.replace(new RegExp(normalized, 'gi'), '<LOCAL_PATH>');
  }
  return output;
}

export function selectLoopbackPort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') { server.close(); reject(new Error('could not select a loopback port')); return; }
      server.close(error => error ? reject(error) : resolvePort(address.port));
    });
  });
}

/** Probe a selected host port; the socket closes before Docker can bind it. */
export async function probeLoopbackPort(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('host port must be an integer in 1024..65535');
  const server = createServer();
  try {
    await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolveListen); });
  } catch (error) {
    if (error?.code === 'EADDRINUSE') return { port, available: false, errorCode: error.code };
    throw error;
  }
  await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  return { port, available: true, reservationHeld: false };
}

/** Verify Docker configured and active published endpoint match the selected loopback port. */
export function assertPublishedLoopbackPort(container, containerPort, expectedHostPort) {
  const expected = String(expectedHostPort);
  const configured = container?.HostConfig?.PortBindings?.[containerPort];
  const active = container?.NetworkSettings?.Ports?.[containerPort];
  if (!Array.isArray(configured) || configured.length !== 1 || configured[0]?.HostIp !== '127.0.0.1' || configured[0]?.HostPort !== expected) {
    throw new Error(`PORT_BINDING_MISMATCH: HostConfig.PortBindings does not match 127.0.0.1:${expected}`);
  }
  if (!Array.isArray(active) || active.length !== 1 || active[0]?.HostIp !== '127.0.0.1' || active[0]?.HostPort !== expected) {
    throw new Error(`PORT_BINDING_MISMATCH: NetworkSettings.Ports does not match 127.0.0.1:${expected}`);
  }
  return true;
}

/** Verify Docker CLI's active forwarding view, in addition to inspect and an HTTP request. */
export function assertDockerPortOutput(output, expectedHostIp, expectedHostPort) {
  const expected = `${expectedHostIp}:${expectedHostPort}`;
  const mappings = String(output ?? '').trim().split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (mappings.length !== 1 || mappings[0] !== expected) {
    throw new Error(`DOCKER_PORT_MISMATCH: expected exactly ${expected}; received ${mappings.join(',') || 'no active mapping'}`);
  }
  return true;
}

/** Build a no-payload TCP probe for one of the fixed IPv4/IPv6 external control endpoints. */
export function buildEgressProbeArgs(containerId, family) {
  if (typeof containerId !== 'string' || !/^[a-f0-9]{64}$/i.test(containerId)) throw new Error('egress probe requires a recorded full container ID');
  const target = EGRESS_PROBE_TARGETS[family];
  if (!target) throw new Error('egress probe family must be ipv4 or ipv6');
  const command = `timeout 5 bash -c 'echo >/dev/tcp/${target.address}/${target.port}'`;
  return ['exec', containerId, 'bash', '-lc', command];
}

export function assertContainerPortNotPublished(container, containerPort) {
  const configured = container?.HostConfig?.PortBindings || {};
  const active = container?.NetworkSettings?.Ports?.[containerPort];
  if (Object.hasOwn(configured, containerPort) || (Array.isArray(active) && active.length > 0)) {
    throw new Error(`PORT_BINDING_MISMATCH: ${containerPort} must not be published to the host`);
  }
  return true;
}

export function isPortBindingConflict(value) {
  const text = typeof value === 'string' ? value : dockerErrorText(value);
  return /port is already allocated|address already in use|failed to bind|bind:.*(address|port)/i.test(text);
}
export function snapshotInventory(dockerExec = args => execFileSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, stdio: ['ignore', 'pipe', 'pipe'] }).trim()) {
  try {
    const list = args => { const text = dockerExec(args); return text ? text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).sort((left, right) => left.localeCompare(right, 'en')) : []; };
    return {
      containers: list(['ps', '-aq', '--no-trunc']),
      networks: list(['network', 'ls', '-q', '--no-trunc']),
      volumes: list(['volume', 'ls', '-q']),
      images: list(['image', 'ls', '-q', '--no-trunc']),
    };
  } catch (error) {
    throw new CleanupBlockedError(`Docker inventory BLOCKED: ${dockerErrorText(error)}`, { cause: error });
  }
}

export function assertOwnedContainer(resource, expected) {
  const labels = resource?.Config?.Labels;
  const imageLabels = expected.imageLabels || {};
  const expectedLabels = { ...imageLabels, ...expected.labels };
  if (resource?.Id !== expected.id || normalizedName(resource?.Name) !== expected.name || resource?.Config?.Image !== expected.imageRef || !sameLabels(labels, expectedLabels)) {
    throw new CleanupBlockedError(`recorded ${expected.role || 'container'} identity, image, or complete ownership labels do not match`);
  }
  if (!Array.isArray(resource.Mounts) || resource.Mounts.length !== 0) {
    throw new CleanupBlockedError(`recorded ${expected.role || 'container'} has an unexpected mount; no resource may be removed`);
  }
  return resource;
}

export function assertOwnedNetwork(network, expected) {
  const endpointIds = Object.keys(network?.Containers || {}).sort((left, right) => left.localeCompare(right, 'en'));
  if (network?.Id !== expected.id || network?.Name !== expected.name || !sameLabels(network?.Labels, expected.labels)) {
    throw new CleanupBlockedError('recorded network identity or complete ownership labels do not match');
  }
  if (endpointIds.length !== expected.containerIds.length || endpointIds.some((id, index) => id !== expected.containerIds[index])) {
    throw new CleanupBlockedError('network endpoints do not exactly match the verified recorded containers');
  }
  return network;
}
/** Record a returned Docker ID before interpreting a nonzero create status. */
export function recordCreatedResource({ kind, role, name, imageRef, result, record, onRecord = () => {} }) {
  const output = Buffer.isBuffer(result?.stdout) ? result.stdout.toString('utf8') : String(result?.stdout ?? '');
  const id = output.trim().split(/\s+/)[0];
  const hasId = /^[a-f0-9]{64}$/i.test(id || '');
  if (hasId) {
    const value = kind === 'network' ? { id, name } : { role, id, name, imageRef };
    if (kind === 'network') record.network = value;
    else if (kind === 'container') record.containers.push(value);
    else throw new Error(`unsupported Docker resource kind: ${kind}`);
    onRecord(value);
  }
  if (Number(result?.status) !== 0) {
    const detail = Buffer.isBuffer(result?.stderr) ? result.stderr.toString('utf8') : String(result?.stderr || '');
    const prefix = isPortBindingConflict(detail) ? 'PORT_BIND_CONFLICT: ' : '';
    throw new Error(`${prefix}${kind} create failed${hasId ? ' after returning a resource ID that was recorded' : ' without returning a recordable resource ID'}`);
  }
  if (!hasId) throw new Error(`${kind} create did not return a full Docker resource ID`);
  return id;
}
