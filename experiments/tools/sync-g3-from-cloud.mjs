import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { resolveVmExternalIp } from '../claroline/tools/cloud-controller.mjs';

const home = process.env.USERPROFILE || process.env.HOME || '';
const sshKey = resolve(home, '.ssh', 'google_compute_engine');
const hostIp = resolveVmExternalIp();

const localTarget = resolve('docs/tasks');
mkdirSync(localTarget, { recursive: true });

console.log(`Downloading g3-evidence from Cloud VM (${hostIp})...`);

const scp = spawnSync('scp', [
  '-r',
  '-o', 'BatchMode=yes',
  '-o', 'StrictHostKeyChecking=no',
  '-i', sshKey,
  `runner@${hostIp}:/home/runner/BEWT-CovExt/docs/tasks/g3-evidence`,
  localTarget,
], { encoding: 'utf8', timeout: 300000 });

if (scp.status === 0) {
  console.log('✓ Successfully downloaded docs/tasks/g3-evidence from Cloud VM');
} else {
  console.error('Failed to download g3-evidence:', scp.stderr || scp.stdout);
  process.exit(1);
}
