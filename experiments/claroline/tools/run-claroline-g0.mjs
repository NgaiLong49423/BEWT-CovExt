import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_IMAGE_REF, APP_TEST_CLASS, BROWSER_IMAGE_REF, SOURCE_COMMIT, assertNetworkPolicy, classifyEgressProbe, EGRESS_LIMITED_NETWORK_POLICY, createEvidenceDirectory, labelsForRun, namesForRun, parseSurefireXml, recordCreatedResource, sanitizeSurefireXml, snapshotInventory, selectLoopbackPort, probeLoopbackPort, assertPublishedLoopbackPort, assertContainerPortNotPublished, validateRunId } from './claroline-g0.mjs';
import { DOCKER_CLI_PATH, DOCKER_ENV, MAVEN_CLI_PATH, MAVEN_ENV, POWERSHELL_PATH } from './child-process-policy.mjs';
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
const writeOnce = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
const runId = validateRunId(process.argv[2] || '');
const evidenceDir = createEvidenceDirectory(resolve(repo, 'docs/tasks/T03-B2/evidence'), runId); // Existing run IDs fail closed.
const names = namesForRun(runId);
const labels = labelsForRun(runId);
const labelArgs = Object.entries(labels).flatMap(([key, value]) => ['--label', `${key}=${value}`]);
const record = { runId, benchmarkRepositoryCommit: SOURCE_COMMIT, applicationSourceCommit: null, imageDigest: digest(APP_IMAGE_REF), browserImageDigest: digest(BROWSER_IMAGE_REF), imageLabels: {}, networkPolicy: EGRESS_LIMITED_NETWORK_POLICY, containers: [], network: null };
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

