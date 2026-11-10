import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test, { describe } from 'node:test';

import {
  loadCanonicalConfig,
  resolveEnvFilePath,
  toCloudVmConfig,
  validateBewtConfig,
} from '../../src/runtime/config-loader.js';

describe('Adversarial Challenger 2 — Worktree Resolution & Cloud Controller Compatibility', () => {
  test('1. live worktrees resolution across all paths in git worktree list', () => {
    let rawList = '';
    try {
      rawList = execSync('git worktree list --porcelain', { encoding: 'utf8' });
    } catch {
      // Fallback if git fails
      return;
    }

    const lines = rawList.split('\n');
    const worktreeDirs = lines
      .filter((l) => l.startsWith('worktree '))
      .map((l) => l.slice(9).trim())
      .filter((p) => existsSync(p));

    assert.ok(worktreeDirs.length > 0, 'Must discover at least one active worktree');

    for (const wt of worktreeDirs) {
      // Root of worktree
      const resolved = resolveEnvFilePath(wt);
      assert.ok(existsSync(resolved), `Resolved .env must exist on disk for worktree: ${wt}`);
      assert.ok(resolved.endsWith('.env'), `Resolved path must end with .env: ${resolved}`);

      const config = loadCanonicalConfig({ startDir: wt });
      assert.equal(config.projectId, 'gen-lang-client-0311012609');
      assert.equal(config.zone, 'asia-southeast1-a');
      assert.equal(config.vmName, 'bewt-covext-runner');
      assert.equal(config.instanceId, '3042402845209891905');

      // Test deep subdirectories if present
      const candidates = [
        join(wt, 'framework'),
        join(wt, 'experiments'),
        join(wt, 'experiments', 'claroline', 'tools'),
        join(wt, 'docs', 'program'),
      ];
      for (const deep of candidates) {
        if (existsSync(deep)) {
          const deepResolved = resolveEnvFilePath(deep);
          assert.equal(deepResolved, resolved, `Deep resolution from ${deep} must match root resolution`);
          const deepConfig = loadCanonicalConfig({ startDir: deep });
          assert.equal(deepConfig.projectId, 'gen-lang-client-0311012609');
        }
      }
    }
  });

  test('2. simulated worktree with CRLF line endings and trailing whitespace', () => {
    const sandbox = join(tmpdir(), `bewt-adv-crlf-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const mainRepo = join(sandbox, 'main-repo');
    const worktree = join(sandbox, 'worktree-crlf');
    const deepSub = join(worktree, 'deep', 'nested', 'dir');

    try {
      mkdirSync(join(mainRepo, '.git', 'worktrees', 'wt-crlf'), { recursive: true });
      mkdirSync(deepSub, { recursive: true });

      const envContent = 'BEWT_GCP_PROJECT_ID=gen-lang-client-0311012609\nBEWT_GCP_PROJECT_NAME=Mina\nBEWT_GCP_ACCOUNT=longgiango511@gmail.com\nBEWT_GCP_REGION=asia-southeast1\nBEWT_GCP_ZONE=asia-southeast1-a\nBEWT_GCP_VM_NAME=bewt-covext-runner\nBEWT_GCP_INSTANCE_ID=3042402845209891905\nBEWT_GCP_MACHINE_TYPE=c4d-highmem-8\nBEWT_GCP_REMOTE_USER=runner\nBEWT_GCP_REMOTE_REPO=/home/runner/BEWT-CovExt\nBEWT_RUNTIME_PROVIDER=GOOGLE_CLOUD_COMPUTE_ENGINE\nBEWT_DOCKER_RUNTIME=CLOUD_ONLY\nBEWT_LOCAL_DOCKER_ALLOWED=false\nBEWT_CLOUD_BUDGET_MODE=UNLIMITED_USER_AUTHORIZED\nBEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS=21600\nBEWT_GCP_EXPECTED_TERMINATION_ACTION=STOP\nBEWT_GCP_AUTO_CREATE_VM=false\nBEWT_GCP_AUTO_START_VM=false\nBEWT_GCP_AUTO_EXTEND_VM=false\n';
      writeFileSync(join(mainRepo, '.env'), envContent);

      // Write .git with CRLF and spaces
      const gitdirTarget = join(mainRepo, '.git', 'worktrees', 'wt-crlf');
      writeFileSync(join(worktree, '.git'), `gitdir:   ${gitdirTarget}  \r\n`);

      // Write commondir with CRLF
      writeFileSync(join(gitdirTarget, 'commondir'), '../..\r\n');

      const resolved = resolveEnvFilePath(deepSub);
      assert.equal(resolved, join(mainRepo, '.env'));

      const config = loadCanonicalConfig({ startDir: deepSub });
      assert.equal(config.instanceId, '3042402845209891905');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test('3. simulated worktree with missing commondir file (fallback logic)', () => {
    const sandbox = join(tmpdir(), `bewt-adv-nocommondir-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const mainRepo = join(sandbox, 'main-repo');
    const worktree = join(sandbox, 'worktree-nocommon');

    try {
      // Normal git structure: main-repo/.git/worktrees/wt1
      // fallback resolves worktreeGitDir, '../../..' which reaches mainRepo
      mkdirSync(join(mainRepo, '.git', 'worktrees', 'wt1'), { recursive: true });
      mkdirSync(worktree, { recursive: true });

      const envContent = 'BEWT_GCP_PROJECT_ID=gen-lang-client-0311012609\nBEWT_GCP_PROJECT_NAME=Mina\nBEWT_GCP_ACCOUNT=longgiango511@gmail.com\nBEWT_GCP_REGION=asia-southeast1\nBEWT_GCP_ZONE=asia-southeast1-a\nBEWT_GCP_VM_NAME=bewt-covext-runner\nBEWT_GCP_INSTANCE_ID=3042402845209891905\nBEWT_GCP_MACHINE_TYPE=c4d-highmem-8\nBEWT_GCP_REMOTE_USER=runner\nBEWT_GCP_REMOTE_REPO=/home/runner/BEWT-CovExt\nBEWT_RUNTIME_PROVIDER=GOOGLE_CLOUD_COMPUTE_ENGINE\nBEWT_DOCKER_RUNTIME=CLOUD_ONLY\nBEWT_LOCAL_DOCKER_ALLOWED=false\nBEWT_CLOUD_BUDGET_MODE=UNLIMITED_USER_AUTHORIZED\nBEWT_GCP_EXPECTED_MAX_RUN_DURATION_SECONDS=21600\nBEWT_GCP_EXPECTED_TERMINATION_ACTION=STOP\nBEWT_GCP_AUTO_CREATE_VM=false\nBEWT_GCP_AUTO_START_VM=false\nBEWT_GCP_AUTO_EXTEND_VM=false\n';
      writeFileSync(join(mainRepo, '.env'), envContent);

      writeFileSync(join(worktree, '.git'), `gitdir: ${join(mainRepo, '.git', 'worktrees', 'wt1')}\n`);
      // intentionally do NOT write commondir file

      const resolved = resolveEnvFilePath(worktree);
      assert.equal(resolved, join(mainRepo, '.env'));

      const config = loadCanonicalConfig({ startDir: worktree });
      assert.equal(config.vmName, 'bewt-covext-runner');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test('4. Cloud Controller adapter schema exactly matches Section 4 Master Goal', () => {
    const raw = {
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
    };

    const validated = validateBewtConfig(raw, '/dummy/.env');
    const cloudVm = toCloudVmConfig(validated);

    // Section 4 Master Goal fields
    assert.equal(cloudVm.projectId, 'gen-lang-client-0311012609');
    assert.equal(cloudVm.zone, 'asia-southeast1-a');
    assert.equal(cloudVm.instanceName, 'bewt-covext-runner');
    assert.equal(cloudVm.expectedInstanceId, '3042402845209891905');
    assert.equal(cloudVm.expectedMachineTypeSuffix, 'machineTypes/c4d-highmem-8');
    assert.equal(cloudVm.expectedMaxRunDurationSeconds, 21600);
    assert.equal(typeof cloudVm.expectedMaxRunDurationSeconds, 'number');
    assert.equal(cloudVm.expectedTerminationAction, 'STOP');
    assert.equal(cloudVm.sshUser, 'runner');
    assert.equal(cloudVm.remoteRepoPath, '/home/runner/BEWT-CovExt');
    assert.equal(cloudVm.minRemainingSecondsForRun, 600);

    // Verify object immutability
    assert.ok(Object.isFrozen(cloudVm));
  });
});
