import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_IMAGE_REF, BROWSER_IMAGE_REF, SOURCE_COMMIT, validateRunId } from './claroline-g0.mjs';
import { loadCanonicalConfig, toCloudVmConfig } from '../../../framework/src/runtime/config-loader.ts';

const toolDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(toolDir, '../../..');

export const CLOUD_VM_CONFIG = Object.freeze(toCloudVmConfig(loadCanonicalConfig({ startDir: repoRoot })));

export const ALLOWLISTED_REMOTE_ACTIONS = Object.freeze({
  'preflight-probe': {
    requiresRunId: false,
    sideEffecting: false,
    timeoutMs: 30000,
    description: 'Read-only VM hardware, OS, Git, and Docker readiness probe',
  },
  'unit-tests': {
    requiresRunId: false,
    sideEffecting: false,
    timeoutMs: 120000,
    description: 'Syntax check and Node.js unit test suite on Ubuntu VM',
  },
  'maven-compile': {
    requiresRunId: false,
    sideEffecting: false,
    timeoutMs: 180000,
    description: 'Maven clean test-compile check for Claroline suite on Ubuntu VM',
  },
  'run-diagnostic': {
    requiresRunId: true,
    sideEffecting: true,
    timeoutMs: 300000,
    description: 'Execute app-only Claroline diagnostic with unique runId',
  },
  'run-g0': {
    requiresRunId: true,
    sideEffecting: true,
    timeoutMs: 600000,
    description: 'Execute Claroline G0 baseline workflow with unique runId',
  },
  'cleanup-run': {
    requiresRunId: true,
    sideEffecting: true,
    timeoutMs: 120000,
    description: 'Execute exact-resource cleanup recovery for a recorded runId',
  },
  'process-check': {
    requiresRunId: true,
    sideEffecting: false,
    timeoutMs: 20000,
    description: 'Read-only recovery check for active runner processes and evidence files by runId',
  },
  'inspect-docker-clean': {
    requiresRunId: false,
    sideEffecting: false,
    timeoutMs: 20000,
    description: 'Read-only check of Docker containers, networks, and volumes on VM',
  },
});

