import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const PINNED_BEWT_CONFIG = Object.freeze({
  BEWT_GCP_PROJECT_ID: 'gen-lang-client-0311012609',
  BEWT_GCP_PROJECT_NAME: 'Mina',
  BEWT_GCP_ACCOUNT: 'longgiango511@gmail.com',
  BEWT_GCP_REGION: 'asia-southeast1',
  BEWT_GCP_ZONE: 'asia-southeast1-a',
  BEWT_GCP_VM_NAME: 'bewt-covext-runner',
  BEWT_GCP_INSTANCE_ID: '3042402845209891905',
  BEWT_GCP_MACHINE_TYPE: 'c4d-highmem-8',
  BEWT_GCP_REMOTE_USER: 'runner',
  BEWT_GCP_REMOTE_REPO: '/home/runner/BEWT-CovExt',
  BEWT_RUNTIME_PROVIDER: 'GOOGLE_CLOUD_COMPUTE_ENGINE',
  BEWT_DOCKER_RUNTIME: 'CLOUD_ONLY',
  BEWT_LOCAL_DOCKER_ALLOWED: 'false',
  BEWT_CLOUD_BUDGET_MODE: 'UNLIMITED_USER_AUTHORIZED',
  BEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS: '21600',
  BEWT_GCP_EXPECTED_TERMINATION_ACTION: 'STOP',
  BEWT_GCP_AUTO_CREATE_VM: 'false',
  BEWT_GCP_AUTO_START_VM: 'false',
  BEWT_GCP_AUTO_EXTEND_VM: 'false',
} as const);

export const REQUIRED_BEWT_KEYS = Object.freeze([
  'BEWT_GCP_PROJECT_ID',
  'BEWT_GCP_PROJECT_NAME',
  'BEWT_GCP_ACCOUNT',
  'BEWT_GCP_REGION',
  'BEWT_GCP_ZONE',
  'BEWT_GCP_VM_NAME',
  'BEWT_GCP_INSTANCE_ID',
  'BEWT_GCP_MACHINE_TYPE',
  'BEWT_GCP_REMOTE_USER',
  'BEWT_GCP_REMOTE_REPO',
  'BEWT_RUNTIME_PROVIDER',
  'BEWT_DOCKER_RUNTIME',
  'BEWT_LOCAL_DOCKER_ALLOWED',
  'BEWT_CLOUD_BUDGET_MODE',
  'BEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS',
  'BEWT_GCP_EXPECTED_TERMINATION_ACTION',
  'BEWT_GCP_AUTO_CREATE_VM',
  'BEWT_GCP_AUTO_START_VM',
  'BEWT_GCP_AUTO_EXTEND_VM',
] as const);

export type BewtConfigKey = (typeof REQUIRED_BEWT_KEYS)[number];
export type RawBewtConfig = Record<BewtConfigKey, string>;

export interface ValidatedBewtConfig {
  readonly projectId: 'gen-lang-client-0311012609';
  readonly projectName: string;
  readonly account: string;
  readonly region: string;
  readonly zone: 'asia-southeast1-a';
  readonly vmName: 'bewt-covext-runner';
  readonly instanceId: '3042402845209891905';
  readonly machineType: string;
  readonly remoteUser: string;
  readonly remoteRepo: string;
  readonly runtimeProvider: 'GOOGLE_CLOUD_COMPUTE_ENGINE';
  readonly dockerRuntime: 'CLOUD_ONLY';
  readonly localDockerAllowed: false;
  readonly cloudBudgetMode: string;
  readonly maxRunDurationSeconds: 21600;
  readonly terminationAction: 'STOP';
  readonly autoCreateVm: false;
  readonly autoStartVm: false;
  readonly autoExtendVm: false;
  readonly envFilePath: string;
  readonly raw: Readonly<Record<string, string>>;
}

