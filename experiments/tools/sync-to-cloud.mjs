import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveVmExternalIp } from '../claroline/tools/cloud-controller.mjs';

const FILES_TO_SYNC = [
  'experiments/kanboard/bewt-suite/src/test/java/tests/BaseTest.java',
  'experiments/joomla/bewt-suite/src/test/java/base/Installer.java',
  'experiments/mediawiki/bewt-suite/src/main/java/po/PageCreationPage.java',
  'experiments/mantisbt/bewt-suite/src/test/java/base/BaseTest.java',
  'experiments/mantisbt/bewt-suite/src/test/java/base/AddUser.java',
  'framework/src/runtime/maven-command.ts',
  'experiments/tools/unified-g0-runner.mjs',
  'experiments/tools/run-all-g0-cloud.mjs',
  'experiments/tools/run-all-candidates-cloud.mjs',
  'experiments/tools/run-g0.sh',
  'experiments/bludit/tools/run-bludit-g0.mjs',
  'experiments/claroline/tools/run-claroline-g0.mjs',
  'experiments/claroline/tools/run-claroline-diagnostic.mjs',
  'experiments/claroline/tools/cloud-controller.mjs',
  'experiments/expresscart/tools/run-expresscart-g0.mjs',
  'experiments/joomla/tools/run-joomla-g0.mjs',
  'experiments/kanboard/tools/run-kanboard-g0.mjs',
  'experiments/mantisbt/tools/run-mantisbt-g0.mjs',
  'experiments/mediawiki/tools/run-mediawiki-g0.mjs',
  'experiments/prestashop/tools/run-prestashop-g0.mjs',
];

const home = process.env.USERPROFILE || process.env.HOME || '';
const sshKey = resolve(home, '.ssh', 'google_compute_engine');
const hostIp = resolveVmExternalIp();

console.log(`Syncing ${FILES_TO_SYNC.length} files to Cloud VM (${hostIp})...`);

for (const relPath of FILES_TO_SYNC) {
  const remotePath = `/home/runner/BEWT-CovExt/${relPath.replaceAll('\\', '/')}`;
  const remoteDir = remotePath.slice(0, remotePath.lastIndexOf('/'));
  
  // Ensure remote directory exists
  spawnSync('ssh', [
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=no',
    '-i', sshKey,
    `runner@${hostIp}`,
    `mkdir -p "${remoteDir}"`,
  ], { encoding: 'utf8' });

  // SCP file
  const scp = spawnSync('scp', [
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=no',
    '-i', sshKey,
    relPath,
    `runner@${hostIp}:${remotePath}`,
  ], { encoding: 'utf8' });

  if (scp.status !== 0) {
    console.error(`FAILED syncing ${relPath}: ${scp.stderr || scp.stdout}`);
    process.exit(1);
  }
  console.log(`  ✓ ${relPath}`);
}

console.log('All files synced successfully to Cloud VM.');
