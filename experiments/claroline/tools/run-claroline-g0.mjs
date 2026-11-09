import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_IMAGE_REF, APP_TEST_CLASS, BROWSER_IMAGE_REF, SOURCE_COMMIT, createEvidenceDirectory, labelsForRun, namesForRun, parseSurefireXml, recordCreatedResource, sanitizeSurefireXml, snapshotInventory, validateRunId } from './claroline-g0.mjs';
import { DOCKER_CLI_PATH, DOCKER_ENV, MAVEN_CLI_PATH, MAVEN_ENV, POWERSHELL_PATH } from './child-process-policy.mjs';
import { runCleanupWithExitCode } from './cleanup-claroline-g0.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const repo = root;
const docker = args => execFileSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const digest = ref => ref.slice(ref.indexOf('@') + 1);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const writeOnce = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
const runId = validateRunId(process.argv[2] || '');
const evidenceDir = createEvidenceDirectory(resolve(repo, 'docs/tasks/T03-B2/evidence'), runId); // Existing run IDs fail closed.
const names = namesForRun(runId);
const labels = labelsForRun(runId);
const labelArgs = Object.entries(labels).flatMap(([key, value]) => ['--label', `${key}=${value}`]);
const record = { runId, benchmarkRepositoryCommit: SOURCE_COMMIT, applicationSourceCommit: null, imageDigest: digest(APP_IMAGE_REF), browserImageDigest: digest(BROWSER_IMAGE_REF), containers: [], network: null };
let exitCode = 1;

function dockerCall(args, evidenceName, throwOnError = true) {
  const result = spawnSync(DOCKER_CLI_PATH, args, { encoding: 'utf8', env: DOCKER_ENV, windowsHide: true });
  if (evidenceName) writeFileSync(resolve(evidenceDir, evidenceName), JSON.stringify({ command: ['docker', ...args], status: result.status, stdout: result.stdout || '', stderr: result.stderr || '', error: result.error?.message || null }, null, 2) + '\n', { flag: 'wx' });
  if (throwOnError && (result.error || result.status !== 0)) throw new Error(`docker ${args[0]} failed (${result.status}): ${(result.stderr || result.error?.message || '').trim()}`);
  return result;
}

try {
  writeOnce(resolve(evidenceDir, 'run-record.json'), record);
  const memory = Number(execFileSync(POWERSHELL_PATH, ['-NoProfile', '-NonInteractive', '-Command', '(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory'], { encoding: 'utf8', env: DOCKER_ENV }).trim()) * 1024;
  writeOnce(resolve(evidenceDir, 'memory-preflight.json'), { freeBytes: memory, minimumBytes: 4 * 1024 ** 3, outcome: memory >= 4 * 1024 ** 3 ? 'PASS' : 'BLOCKED' });
  if (memory < 4 * 1024 ** 3) throw new Error('runtime BLOCKED: host free RAM below 4 GiB threshold');
  const before = snapshotInventory();
  writeOnce(resolve(evidenceDir, 'docker-before.json'), before);
  const appInspect = JSON.parse(docker(['image', 'inspect', APP_IMAGE_REF]))[0];
  const browserInspect = JSON.parse(docker(['image', 'inspect', BROWSER_IMAGE_REF]))[0];
  if (appInspect.Os !== 'linux' || appInspect.Architecture !== 'amd64' || browserInspect.Os !== 'linux' || browserInspect.Architecture !== 'amd64') throw new Error('pinned images must both be linux/amd64');
  const safeConfig = config => ({ Entrypoint: config.Entrypoint, Cmd: config.Cmd, WorkingDir: config.WorkingDir, User: config.User, Labels: config.Labels, ExposedPorts: config.ExposedPorts });
  writeOnce(resolve(evidenceDir, 'image-inspect.json'), { app: { Id: appInspect.Id, RepoDigests: appInspect.RepoDigests, Os: appInspect.Os, Architecture: appInspect.Architecture, Created: appInspect.Created, Config: safeConfig(appInspect.Config), RootFS: appInspect.RootFS }, browser: { Id: browserInspect.Id, RepoDigests: browserInspect.RepoDigests, Os: browserInspect.Os, Architecture: browserInspect.Architecture, Created: browserInspect.Created } });
  const networkCreate = dockerCall(['network', 'create', '--driver', 'bridge', '--internal', ...labelArgs, names.network], 'network-create.json', false);
  recordCreatedResource({ kind: 'network', name: names.network, result: networkCreate, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const appCreated = dockerCall(['create', '--name', names.app, '--network', names.network, '--publish', '127.0.0.1::80', '--memory', '1280m', '--cpus', '1.5', '--pids-limit', '256', '--restart', 'no', ...labelArgs, APP_IMAGE_REF], 'app-create.json', false);
  recordCreatedResource({ kind: 'container', role: 'app', name: names.app, imageRef: APP_IMAGE_REF, result: appCreated, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const browserCreated = dockerCall(['create', '--name', names.browser, '--network', names.network, '--publish', '127.0.0.1::4444', '--memory', '2304m', '--cpus', '2', '--pids-limit', '512', '--shm-size', '1g', '--restart', 'no', ...labelArgs, BROWSER_IMAGE_REF], 'selenium-create.json', false);
  recordCreatedResource({ kind: 'container', role: 'browser', name: names.browser, imageRef: BROWSER_IMAGE_REF, result: browserCreated, record, onRecord: () => writeFileSync(resolve(evidenceDir, 'run-record.json'), `${JSON.stringify(record, null, 2)}\n`) });
  const appInfo = JSON.parse(docker(['inspect', names.app]))[0];
  const appPort = appInfo.NetworkSettings.Ports['80/tcp']?.[0]?.HostPort;
  const browserInfo = JSON.parse(docker(['inspect', names.browser]))[0];
  const browserPort = browserInfo.NetworkSettings.Ports['4444/tcp']?.[0]?.HostPort;
  if (!appPort || !browserPort) throw new Error('dynamic loopback port assignment missing');
  dockerCall(['start', names.app], 'app-start.json');
  dockerCall(['start', names.browser], 'selenium-start.json');
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
  const suite = resolve(root, 'bewt-suite');
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
