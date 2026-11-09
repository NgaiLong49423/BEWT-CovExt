import { createConnection, createServer } from 'node:net';
import { execFileSync } from 'node:child_process';
import { createPublicKey, verify as verifySignature } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DOCKER_CLI_PATH, DOCKER_ENV, IPTABLES_CLI_PATH, SUDO_CLI_PATH, runCommand } from './child-process-policy.mjs';

export const APP_IMAGE_REF = 'olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af';
export const BROWSER_IMAGE_REF = 'selenium/standalone-chrome@sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f';
export const SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const SOURCE_VERSION = '1.11.10';
export const APPLICATION_SOURCE_COMMIT = '22d852f93081bc36b1d08b93f5e0c14b49a573f6';
export const APPLICATION_SOURCE_VERSION = '1.11.10-bewt-derivative';
export const IMAGE_PROVENANCE_CLASSIFICATION = 'BEWT_BENCHMARK_DERIVATIVE_PINNED';
export const PINNED_IMAGE_PATCH_RECORD = Object.freeze({
  decisionId: 'P1',
  classification: IMAGE_PROVENANCE_CLASSIFICATION,
  officialTarballLayerIndex: 8,
  officialTarballLayerSha256: 'd33f1c16adf9e589e8a0501b33b99d1cd8f73e1c4ec6e753d05a3c076e7d302f',
  officialFileSha256: 'fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1',
  officialFileBytes: 23010,
  patchLayerIndex: 13,
  patchLayerSha256: 'a48416c0ca244a9138ac9e537426ed037f4373a85160ffc43514a7a6b4e7501a',
  patchedFilePath: 'var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php',
  patchedFileSha256: 'c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8',
  patchedFileBytes: 23040,
  patchedFunctions: Object.freeze(['create_course_tables', 'fill_Db_course']),
  patchSummary: 'Comments out course_description and course_properties table creation/seeding in add_course.lib.inc.php (lines 382-389, 557-562)',
});
export const APP_TEST_CLASS = 'test.Claroline_AddUserTest';
export const INTERNAL_NETWORK_POLICY = 'internal-bridge-v1';
export const EGRESS_LIMITED_NETWORK_POLICY = 'egress-limited-bridge-no-masquerade-v1';
export const INTERNAL_IPAM_NETWORK_POLICY = 'internal-bridge-explicit-ipam-v1';
export const ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY = 'published-bridge-default-route-removed-v1';
export const ROUTE_ISOLATION_METHOD = 'container-netns-default-route-drop-v1';
export const HOST_FIREWALL_PUBLISHED_NETWORK_POLICY = 'published-bridge-host-firewall-reject-v1';
export const HOST_FIREWALL_ISOLATION_METHOD = 'linux-docker-user-bridge-reject-v1';
export const EGRESS_PROBE_TARGETS = Object.freeze({
  ipv4: Object.freeze({ family: 'ipv4', address: '1.1.1.1', port: 443 }),
  ipv6: Object.freeze({ family: 'ipv6', address: '2606:4700:4700::1111', port: 443 }),
});
const ROUTE_APPROVAL_SCOPE = 'one privileged exec in this exact container network namespace before services start; no host routing, Docker daemon, or other-container changes';
const ROUTE_APPROVAL_ROLLBACK = 'if route removal or any probe fails, do not start services; remove only the exact recorded run-owned containers and network; discard the container rather than restoring its route';
export const HOST_FIREWALL_APPROVAL_SCOPE = 'one DOCKER-USER rule scoped strictly to this run-owned bridge interface (-i br-<id12> ! -o br-<id12>) before any container starts; no container privileged exec, no host default route modification, no impact on sshd/ens3/docker0 or other bridges';
export const HOST_FIREWALL_APPROVAL_ROLLBACK = 'delete the exact DOCKER-USER rule by full specification and verify zero residual rules for this run tag and bridge interface before removing the run-owned Docker network';
export const HOST_FIREWALL_MAX_APPROVAL_TTL_MS = 15 * 60 * 1000;

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

