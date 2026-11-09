import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstat, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

// Fixed system installation paths prevent executable lookup through an untrusted PATH.
const gitExecutable = process.platform === 'win32' ? 'C:\\Program Files\\Git\\cmd\\git.exe' : '/usr/bin/git';

const [sourceRootArg, outputArg] = process.argv.slice(2);
if (!sourceRootArg || !outputArg) throw new Error('Usage: node record-baseline-provenance.mjs <read-only-bewt-original-root> <new-output.json>');
const sourceRoot = resolve(sourceRootArg);
const output = resolve(outputArg);
// Follow existing parent symlinks before checking containment; never write evidence into the read-only source tree.
const realSourceRoot = await realpath(sourceRoot);
const realOutputParent = await realpath(dirname(output));
const outputParentRelative = relative(realSourceRoot, realOutputParent);
if (outputParentRelative === '' || (!outputParentRelative.startsWith(`..${sep}`) && outputParentRelative !== '..' && !isAbsolute(outputParentRelative))) {
  throw new Error('Output must be outside the read-only BEWT source tree');
}
const benchmarkCommit = execFileSync(gitExecutable, ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(benchmarkCommit)) throw new Error('Could not resolve the pinned BEWT source commit');
const root = resolve(import.meta.dirname, '../../../..');
const apps = [
  { id: 'joomla', versionDir: 'joomla-3.10.11' },
  { id: 'mantisbt', versionDir: 'mantisbt-1.2.0' },
  { id: 'mediawiki', versionDir: 'mediawiki-1.40.0' },
  { id: 'prestashop', versionDir: 'prestashop-1.6.1.23' },
];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function walk(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed in baseline source: ${path}`);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (entry.isFile()) output.push(path);
  }
  return output;
}
const records = [];
for (const app of apps) {
  const sourceSuite = join(sourceRoot, app.id, 'baseline', app.versionDir);
  const workSuite = join(root, 'experiments', app.id, 'bewt-suite');
  const sourceRelative = join(app.id, 'baseline', app.versionDir).split(sep).join('/');
  const dirty = execFileSync(gitExecutable, ['-C', sourceRoot, 'status', '--porcelain=v1', '--', sourceRelative], { encoding: 'utf8' }).trim();
  const inputs = [join(sourceSuite, 'pom.xml'), ...(await walk(join(sourceSuite, 'src', 'main', 'java'))), ...(await walk(join(sourceSuite, 'src', 'test', 'java')))];
  const files = [];
  for (const sourceFile of inputs) {
    const rel = relative(sourceSuite, sourceFile);
    const workFile = join(workSuite, rel);
    const sourceBytes = await readFile(sourceFile);
    const copiedBytes = await readFile(workFile);
    const sourceRelRepo = relative(sourceRoot, sourceFile).split(sep).join('/');
    const sourceBlobAtHead = execFileSync(gitExecutable, ['-C', sourceRoot, 'rev-parse', `HEAD:${sourceRelRepo}`], { encoding: 'utf8' }).trim();
    const sourceBlobWorking = execFileSync(gitExecutable, ['-C', sourceRoot, 'hash-object', '--', sourceRelRepo], { encoding: 'utf8' }).trim();
    const copyBlob = execFileSync(gitExecutable, ['-C', root, 'hash-object', '--', relative(root, workFile).split(sep).join('/')], { encoding: 'utf8' }).trim();
    files.push({ path: rel.split(sep).join('/'), sourceSha256: sha256(sourceBytes), sourceGitBlobAtHead: sourceBlobAtHead, sourceWorkingGitBlob: sourceBlobWorking, workCopySha256: sha256(copiedBytes), workCopyGitBlob: copyBlob, byteIdentical: sourceBytes.equals(copiedBytes) });
  }
  records.push({ app: app.id, sourceVersionDirectory: `${app.id}/baseline/${app.versionDir}`, sourceDirtyForSuite: Boolean(dirty), sourceDirtyStatus: dirty || 'CLEAN', fileCount: files.length, unchangedFiles: files.filter((x) => x.byteIdentical).length, adaptedFiles: files.filter((x) => !x.byteIdentical).map((x) => x.path), files });
}
const result = { schemaVersion: '1.0.0', testedRepositoryHead: execFileSync(gitExecutable, ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), benchmarkSourceCommit: benchmarkCommit, generatedAt: new Date().toISOString(), sourceRootRecordedAs: 'bewt-original/', filesAreReadOnlySourceCopies: true, applications: records };
try { await lstat(output); throw new Error(`Output already exists; evidence is write-once: ${output}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output: relative(root, output).split(sep).join('/'), benchmarkSourceCommit: benchmarkCommit, apps: records.map(({ app, fileCount, unchangedFiles, adaptedFiles, sourceDirtyForSuite }) => ({ app, fileCount, unchangedFiles, adaptedCount: fileCount - unchangedFiles, adaptedFiles, sourceDirtyForSuite })) }, null, 2));