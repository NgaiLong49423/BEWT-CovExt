import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { reserveEvidenceRun, recordMavenEvidence, storeEncryptedArtifact, decryptArtifact, verifyRawArtifactBinding } from '../maven-evidence.mjs';

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

test('concurrent evidence publication creates exactly one immutable complete result', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-005');
  const outcomes = await Promise.allSettled([recordMavenEvidence(run, data()), recordMavenEvidence(run, data())]);
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter(x => x.status === 'rejected' && x.reason.code === 'EEXIST').length, 1);
  assert.equal(JSON.parse(await fs.readFile(path.join(run.dir, 'maven-evidence.json'), 'utf8')).executionVerified, false);
  assert.deepEqual(await fs.readdir(run.dir), ['maven-evidence.json']);
}));

test('refuses to reserve output inside a BEWT read-only source tree', async () => fixture(async (root) => {
  const source = path.join(root, 'bewt-original');
  await fs.mkdir(source);
  await assert.rejects(reserveEvidenceRun(source, 'kanboard-run-006'), /read-only source tree/);
  assert.deepEqual(await fs.readdir(source), []);
}));

test('publication failure preserves existing destination and removes its owned temporary file', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-007');
  const existing = path.join(run.dir, 'maven-evidence.json');
  await fs.mkdir(existing);
  await assert.rejects(recordMavenEvidence(run, data()));
  assert.equal((await fs.stat(existing)).isDirectory(), true);
  assert.deepEqual(await fs.readdir(run.dir), ['maven-evidence.json']);
}));

test('resolves a directory alias before checking the read-only source boundary', async () => fixture(async (root) => {
  const source = path.join(root, 'bewt-original');
  const alias = path.join(root, 'alias');
  await fs.mkdir(source);
  await fs.symlink(source, alias, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(reserveEvidenceRun(alias, 'kanboard-run-008'), /read-only source tree/);
  assert.deepEqual(await fs.readdir(source), []);
}));

test('encrypts raw artifacts outside Git without storing key or plaintext and decrypts in memory', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-009');
  const key = randomBytes(32); const secret = Buffer.from('TEST_ONLY_PRIVATE_SECRET');
  const a = await storeEncryptedArtifact(run, 'surefire-original', secret, key);
  await storeEncryptedArtifact(run, 'maven-stdout', secret, key);
  const first = await fs.readFile(path.join(run.dir, 'surefire-original.aesgcm.json'), 'utf8');
  const second = JSON.parse(await fs.readFile(path.join(run.dir, 'maven-stdout.aesgcm.json'), 'utf8'));
  const envelope = JSON.parse(first);
  assert.doesNotMatch(first, /TEST_ONLY_PRIVATE_SECRET/);
  assert.equal(first.includes(key.toString('hex')), false);
  assert.equal(first.includes(key.toString('base64')), false);
  assert.notEqual(envelope.nonceHex, second.nonceHex);
  assert.equal(a.plaintextPersisted, false);
  assert.deepEqual(decryptArtifact(envelope, run.runId, 'surefire-original', key), secret);
  await assert.rejects(storeEncryptedArtifact(run, 'surefire-original', secret, key), { code: 'EEXIST' });
  assert.equal(await fs.readFile(path.join(run.dir, 'surefire-original.aesgcm.json'), 'utf8'), first);
}));

test('rejects tampered ciphertext, tag, identity, plaintext hash and incorrect key', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-010'); const key = randomBytes(32);
  await storeEncryptedArtifact(run, 'surefire-original', Buffer.from('data'), key);
  const e = JSON.parse(await fs.readFile(path.join(run.dir, 'surefire-original.aesgcm.json'), 'utf8'));
  const changed = Buffer.from(e.ciphertextBase64, 'base64'); changed[0] ^= 1;
  assert.throws(() => decryptArtifact({ ...e, ciphertextBase64: changed.toString('base64') }, run.runId, 'surefire-original', key));
  assert.throws(() => decryptArtifact({ ...e, tagHex: '0'.repeat(32) }, run.runId, 'surefire-original', key));
  assert.throws(() => decryptArtifact({ ...e, plaintextSha256: '0'.repeat(64) }, run.runId, 'surefire-original', key));
  assert.throws(() => decryptArtifact(e, 'kanboard-run-011', 'surefire-original', key), /identity/);
  assert.throws(() => decryptArtifact(e, run.runId, 'maven-stdout', key), /identity/);
  assert.throws(() => decryptArtifact({ ...e, runId: 'kanboard-run-011' }, 'kanboard-run-011', 'surefire-original', key));
  assert.throws(() => decryptArtifact({ ...e, artifactName: 'maven-stdout' }, run.runId, 'maven-stdout', key));
  assert.throws(() => decryptArtifact({ ...e, ciphertextBase64: '%%%bad' }, run.runId, 'surefire-original', key), /Malformed/);
  assert.throws(() => decryptArtifact(e, run.runId, 'surefire-original', randomBytes(32)));
}));

