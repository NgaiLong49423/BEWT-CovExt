import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { reserveEvidenceRun, recordMavenEvidence } from '../maven-evidence.mjs';

const data = () => ({ executable: 'mvn', port: 49153, args: ['-Dtest=tests.AddNewProject', '-Dapp.url=http://127.0.0.1:49153', 'test'], cwd: 'experiments/kanboard/bewt-suite', sourceCommit: '00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b', benchmarkCommit: '0501249ff3e9a5ea83a06155cd2971dc36197056', processStatus: 'EXITED', exitCode: 0, startedAt: '2026-11-10T00:00:00.000Z', endedAt: '2026-11-10T00:00:02.000Z', stdout: Buffer.from('password=SECRET'), stderr: Buffer.from(''), rawXml: Buffer.from('<raw>SECRET</raw>'), sanitizedXml: Buffer.from('<sanitized/>') });
async function fixture(fn) { const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kanboard-evidence-test-')); try { await fn(root); } finally { await fs.rm(root, { recursive: true, force: true }); } }

test('captures hashes, exact fixed arguments and explicit limitations without storing raw bytes', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-001');
  const result = await recordMavenEvidence(run, data());
  assert.equal(result.executionVerified, false); assert.equal(result.sanitizationLinkVerified, false);
  assert.notEqual(result.sha256.rawXml, result.sha256.sanitizedXml);
  const disk = await fs.readFile(path.join(run.dir, 'maven-evidence.json'), 'utf8');
  assert.doesNotMatch(disk, /SECRET/); assert.deepEqual(JSON.parse(disk), result);
}));

test('refuses duplicate run IDs and duplicate evidence without overwriting', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-002');
  await assert.rejects(reserveEvidenceRun(root, 'kanboard-run-002'), { code: 'EEXIST' });
  await recordMavenEvidence(run, data()); const before = await fs.readFile(path.join(run.dir, 'maven-evidence.json'));
  await assert.rejects(recordMavenEvidence(run, data()), { code: 'EEXIST' });
  assert.deepEqual(await fs.readFile(path.join(run.dir, 'maven-evidence.json')), before);
}));

test('rejects invalid identities, command mutations, incomplete output and invalid status before writing', async () => fixture(async (root) => {
  await assert.rejects(reserveEvidenceRun(root, '../escape'));
  const run = await reserveEvidenceRun(root, 'kanboard-run-003');
  await assert.rejects(recordMavenEvidence({ ...run }, data()), /not reserved/);
  for (const patch of [{ args: ['test'] }, { executable: 'sh' }, { exitCode: null }, { rawXml: Buffer.alloc(0) }, { sourceCommit: 'bad' }, { stderr: 'not bytes' }, { startedAt: { value: '2026-11-10T00:00:00.000Z', secret: 'SECRET' } }, { endedAt: 'not a timestamp' }]) {
    await assert.rejects(recordMavenEvidence(run, { ...data(), ...patch }));
    await assert.rejects(fs.access(path.join(run.dir, 'maven-evidence.json')), { code: 'ENOENT' });
  }
}));

test('records failed invocations without XML rather than presenting them as passed', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-004');
  const record = await recordMavenEvidence(run, { ...data(), processStatus: 'TIMED_OUT', exitCode: null, rawXml: null, sanitizedXml: null });
  assert.equal(record.processStatus, 'TIMED_OUT'); assert.equal(record.sha256.rawXml, null); assert.equal(record.executionVerified, false);
}));
