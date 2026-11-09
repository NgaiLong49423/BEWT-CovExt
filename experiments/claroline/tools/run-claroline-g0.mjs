import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_IMAGE_REF, APP_TEST_CLASS, BROWSER_IMAGE_REF, SOURCE_COMMIT, assertOwnedContainer, assertPrivateLogDirectory, assertRouteIsolationContainer, assertNetworkPolicy, assertRecordedNetworkIpam, assertContainerNetworkGateway, assertNoDefaultRoutes, routeIsolationExecArgs, routeIsolationApprovalRequest, requestRouteIsolationApproval, EGRESS_PROBE_TARGETS, buildEgressProbeArgs, probeTcpTarget, classifyHostControlProbe, assertDockerPortOutput, classifyEgressProbe, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY, ROUTE_ISOLATION_METHOD, selectInternalBridgeIpam, createEvidenceDirectory, labelsForRun, namesForRun, parseSurefireXml, recordCreatedResource, sanitizeSurefireXml, snapshotInventory, selectLoopbackPort, probeLoopbackPort, assertPublishedLoopbackPort, assertContainerPortNotPublished, validateRunId } from './claroline-g0.mjs';
import { DOCKER_CLI_PATH, DOCKER_ENV, invokeMaven, readHostFreeMemoryBytes, readHostIpv4Routes } from './child-process-policy.mjs';
import { runCleanupWithExitCode } from './cleanup-claroline-g0.mjs';

const runnerDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(runnerDir, '../../..');
const repo = root;
const suite = resolve(runnerDir, '../bewt-suite');
const suitePom = resolve(suite, 'pom.xml');
if (!statSync(suitePom).isFile()) throw new Error(`Claroline benchmark POM not found: ${suitePom}`);
const docker = args => execFileSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const digest = ref => ref.slice(ref.indexOf('@') + 1);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const sanitizeEvidenceText = text => String(text || '').replace(/\bn0tl[\w-]+\b/gi, '<TEST_FIXTURE_SECRET>').replace(/[A-Z]:[\\/][^\r\n"'<>\s]*/gi, '<LOCAL_PATH>').replace(/\/home\/[a-zA-Z0-9._-]+\/[^\r\n"'<>\s]*/g, '<LOCAL_PATH>').replaceAll(repo, '<REPOSITORY_ROOT>').replaceAll(repo.replaceAll('\\', '/'), '<REPOSITORY_ROOT>');
const writeOnce = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
const runId = validateRunId(process.argv[2] || '');
const evidenceDir = createEvidenceDirectory(resolve(repo, 'docs/tasks/T03-B2/evidence'), runId); // Existing run IDs fail closed.
const names = namesForRun(runId);
const labels = labelsForRun(runId);
const labelArgs = Object.entries(labels).flatMap(([key, value]) => ['--label', `${key}=${value}`]);
const record = { runId, benchmarkRepositoryCommit: SOURCE_COMMIT, applicationSourceCommit: null, imageDigest: digest(APP_IMAGE_REF), browserImageDigest: digest(BROWSER_IMAGE_REF), imageLabels: {}, networkPolicy: ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY, egressIsolationMethod: ROUTE_ISOLATION_METHOD, containers: [], network: null };
let exitCode = 1;

function dockerCall(args, evidenceName, throwOnError = true) {
  const result = spawnSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
  if (evidenceName) writeFileSync(resolve(evidenceDir, evidenceName), JSON.stringify({ command: ['docker', ...args], status: result.status, stdout: result.stdout || '', stderr: result.stderr || '', error: result.error?.message || null }, null, 2) + '\n', { flag: 'wx' });
  if (throwOnError && (result.error || result.status !== 0)) {
    const detail = (result.stderr || result.error?.message || '').trim();
    const prefix = /port is already allocated|address already in use|failed to bind|bind:.*(address|port)/i.test(detail) ? 'PORT_BIND_CONFLICT: ' : '';
    throw new Error(`${prefix}docker ${args[0]} failed (${result.status}): ${detail}`);
  }
  return result;
}

function createPrivateStartupLogDirectory(container, role) {
  const result = dockerCall(['exec', container.id, '/bin/sh', '-c', 'set -eu; test -d "$HOME"; test ! -L "$HOME"; umask 077; printf "%s\\n" "$HOME"; mktemp -d "$HOME/.t03b2-logs.XXXXXXXX"'], `${role}-service-log-directory.json`);
  const [homeDirectory, logDirectory] = String(result.stdout || '').trim().split(/\r?\n/);
  container.startupLogHome = homeDirectory;
  container.startupLogDirectory = assertPrivateLogDirectory(logDirectory, homeDirectory);
  writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`);
  return container.startupLogDirectory;
}

function selectNetworkIpam() {
  const ids = docker(['network', 'ls', '-q']).split(/\r?\n/).filter(Boolean);
  const dockerCidrs = ids.flatMap(id => JSON.parse(docker(['network', 'inspect', id]))[0].IPAM?.Config?.map(item => item.Subnet).filter(Boolean) || []);
  let hostRoutes;
  try {
    hostRoutes = readHostIpv4Routes();
  } catch (error) {
    throw new Error(`NETWORK_IPAM_BLOCKED: host route inventory failed (${ sanitizeEvidenceText(error.message) })`);
  }
  const selected = selectInternalBridgeIpam([...dockerCidrs, ...hostRoutes]);
  writeOnce(resolve(evidenceDir, 'network-ipam-selection.json'), { outcome: 'PASS', selected, dockerNetworkCount: ids.length, inspectedDockerSubnetCount: dockerCidrs.length, inspectedHostRouteCount: hostRoutes.length, overlapChecked: true });
  return selected;
}

try {
  writeOnce(resolve(evidenceDir, 'run-record.json'), record);
  const memorySamples = [];
  for (let index = 0; index < 3; index += 1) {
    const freeBytes = readHostFreeMemoryBytes();
    memorySamples.push({ capturedAtUtc: new Date().toISOString(), freeBytes, freeGiB: Number((freeBytes / 1024 ** 3).toFixed(3)) });
    if (index < 2) await new Promise(resolvePromise => setTimeout(resolvePromise, 5000));
  }
  const minimumFreeBytes = Math.min(...memorySamples.map(sample => sample.freeBytes));
  writeOnce(resolve(evidenceDir, 'memory-preflight.json'), { samples: memorySamples, minimumFreeBytes, minimumFreeGiB: Number((minimumFreeBytes / 1024 ** 3).toFixed(3)), requiredBytes: 6 * 1024 ** 3, outcome: minimumFreeBytes >= 6 * 1024 ** 3 ? 'PASS' : 'BLOCKED' });
  if (minimumFreeBytes < 6 * 1024 ** 3) throw new Error('HOST_MEMORY_BLOCKED: G0 requires stable 6 GiB host free RAM');
  const before = snapshotInventory();
  writeOnce(resolve(evidenceDir, 'docker-before.json'), before);
  const appInspect = JSON.parse(docker(['image', 'inspect', APP_IMAGE_REF]))[0];
  const browserInspect = JSON.parse(docker(['image', 'inspect', BROWSER_IMAGE_REF]))[0];
  if (appInspect.Os !== 'linux' || appInspect.Architecture !== 'amd64' || browserInspect.Os !== 'linux' || browserInspect.Architecture !== 'amd64') throw new Error('pinned images must both be linux/amd64');
  record.imageLabels = { app: appInspect.Config.Labels || {}, browser: browserInspect.Config.Labels || {} };
  let appPort = await selectLoopbackPort();
  let browserPort = await selectLoopbackPort();
  while (browserPort === appPort) browserPort = await selectLoopbackPort();
  record.selectedHostPorts = { app: appPort, browser: browserPort };
  writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`);
  writeOnce(resolve(evidenceDir, 'host-port-allocation.json'), { app: appPort, browser: browserPort, bindAddress: '127.0.0.1', allocation: 'host ephemeral loopback ports selected before Docker create', reservationHeld: false });
  const portProbes = { app: await probeLoopbackPort(appPort), browser: await probeLoopbackPort(browserPort), capturedAtUtc: new Date().toISOString(), reservationHeld: false };
  writeOnce(resolve(evidenceDir, 'port-precreate-check.json'), portProbes);
  if (!portProbes.app.available || !portProbes.browser.available || appPort === browserPort) throw new Error('PORT_BIND_CONFLICT: selected loopback ports are unavailable or not distinct before Docker create');
  const safeConfig = config => ({ Entrypoint: config.Entrypoint, Cmd: config.Cmd, WorkingDir: config.WorkingDir, User: config.User, Labels: config.Labels, ExposedPorts: config.ExposedPorts });
  writeOnce(resolve(evidenceDir, 'image-inspect.json'), { app: { Id: appInspect.Id, RepoDigests: appInspect.RepoDigests, Os: appInspect.Os, Architecture: appInspect.Architecture, Created: appInspect.Created, Config: safeConfig(appInspect.Config), RootFS: appInspect.RootFS }, browser: { Id: browserInspect.Id, RepoDigests: browserInspect.RepoDigests, Os: browserInspect.Os, Architecture: browserInspect.Architecture, Created: browserInspect.Created } });
  const hostEgressControls = {};
  for (const [family, target] of Object.entries(EGRESS_PROBE_TARGETS)) {
    const result = await probeTcpTarget(target.address, target.port, family);
    hostEgressControls[family] = { target: `${target.address}:${target.port}`, probeClass: classifyHostControlProbe(result, family), status: result.status, errorCode: result.error?.code || null, error: result.error?.message || '' };
  }
  writeOnce(resolve(evidenceDir, 'host-egress-control.json'), hostEgressControls);
  const networkIpam = selectNetworkIpam();
  const networkCreate = dockerCall(['network', 'create', '--driver', 'bridge', '--ipv6=false', '--subnet', networkIpam.subnet, '--gateway', networkIpam.gateway, '--opt', 'com.docker.network.bridge.enable_ip_masquerade=false', ...labelArgs, names.network], 'network-create.json', false);
  recordCreatedResource({ kind: 'network', name: names.network, result: networkCreate, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const networkInfo = JSON.parse(docker(['network', 'inspect', record.network.id]))[0];
  assertNetworkPolicy(networkInfo, ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY);
  const actualIpam = assertRecordedNetworkIpam(networkInfo, networkIpam);
  record.network.subnet = actualIpam.Subnet;
  record.network.gateway = actualIpam.Gateway;
  writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`);
  writeOnce(resolve(evidenceDir, 'network-policy-verification.json'), { outcome: 'PASS', policy: ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY, egressIsolationMethod: ROUTE_ISOLATION_METHOD, driver: networkInfo.Driver, internal: networkInfo.Internal, ipv6Enabled: networkInfo.EnableIPv6, ipMasquerade: networkInfo.Options?.['com.docker.network.bridge.enable_ip_masquerade'], subnet: actualIpam.Subnet, gateway: actualIpam.Gateway });
  const appCreated = dockerCall(['create', '--name', names.app, '--network', names.network, '--publish', '127.0.0.1:' + appPort + ':80', '--memory', '1280m', '--cpus', '1.5', '--pids-limit', '256', '--restart', 'no', ...labelArgs, '--entrypoint', '/bin/sh', APP_IMAGE_REF, '-c', 'sleep infinity'], 'app-create.json', false);
  recordCreatedResource({ kind: 'container', role: 'app', name: names.app, imageRef: APP_IMAGE_REF, result: appCreated, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const browserCreated = dockerCall(['create', '--name', names.browser, '--network', names.network, '--publish', '127.0.0.1:' + browserPort + ':4444', '--memory', '2304m', '--cpus', '2', '--pids-limit', '512', '--shm-size', '1g', '--restart', 'no', ...labelArgs, '--entrypoint', '/bin/sh', BROWSER_IMAGE_REF, '-c', 'sleep infinity'], 'selenium-create.json', false);
  recordCreatedResource({ kind: 'container', role: 'browser', name: names.browser, imageRef: BROWSER_IMAGE_REF, result: browserCreated, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const appRecord = record.containers.find(item => item.role === 'app');
  const browserRecord = record.containers.find(item => item.role === 'browser');
  if (!appRecord || !browserRecord) throw new Error('RUN_RECORD_INCOMPLETE: expected recorded app and browser container IDs');
  const routeRequests = {
    app: routeIsolationApprovalRequest(appRecord.id, 'app', runId),
    browser: routeIsolationApprovalRequest(browserRecord.id, 'browser', runId),
  };
  writeOnce(resolve(evidenceDir, 'app-route-isolation-authorization-request.json'), routeRequests.app);
  writeOnce(resolve(evidenceDir, 'browser-route-isolation-authorization-request.json'), routeRequests.browser);
  requestRouteIsolationApproval(routeRequests.app); // Fail closed before either attached container starts.
  requestRouteIsolationApproval(routeRequests.browser);
  if (Object.values(hostEgressControls).some(control => control.probeClass !== 'HOST_CONTROL_REACHABLE')) throw new Error(`HOST_EGRESS_CONTROL_INCONCLUSIVE: IPv4/IPv6 controls must both be reachable; ${JSON.stringify(hostEgressControls)}`);
  dockerCall(['start', appRecord.id], 'app-start.json');
  dockerCall(['start', browserRecord.id], 'selenium-start.json');
  const appInfo = JSON.parse(docker(['inspect', appRecord.id]))[0];
  const browserInfo = JSON.parse(docker(['inspect', browserRecord.id]))[0];
  assertOwnedContainer(appInfo, { ...appRecord, labels, imageLabels: record.imageLabels.app });
  assertOwnedContainer(browserInfo, { ...browserRecord, labels, imageLabels: record.imageLabels.browser });
  assertRouteIsolationContainer(appInfo, names.network);
  assertRouteIsolationContainer(browserInfo, names.network);
  assertPublishedLoopbackPort(appInfo, '80/tcp', appPort);
  assertPublishedLoopbackPort(browserInfo, '4444/tcp', browserPort);
  assertContainerPortNotPublished(appInfo, '3306/tcp');
  assertContainerNetworkGateway(appInfo, names.network, record.network.gateway, record.network.id);
  assertContainerNetworkGateway(browserInfo, names.network, record.network.gateway, record.network.id);
  const dockerPortOutputs = { app: docker(['port', appRecord.id, '80/tcp']), browser: docker(['port', browserRecord.id, '4444/tcp']) };
  assertDockerPortOutput(dockerPortOutputs.app, '127.0.0.1', appPort);
  assertDockerPortOutput(dockerPortOutputs.browser, '127.0.0.1', browserPort);
  writeOnce(resolve(evidenceDir, 'docker-port-verification.json'), { outcome: 'PASS', app: { containerId: appRecord.id, output: dockerPortOutputs.app }, browser: { containerId: browserRecord.id, output: dockerPortOutputs.browser } });
  for (const [role, container] of [['app', appRecord], ['browser', browserRecord]]) {
    const routeRemoval = dockerCall(routeIsolationExecArgs(container.id, undefined, runId), `${role}-route-isolation.json`);
    const routeOutput = docker(['exec', container.id, '/bin/sh', '-c', 'set -e; ip route show default; ip -6 route show default']);
    assertNoDefaultRoutes(routeOutput);
    writeOnce(resolve(evidenceDir, `${role}-route-verification.json`), { outcome: 'PASS', method: ROUTE_ISOLATION_METHOD, routeRemovalExitCode: routeRemoval.status, ipv4AndIpv6DefaultRoutesAbsent: true, routeTableOutput: routeOutput });
  }
  for (const [role, container] of [['app', appRecord], ['browser', browserRecord]]) {
    for (const family of Object.keys(EGRESS_PROBE_TARGETS)) {
      const target = EGRESS_PROBE_TARGETS[family];
      const probe = spawnSync(DOCKER_CLI_PATH, buildEgressProbeArgs(container.id, family), { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true, timeout: 8000 });
      const probeOutcome = classifyEgressProbe({ ...probe, source: 'process' });
      writeOnce(resolve(evidenceDir, `${role}-egress-policy-${family}.json`), { family, target: `${target.address}:${target.port}`, outcome: probeOutcome, exitCode: probe.status, stdout: probe.stdout || '', stderr: probe.stderr || '', error: probe.error?.message || '' });
      if (probeOutcome !== 'NETWORK_UNREACHABLE') throw new Error(probeOutcome === 'EGRESS_REACHABLE' ? `EGRESS_POLICY_VIOLATION: ${role} container reached external ${family} target` : `EGRESS_POLICY_UNVERIFIED: ${role} ${family} probe ${probeOutcome}`);
    }
  }
  writeOnce(resolve(evidenceDir, 'host-port-verification.json'), {
    outcome: 'PASS', bindAddress: '127.0.0.1', app: { requestedHostPort: appPort, hostConfig: appInfo.HostConfig.PortBindings['80/tcp'], networkSettings: appInfo.NetworkSettings.Ports['80/tcp'] },
    browser: { requestedHostPort: browserPort, hostConfig: browserInfo.HostConfig.PortBindings['4444/tcp'], networkSettings: browserInfo.NetworkSettings.Ports['4444/tcp'], dockerPort: dockerPortOutputs.browser },
    dockerPort: dockerPortOutputs.app, mysql3306Published: false, reservationHeld: false,
  });
  writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify({ ...record, appPort, browserPort }, null, 2)}\n`);
  const appLogDirectory = createPrivateStartupLogDirectory(appRecord, 'app');
  const browserLogDirectory = createPrivateStartupLogDirectory(browserRecord, 'selenium');
  dockerCall(['exec', '--detach', '--user', '0', appRecord.id, '/bin/sh', '-c', `./run-services-docker.sh bash > ${appLogDirectory}/services.log 2>&1`], 'app-services-start.json');
  dockerCall(['exec', '--detach', '--user', '1200', browserRecord.id, '/bin/sh', '-c', `/opt/bin/entry_point.sh > ${browserLogDirectory}/services.log 2>&1`], 'selenium-services-start.json');
  const waitHttp = async (url, label, validate = () => true) => {
    const deadline = Date.now() + 180000;
    let last = '';
    while (Date.now() < deadline) {
      try { const response = await fetch(url, { signal: AbortSignal.timeout(3000) }); const body = await response.text(); if (response.ok && validate(body)) return { outcome: 'PASS', status: response.status }; last = `HTTP ${response.status}; readiness payload not ready`; }
      catch (error) { last = error.message; }
      await new Promise(resolvePromise => setTimeout(resolvePromise, 2000));
    }
    throw new Error(`${label} readiness timeout: ${last}`);
  };
  const hostAppUrl = `http://127.0.0.1:${appPort}/claroline11110/claroline/index.php`;
  // The URL is consumed inside the Selenium browser container; localhost there is not the Docker host.
  const appUrl = `http://${names.app}/claroline11110/claroline/index.php`;
  const seleniumUrl = `http://127.0.0.1:${browserPort}/status`;
  const readiness = { app: await waitHttp(hostAppUrl, 'Claroline'), selenium: await waitHttp(seleniumUrl, 'Selenium', body => { try { return JSON.parse(body)?.value?.ready === true; } catch { return false; } }), appUrlFromBrowserNetwork: appUrl };
  writeOnce(resolve(evidenceDir, 'http-readiness.json'), readiness);
  const appProcs = docker(['exec', names.app, 'bash', '-lc', 'pgrep -a apache2; pgrep -a mysqld']);
  writeFileSync(resolve(evidenceDir, 'service-processes.txt'), appProcs.replaceAll('D:\\Github-Projects\\BEWT-CovExt-worktrees\\t03b2-claroline-g0', '<WORKTREE>'), { flag: 'wx' });
  const dbList = docker(['exec', names.app, 'mysql', '-NBe', 'SHOW DATABASES']);
  writeFileSync(resolve(evidenceDir, 'database-list.txt'), `${dbList}\n`, { flag: 'wx' });
  if (!dbList.toLowerCase().includes('claroline')) throw new Error('database readiness BLOCKED: expected Claroline database was not observed');
  const dbTables = docker(['exec', names.app, 'mysql', '-NBe', 'SHOW TABLES IN claroline']);
  const table = dbTables.split(/\r?\n/).map(value => value.trim()).find(value => /^(cl_)?user$/i.test(value));
  if (!table) throw new Error('database readiness BLOCKED: Claroline user table not found');
  const userQuery = "SELECT COUNT(*) FROM claroline.`" + table + "` WHERE username='user001'";
  const readUserCount = () => Number(docker(['exec', names.app, 'mysql', '-NBe', userQuery]));
  const beforeUserCount = readUserCount();
  writeOnce(resolve(evidenceDir, 'database-before.json'), { schemaObserved: 'claroline', userTable: table, fixtureUsername: 'user001', matchingRows: beforeUserCount });
  if (beforeUserCount !== 0) throw new Error('FIXTURE_FAILURE: user001 already exists before the smoke test');
  const mavenStartedAt = Date.now();
  const mavenArgs = ['-B', '-Dtest=' + APP_TEST_CLASS, `-Dapp.url=${appUrl}`, `-Dwebdriver.remote.url=http://127.0.0.1:${browserPort}/wd/hub`, 'clean', 'test'];
  const maven = invokeMaven(mavenArgs, { cwd: suite });
  const sanitize = sanitizeEvidenceText;
  writeFileSync(resolve(evidenceDir, 'maven.stdout.log'), sanitize(maven.stdout), { flag: 'wx' });
  writeFileSync(resolve(evidenceDir, 'maven.stderr.log'), sanitize(maven.stderr), { flag: 'wx' });
  writeOnce(resolve(evidenceDir, 'maven-exit.json'), { command: 'mvn -B -Dtest=test.Claroline_AddUserTest -Dapp.url=<loopback-dynamic> -Dwebdriver.remote.url=<loopback-dynamic>/wd/hub test', exitCode: maven.status, signal: maven.signal, stdoutSha256: sha256(sanitize(maven.stdout || '')), stderrSha256: sha256(sanitize(maven.stderr || '')) });
  const xmlPath = resolve(suite, 'target/surefire-reports/TEST-test.Claroline_AddUserTest.xml');
  let junit;
  try { if (statSync(xmlPath).mtimeMs < mavenStartedAt) throw new Error('Surefire XML predates this Maven invocation'); const raw = readFileSync(xmlPath, 'utf8'); const safe = sanitize(sanitizeSurefireXml(raw, [repo, root])); writeFileSync(resolve(evidenceDir, 'TEST-test.Claroline_AddUserTest.xml'), safe, { flag: 'wx' }); junit = parseSurefireXml(safe, APP_TEST_CLASS); writeOnce(resolve(evidenceDir, 'surefire-hash.json'), { originalXmlSha256: sha256(raw), sanitizedXmlSha256: sha256(safe) }); }
  catch (error) { junit = { outcome: 'BLOCKED', reason: `Surefire XML unavailable: ${error.message}` }; }
  writeOnce(resolve(evidenceDir, 'junit-result.json'), junit);
  const afterUserCount = readUserCount();
  writeOnce(resolve(evidenceDir, 'database-after.json'), { schemaObserved: 'claroline', userTable: table, fixtureUsername: 'user001', matchingRows: afterUserCount });
  if (maven.status !== 0 || junit.outcome !== 'PASS') throw new Error(`G0 FAIL: Maven=${maven.status}, JUnit=${junit.outcome}`);
  if (afterUserCount !== 1) throw new Error(`APPLICATION_FAILURE: expected exactly one created user001 row; saw ${afterUserCount}`);
  exitCode = 0;
} catch (error) {
  writeFileSync(resolve(evidenceDir, 'run-failure.txt'), `${error.name}: ${error.message}\n`, { flag: 'wx' });
} finally {
  if (record.egressIsolationMethod === ROUTE_ISOLATION_METHOD) {
    for (const item of record.containers) {
      if (!item.startupLogDirectory || !item.startupLogHome) continue;
      const logDirectory = assertPrivateLogDirectory(item.startupLogDirectory, item.startupLogHome);
      const result = spawnSync(DOCKER_CLI_PATH, ['exec', item.id, '/bin/sh', '-c', `cat ${logDirectory}/services.log`], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
      const output = sanitizeEvidenceText(result.stdout || result.stderr || '');
      try { writeFileSync(resolve(evidenceDir, `${item.role}-service-startup-sanitized.log`), output, { flag: 'wx' }); } catch {}
      try { writeOnce(resolve(evidenceDir, `${item.role}-service-startup-metadata.json`), { exitCode: result.status, error: sanitizeEvidenceText(result.error?.message || ''), sha256: sha256(output), redactionPolicy: 'local paths and fixture credentials sanitized' }); } catch {}
    }
  }
  try {
    const baseline = readFileSync(resolve(evidenceDir, 'docker-before.json'), 'utf8');
    const result = runCleanupWithExitCode({ record, baseline: JSON.parse(baseline) });
    writeOnce(resolve(evidenceDir, 'cleanup-result.json'), result);
    if (result.outcome !== 'PASS') exitCode = 1;
  } catch (error) {
    try { writeFileSync(resolve(evidenceDir, 'cleanup-blocked.txt'), `${error.name}: ${error.message}\n`, { flag: 'wx' }); } catch {}
    exitCode = 1;
  }
  try {
    const after = snapshotInventory();
    writeOnce(resolve(evidenceDir, 'docker-after.json'), after);
    const beforeRaw = JSON.parse(readFileSync(resolve(evidenceDir, 'docker-before.json'), 'utf8'));
    const summarize = inv => Object.fromEntries(Object.entries(inv).map(([k, v]) => [k, { count: v.length, sha256: sha256([...v].sort((a, b) => a.localeCompare(b, 'en')).join('\n')) }]));
    writeOnce(resolve(evidenceDir, 'docker-inventory-sanitized-summary.json'), {
      before: summarize(beforeRaw),
      after: summarize(after),
      countsEqual: Object.keys(beforeRaw).every(k => beforeRaw[k].length === after[k].length),
      fingerprintsEqual: Object.keys(beforeRaw).every(k => summarize(beforeRaw)[k].sha256 === summarize(after)[k].sha256),
      rawInventoriesExcludedFromGit: true,
    });
  } catch (error) { try { writeFileSync(resolve(evidenceDir, 'docker-after-blocked.txt'), `${error.message}\n`, { flag: 'wx' }); } catch {} exitCode = 1; }
}
process.exitCode = exitCode;