test('rejects raw storage in any Git worktree and rejects invalid names or keys', async () => fixture(async (root) => {
  await fs.mkdir(path.join(root, '.git')); const run = await reserveEvidenceRun(root, 'kanboard-run-012');
  await assert.rejects(storeEncryptedArtifact(run, 'surefire-original', Buffer.from('raw'), randomBytes(32)), /Git worktree/);
  await assert.rejects(storeEncryptedArtifact(run, '../escape', Buffer.from('raw'), randomBytes(32)), /Unsupported/);
  await assert.rejects(storeEncryptedArtifact(run, 'surefire-original', Buffer.from('raw'), Buffer.alloc(3)), /32 bytes/);
  assert.deepEqual(await fs.readdir(run.dir), []);
}));

test('verifies raw hashes against the record without claiming execution or sanitizer validity', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-013'); const key = randomBytes(32); const input = data();
  await recordMavenEvidence(run, input);
  await storeEncryptedArtifact(run, 'maven-stdout', input.stdout, key);
  await storeEncryptedArtifact(run, 'maven-stderr', input.stderr, key);
  await assert.rejects(verifyRawArtifactBinding(run, key), { code: 'ENOENT' });
  await storeEncryptedArtifact(run, 'surefire-original', input.rawXml, key);
  const verified = await verifyRawArtifactBinding(run, key);
  assert.equal(verified.status, 'RAW_HASH_BINDING_MATCH');
  assert.equal(verified.executionVerified, false); assert.equal(verified.sanitizationLinkVerified, false);
  await assert.rejects(verifyRawArtifactBinding(run, randomBytes(32)));
}));

test('detects a raw artifact that differs from its recorded hash', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-014'); const key = randomBytes(32); const input = data();
  await recordMavenEvidence(run, input);
  await storeEncryptedArtifact(run, 'maven-stdout', Buffer.from('different'), key);
  await storeEncryptedArtifact(run, 'maven-stderr', input.stderr, key);
  await storeEncryptedArtifact(run, 'surefire-original', input.rawXml, key);
  await assert.rejects(verifyRawArtifactBinding(run, key), /hash mismatch/);
}));

test('rejects changing keys within one run and reusing a run key in another run in this process', async () => fixture(async (root) => {
  const first = await reserveEvidenceRun(root, 'kanboard-run-015');
  const second = await reserveEvidenceRun(root, 'kanboard-run-016');
  const key = randomBytes(32);
  await storeEncryptedArtifact(first, 'maven-stdout', Buffer.from('x'), key);
  await assert.rejects(storeEncryptedArtifact(first, 'maven-stderr', Buffer.from('y'), randomBytes(32)), /same key/);
  await assert.rejects(storeEncryptedArtifact(second, 'maven-stdout', Buffer.from('x'), key), /another run/);
  assert.deepEqual(await fs.readdir(second.dir), []);
}));

test('binding verification rejects a non-regular encrypted evidence file', async () => fixture(async (root) => {
  const run = await reserveEvidenceRun(root, 'kanboard-run-017'); const key = randomBytes(32); const input = data();
  await recordMavenEvidence(run, input);
  await storeEncryptedArtifact(run, 'maven-stdout', input.stdout, key);
  await storeEncryptedArtifact(run, 'maven-stderr', input.stderr, key);
  await storeEncryptedArtifact(run, 'surefire-original', input.rawXml, key);
  const target = path.join(run.dir, 'surefire-original.aesgcm.json');
  await fs.rename(target, `${target}.saved`); await fs.mkdir(target);
  await assert.rejects(verifyRawArtifactBinding(run, key), /not a regular file/);
}));