try {
  writeOnce(resolve(evidenceDir, 'run-record.json'), record);
  const memorySamples = [];
  for (let index = 0; index < 3; index += 1) {
    const freeBytes = Number(execFileSync(POWERSHELL_PATH, ['-NoProfile', '-NonInteractive', '-Command', '(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory'], { encoding: 'utf8', env: DOCKER_ENV }).trim()) * 1024;
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
  const hostEgressControl = spawnSync(POWERSHELL_PATH, ['-NoProfile', '-NonInteractive', '-Command', '$ErrorActionPreference="SilentlyContinue"; if (Test-NetConnection -ComputerName 1.1.1.1 -Port 443 -InformationLevel Quiet) { exit 0 } else { exit 1 }'], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true, timeout: 10000 });
  writeOnce(resolve(evidenceDir, 'host-egress-control.json'), { target: '1.1.1.1:443', exitCode: hostEgressControl.status, outcome: hostEgressControl.status === 0 ? 'PASS' : 'BLOCKED', error: hostEgressControl.error?.message || '' });
  if (hostEgressControl.status !== 0) throw new Error('EGRESS_CONTROL_BLOCKED: host could not reach the external TCP control target');
  const networkCreate = dockerCall(['network', 'create', '--driver', 'bridge', '--opt', 'com.docker.network.bridge.enable_ip_masquerade=false', ...labelArgs, names.network], 'network-create.json', false);
  recordCreatedResource({ kind: 'network', name: names.network, result: networkCreate, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const networkInfo = JSON.parse(docker(['network', 'inspect', record.network.id]))[0];
  assertNetworkPolicy(networkInfo, EGRESS_LIMITED_NETWORK_POLICY);
  writeOnce(resolve(evidenceDir, 'network-policy-verification.json'), { outcome: 'PASS', policy: EGRESS_LIMITED_NETWORK_POLICY, driver: networkInfo.Driver, internal: networkInfo.Internal, ipv6Enabled: networkInfo.EnableIPv6, ipMasquerade: networkInfo.Options?.['com.docker.network.bridge.enable_ip_masquerade'] });
  const appCreated = dockerCall(['create', '--name', names.app, '--network', names.network, '--publish', '127.0.0.1:' + appPort + ':80', '--memory', '1280m', '--cpus', '1.5', '--pids-limit', '256', '--restart', 'no', ...labelArgs, APP_IMAGE_REF], 'app-create.json', false);
  recordCreatedResource({ kind: 'container', role: 'app', name: names.app, imageRef: APP_IMAGE_REF, result: appCreated, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const browserCreated = dockerCall(['create', '--name', names.browser, '--network', names.network, '--publish', '127.0.0.1:' + browserPort + ':4444', '--memory', '2304m', '--cpus', '2', '--pids-limit', '512', '--shm-size', '1g', '--restart', 'no', ...labelArgs, BROWSER_IMAGE_REF], 'selenium-create.json', false);
  recordCreatedResource({ kind: 'container', role: 'browser', name: names.browser, imageRef: BROWSER_IMAGE_REF, result: browserCreated, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  dockerCall(['start', names.app], 'app-start.json');
  dockerCall(['start', names.browser], 'selenium-start.json');
  const appInfo = JSON.parse(docker(['inspect', names.app]))[0];
  const browserInfo = JSON.parse(docker(['inspect', names.browser]))[0];
  assertPublishedLoopbackPort(appInfo, '80/tcp', appPort);
  assertPublishedLoopbackPort(browserInfo, '4444/tcp', browserPort);
  assertContainerPortNotPublished(appInfo, '3306/tcp');
  for (const [role, container] of [['app', record.containers.find(item => item.role === 'app')], ['browser', record.containers.find(item => item.role === 'browser')]]) {
    const probe = spawnSync(DOCKER_CLI_PATH, ['exec', container.id, 'bash', '-lc', "timeout 5 bash -c 'echo >/dev/tcp/1.1.1.1/443'"], { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true, timeout: 8000 });
    const probeOutcome = classifyEgressProbe(probe);
    writeOnce(resolve(evidenceDir, `${role}-egress-policy-check.json`), { target: '1.1.1.1:443', outcome: probeOutcome, exitCode: probe.status, stdout: probe.stdout || '', stderr: probe.stderr || '', error: probe.error?.message || '' });
    if (probeOutcome !== 'PASS') throw new Error(probeOutcome === 'FAIL' ? `EGRESS_POLICY_VIOLATION: ${role} container reached an external TCP target` : `EGRESS_POLICY_UNVERIFIED: ${role} container probe was inconclusive`);
  }
  writeOnce(resolve(evidenceDir, 'host-port-verification.json'), {
    outcome: 'PASS', bindAddress: '127.0.0.1', app: { requestedHostPort: appPort, hostConfig: appInfo.HostConfig.PortBindings['80/tcp'], networkSettings: appInfo.NetworkSettings.Ports['80/tcp'] },
    browser: { requestedHostPort: browserPort, hostConfig: browserInfo.HostConfig.PortBindings['4444/tcp'], networkSettings: browserInfo.NetworkSettings.Ports['4444/tcp'] },
    mysql3306Published: false, reservationHeld: false,
  });
  writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify({ ...record, appPort, browserPort }, null, 2)}\n`);
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
  const psQuote = value => `'${String(value).replaceAll("'", "''")}'`;
  const mavenScript = `& ${psQuote(MAVEN_CLI_PATH)} ${mavenArgs.map(psQuote).join(' ')}; exit $LASTEXITCODE`;
  const maven = spawnSync(POWERSHELL_PATH, ['-NoProfile', '-NonInteractive', '-Command', mavenScript], { cwd: suite, encoding: 'utf8', env: MAVEN_ENV, windowsHide: true });
  const sanitize = text => String(text || '').replace(/\bn0tl[\w-]+\b/gi, '<TEST_FIXTURE_SECRET>').replace(/[A-Z]:[\\/][^\r\n"'<>\s]*/gi, '<LOCAL_PATH>').replaceAll(repo, '<REPOSITORY_ROOT>').replaceAll(repo.replaceAll('\\', '/'), '<REPOSITORY_ROOT>');
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
  try {
    const baseline = readFileSync(resolve(evidenceDir, 'docker-before.json'), 'utf8');
    const result = runCleanupWithExitCode({ record, baseline: JSON.parse(baseline) });
    writeOnce(resolve(evidenceDir, 'cleanup-result.json'), result);
    if (result.outcome !== 'PASS') exitCode = 1;
  } catch (error) {
    try { writeFileSync(resolve(evidenceDir, 'cleanup-blocked.txt'), `${error.name}: ${error.message}\n`, { flag: 'wx' }); } catch {}
    exitCode = 1;
  }
  try { const after = snapshotInventory(); writeOnce(resolve(evidenceDir, 'docker-after.json'), after); }
  catch (error) { try { writeFileSync(resolve(evidenceDir, 'docker-after-blocked.txt'), `${error.message}\n`, { flag: 'wx' }); } catch {} exitCode = 1; }
}
process.exitCode = exitCode;