export function scrubCloudText(value) {
  return String(value ?? '')
    .replaceAll(CLOUD_VM_CONFIG.remoteRepoPath, '<REMOTE_REPO>')
    .replaceAll(repoRoot, '<WORKTREE>')
    .replaceAll(repoRoot.replaceAll('\\', '/'), '<WORKTREE>')
    .replace(/(password|passwd|token|secret|authorization|cookie|private_key|access_token)(\s*[=:]\s*)[^\s,;"']+/gi, '$1$2[REDACTED]')
    .replace(/ya29\.[A-Za-z0-9._-]+/g, '[REDACTED_OAUTH_TOKEN]')
    .replace(/\b[A-Z]:\\(?:[^\s"']+\\)*[^\s"']*/gi, '<LOCAL_PATH>')
    .replace(/\/home\/[a-zA-Z0-9._-]+\/[^\s"']*/g, '<LOCAL_PATH>');
}

export function assertAllowedRemoteAction(action, params = {}) {
  if (typeof action !== 'string' || !Object.hasOwn(ALLOWLISTED_REMOTE_ACTIONS, action)) {
    throw new Error(`UNALLOWED_REMOTE_ACTION: action '${action}' is not in ALLOWLISTED_REMOTE_ACTIONS`);
  }
  const spec = ALLOWLISTED_REMOTE_ACTIONS[action];
  let validatedRunId = null;
  if (spec.requiresRunId) {
    validatedRunId = validateRunId(params.runId || '');
  } else if (params.runId !== undefined && params.runId !== null && params.runId !== '') {
    throw new Error(`UNEXPECTED_RUN_ID: action '${action}' does not accept a runId parameter`);
  }
  return { action, spec, runId: validatedRunId };
}

export function buildRemoteCommandScript(action, params = {}) {
  const { runId } = assertAllowedRemoteAction(action, params);
  const repo = CLOUD_VM_CONFIG.remoteRepoPath;
  switch (action) {
    case 'preflight-probe':
      return [
        'set -eu',
        `cd ${repo}`,
        'printf "UNAME=%s\\n" "$(uname -srmo)"',
        'printf "NPROC=%s\\n" "$(nproc)"',
        'printf "MEM_TOTAL_KB=%s\\n" "$(awk \'/^MemTotal:/ {print $2}\' /proc/meminfo)"',
        'printf "MEM_AVAIL_KB=%s\\n" "$(awk \'/^MemAvailable:/ {print $2}\' /proc/meminfo)"',
        'printf "DISK_ROOT_FREE_BYTES=%s\\n" "$(df -B1 / | awk \'NR==2 {print $4}\')"',
        'printf "DOCKER_SERVER_VERSION=%s\\n" "$(docker version --format \'{{.Server.Version}}\')"',
        'printf "GIT_BRANCH=%s\\n" "$(git rev-parse --abbrev-ref HEAD)"',
        'printf "GIT_HEAD=%s\\n" "$(git rev-parse HEAD)"',
        'printf "GIT_STATUS_COUNT=%s\\n" "$(git status --porcelain --untracked-files=no | wc -l)"',
        'printf "BEWT_ORIGINAL_HEAD=%s\\n" "$(git -C bewt-original rev-parse HEAD)"',
        `printf "APP_IMAGE_ID=%s\\n" "$(docker image inspect --format '{{.Id}}' '${APP_IMAGE_REF}')"`,
        `printf "BROWSER_IMAGE_ID=%s\\n" "$(docker image inspect --format '{{.Id}}' '${BROWSER_IMAGE_REF}')"`,
        'printf "DOCKER_CONTAINERS_COUNT=%s\\n" "$(docker ps -aq | wc -l)"',
        'printf "DOCKER_NETWORKS_COUNT=%s\\n" "$(docker network ls -q | wc -l)"',
        'printf "DOCKER_VOLUMES_COUNT=%s\\n" "$(docker volume ls -q | wc -l)"',
      ].join('; ');
    case 'unit-tests':
      return [
        'set -eu',
        `cd ${repo}`,
        'node --check experiments/claroline/tools/child-process-policy.mjs',
        'node --check experiments/claroline/tools/claroline-g0.mjs',
        'node --check experiments/claroline/tools/cleanup-claroline-g0.mjs',
        'node --check experiments/claroline/tools/run-claroline-diagnostic.mjs',
        'node --check experiments/claroline/tools/run-claroline-g0.mjs',
        'node --check experiments/claroline/tools/record-offline-verification.mjs',
        'node --check experiments/claroline/tools/cloud-controller.mjs',
        'node --check experiments/claroline/tools/validate-evidence.mjs',
        'node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs',
      ].join(' && ');
    case 'maven-compile':
      return `set -eu; cd ${repo}/experiments/claroline/bewt-suite && mvn -B clean test-compile`;
    case 'run-diagnostic':
      return `set -eu; cd ${repo} && node experiments/claroline/tools/run-claroline-diagnostic.mjs ${runId}`;
    case 'run-g0':
      return `set -eu; cd ${repo} && node experiments/claroline/tools/run-claroline-g0.mjs ${runId}`;
    case 'cleanup-run':
      return `set -eu; cd ${repo} && node experiments/claroline/tools/cleanup-claroline-g0.mjs ${runId}`;
    case 'process-check':
      return [
        'set -eu',
        `cd ${repo}`,
        `ps -ef | grep -F '${runId}' | grep -v grep || true`,
        `test -d docs/tasks/T03-B2/evidence/${runId} && ls -1 docs/tasks/T03-B2/evidence/${runId} || echo "EVIDENCE_DIR_ABSENT"`,
      ].join('; ');
    case 'inspect-docker-clean':
      return [
        'set -eu',
        'printf "CONTAINERS=%s\\n" "$(docker ps -aq | tr \'\\n\' \',\')"',
        'printf "NETWORKS=%s\\n" "$(docker network ls --format \'{{.Name}}\' | tr \'\\n\' \',\')"',
        'printf "VOLUMES=%s\\n" "$(docker volume ls --format \'{{.Name}}\' | tr \'\\n\' \',\')"',
      ].join('; ');
    default:
      throw new Error(`Unhandled allowlisted action: ${action}`);
  }
}

export function verifyTerminationSchedule(instanceJson, nowMs = Date.now(), minRemainingSeconds = CLOUD_VM_CONFIG.minRemainingSecondsForRun) {
  if (!instanceJson || typeof instanceJson !== 'object') {
    throw new Error('VM_PREFLIGHT_BLOCKED: empty or invalid instance description JSON');
  }
  if (instanceJson.name !== CLOUD_VM_CONFIG.instanceName) {
    throw new Error(`VM_PREFLIGHT_BLOCKED: instance name mismatch (${instanceJson.name})`);
  }
  if (String(instanceJson.id) !== CLOUD_VM_CONFIG.expectedInstanceId) {
    throw new Error(`VM_PREFLIGHT_BLOCKED: instance ID mismatch (${instanceJson.id})`);
  }
  if (instanceJson.status !== 'RUNNING') {
    throw new Error(`VM_STOPPED_OR_NOT_RUNNING: status is ${instanceJson.status}; refusing to auto-start or create VM`);
  }
  if (!String(instanceJson.machineType || '').endsWith(CLOUD_VM_CONFIG.expectedMachineTypeSuffix)) {
    throw new Error(`VM_PREFLIGHT_BLOCKED: unexpected machineType (${instanceJson.machineType})`);
  }
  const maxRunSeconds = Number(instanceJson.scheduling?.maxRunDuration?.seconds || 0);
  const terminationAction = instanceJson.scheduling?.instanceTerminationAction;
  const allowedDurations = new Set([18000, 21600, CLOUD_VM_CONFIG.expectedMaxRunDurationSeconds]);
  if (!allowedDurations.has(maxRunSeconds) || terminationAction !== CLOUD_VM_CONFIG.expectedTerminationAction) {
    throw new Error(`VM_SAFETY_BLOCKED: scheduling.maxRunDuration=${maxRunSeconds}s, instanceTerminationAction=${terminationAction}`);
  }
  const startTimestamp = instanceJson.lastStartTimestamp || instanceJson.creationTimestamp;
  const startedMs = Date.parse(startTimestamp);
  if (!Number.isFinite(startedMs)) {
    throw new Error(`VM_PREFLIGHT_BLOCKED: invalid start timestamp (${startTimestamp})`);
  }
  const terminationMs = startedMs + maxRunSeconds * 1000;
  const remainingSeconds = Math.floor((terminationMs - nowMs) / 1000);
  if (remainingSeconds < minRemainingSeconds) {
    throw new Error(`VM_DEADLINE_INSUFFICIENT: only ${remainingSeconds}s remaining before auto-STOP (< ${minRemainingSeconds}s required)`);
  }
  return {
    instanceId: String(instanceJson.id),
    instanceName: instanceJson.name,
    status: instanceJson.status,
    machineType: instanceJson.machineType.split('/').pop(),
    zone: String(instanceJson.zone || '').split('/').pop(),
    creationTimestamp: instanceJson.creationTimestamp,
    maxRunDurationSeconds: maxRunSeconds,
    instanceTerminationAction: terminationAction,
    terminationTimestampUtc: new Date(terminationMs).toISOString(),
    remainingSeconds,
  };
}

export function isPrivateInventoryFile(fileName) {
  return /(?:^|\/)(?:docker-(?:before|after)(?:-private)?\.json|sha256-manifest\.json)$/i.test(fileName);
}

export function validateEvidenceId(evidenceId) {
  if (
    typeof evidenceId !== 'string' ||
    !/^(?:t03b2-[a-z0-9]{1,20}-\d{8}-r[1-9]\d*|offline-verification-\d{8}-r[1-9]\d*)$/.test(evidenceId)
  ) {
    throw new Error('evidenceId must be a unique t03b2-* or offline-verification-* date/run identity');
  }
  return evidenceId;
}

export function resolveEvidenceDirectoryById(evidenceId, baseDir = resolve(repoRoot, 'docs/tasks/T03-B2/evidence')) {
  const validId = validateEvidenceId(evidenceId);
  const rootDir = resolve(baseDir);
  if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
    throw new Error(`EVIDENCE_ROOT_MISSING: ${rootDir}`);
  }
  const matched = readdirSync(rootDir, { withFileTypes: true })
    .find(entry => entry.isDirectory() && entry.name === validId);
  if (!matched) {
    throw new Error(`EVIDENCE_DIR_MISSING: directory '${validId}' does not exist under ${rootDir}`);
  }
  return resolve(rootDir, matched.name);
}

export function computeDirectorySha256Manifest(dirPath, { includePrivate = false, runId = null } = {}) {
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    throw new Error(`MANIFEST_TARGET_MISSING: directory does not exist: ${dirPath}`);
  }
  const entries = readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => name !== 'sha256-manifest.json' && (includePrivate || !isPrivateInventoryFile(name)))
    .sort((left, right) => left.localeCompare(right, 'en'));

  const files = {};
  for (const name of entries) {
    const fullPath = join(dirPath, name);
    const buffer = readFileSync(fullPath);
    files[posix.normalize(name)] = {
      sha256: createHash('sha256').update(buffer).digest('hex'),
      bytes: buffer.byteLength,
    };
  }
  return {
    schemaVersion: 1,
    runId: runId || posix.basename(dirPath.replaceAll('\\', '/')),
    generatedAtUtc: new Date().toISOString(),
    fileCount: Object.keys(files).length,
    privateInventoriesExcluded: !includePrivate,
    files,
  };
}

export function verifySha256Manifest(dirPath, manifest, { allowExtraPrivateFiles = true } = {}) {
  if (!manifest || typeof manifest !== 'object' || !manifest.files || typeof manifest.files !== 'object') {
    return { outcome: 'FAIL', reason: 'invalid or missing manifest.files object', mismatches: ['manifest.files'] };
  }
  const mismatches = [];
  const expectedNames = Object.keys(manifest.files).sort((a, b) => a.localeCompare(b, 'en'));
  for (const name of expectedNames) {
    if (name.includes('..') || name.startsWith('/') || name.includes('\\')) {
      mismatches.push(`unsafe file path in manifest: ${name}`);
      continue;
    }
    const targetPath = join(dirPath, name);
    if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
      mismatches.push(`missing file: ${name}`);
      continue;
    }
    const buffer = readFileSync(targetPath);
    const actualSha256 = createHash('sha256').update(buffer).digest('hex');
    const expected = manifest.files[name];
    if (actualSha256 !== expected.sha256) {
      mismatches.push(`sha256 mismatch for ${name}: expected ${expected.sha256}, got ${actualSha256}`);
    }
    if (typeof expected.bytes === 'number' && buffer.byteLength !== expected.bytes) {
      mismatches.push(`byte size mismatch for ${name}: expected ${expected.bytes}, got ${buffer.byteLength}`);
    }
  }
  if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
    const actualFiles = readdirSync(dirPath, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(name => name !== 'sha256-manifest.json' && (!allowExtraPrivateFiles || !isPrivateInventoryFile(name)));
    for (const actual of actualFiles) {
      if (!Object.hasOwn(manifest.files, actual)) {
        mismatches.push(`unlisted file present in directory: ${actual}`);
      }
    }
  }
  return {
    outcome: mismatches.length === 0 ? 'PASS' : 'FAIL',
    verifiedFileCount: expectedNames.length,
    mismatches,
  };
}

function resolveGcloudPath() {
  const stitchGcloud = 'C:\\Users\\Lenovo\\.stitch-mcp\\google-cloud-sdk\\bin\\gcloud.cmd';
  if (process.platform === 'win32' && existsSync(stitchGcloud)) return stitchGcloud;
  return 'gcloud';
}

function resolveSshKeyPath() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  return join(home, '.ssh', 'google_compute_engine');
}

function runGcloudCommand(args, { spawnSyncFn = spawnSync } = {}) {
  const gcloudBin = resolveGcloudPath();
  const isCmd = gcloudBin.toLowerCase().endsWith('.cmd');
  const res = isCmd
    ? spawnSyncFn('cmd.exe', ['/d', '/s', '/c', gcloudBin, ...args], { encoding: 'utf8', windowsHide: true, timeout: 30000 })
    : spawnSyncFn(gcloudBin, args, { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (res.status !== 0) {
    throw new Error(`GCLOUD_PREFLIGHT_FAILED (${args[0]}): ${scrubCloudText(res.stderr || res.stdout || res.error?.message)}`);
  }
  return res.stdout.trim();
}

export function resolveVmExternalIp({ spawnSyncFn = spawnSync } = {}) {
  const rawInstance = runGcloudCommand([
    'compute', 'instances', 'describe', CLOUD_VM_CONFIG.instanceName,
    `--zone=${CLOUD_VM_CONFIG.zone}`,
    `--project=${CLOUD_VM_CONFIG.projectId}`,
    '--format=json(id,name,zone,machineType,status,creationTimestamp,lastStartTimestamp,scheduling,networkInterfaces)',
  ], { spawnSyncFn });
  const instanceJson = JSON.parse(rawInstance);
  verifyTerminationSchedule(instanceJson);
  const natIp = String(instanceJson.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || '').trim();
  if (!natIp) {
    throw new Error('VM_EXTERNAL_IP_UNAVAILABLE: instance networkInterfaces[0].accessConfigs[0].natIP is empty');
  }
  return natIp;
}

export function executeRemoteAction(action, params = {}, { spawnSyncFn = spawnSync, hostIp = null } = {}) {
  const { spec, runId } = assertAllowedRemoteAction(action, params);
  const resolvedHostIp = hostIp || resolveVmExternalIp({ spawnSyncFn });
  const remoteScript = buildRemoteCommandScript(action, params);
  const sshKey = resolveSshKeyPath();
  const sshArgs = [
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ConnectTimeout=15',
    '-i', sshKey,
    `${CLOUD_VM_CONFIG.sshUser}@${resolvedHostIp}`,
    remoteScript,
  ];
  const startedAtUtc = new Date().toISOString();
  const startMs = Date.now();
  const result = spawnSyncFn('ssh', sshArgs, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: spec.timeoutMs,
  });
  const completedAtUtc = new Date().toISOString();
  const durationMs = Date.now() - startMs;
  const sshTransportError = result.status === 255 || Boolean(result.error);
  return {
    action,
    runId,
    startedAtUtc,
    completedAtUtc,
    durationMs,
    exitCode: result.status,
    signal: result.signal || null,
    statusClassification: sshTransportError ? 'INCONCLUSIVE' : (result.status === 0 ? 'PASS' : 'NONZERO_EXIT'),
    stdout: scrubCloudText(result.stdout || ''),
    stderr: scrubCloudText(result.stderr || ''),
    error: result.error ? scrubCloudText(result.error.message) : null,
  };
}

export function runCloudPreflight({ spawnSyncFn = spawnSync } = {}) {
  const project = runGcloudCommand(['config', 'get-value', 'project'], { spawnSyncFn });
  if (project !== CLOUD_VM_CONFIG.projectId) {
    throw new Error(`GCLOUD_PROJECT_MISMATCH: expected ${CLOUD_VM_CONFIG.projectId}, got ${project}`);
  }
  const rawInstance = runGcloudCommand([
    'compute', 'instances', 'describe', CLOUD_VM_CONFIG.instanceName,
    `--zone=${CLOUD_VM_CONFIG.zone}`,
    `--project=${CLOUD_VM_CONFIG.projectId}`,
    '--format=json(id,name,zone,machineType,status,creationTimestamp,lastStartTimestamp,scheduling,disks,networkInterfaces)',
  ], { spawnSyncFn });
  const instanceJson = JSON.parse(rawInstance);
  const schedule = verifyTerminationSchedule(instanceJson);
  const natIp = String(instanceJson.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || '').trim();
  if (!natIp) {
    throw new Error('VM_EXTERNAL_IP_UNAVAILABLE: instance networkInterfaces[0].accessConfigs[0].natIP is empty');
  }
  const stackType = instanceJson.networkInterfaces?.[0]?.stackType || 'UNKNOWN';
  const probe = executeRemoteAction('preflight-probe', {}, { spawnSyncFn, hostIp: natIp });
  if (probe.exitCode !== 0) {
    throw new Error(`SSH_PREFLIGHT_PROBE_FAILED: exit=${probe.exitCode} stderr=${probe.stderr}`);
  }
  const kv = Object.fromEntries(
    probe.stdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.includes('='))
      .map(line => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      }),
  );
  if (kv.BEWT_ORIGINAL_HEAD !== SOURCE_COMMIT) {
    throw new Error(`SOURCE_PIN_MISMATCH: expected ${SOURCE_COMMIT}, got ${kv.BEWT_ORIGINAL_HEAD}`);
  }
  return {
    capturedAtUtc: new Date().toISOString(),
    outcome: 'PASS',
    projectId: project,
    vm: {
      ...schedule,
      networkStackType: stackType,
      diskSizeGb: Number(instanceJson.disks?.[0]?.diskSizeGb || 0),
    },
    remoteEnvironment: {
      uname: kv.UNAME,
      vCpuCount: Number(kv.NPROC),
      memTotalBytes: Number(kv.MEM_TOTAL_KB) * 1024,
      memAvailableBytes: Number(kv.MEM_AVAIL_KB) * 1024,
      memAvailableGiB: Number(((Number(kv.MEM_AVAIL_KB) * 1024) / 1024 ** 3).toFixed(3)),
      diskFreeBytes: Number(kv.DISK_ROOT_FREE_BYTES),
      diskFreeGiB: Number((Number(kv.DISK_ROOT_FREE_BYTES) / 1024 ** 3).toFixed(3)),
      dockerServerVersion: kv.DOCKER_SERVER_VERSION,
      gitBranch: kv.GIT_BRANCH,
      gitHead: kv.GIT_HEAD,
      gitTrackedDirtyCount: Number(kv.GIT_STATUS_COUNT),
      bewtOriginalCommit: kv.BEWT_ORIGINAL_HEAD,
      appImageId: kv.APP_IMAGE_ID,
      browserImageId: kv.BROWSER_IMAGE_ID,
      activeDockerContainers: Number(kv.DOCKER_CONTAINERS_COUNT),
      activeDockerNetworks: Number(kv.DOCKER_NETWORKS_COUNT),
      activeDockerVolumes: Number(kv.DOCKER_VOLUMES_COUNT),
    },
  };
}

export function syncEvidenceFromCloud(runId, {
  hostIp = null,
  localEvidenceRoot = resolve(repoRoot, 'docs/tasks/T03-B2/evidence'),
  localPrivateArchiveRoot = resolve(repoRoot, '.local-state/cloud-private-evidence'),
  spawnSyncFn = spawnSync,
} = {}) {
  const validId = validateRunId(runId);
  const resolvedHostIp = hostIp || resolveVmExternalIp({ spawnSyncFn });
  const sshKey = resolveSshKeyPath();
  const remoteEvidenceDir = `${CLOUD_VM_CONFIG.remoteRepoPath}/docs/tasks/T03-B2/evidence/${validId}`;
  const localDir = resolve(localEvidenceRoot, validId);
  if (existsSync(localDir)) {
    throw new Error(`LOCAL_EVIDENCE_ALREADY_EXISTS: refusing to overwrite ${localDir}`);
  }
  mkdirSync(localEvidenceRoot, { recursive: true });
  const scpArgs = [
    '-r',
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=no',
    '-i', sshKey,
    `${CLOUD_VM_CONFIG.sshUser}@${resolvedHostIp}:${remoteEvidenceDir}`,
    localEvidenceRoot,
  ];
  const scpResult = spawnSyncFn('scp', scpArgs, { encoding: 'utf8', windowsHide: true, timeout: 120000 });
  if (scpResult.status !== 0) {
    throw new Error(`SCP_EVIDENCE_SYNC_FAILED: ${scrubCloudText(scpResult.stderr || scpResult.stdout || scpResult.error?.message)}`);
  }

  // Move raw private inventories out of the git-tracked evidence folder into non-committed private storage.
  const privateDir = resolve(localPrivateArchiveRoot, validId);
  mkdirSync(privateDir, { recursive: true });
  const movedPrivateFiles = [];
  for (const entry of readdirSync(localDir, { withFileTypes: true })) {
    if (entry.isFile() && isPrivateInventoryFile(entry.name) && entry.name !== 'sha256-manifest.json') {
      renameSync(join(localDir, entry.name), join(privateDir, entry.name));
      movedPrivateFiles.push(entry.name);
    }
  }

  const manifest = computeDirectorySha256Manifest(localDir, { includePrivate: false, runId: validId });
  const manifestPath = join(localDir, 'sha256-manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  const verification = verifySha256Manifest(localDir, manifest);
  if (verification.outcome !== 'PASS') {
    throw new Error(`MANIFEST_VERIFICATION_FAILED: ${verification.mismatches.join('; ')}`);
  }
  return {
    outcome: 'PASS',
    runId: validId,
    localEvidenceDir: relative(repoRoot, localDir).replaceAll('\\', '/'),
    movedPrivateFiles,
    manifestFileCount: manifest.fileCount,
    verification,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const subcommand = process.argv[2] || '';
  if (subcommand === 'preflight') {
    const report = runCloudPreflight();
    const evidenceId = process.argv[3] ? validateEvidenceId(process.argv[3]) : null;
    if (evidenceId) {
      const targetDir = resolveEvidenceDirectoryById(evidenceId);
      writeFileSync(join(targetDir, 'cloud-preflight.json'), `${JSON.stringify(report, null, 2)}\n`);
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (subcommand === 'exec') {
    const action = process.argv[3] || '';
    const runId = process.argv[4] || undefined;
    const result = executeRemoteAction(action, { runId });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.exitCode !== 0) process.exitCode = 1;
  } else if (subcommand === 'sync-evidence') {
    const runId = process.argv[3] || '';
    const result = syncEvidenceFromCloud(runId);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (subcommand === 'write-manifest') {
    const evidenceId = validateEvidenceId(process.argv[3] || '');
    const targetDir = resolveEvidenceDirectoryById(evidenceId);
    const manifest = computeDirectorySha256Manifest(targetDir, { runId: evidenceId });
    writeFileSync(join(targetDir, 'sha256-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  } else {
    throw new Error('Usage: node cloud-controller.mjs <preflight|exec|sync-evidence|write-manifest> [...]');
  }
}
