import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { describe } from 'node:test';

import {
  loadCanonicalConfig,
  parseEnvFileContent,
  resolveEnvFilePath,
  toCloudVmConfig,
  validateBewtConfig,
} from '../../src/runtime/config-loader.js';

const VALID_ENV_TEXT = `
# Comment at top
BEWT_GCP_PROJECT_ID=gen-lang-client-0311012609
BEWT_GCP_PROJECT_NAME="Mina"
BEWT_GCP_ACCOUNT='longgiango511@gmail.com'
BEWT_GCP_REGION=asia-southeast1
BEWT_GCP_ZONE=asia-southeast1-a
BEWT_GCP_VM_NAME=bewt-covext-runner
BEWT_GCP_INSTANCE_ID=3042402845209891905
BEWT_GCP_MACHINE_TYPE=c4d-highmem-8
BEWT_GCP_REMOTE_USER=runner
BEWT_GCP_REMOTE_REPO=/home/runner/BEWT-CovExt
BEWT_RUNTIME_PROVIDER=GOOGLE_CLOUD_COMPUTE_ENGINE
BEWT_DOCKER_RUNTIME=CLOUD_ONLY
BEWT_LOCAL_DOCKER_ALLOWED=false
BEWT_CLOUD_BUDGET_MODE=UNLIMITED_USER_AUTHORIZED
BEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS=21600
BEWT_GCP_EXPECTED_TERMINATION_ACTION=STOP
BEWT_GCP_AUTO_CREATE_VM=false
BEWT_GCP_AUTO_START_VM=false
BEWT_GCP_AUTO_EXTEND_VM=false
`;

