import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_IMAGE_REF, BROWSER_IMAGE_REF, SOURCE_COMMIT, EGRESS_PROBE_TARGETS, assertOwnedContainer, assertPrivateLogDirectory, assertRouteIsolationContainer, assertContainerPortNotPublished, assertDockerPortOutput, buildEgressProbeArgs, probeTcpTarget, classifyHostControlProbe,
  assertPublishedLoopbackPort, assertNetworkPolicy, assertRecordedNetworkIpam, assertContainerNetworkGateway,
  classifyEgressProbe, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY, ROUTE_ISOLATION_METHOD,
  routeIsolationExecArgs, routeIsolationApprovalRequest, requestRouteIsolationApproval, assertNoDefaultRoutes, selectInternalBridgeIpam,
  createEvidenceDirectory, labelsForRun, namesForRun,
  probeLoopbackPort, recordCreatedResource, selectLoopbackPort, snapshotInventory,
  validateRunId,
} from './claroline-g0.mjs';
import { DOCKER_CLI_PATH, DOCKER_ENV, readHostFreeMemoryBytes, readHostIpv4Routes } from './child-process-policy.mjs';
import { runCleanupWithExitCode } from './cleanup-claroline-g0.mjs';

const toolDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(toolDir, '../../..');
const evidenceRoot = resolve(root, 'docs/tasks/T03-B2/evidence');
const runId = validateRunId(process.argv[2] || '');
const evidenceDir = createEvidenceDirectory(evidenceRoot, runId);
const names = namesForRun(runId);
const labels = labelsForRun(runId);
const labelArgs = Object.entries(labels).flatMap(([key, value]) => ['--label', `${key}=${value}`]);
const writeOnce = (name, value) => writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
const writeTextOnce = (name, value) => writeFileSync(resolve(evidenceDir, name), `${value}\n`, { flag: 'wx' });
const scrub = value => String(value ?? '')
  .replaceAll(root, '<WORKTREE>')
  .replace(/(password|passwd|token|secret|authorization|cookie)(\s*[=:]\s*)[^\s,;]+/gi, '$1$2[REDACTED]')
  .replace(/\b[A-Z]:\\(?:[^\s"']+\\)*[^\s"']*/gi, '<LOCAL_PATH>')
  .replace(/\/home\/[a-zA-Z0-9._-]+\/[^\s"']*/g, '<LOCAL_PATH>');
const docker = args => execFileSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const digestOf = ref => ref.slice(ref.indexOf('@') + 1);
const record = {
  runId, benchmarkRepositoryCommit: SOURCE_COMMIT, applicationSourceCommit: null, networkPolicy: ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY,
  egressIsolationMethod: ROUTE_ISOLATION_METHOD,
  imageDigest: digestOf(APP_IMAGE_REF), browserImageDigest: digestOf(BROWSER_IMAGE_REF),
  imageLabels: {}, containers: [], network: null, selectedHostPorts: {},
};
let baseline = null;
let outcome = 'BLOCKED';
let reason = 'diagnostic did not complete';
let dockerChanged = false;

function saveRecord() { writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`); }

function createPrivateStartupLogDirectory(item) {
  const result = dockerCall(['exec', item.id, '/bin/sh', '-c', 'set -eu; test -d "$HOME"; test ! -L "$HOME"; umask 077; printf "%s\\n" "$HOME"; mktemp -d "$HOME/.t03b2-logs.XXXXXXXX"'], `${item.role}-service-log-directory.json`);
  const [homeDirectory, logDirectory] = String(result.stdout || '').trim().split(/\r?\n/);
  item.startupLogHome = homeDirectory;
  item.startupLogDirectory = assertPrivateLogDirectory(logDirectory, homeDirectory);
  saveRecord();
  return item.startupLogDirectory;
}

function selectNetworkIpam() {
  const ids = docker(['network', 'ls', '-q']).split(/\r?\n/).filter(Boolean);
  const dockerCidrs = ids.flatMap(id => JSON.parse(docker(['network', 'inspect', id]))[0].IPAM?.Config?.map(item => item.Subnet).filter(Boolean) || []);
  let hostRoutes;
  try {
    hostRoutes = readHostIpv4Routes();
  } catch (error) {
    throw new Error(`NETWORK_IPAM_BLOCKED: host route inventory failed (${scrub(error.message)})`);
  }
  const selected = selectInternalBridgeIpam([...dockerCidrs, ...hostRoutes]);
  writeOnce('network-ipam-selection.json', { outcome: 'PASS', selected, dockerNetworkCount: ids.length, inspectedDockerSubnetCount: dockerCidrs.length, inspectedHostRouteCount: hostRoutes.length, overlapChecked: true });
  return selected;
}

function dockerCall(args, evidenceName, throwOnError = true) {
  const result = spawnSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
  writeOnce(evidenceName, {
    command: ['docker', ...args], status: result.status,
    stdout: scrub(result.stdout || ''), stderr: scrub(result.stderr || ''), error: scrub(result.error?.message || ''),
  });
  if (throwOnError && (result.error || result.status !== 0)) {
    const detail = (result.stderr || result.error?.message || '').trim();
    const portConflict = /port is already allocated|address already in use|failed to bind|bind:.*(address|port)/i.test(detail);
    throw new Error(`${portConflict ? 'PORT_BIND_CONFLICT: ' : ''}docker ${args[0]} failed (${result.status}): ${scrub(detail)}`);
  }
  return result;
}

function safeInspect(resource) {
  const endpointMap = resource.NetworkSettings?.Networks || {};
  return {
    id: resource.Id, name: String(resource.Name || '').replace(/^\//, ''), image: resource.Config?.Image,
    labels: resource.Config?.Labels || {},
    state: {
      status: resource.State?.Status, running: resource.State?.Running,
      exitCode: resource.State?.ExitCode, oomKilled: resource.State?.OOMKilled,
      error: scrub(resource.State?.Error), startedAt: resource.State?.StartedAt, finishedAt: resource.State?.FinishedAt,
    },
    hostConfig: { privileged: resource.HostConfig?.Privileged, networkMode: resource.HostConfig?.NetworkMode, binds: resource.HostConfig?.Binds || [], portBindings: resource.HostConfig?.PortBindings || {} },
    networkSettings: {
      ports: resource.NetworkSettings?.Ports || {},
      networks: Object.fromEntries(Object.entries(endpointMap).map(([key, value]) => [key, {
        networkId: value.NetworkID, endpointId: value.EndpointID, ipAddress: value.IPAddress,
        gateway: value.Gateway, macAddress: value.MacAddress,
      }])),
    },
    mounts: resource.Mounts || [],
  };
}

function inspectOwned(item) { return JSON.parse(docker(['inspect', item.id]))[0]; }

function inventorySummary(before, after) {
  const summarize = inventory => Object.fromEntries(Object.entries(inventory).map(([kind, values]) => [kind, {
    count: values.length,
    sha256: createHash('sha256').update([...values].sort((left, right) => left.localeCompare(right, 'en')).join('\n')).digest('hex'),
  }]));
  return {
    before: summarize(before), after: summarize(after),
    countsEqual: Object.keys(before).every(kind => before[kind].length === after[kind].length),
    fingerprintsEqual: Object.keys(before).every(kind => summarize(before)[kind].sha256 === summarize(after)[kind].sha256),
    rawInventoriesExcludedFromGit: true,
  };
}

function capturePreTeardownEvidence() {
  for (const item of record.containers) {
    try { writeOnce(`${item.role}-inspect-before-cleanup.json`, safeInspect(inspectOwned(item))); }
    catch (error) { try { writeTextOnce(`${item.role}-inspect-before-cleanup-error.txt`, scrub(error.message)); } catch {} }
    const logs = spawnSync(DOCKER_CLI_PATH, ['logs', '--timestamps', '--tail', '200', item.id], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
    const logText = `${scrub(logs.stdout || '')}${logs.stderr ? `\n[stderr]\n${scrub(logs.stderr)}` : ''}`;
    try { writeTextOnce(`${item.role}-logs-sanitized.log`, logText); } catch {}
    try { writeOnce(`${item.role}-logs-metadata.json`, { exitCode: logs.status, error: scrub(logs.error?.message || ''), sha256: createHash('sha256').update(logText).digest('hex'), redactionPolicy: 'local paths replaced; credential-like fields redacted' }); } catch {}
    const stats = spawnSync(DOCKER_CLI_PATH, ['stats', '--no-stream', '--format', '{{json .}}', item.id], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
    try { writeOnce(`${item.role}-stats-before-cleanup.json`, { exitCode: stats.status, rows: String(stats.stdout || '').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) }); } catch { try { writeOnce(`${item.role}-stats-before-cleanup.json`, { exitCode: stats.status, output: scrub(stats.stdout || stats.stderr) }); } catch {} }
    if (record.egressIsolationMethod === ROUTE_ISOLATION_METHOD && item.startupLogDirectory) {
      const logDirectory = assertPrivateLogDirectory(item.startupLogDirectory, item.startupLogHome);
      const startup = spawnSync(DOCKER_CLI_PATH, ['exec', item.id, '/bin/sh', '-c', `cat ${logDirectory}/services.log`], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
      const startupLog = scrub(startup.stdout || startup.stderr || '');
      try { writeTextOnce(`${item.role}-service-startup-sanitized.log`, startupLog); } catch {}
      try { writeOnce(`${item.role}-service-startup-metadata.json`, { exitCode: startup.status, error: scrub(startup.error?.message || ''), sha256: createHash('sha256').update(startupLog).digest('hex'), redactionPolicy: 'local paths replaced; credential-like fields redacted' }); } catch {}
    }
  }
  const since = record.startedAtUtc || record.createdAtUtc;
  if (since && record.containers.length) {
    for (const item of record.containers) {
      const events = spawnSync(DOCKER_CLI_PATH, ['events', '--since', since, '--until', new Date().toISOString(), '--filter', `container=${item.id}`, '--format', '{{json .}}'], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
      try { writeOnce(`${item.role}-events-before-cleanup.json`, { exitCode: events.status, events: String(events.stdout || '').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(scrub(line))), error: scrub(events.stderr || '') }); } catch { try { writeOnce(`${item.role}-events-before-cleanup.json`, { exitCode: events.status, output: scrub(events.stdout || events.stderr) }); } catch {} }
    }
  }
}

try {
  saveRecord();
  const samples = [];
  for (let index = 0; index < 3; index += 1) {
    const free = readHostFreeMemoryBytes();
    samples.push({ capturedAtUtc: new Date().toISOString(), freeBytes: free, freeGiB: Number((free / 1024 ** 3).toFixed(3)) });
    if (index < 2) await new Promise(resolvePromise => setTimeout(resolvePromise, 5000));
  }
  writeOnce('memory-preflight.json', { samples, minimumBytes: Math.min(...samples.map(sample => sample.freeBytes)), minimumGiB: Number((Math.min(...samples.map(sample => sample.freeBytes)) / 1024 ** 3).toFixed(3)), requiredBytes: 6 * 1024 ** 3, outcome: Math.min(...samples.map(sample => sample.freeBytes)) >= 6 * 1024 ** 3 ? 'PASS' : 'BLOCKED' });
  if (Math.min(...samples.map(sample => sample.freeBytes)) < 6 * 1024 ** 3) throw new Error('HOST_MEMORY_BLOCKED: diagnostic requires stable 6 GiB host free RAM');
  baseline = snapshotInventory();
  writeOnce('docker-before-private.json', baseline);
  const appImage = JSON.parse(docker(['image', 'inspect', APP_IMAGE_REF]))[0];
  const browserImage = JSON.parse(docker(['image', 'inspect', BROWSER_IMAGE_REF]))[0];
  if (appImage.Os !== 'linux' || appImage.Architecture !== 'amd64' || browserImage.Os !== 'linux' || browserImage.Architecture !== 'amd64') throw new Error('pinned app and browser images must both be linux/amd64');
  record.imageLabels = { app: appImage.Config.Labels || {}, browser: browserImage.Config.Labels || {} };
  writeOnce('image-inspect-sanitized.json', {
    app: { id: appImage.Id, repoDigests: appImage.RepoDigests, os: appImage.Os, architecture: appImage.Architecture, created: appImage.Created, rootFsLayers: appImage.RootFS?.Layers?.length },
    browser: { id: browserImage.Id, repoDigests: browserImage.RepoDigests, os: browserImage.Os, architecture: browserImage.Architecture, created: browserImage.Created },
  });
  const hostEgressControls = {};
  for (const [family, target] of Object.entries(EGRESS_PROBE_TARGETS)) {
    const result = await probeTcpTarget(target.address, target.port, family);
    hostEgressControls[family] = { target: `${target.address}:${target.port}`, probeClass: classifyHostControlProbe(result, family), status: result.status, errorCode: result.error?.code || null, error: scrub(result.error?.message || '') };
  }
  writeOnce('host-egress-control.json', hostEgressControls);
  const appPort = await selectLoopbackPort();
  const probe = await probeLoopbackPort(appPort);
  record.selectedHostPorts = { app: appPort };
  writeOnce('port-precreate-check.json', { bindAddress: '127.0.0.1', app: probe, capturedAtUtc: new Date().toISOString(), reservationHeld: false });
  if (!probe.available) throw new Error('PORT_BIND_CONFLICT: selected app port was unavailable before Docker create');
  writeOnce('host-port-allocation.json', { app: appPort, bindAddress: '127.0.0.1', purpose: 'app-only diagnostic; browser not started', reservationHeld: false });
  saveRecord();
  const networkIpam = selectNetworkIpam();
  const networkCreate = dockerCall(['network', 'create', '--driver', 'bridge', '--ipv6=false', '--subnet', networkIpam.subnet, '--gateway', networkIpam.gateway, '--opt', 'com.docker.network.bridge.enable_ip_masquerade=false', ...labelArgs, names.network], 'network-create.json', false);
  try { recordCreatedResource({ kind: 'network', name: names.network, result: networkCreate, record, onRecord: saveRecord }); }
  finally { if (record.network) dockerChanged = true; }
  const network = JSON.parse(docker(['network', 'inspect', record.network.id]))[0];
  assertNetworkPolicy(network, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY);
  const actualIpam = assertRecordedNetworkIpam(network, networkIpam);
  record.network.subnet = actualIpam.Subnet;
  record.network.gateway = actualIpam.Gateway;
  saveRecord();
  writeOnce('network-policy-verification.json', { outcome: 'PASS', policy: ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY, egressIsolationMethod: ROUTE_ISOLATION_METHOD, driver: network.Driver, internal: network.Internal, ipv6Enabled: network.EnableIPv6, ipMasquerade: network.Options?.['com.docker.network.bridge.enable_ip_masquerade'], subnet: actualIpam.Subnet, gateway: actualIpam.Gateway });
  const appCreate = dockerCall(['create', '--name', names.app, '--network', names.network, '--publish', `127.0.0.1:${appPort}:80`, '--memory', '1280m', '--cpus', '1.5', '--pids-limit', '256', '--restart', 'no', ...labelArgs, '--entrypoint', '/bin/sh', APP_IMAGE_REF, '-c', 'sleep infinity'], 'app-create.json', false);
  try { recordCreatedResource({ kind: 'container', role: 'app', name: names.app, imageRef: APP_IMAGE_REF, result: appCreate, record, onRecord: saveRecord }); }
  finally { if (record.containers.length) dockerChanged = true; }
  const routeRequest = routeIsolationApprovalRequest(record.containers[0].id, 'app', runId);
  writeOnce('app-route-isolation-authorization-request.json', routeRequest);
  requestRouteIsolationApproval(routeRequest); // Fail closed before starting the attached container.
  if (Object.values(hostEgressControls).some(control => control.probeClass !== 'HOST_CONTROL_REACHABLE')) throw new Error(`HOST_EGRESS_CONTROL_INCONCLUSIVE: IPv4/IPv6 controls must both be reachable; ${JSON.stringify(hostEgressControls)}`);
  record.createdAtUtc = new Date().toISOString();
  saveRecord();
  dockerCall(['start', record.containers[0].id], 'app-start.json');
  record.startedAtUtc = new Date().toISOString();
  saveRecord();
  const app = inspectOwned(record.containers[0]);
  assertOwnedContainer(app, { ...record.containers[0], labels, imageLabels: record.imageLabels.app });
  assertRouteIsolationContainer(app, names.network);
  const appSafe = safeInspect(app);
  assertPublishedLoopbackPort(app, '80/tcp', appPort);
  assertContainerPortNotPublished(app, '3306/tcp');
  assertContainerNetworkGateway(app, names.network, record.network.gateway, record.network.id);
  const dockerPortOutput = docker(['port', record.containers[0].id, '80/tcp']);
  assertDockerPortOutput(dockerPortOutput, '127.0.0.1', appPort);
  writeOnce('docker-port-verification.json', { outcome: 'PASS', containerId: record.containers[0].id, output: dockerPortOutput });
  writeOnce('host-port-verification.json', { outcome: 'PASS', requestedHostPort: appPort, hostConfig: appSafe.hostConfig.portBindings['80/tcp'], networkSettings: appSafe.networkSettings.ports['80/tcp'], dockerPort: dockerPortOutput, mysql3306Published: false, reservationHeld: false });
  writeOnce('app-inspect-after-start.json', appSafe);
  const routeRemoval = dockerCall(routeIsolationExecArgs(record.containers[0].id, undefined, runId), 'app-route-isolation.json');
  const routeOutput = docker(['exec', record.containers[0].id, '/bin/sh', '-c', 'set -e; ip route show default; ip -6 route show default']);
  assertNoDefaultRoutes(routeOutput);
  writeOnce('app-route-verification.json', { outcome: 'PASS', method: ROUTE_ISOLATION_METHOD, routeRemovalExitCode: routeRemoval.status, ipv4AndIpv6DefaultRoutesAbsent: true, routeTableOutput: scrub(routeOutput) });
  for (const family of Object.keys(EGRESS_PROBE_TARGETS)) {
    const target = EGRESS_PROBE_TARGETS[family];
    const probe = spawnSync(DOCKER_CLI_PATH, buildEgressProbeArgs(record.containers[0].id, family), { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true, timeout: 8000 });
    const probeOutcome = classifyEgressProbe({ ...probe, source: 'process' });
    writeOnce(`app-egress-policy-${family}.json`, { family, target: `${target.address}:${target.port}`, outcome: probeOutcome, exitCode: probe.status, stdout: scrub(probe.stdout || ''), stderr: scrub(probe.stderr || ''), error: scrub(probe.error?.message || '') });
    if (probeOutcome !== 'NETWORK_UNREACHABLE') throw new Error(probeOutcome === 'EGRESS_REACHABLE' ? `EGRESS_POLICY_VIOLATION: container reached external ${family} target` : `EGRESS_POLICY_UNVERIFIED: ${probeOutcome}`);
  }
  const appLogDirectory = createPrivateStartupLogDirectory(record.containers[0]);
  dockerCall(['exec', '--detach', '--user', '0', record.containers[0].id, '/bin/sh', '-c', `./run-services-docker.sh bash > ${appLogDirectory}/services.log 2>&1`], 'app-services-start.json');
  const deadline = Date.now() + 180000;
  let http = { outcome: 'BLOCKED', reason: 'readiness timeout' };
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}/claroline11110/claroline/index.php`, { signal: AbortSignal.timeout(3000) });
      const body = await response.text();
      if (response.ok) { http = { outcome: 'PASS', status: response.status, bodyBytes: Buffer.byteLength(body) }; break; }
      http = { outcome: 'BLOCKED', status: response.status };
    } catch (error) { http = { outcome: 'BLOCKED', lastError: scrub(error.message) }; }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 2000));
  }
  writeOnce('http-readiness.json', http);
  if (http.outcome !== 'PASS') throw new Error(`HTTP_READINESS_BLOCKED: ${http.reason || http.lastError || http.status}`);
  const processCheck = spawnSync(DOCKER_CLI_PATH, ['exec', record.containers[0].id, 'bash', '-lc', 'pgrep -a apache2; pgrep -a mysqld'], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
  writeOnce('service-processes.json', { exitCode: processCheck.status, output: scrub(processCheck.stdout || ''), error: scrub(processCheck.stderr || '') });
  if (processCheck.status !== 0 || !/mysqld/i.test(processCheck.stdout || '')) throw new Error('MYSQL_READINESS_BLOCKED: mysqld process not verified');
  const database = spawnSync(DOCKER_CLI_PATH, ['exec', record.containers[0].id, 'mysql', '-NBe', 'SHOW DATABASES'], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
  const databases = String(database.stdout || '').trim().split(/\r?\n/).filter(Boolean);
  writeOnce('database-readiness.json', { exitCode: database.status, databaseNames: databases, expectedDatabasePresent: databases.some(name => name.toLowerCase() === 'claroline') });
  if (database.status !== 0 || !databases.some(name => name.toLowerCase() === 'claroline')) throw new Error('MYSQL_READINESS_BLOCKED: Claroline database not verified');
  outcome = 'PASS';
  reason = 'app-only diagnostic verified route isolation, exact loopback port, HTTP and MySQL readiness; no Selenium or Maven test was run';
} catch (error) {
  outcome = error?.code === 'BLOCKED_APPROVAL_REQUIRED' ? 'BLOCKED_APPROVAL_REQUIRED' : 'BLOCKED';
  reason = scrub(error?.message || String(error));
  try { writeTextOnce('run-failure.txt', `${error?.name || 'Error'}: ${reason}`); } catch {}
} finally {
  if (record.containers.length) capturePreTeardownEvidence();
  if (baseline && (record.network || record.containers.length)) {
    const cleanup = runCleanupWithExitCode({ record, baseline });
    try { writeOnce('cleanup-result.json', cleanup.outcome === 'PASS' ? cleanup.result : { outcome: 'BLOCKED', reason: scrub(cleanup.reason) }); } catch {}
    if (cleanup.outcome !== 'PASS') { outcome = 'BLOCKED'; reason = `cleanup BLOCKED: ${scrub(cleanup.reason)}`; }
  }
  if (baseline) {
    try {
      const after = snapshotInventory();
      writeOnce('docker-after-private.json', after);
      writeOnce('docker-inventory-sanitized-summary.json', inventorySummary(baseline, after));
    } catch (error) {
      outcome = 'BLOCKED'; reason = `post-cleanup inventory BLOCKED: ${scrub(error.message)}`;
      try { writeTextOnce('docker-after-blocked.txt', reason); } catch {}
    }
  }
  try { writeOnce('diagnostic-result.json', { runId, outcome, reason, businessTest: 'NOT_RUN', selenium: 'NOT_RUN', dbReset: 'NOT_RUN', dockerResourcesChanged: dockerChanged, cleanup: 'see cleanup-result.json' }); } catch {}
}

if (outcome !== 'PASS') process.exitCode = 1;
console.log(JSON.stringify({ runId, outcome, reason, evidenceDir }));