export interface CloudVmConfig {
  readonly projectId: string;
  readonly zone: string;
  readonly instanceName: string;
  readonly expectedInstanceId: string;
  readonly expectedMachineTypeSuffix: string;
  readonly expectedMaxRunDurationSeconds: number;
  readonly expectedTerminationAction: string;
  readonly sshUser: string;
  readonly remoteRepoPath: string;
  readonly minRemainingSecondsForRun: number;
}

export class ConfigFileNotFoundError extends Error {
  readonly code = 'CONFIG_FILE_NOT_FOUND';
  constructor(message: string) {
    super(message);
    this.name = 'ConfigFileNotFoundError';
  }
}

export class ConfigValidationError extends Error {
  readonly code = 'CONFIG_VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigSecurityViolationError extends Error {
  readonly code = 'CONFIG_SECURITY_VIOLATION';
  constructor(message: string) {
    super(message);
    this.name = 'ConfigSecurityViolationError';
  }
}

export interface ResolveOptions {
  envPath?: string | undefined;
}

export function resolveEnvFilePath(startDir?: string, options: ResolveOptions = {}): string {
  if (options.envPath) {
    const candidate = resolve(options.envPath);
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
    throw new ConfigFileNotFoundError(`Specified envPath does not exist: ${candidate}`);
  }

  if (process.env.BEWT_CONFIG_PATH) {
    const candidate = resolve(process.env.BEWT_CONFIG_PATH);
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
    throw new ConfigFileNotFoundError(`BEWT_CONFIG_PATH does not exist: ${candidate}`);
  }

  let currentDir = resolve(startDir || process.cwd());
  while (true) {
    const directEnv = join(currentDir, '.env');
    if (existsSync(directEnv) && statSync(directEnv).isFile()) {
      return directEnv;
    }

    const gitPath = join(currentDir, '.git');
    if (existsSync(gitPath)) {
      const gitStat = statSync(gitPath);
      if (gitStat.isFile()) {
        const gitContent = readFileSync(gitPath, 'utf8');
        const match = gitContent.match(/gitdir:\s*(.+)/);
        if (match && match[1]) {
          const rawGitDir = match[1].trim();
          const worktreeGitDir = resolve(currentDir, rawGitDir);
          const commondirFile = join(worktreeGitDir, 'commondir');
          let mainRepoRoot: string;
          if (existsSync(commondirFile)) {
            const relCommon = readFileSync(commondirFile, 'utf8').trim();
            mainRepoRoot = dirname(resolve(worktreeGitDir, relCommon));
          } else {
            mainRepoRoot = resolve(worktreeGitDir, '../../..');
          }
          const rootEnv = join(mainRepoRoot, '.env');
          if (existsSync(rootEnv) && statSync(rootEnv).isFile()) {
            return rootEnv;
          }
        }
      }
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  throw new ConfigFileNotFoundError(
    `CONFIG_FILE_NOT_FOUND: Could not resolve .env starting from '${resolve(startDir || process.cwd())}' up to repository root.`
  );
}

export function parseEnvFileContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

export function validateBewtConfig(
  parsed: Record<string, string>,
  envFilePath: string
): ValidatedBewtConfig {
  if (parsed.GEMINI_API_KEY !== undefined && parsed.GEMINI_API_KEY !== '') {
    throw new ConfigSecurityViolationError(
      'CONFIG_SECURITY_VIOLATION: GEMINI_API_KEY detected in root .env. Gemini API keys must reside exclusively in experiments/expresscart/.env.'
    );
  }

  for (const [k, v] of Object.entries(parsed)) {
    if (v.includes('BEGIN PRIVATE KEY') || v.includes('BEGIN OPENSSH PRIVATE KEY') || v.includes('BEGIN RSA PRIVATE KEY')) {
      throw new ConfigSecurityViolationError(`CONFIG_SECURITY_VIOLATION: Private key material detected in key '${k}'.`);
    }
  }

  const missingKeys: string[] = [];
  for (const key of REQUIRED_BEWT_KEYS) {
    if (!parsed[key] || parsed[key]!.trim() === '') {
      missingKeys.push(key);
    }
  }
  if (missingKeys.length > 0) {
    throw new ConfigValidationError(`CONFIG_VALIDATION_ERROR: Missing required BEWT configuration keys: ${missingKeys.join(', ')}`);
  }

  if (parsed.BEWT_GCP_PROJECT_ID !== PINNED_BEWT_CONFIG.BEWT_GCP_PROJECT_ID) {
    throw new ConfigValidationError(
      `CONFIG_VALIDATION_ERROR: BEWT_GCP_PROJECT_ID mismatch: expected '${PINNED_BEWT_CONFIG.BEWT_GCP_PROJECT_ID}', got '${parsed.BEWT_GCP_PROJECT_ID}'.`
    );
  }
  if (parsed.BEWT_GCP_ZONE !== PINNED_BEWT_CONFIG.BEWT_GCP_ZONE) {
    throw new ConfigValidationError(
      `CONFIG_VALIDATION_ERROR: BEWT_GCP_ZONE mismatch: expected '${PINNED_BEWT_CONFIG.BEWT_GCP_ZONE}', got '${parsed.BEWT_GCP_ZONE}'.`
    );
  }
  if (parsed.BEWT_GCP_VM_NAME !== PINNED_BEWT_CONFIG.BEWT_GCP_VM_NAME) {
    throw new ConfigValidationError(
      `CONFIG_VALIDATION_ERROR: BEWT_GCP_VM_NAME mismatch: expected '${PINNED_BEWT_CONFIG.BEWT_GCP_VM_NAME}', got '${parsed.BEWT_GCP_VM_NAME}'.`
    );
  }
  if (parsed.BEWT_GCP_INSTANCE_ID !== PINNED_BEWT_CONFIG.BEWT_GCP_INSTANCE_ID) {
    throw new ConfigValidationError(
      `CONFIG_VALIDATION_ERROR: BEWT_GCP_INSTANCE_ID mismatch: expected '${PINNED_BEWT_CONFIG.BEWT_GCP_INSTANCE_ID}', got '${parsed.BEWT_GCP_INSTANCE_ID}'.`
    );
  }
  if (parsed.BEWT_RUNTIME_PROVIDER !== PINNED_BEWT_CONFIG.BEWT_RUNTIME_PROVIDER) {
    throw new ConfigValidationError(
      `CONFIG_VALIDATION_ERROR: BEWT_RUNTIME_PROVIDER mismatch: expected '${PINNED_BEWT_CONFIG.BEWT_RUNTIME_PROVIDER}', got '${parsed.BEWT_RUNTIME_PROVIDER}'.`
    );
  }

  if (parsed.BEWT_LOCAL_DOCKER_ALLOWED !== 'false') {
    throw new ConfigSecurityViolationError(
      `CONFIG_SECURITY_VIOLATION: Local Docker execution is strictly forbidden. BEWT_LOCAL_DOCKER_ALLOWED must be 'false', got '${parsed.BEWT_LOCAL_DOCKER_ALLOWED}'.`
    );
  }
  if (parsed.BEWT_DOCKER_RUNTIME !== 'CLOUD_ONLY') {
    throw new ConfigSecurityViolationError(
      `CONFIG_SECURITY_VIOLATION: BEWT_DOCKER_RUNTIME must be 'CLOUD_ONLY', got '${parsed.BEWT_DOCKER_RUNTIME}'.`
    );
  }

  if (parsed.BEWT_GCP_AUTO_CREATE_VM !== 'false') {
    throw new ConfigSecurityViolationError(`CONFIG_SECURITY_VIOLATION: BEWT_GCP_AUTO_CREATE_VM must be 'false'.`);
  }
  if (parsed.BEWT_GCP_AUTO_START_VM !== 'false') {
    throw new ConfigSecurityViolationError(`CONFIG_SECURITY_VIOLATION: BEWT_GCP_AUTO_START_VM must be 'false'.`);
  }
  if (parsed.BEWT_GCP_AUTO_EXTEND_VM !== 'false') {
    throw new ConfigSecurityViolationError(`CONFIG_SECURITY_VIOLATION: BEWT_GCP_AUTO_EXTEND_VM must be 'false'.`);
  }
  if (parsed.BEWT_GCP_EXPECTED_TERMINATION_ACTION !== 'STOP') {
    throw new ConfigValidationError(`CONFIG_VALIDATION_ERROR: BEWT_GCP_EXPECTED_TERMINATION_ACTION must be 'STOP'.`);
  }
  if (parsed.BEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS !== '21600') {
    throw new ConfigValidationError(
      `CONFIG_VALIDATION_ERROR: BEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS must be '21600', got '${parsed.BEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS}'.`
    );
  }

  return Object.freeze({
    projectId: 'gen-lang-client-0311012609' as const,
    projectName: parsed.BEWT_GCP_PROJECT_NAME!,
    account: parsed.BEWT_GCP_ACCOUNT!,
    region: parsed.BEWT_GCP_REGION!,
    zone: 'asia-southeast1-a' as const,
    vmName: 'bewt-covext-runner' as const,
    instanceId: '3042402845209891905' as const,
    machineType: parsed.BEWT_GCP_MACHINE_TYPE!,
    remoteUser: parsed.BEWT_GCP_REMOTE_USER!,
    remoteRepo: parsed.BEWT_GCP_REMOTE_REPO!,
    runtimeProvider: 'GOOGLE_CLOUD_COMPUTE_ENGINE' as const,
    dockerRuntime: 'CLOUD_ONLY' as const,
    localDockerAllowed: false as const,
    cloudBudgetMode: parsed.BEWT_CLOUD_BUDGET_MODE!,
    maxRunDurationSeconds: 21600 as const,
    terminationAction: 'STOP' as const,
    autoCreateVm: false as const,
    autoStartVm: false as const,
    autoExtendVm: false as const,
    envFilePath,
    raw: Object.freeze({ ...parsed }),
  });
}

export interface LoadConfigOptions {
  startDir?: string | undefined;
  envPath?: string | undefined;
}

export function loadCanonicalConfig(options: LoadConfigOptions = {}): ValidatedBewtConfig {
  const filePath = resolveEnvFilePath(options.startDir, { envPath: options.envPath });
  const content = readFileSync(filePath, 'utf8');
  const parsed = parseEnvFileContent(content);
  return validateBewtConfig(parsed, filePath);
}

export function toCloudVmConfig(config: ValidatedBewtConfig): CloudVmConfig {
  return Object.freeze({
    projectId: config.projectId,
    zone: config.zone,
    instanceName: config.vmName,
    expectedInstanceId: config.instanceId,
    expectedMachineTypeSuffix: `machineTypes/${config.machineType}`,
    expectedMaxRunDurationSeconds: config.maxRunDurationSeconds,
    expectedTerminationAction: config.terminationAction,
    sshUser: config.remoteUser,
    remoteRepoPath: config.remoteRepo,
    minRemainingSecondsForRun: 600,
  });
}

/**
 * Safely loads GEMINI_API_KEY from experiments/expresscart/.env without placing secrets in root .env.
 * Falls back to process.env.GEMINI_API_KEY if not found in the dedicated app env file.
 */
export function loadGeminiApiKey(repoRoot?: string): string | undefined {
  let root = repoRoot;
  if (!root) {
    try {
      const canonicalEnv = resolveEnvFilePath();
      root = dirname(canonicalEnv);
    } catch {
      root = resolve(process.cwd());
    }
  }

  const expresscartEnvPath = join(root, 'experiments/expresscart/.env');
  if (existsSync(expresscartEnvPath) && statSync(expresscartEnvPath).isFile()) {
    const content = readFileSync(expresscartEnvPath, 'utf8');
    const parsed = parseEnvFileContent(content);
    if (parsed.GEMINI_API_KEY && parsed.GEMINI_API_KEY.trim() !== '') {
      return parsed.GEMINI_API_KEY.trim();
    }
  }

  return process.env.GEMINI_API_KEY;
}