describe('Config Loader — Unit Tests', () => {
  test('1. valid configuration parses and validates correctly with frozen object', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    const config = validateBewtConfig(parsed, '/mock/path/.env');
    assert.equal(config.projectId, 'gen-lang-client-0311012609');
    assert.equal(config.projectName, 'Mina');
    assert.equal(config.account, 'longgiango511@gmail.com');
    assert.equal(config.zone, 'asia-southeast1-a');
    assert.equal(config.vmName, 'bewt-covext-runner');
    assert.equal(config.instanceId, '3042402845209891905');
    assert.equal(config.localDockerAllowed, false);
    assert.equal(config.dockerRuntime, 'CLOUD_ONLY');
    assert.equal(config.maxRunDurationSeconds, 21600);
    assert.equal(config.terminationAction, 'STOP');
    assert.ok(Object.isFrozen(config));
    assert.ok(Object.isFrozen(config.raw));
  });

  test('2. throws CONFIG_VALIDATION_ERROR when required key is missing', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    delete parsed.BEWT_GCP_INSTANCE_ID;
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_VALIDATION_ERROR' && err.message.includes('BEWT_GCP_INSTANCE_ID')
    );
  });

  test('3. throws CONFIG_VALIDATION_ERROR on project ID mismatch', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_GCP_PROJECT_ID = 'other-project-999';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_VALIDATION_ERROR' && err.message.includes('other-project-999')
    );
  });

  test('4. throws CONFIG_VALIDATION_ERROR on zone mismatch', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_GCP_ZONE = 'us-central1-a';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_VALIDATION_ERROR' && err.message.includes('us-central1-a')
    );
  });

  test('5. throws CONFIG_VALIDATION_ERROR on VM name mismatch', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_GCP_VM_NAME = 'wrong-vm-runner';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_VALIDATION_ERROR' && err.message.includes('wrong-vm-runner')
    );
  });

  test('6. throws CONFIG_VALIDATION_ERROR on instance ID mismatch', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_GCP_INSTANCE_ID = '9999999999999999999';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_VALIDATION_ERROR' && err.message.includes('9999999999999999999')
    );
  });

  test('7. throws CONFIG_SECURITY_VIOLATION when BEWT_LOCAL_DOCKER_ALLOWED is true', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_LOCAL_DOCKER_ALLOWED = 'true';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_SECURITY_VIOLATION' && err.message.includes('BEWT_LOCAL_DOCKER_ALLOWED')
    );
  });

  test('8. throws CONFIG_SECURITY_VIOLATION when BEWT_DOCKER_RUNTIME is not CLOUD_ONLY', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_DOCKER_RUNTIME = 'LOCAL';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_SECURITY_VIOLATION' && err.message.includes('CLOUD_ONLY')
    );
  });

  test('9. throws CONFIG_SECURITY_VIOLATION when VM auto policies are not false', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_GCP_AUTO_CREATE_VM = 'true';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_SECURITY_VIOLATION' && err.message.includes('BEWT_GCP_AUTO_CREATE_VM')
    );

    const parsed2 = parseEnvFileContent(VALID_ENV_TEXT);
    parsed2.BEWT_GCP_AUTO_START_VM = 'true';
    assert.throws(
      () => validateBewtConfig(parsed2, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_SECURITY_VIOLATION' && err.message.includes('BEWT_GCP_AUTO_START_VM')
    );

    const parsed3 = parseEnvFileContent(VALID_ENV_TEXT);
    parsed3.BEWT_GCP_AUTO_EXTEND_VM = 'true';
    assert.throws(
      () => validateBewtConfig(parsed3, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_SECURITY_VIOLATION' && err.message.includes('BEWT_GCP_AUTO_EXTEND_VM')
    );
  });

  test('10. throws CONFIG_SECURITY_VIOLATION when GEMINI_API_KEY is present in root .env', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.GEMINI_API_KEY = 'AIzaSySecretApiKeyHere';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_SECURITY_VIOLATION' && err.message.includes('experiments/expresscart/.env')
    );
  });

  test('11. throws CONFIG_SECURITY_VIOLATION when private key material is detected', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    parsed.BEWT_GCP_ACCOUNT = '-----BEGIN OPENSSH PRIVATE KEY-----';
    assert.throws(
      () => validateBewtConfig(parsed, '/mock/path/.env'),
      (err: any) => err.code === 'CONFIG_SECURITY_VIOLATION' && err.message.includes('Private key material')
    );
  });

  test('12. resolves .env across simulated git worktree structure', () => {
    const sandbox = join(tmpdir(), `bewt-test-wt-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const mainRepo = join(sandbox, 'main-repo');
    const worktree = join(sandbox, 'worktree-1');
    const subWorktree = join(worktree, 'deep', 'sub');

    try {
      mkdirSync(join(mainRepo, '.git', 'worktrees', 'wt1'), { recursive: true });
      mkdirSync(subWorktree, { recursive: true });

      // Main repo has canonical .env
      writeFileSync(join(mainRepo, '.env'), VALID_ENV_TEXT);

      // Worktree has .git file pointing to main repo worktree
      writeFileSync(
        join(worktree, '.git'),
        `gitdir: ${join(mainRepo, '.git', 'worktrees', 'wt1').replaceAll('\\', '/')}\n`
      );

      // Write commondir inside worktree git dir
      writeFileSync(join(mainRepo, '.git', 'worktrees', 'wt1', 'commondir'), '../..\n');

      const resolved = resolveEnvFilePath(subWorktree);
      assert.equal(resolved, join(mainRepo, '.env'));

      const loaded = loadCanonicalConfig({ startDir: subWorktree });
      assert.equal(loaded.projectId, 'gen-lang-client-0311012609');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test('13. throws CONFIG_FILE_NOT_FOUND when no .env exists in tree', () => {
    const sandbox = join(tmpdir(), `bewt-test-empty-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(sandbox, 'sub'), { recursive: true });
    try {
      assert.throws(
        () => resolveEnvFilePath(join(sandbox, 'sub')),
        (err: any) => err.code === 'CONFIG_FILE_NOT_FOUND'
      );
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test('14. toCloudVmConfig produces schema compatible with cloud-controller.mjs', () => {
    const parsed = parseEnvFileContent(VALID_ENV_TEXT);
    const config = validateBewtConfig(parsed, '/mock/path/.env');
    const vmConfig = toCloudVmConfig(config);

    assert.equal(vmConfig.projectId, 'gen-lang-client-0311012609');
    assert.equal(vmConfig.zone, 'asia-southeast1-a');
    assert.equal(vmConfig.instanceName, 'bewt-covext-runner');
    assert.equal(vmConfig.expectedInstanceId, '3042402845209891905');
    assert.equal(vmConfig.expectedMachineTypeSuffix, 'machineTypes/c4d-highmem-8');
    assert.equal(vmConfig.expectedMaxRunDurationSeconds, 21600);
    assert.equal(vmConfig.expectedTerminationAction, 'STOP');
    assert.equal(vmConfig.sshUser, 'runner');
    assert.equal(vmConfig.remoteRepoPath, '/home/runner/BEWT-CovExt');
    assert.equal(vmConfig.minRemainingSecondsForRun, 600);
  });
});
