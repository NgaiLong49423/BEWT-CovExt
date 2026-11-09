import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolDirectory, '../../..');
const evidenceRoot = resolve(repositoryRoot, 'docs/tasks/T03-B2/evidence');
const runId = process.argv[2] || '';
if (!/^offline-verification-\d{8}-r\d+$/.test(runId)) throw new Error('usage: node record-offline-verification.mjs offline-verification-YYYYMMDD-rN');
const evidenceDirectory = resolve(evidenceRoot, runId);
mkdirSync(evidenceDirectory, { recursive: false });

const files = [
  'experiments/claroline/tools/claroline-g0.mjs',
  'experiments/claroline/tools/run-claroline-diagnostic.mjs',
  'experiments/claroline/tools/run-claroline-g0.mjs',
  'experiments/claroline/tools/cleanup-claroline-g0.mjs',
  'experiments/claroline/tools/child-process-policy.mjs',
  'experiments/claroline/tools/cloud-controller.mjs',
  'experiments/claroline/tools/validate-evidence.mjs',
  'experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs',
  'experiments/claroline/tools/record-offline-verification.mjs',
];
const sha256 = value => createHash('sha256').update(value).digest('hex');
const git = args => {
  const result = spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr || result.error?.message || result.status}`);
  return result.stdout;
};
const head = git(['rev-parse', 'HEAD']).trim();
const trackedDiff = git(['diff', '--name-only', 'HEAD', '--', ...files]).trim().split(/\r?\n/).filter(Boolean);
const sourceBefore = Object.fromEntries(files.map(file => {
  const workingTree = readFileSync(resolve(repositoryRoot, file));
  const headBlobOid = git(['rev-parse', `HEAD:${file}`]).trim();
  const workingTreeBlobOid = git(['hash-object', '--path', file, file]).trim();
  return [file, { workingTreeSha256: sha256(workingTree), headBlobOid, workingTreeBlobOid, matchesHead: workingTreeBlobOid === headBlobOid }];
}));
const commands = [
  ...files.filter(file => file.endsWith('.mjs')).map(file => ['node', '--check', file]),
  ['node', '--test', 'experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs'],
];
const results = [];
for (const [index, command] of commands.entries()) {
  const result = spawnSync(command[0], command.slice(1), { cwd: repositoryRoot, encoding: 'utf8', windowsHide: true, timeout: 120000 });
  const output = `${result.stdout || ''}${result.stderr ? `${result.stdout ? '\n' : ''}${result.stderr}` : ''}`;
  const logName = `command-${String(index + 1).padStart(2, '0')}.log`;
  writeFileSync(resolve(evidenceDirectory, logName), output, { flag: 'wx' });
  results.push({ command, exitCode: result.status ?? 1, signal: result.signal || null, log: logName, logSha256: sha256(output) });
}
const sourceAfter = Object.fromEntries(files.map(file => {
  const workingTree = readFileSync(resolve(repositoryRoot, file));
  const headBlobOid = git(['rev-parse', `HEAD:${file}`]).trim();
  const workingTreeBlobOid = git(['hash-object', '--path', file, file]).trim();
  return [file, { workingTreeSha256: sha256(workingTree), headBlobOid, workingTreeBlobOid, matchesHead: workingTreeBlobOid === headBlobOid }];
}));
const testLog = results.at(-1);
const testOutput = readFileSync(resolve(evidenceDirectory, testLog.log), 'utf8');
const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => {
  const match = testOutput.match(new RegExp(`(?:ℹ|#) ${key} (\\d+)`));
  return [key, match ? Number(match[1]) : null];
}));
const summary = {
  runId,
  capturedAtUtc: new Date().toISOString(),
  headAtTest: head,
  sourceFiles: files,
  sourceHashesBefore: sourceBefore,
  sourceHashesAfter: sourceAfter,
  sourceWorkingTreeDirtyAtTest: trackedDiff.length > 0 || Object.values(sourceBefore).some(item => !item.matchesHead),
  sourceMatchesHeadAtTest: Object.values(sourceBefore).every(item => item.matchesHead) && Object.values(sourceAfter).every(item => item.matchesHead),
  sourceDiffPathsAtTest: trackedDiff,
  commands: results,
  testCounts: counts,
  overallExitCode: results.some(result => result.exitCode !== 0) ? 1 : 0,
};
writeFileSync(resolve(evidenceDirectory, 'verification-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
process.stdout.write(`${JSON.stringify({ runId, headAtTest: head, syntaxChecks: commands.length - 1, testCounts: counts, overallExitCode: summary.overallExitCode, sourceMatchesHeadAtTest: summary.sourceMatchesHeadAtTest, evidenceDirectory }, null, 2)}\n`);
if (summary.overallExitCode !== 0 || !summary.sourceMatchesHeadAtTest) process.exitCode = 1;