export function requestRouteIsolationApproval(request) {
  const error = approvalRequired('no independently authenticated Team Lead decision verifier is configured; operator confirmation is not authorization');
  error.authorizationRequest = request;
  throw error;
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
  if (policy === ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY || policy === HOST_FIREWALL_PUBLISHED_NETWORK_POLICY) {
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

/** No privileged command is available until a separately governed authorization service is designed and approved. */
export function routeIsolationExecArgs(containerId, decision, runId) {
  const request = routeIsolationApprovalRequest(containerId, decision?.role, runId);
  const error = approvalRequired('independent Team Lead authorization is unavailable; privileged route isolation is disabled');
  error.authorizationRequest = request;
  throw error;
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

export function classifyTcpProbe(result) {
  if (!result || typeof result !== 'object') return 'INCONCLUSIVE';
  const output = `${result.stderr || ''} ${result.stdout || ''} ${result.error?.message || ''}`;
  const errorCode = result.error?.code || result.code;
  const status = result.status;
  const unreachableCode = ['ENETUNREACH', 'EHOSTUNREACH', 'ENETDOWN'].includes(errorCode);
  const unreachableText = /network is unreachable|no route to host|network is down/i.test(output);
  const timeoutEvidence = errorCode === 'ETIMEDOUT' || /connection timed out|operation timed out|timed out/i.test(output);
  const refusedEvidence = errorCode === 'ECONNREFUSED' || /connection refused/i.test(output);
  const connectedEvidence = result.connectionEstablished === true || /\bconnected\b/i.test(output);

  if (result.source === 'node-socket') {
    if (!Number.isInteger(status)) return result.error?.code === 'ETIMEDOUT' ? 'PROBE_TIMEOUT' : 'INCONCLUSIVE';
    if ((status === 0 && result.error) || (status !== 0 && !result.error)) return 'INCONCLUSIVE';
    if (status === 0) return result.connectionEstablished === true && !unreachableText && !timeoutEvidence && !refusedEvidence ? 'CONNECTION_SUCCESS' : 'INCONCLUSIVE';
    if (unreachableCode && !timeoutEvidence && !refusedEvidence && !connectedEvidence) return 'NETWORK_UNREACHABLE';
    if (errorCode === 'ETIMEDOUT' && !unreachableText && !refusedEvidence) return 'PROBE_TIMEOUT';
    if (errorCode === 'ECONNREFUSED' && !unreachableText && !timeoutEvidence) return 'CONNECTION_REFUSED';
    return 'INCONCLUSIVE';
  }

  if (result.source === 'process') {
    // Docker CLI/spawn failures and malformed wrappers are never container-network evidence.
    if (result.error || !Number.isInteger(status)) return 'PROBE_EXECUTION_FAILURE';
    const marker = output.match(/__BEWT_TCP_PROBE_EXIT__=(\d+)/);
    if (!marker) return 'PROBE_EXECUTION_FAILURE';
    const probeStatus = Number(marker[1]);
    if (status !== probeStatus) return 'INCONCLUSIVE';
    if ((probeStatus === 0 || connectedEvidence) && (unreachableText || timeoutEvidence || refusedEvidence)) return 'INCONCLUSIVE';
    if (probeStatus === 0) return 'CONNECTION_SUCCESS';
    if ([125, 126, 127].includes(probeStatus) || /command not found|cannot execute|permission denied/i.test(output)) return 'PROBE_EXECUTION_FAILURE';
    if (probeStatus === 124) return unreachableText || refusedEvidence || connectedEvidence ? 'INCONCLUSIVE' : 'PROBE_TIMEOUT';
    if (timeoutEvidence) return unreachableText || refusedEvidence || connectedEvidence ? 'INCONCLUSIVE' : 'PROBE_TIMEOUT';
    if (connectedEvidence || (unreachableText && refusedEvidence)) return 'INCONCLUSIVE';
    if (unreachableText) return 'NETWORK_UNREACHABLE';
    if (refusedEvidence) return 'CONNECTION_REFUSED';
    return 'INCONCLUSIVE';
  }

  // Unlabelled/spawn-like results lack enough provenance to prove endpoint isolation.
  if (status === null || status === undefined) return result.error ? 'PROBE_EXECUTION_FAILURE' : 'INCONCLUSIVE';
  if (!Number.isInteger(status)) return 'INCONCLUSIVE';
  if ([125, 126, 127].includes(status)) return 'PROBE_EXECUTION_FAILURE';
  if ((status === 0 || connectedEvidence) && (unreachableText || unreachableCode || timeoutEvidence || refusedEvidence)) return 'INCONCLUSIVE';
  if (status === 0 || connectedEvidence) return 'CONNECTION_SUCCESS';
  return 'INCONCLUSIVE';
}

export function classifyHostControlProbe(result, family) {
  const probe = classifyTcpProbe(result);
  if (probe === 'CONNECTION_SUCCESS') return 'HOST_CONTROL_REACHABLE';
  if (probe === 'NETWORK_UNREACHABLE') return family === 'ipv6' ? 'HOST_IPV6_UNAVAILABLE' : 'HOST_IPV4_UNAVAILABLE';
  if (probe === 'CONNECTION_REFUSED') return 'HOST_CONTROL_TARGET_REFUSED';
  if (probe === 'PROBE_TIMEOUT') return 'HOST_CONTROL_TIMEOUT_INCONCLUSIVE';
  if (probe === 'PROBE_EXECUTION_FAILURE') return 'HOST_CONTROL_EXECUTION_FAILURE';
  return 'HOST_CONTROL_INCONCLUSIVE';
}

/** Only an explicit network-unreachable result verifies this fixed endpoint is blocked. */
export function classifyEgressProbe(result) {
  const probe = classifyTcpProbe(result);
  if (probe === 'NETWORK_UNREACHABLE') return 'NETWORK_UNREACHABLE';
  if (probe === 'CONNECTION_SUCCESS' || probe === 'CONNECTION_REFUSED') return 'EGRESS_REACHABLE';
  if (probe === 'PROBE_TIMEOUT') return 'TCP_TIMEOUT_INCONCLUSIVE';
  if (probe === 'PROBE_EXECUTION_FAILURE') return 'PROBE_EXECUTION_FAILURE';
  return 'INCONCLUSIVE';
}

export function probeTcpTarget(address, port, family, timeoutMs = 5000, socketFactory = createConnection) {
  return new Promise(resolve => {
    let settled = false;
    const finish = result => { if (settled) return; settled = true; socket.destroy(); resolve(result); };
    const socket = socketFactory({ host: address, port, family: family === 'ipv6' ? 6 : 4 });
    socket.setTimeout(timeoutMs, () => finish({ source: 'node-socket', status: null, error: Object.assign(new Error('TCP probe timed out'), { code: 'ETIMEDOUT' }) }));
    socket.once('connect', () => finish({ source: 'node-socket', status: 0, connectionEstablished: true }));
    socket.once('error', error => finish({ source: 'node-socket', status: 1, error }));
  });
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
  const command = `timeout 5 bash -c 'echo >/dev/tcp/${target.address}/${target.port}'; probe_status=$?; printf '\\n__BEWT_TCP_PROBE_EXIT__=%s\\n' "$probe_status"; exit "$probe_status"`;
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


export function verifyHostEgressControlsForRun(hostEgressControls, { networkIpv6Enabled = false, hostIpv6DefaultRoutes = [] } = {}) {
  if (hostEgressControls?.ipv4?.classification !== 'HOST_CONTROL_REACHABLE') {
    throw new Error('host control probe did not reach the external IPv4 target; container egress probe would be inconclusive');
  }
  if (hostEgressControls?.ipv6?.classification === 'HOST_CONTROL_REACHABLE') return true;
  if (
    hostEgressControls?.ipv6?.classification === 'HOST_IPV6_UNAVAILABLE' &&
    networkIpv6Enabled === false &&
    Array.isArray(hostIpv6DefaultRoutes) &&
    hostIpv6DefaultRoutes.length === 0
  ) {
    return true;
  }
  throw new Error('host control probe did not reach the external IPv6 target and host IPv6 absence was not verified; container IPv6 egress probe would be inconclusive');
}

export function deriveLinuxBridgeInterfaceName(networkId, inspectedBridgeName = null) {
  if (typeof networkId !== 'string' || !/^[a-f0-9]{64}$/i.test(networkId)) {
    throw new Error('HOST_FIREWALL_INVALID_NETWORK_ID: full 64-hex Docker network ID is required');
  }
  const expected = `br-${networkId.slice(0, 12).toLowerCase()}`;
  if (inspectedBridgeName !== null && inspectedBridgeName !== undefined && inspectedBridgeName !== '') {
    if (inspectedBridgeName !== expected) {
      throw new Error(`HOST_FIREWALL_BRIDGE_MISMATCH: expected ${expected}, got ${inspectedBridgeName}`);
    }
  }
  return expected;
}

export function buildHostBridgeFirewallSpec(networkId, runId, inspectedBridgeName = null, uplinkInterface = null) {
  const validRunId = validateRunId(runId);
  const bridgeInterface = deriveLinuxBridgeInterfaceName(networkId, inspectedBridgeName);
  const normalizedUplink = uplinkInterface === null || uplinkInterface === undefined || uplinkInterface === ''
    ? null
    : String(uplinkInterface).trim();
  if (normalizedUplink !== null && !/^[a-zA-Z0-9_.:-]{1,15}$/.test(normalizedUplink)) {
    throw new Error(`HOST_FIREWALL_INVALID_UPLINK: invalid uplink interface '${normalizedUplink}'`);
  }
  const commentTag = `bewt-t03b2-${validRunId}`;
  const ruleTail = [
    '-i', bridgeInterface,
    '!', '-o', bridgeInterface,
    '-m', 'conntrack',
    '!', '--ctstate', 'RELATED,ESTABLISHED',
    '-m', 'comment',
    '--comment', commentTag,
    '-j', 'REJECT',
    '--reject-with', 'icmp-net-unreachable',
  ];
  const insertArgs = Object.freeze(['-w', '5', '-I', 'DOCKER-USER', '1', ...ruleTail]);
  const checkArgs = Object.freeze(['-w', '5', '-C', 'DOCKER-USER', ...ruleTail]);
  const deleteArgs = Object.freeze(['-w', '5', '-D', 'DOCKER-USER', ...ruleTail]);
  const listArgs = Object.freeze(['-w', '5', '-S', 'DOCKER-USER']);
  const iptablesExecutable = IPTABLES_CLI_PATH || '/usr/sbin/iptables';
  const sudoExecutable = SUDO_CLI_PATH || '/usr/bin/sudo';
  return Object.freeze({
    method: HOST_FIREWALL_ISOLATION_METHOD,
    runId: validRunId,
    networkId: networkId.toLowerCase(),
    bridgeInterface,
    uplinkInterface: normalizedUplink,
    commentTag,
    iptablesExecutable,
    sudoExecutable,
    insertArgs,
    checkArgs,
    deleteArgs,
    listArgs,
    sudoInsertArgs: Object.freeze(['-n', iptablesExecutable, ...insertArgs]),
    sudoCheckArgs: Object.freeze(['-n', iptablesExecutable, ...checkArgs]),
    sudoDeleteArgs: Object.freeze(['-n', iptablesExecutable, ...deleteArgs]),
    sudoListArgs: Object.freeze(['-n', iptablesExecutable, ...listArgs]),
  });
}

export function hostFirewallApprovalRequest(spec) {
  if (!spec || spec.method !== HOST_FIREWALL_ISOLATION_METHOD) {
    throw approvalRequired('a valid host bridge firewall specification is required');
  }
  try { validateRunId(spec.runId); } catch { throw approvalRequired('a valid unique T03-B2 run ID is required'); }
  if (typeof spec.networkId !== 'string' || !/^[a-f0-9]{64}$/.test(spec.networkId)) {
    throw approvalRequired('a full 64-hex recorded Docker network ID is required');
  }
  if (typeof spec.bridgeInterface !== 'string' || spec.bridgeInterface !== `br-${spec.networkId.slice(0, 12)}`) {
    throw approvalRequired('bridgeInterface must match br-<first12(networkId)>');
  }
  if (typeof spec.uplinkInterface !== 'string' || !/^[a-zA-Z0-9_.:-]{1,15}$/.test(spec.uplinkInterface)) {
    throw approvalRequired('verified host default uplinkInterface is required');
  }
  const canonicalSpec = buildHostBridgeFirewallSpec(spec.networkId, spec.runId, spec.bridgeInterface, spec.uplinkInterface);
  return Object.freeze({
    decisionId: 'A1',
    method: canonicalSpec.method,
    runId: canonicalSpec.runId,
    networkName: namesForRun(canonicalSpec.runId).network,
    networkId: canonicalSpec.networkId,
    bridgeInterface: canonicalSpec.bridgeInterface,
    uplinkInterface: canonicalSpec.uplinkInterface,
    commentTag: canonicalSpec.commentTag,
    insertCommand: `${canonicalSpec.sudoExecutable} ${canonicalSpec.sudoInsertArgs.join(' ')}`,
    checkCommand: `${canonicalSpec.sudoExecutable} ${canonicalSpec.sudoCheckArgs.join(' ')}`,
    deleteCommand: `${canonicalSpec.sudoExecutable} ${canonicalSpec.sudoDeleteArgs.join(' ')}`,
    maxExecutions: 1,
    scope: HOST_FIREWALL_APPROVAL_SCOPE,
    rollback: HOST_FIREWALL_APPROVAL_ROLLBACK,
  });
}

export function canonicalHostFirewallDecisionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw approvalRequired('authorization decision payload is missing');
  }
  return JSON.stringify({
    version: 'bewt-host-firewall-approval-v1',
    decisionId: payload.decisionId,
    approverId: payload.approverId,
    approverRole: payload.approverRole,
    method: payload.method,
    runId: payload.runId,
    networkId: payload.networkId,
    bridgeInterface: payload.bridgeInterface,
    uplinkInterface: payload.uplinkInterface,
    commentTag: payload.commentTag,
    insertCommand: payload.insertCommand,
    deleteCommand: payload.deleteCommand,
    maxExecutions: payload.maxExecutions,
    scope: payload.scope,
    rollback: payload.rollback,
    issuedAtUtc: payload.issuedAtUtc,
    expiresAtUtc: payload.expiresAtUtc,
    nonce: payload.nonce,
  });
}

export function verifyHostFirewallDecision(request, signedDecision, {
  trustedPublicKeyPem,
  nowMs = Date.now(),
  consumedNonces = new Set(),
} = {}) {
  const checkedRequest = hostFirewallApprovalRequest(request);
  if (typeof trustedPublicKeyPem !== 'string' || !trustedPublicKeyPem.includes('BEGIN PUBLIC KEY')) {
    const error = approvalRequired('no trusted Team Lead Ed25519 public key is configured for independent host-firewall authorization verification');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  if (!signedDecision || typeof signedDecision !== 'object' || !signedDecision.payload || typeof signedDecision.signatureBase64 !== 'string') {
    const error = approvalRequired('no cryptographically signed Team Lead host-firewall decision token was provided; prompt text or operator confirmation is not authorization');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  const { payload, signatureBase64 } = signedDecision;
  if (typeof payload.approverId !== 'string' || payload.approverId.trim().length < 3 || payload.approverRole !== 'Team Lead') {
    const error = approvalRequired('authorization decision must carry verified Team Lead identity and role');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  if (
    payload.decisionId !== 'A1' ||
    payload.method !== checkedRequest.method ||
    payload.runId !== checkedRequest.runId ||
    payload.networkId !== checkedRequest.networkId ||
    payload.bridgeInterface !== checkedRequest.bridgeInterface ||
    payload.uplinkInterface !== checkedRequest.uplinkInterface ||
    payload.commentTag !== checkedRequest.commentTag ||
    payload.insertCommand !== checkedRequest.insertCommand ||
    payload.deleteCommand !== checkedRequest.deleteCommand ||
    payload.maxExecutions !== 1 ||
    payload.scope !== checkedRequest.scope ||
    payload.rollback !== checkedRequest.rollback
  ) {
    const error = approvalRequired('authorization decision scope, runId, networkId, bridgeInterface, uplinkInterface, or exact command does not match request');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  if (typeof payload.nonce !== 'string' || !/^[a-f0-9]{32,128}$/i.test(payload.nonce)) {
    const error = approvalRequired('authorization decision requires a 128-bit+ hex replay-protection nonce');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  if (!(consumedNonces instanceof Set) || consumedNonces.has(payload.nonce)) {
    const error = approvalRequired('authorization decision nonce has already been consumed (replay rejected)');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  const issuedMs = Date.parse(payload.issuedAtUtc);
  const expiresMs = Date.parse(payload.expiresAtUtc);
  if (!Number.isFinite(issuedMs) || !Number.isFinite(expiresMs) || expiresMs <= issuedMs) {
    const error = approvalRequired('authorization decision timestamps are missing or invalid');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  if (expiresMs - issuedMs > HOST_FIREWALL_MAX_APPROVAL_TTL_MS) {
    const error = approvalRequired('authorization decision validity window exceeds the 15-minute maximum TTL');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  if (nowMs < issuedMs || nowMs > expiresMs) {
    const error = approvalRequired('authorization decision token is expired or not yet valid');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  let verified = false;
  try {
    const publicKey = createPublicKey(trustedPublicKeyPem);
    if (publicKey.asymmetricKeyType !== 'ed25519') {
      throw new Error('public key must be Ed25519');
    }
    const messageBuffer = Buffer.from(canonicalHostFirewallDecisionPayload(payload), 'utf8');
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');
    verified = verifySignature(null, messageBuffer, publicKey, signatureBuffer);
  } catch {
    verified = false;
  }
  if (!verified) {
    const error = approvalRequired('Ed25519 cryptographic signature verification failed for host-firewall decision token');
    error.authorizationRequest = checkedRequest;
    throw error;
  }
  consumedNonces.add(payload.nonce);
  return Object.freeze({
    verified: true,
    approverId: payload.approverId,
    approverRole: payload.approverRole,
    runId: checkedRequest.runId,
    networkId: checkedRequest.networkId,
    bridgeInterface: checkedRequest.bridgeInterface,
    uplinkInterface: checkedRequest.uplinkInterface,
    nonce: payload.nonce,
    issuedAtUtc: payload.issuedAtUtc,
    expiresAtUtc: payload.expiresAtUtc,
  });
}

export function requestHostFirewallApproval(request, verificationOptions = {}) {
  const checkedRequest = hostFirewallApprovalRequest(request);
  return verifyHostFirewallDecision(checkedRequest, verificationOptions.signedDecision, verificationOptions);
}

export function assertHostBridgeFirewallRuleInstalled(iptablesListOutput, spec) {
  if (!spec || typeof spec.bridgeInterface !== 'string' || !/^br-[a-f0-9]{12}$/.test(spec.bridgeInterface) || typeof spec.commentTag !== 'string' || !/^bewt-t03b2-t03b2-[a-z0-9]{1,20}-\d{8}-r[1-9]\d*$/.test(spec.commentTag)) {
    throw new Error('HOST_FIREWALL_VERIFY_FAILED: invalid host bridge firewall specification');
  }
  const lines = String(iptablesListOutput ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const matching = lines.filter(line => line.includes(spec.commentTag) || line.includes(spec.bridgeInterface));
  if (matching.length !== 1) {
    throw new Error(`HOST_FIREWALL_VERIFY_FAILED: expected exactly 1 DOCKER-USER rule for ${spec.bridgeInterface} (${spec.commentTag}), found ${matching.length}`);
  }
  const rule = matching[0];
  const requiredTokens = [
    '-A DOCKER-USER',
    `-i ${spec.bridgeInterface}`,
    `! -o ${spec.bridgeInterface}`,
    '--ctstate RELATED,ESTABLISHED',
    `--comment ${spec.commentTag}`,
    '-j REJECT',
    '--reject-with icmp-net-unreachable',
  ];
  for (const token of requiredTokens) {
    if (!rule.includes(token)) {
      throw new Error(`HOST_FIREWALL_VERIFY_FAILED: active DOCKER-USER rule missing required token '${token}'`);
    }
  }
  return rule;
}

export function assertHostBridgeFirewallRuleRemoved(iptablesListOutput, spec) {
  if (!spec || typeof spec.bridgeInterface !== 'string' || typeof spec.commentTag !== 'string') {
    throw new Error('HOST_FIREWALL_ROLLBACK_VERIFY_FAILED: invalid host bridge firewall specification');
  }
  const lines = String(iptablesListOutput ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const residual = lines.filter(line => line.includes(spec.commentTag) || line.includes(spec.bridgeInterface));
  if (residual.length !== 0) {
    throw new Error(`HOST_FIREWALL_ROLLBACK_VERIFY_FAILED: ${residual.length} residual DOCKER-USER rule(s) remain for ${spec.bridgeInterface}`);
  }
  return true;
}

export function installHostBridgeFirewallRule(spec, verifiedDecision, execFn = (file, args) => runCommand(file, args, { env: DOCKER_ENV, timeout: 15000 })) {
  if (!verifiedDecision || verifiedDecision.verified !== true || verifiedDecision.runId !== spec?.runId || verifiedDecision.networkId !== spec?.networkId || verifiedDecision.bridgeInterface !== spec?.bridgeInterface) {
    throw approvalRequired('installHostBridgeFirewallRule requires a verified Team Lead decision matching runId, networkId, and bridgeInterface');
  }
  const insertResult = execFn(spec.sudoExecutable, spec.sudoInsertArgs);
  if (insertResult.status !== 0) {
    throw new Error(`HOST_FIREWALL_INSTALL_FAILED: ${insertResult.stderr || insertResult.stdout || 'sudo iptables -I DOCKER-USER failed'}`);
  }
  const checkResult = execFn(spec.sudoExecutable, spec.sudoCheckArgs);
  if (checkResult.status !== 0) {
    throw new Error(`HOST_FIREWALL_CHECK_FAILED: ${checkResult.stderr || checkResult.stdout || 'sudo iptables -C DOCKER-USER failed'}`);
  }
  const listResult = execFn(spec.sudoExecutable, spec.sudoListArgs);
  if (listResult.status !== 0) {
    throw new Error(`HOST_FIREWALL_LIST_FAILED: ${listResult.stderr || listResult.stdout || 'sudo iptables -S DOCKER-USER failed'}`);
  }
  const verifiedRule = assertHostBridgeFirewallRuleInstalled(listResult.stdout, spec);
  return {
    installed: true,
    verifiedRule,
    insertStatus: insertResult.status,
    checkStatus: checkResult.status,
    listOutput: listResult.stdout,
  };
}

export function removeHostBridgeFirewallRule(spec, execFn = (file, args) => runCommand(file, args, { env: DOCKER_ENV, timeout: 15000 })) {
  if (!spec || typeof spec.bridgeInterface !== 'string' || typeof spec.commentTag !== 'string') {
    throw new Error('HOST_FIREWALL_ROLLBACK_VERIFY_FAILED: invalid host bridge firewall specification');
  }
  const deleteResult = execFn(spec.sudoExecutable, spec.sudoDeleteArgs);
  if (deleteResult.status !== 0) {
    throw new Error(`HOST_FIREWALL_DELETE_FAILED: ${deleteResult.stderr || deleteResult.stdout || 'sudo iptables -D DOCKER-USER failed'}`);
  }
  const listResult = execFn(spec.sudoExecutable, spec.sudoListArgs);
  if (listResult.status !== 0) {
    throw new Error(`HOST_FIREWALL_LIST_FAILED: ${listResult.stderr || listResult.stdout || 'sudo iptables -S DOCKER-USER failed'}`);
  }
  assertHostBridgeFirewallRuleRemoved(listResult.stdout, spec);
  return {
    removed: true,
    deleteStatus: deleteResult.status,
    listOutput: listResult.stdout,
    residualFirewallRules: 0,
  };
}
