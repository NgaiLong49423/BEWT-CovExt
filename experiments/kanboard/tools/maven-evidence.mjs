import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { link, lstat, mkdir, readFile, realpath, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertRunId, seleniumTestArguments, SOURCE_COMMIT, BEWT_SOURCE_COMMIT } from './kanboard-g0.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const reserved = new WeakSet();
const usedNonces = new WeakMap();
const keyOwners = new Map();
const runKeyHashes = new WeakMap();
const ARTIFACT_NAMES = new Set(['maven-stdout', 'maven-stderr', 'surefire-original']);
const MAX_PRIVATE_BYTES = 16 * 1024 * 1024;
const MAX_ENVELOPE_BYTES = Math.ceil(MAX_PRIVATE_BYTES / 3) * 4 + 4096;

/** Reserve an empty run directory. The root must already exist; an existing run ID is never reused. */
export async function reserveEvidenceRun(evidenceRoot, runId) {
  assertRunId(runId);
  if (!path.isAbsolute(evidenceRoot)) throw new Error('Evidence root must be an absolute path');
  const root = await realpath(evidenceRoot);
  if (root.split(path.sep).some((part) => part.toLowerCase() === 'bewt-original')) throw new Error('Evidence root must not be in a BEWT read-only source tree');
  const dir = path.join(root, runId);
  await mkdir(dir, { mode: 0o700 });
  const run = Object.freeze({ root, runId, dir });
  reserved.add(run);
  usedNonces.set(run, new Set());
  return run;
}

/**
 * Persist a caller-supplied Maven invocation summary without persisting raw output.
 * This is a write-once evidence primitive, not a process runner or proof of execution.
 */
export async function recordMavenEvidence(run, input) {
  if (!run || !reserved.has(run)) throw new Error('Run was not reserved by this process');
  assertRunId(run.runId);
  if (!path.isAbsolute(run.root) || run.dir !== path.join(run.root, run.runId)) throw new Error('Invalid reserved run');
  if (await realpath(run.dir) !== run.dir) throw new Error('Run directory resolves to a different path');
  if (!input || typeof input !== 'object') throw new Error('Maven evidence is required');
  if (!['mvn', 'mvn.cmd'].includes(input.executable)) throw new Error('Unsupported Maven executable name');
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) throw new Error('Invalid loopback port');
  const expectedArgs = seleniumTestArguments(input.port);
  if (!Array.isArray(input.args) || JSON.stringify(input.args) !== JSON.stringify(expectedArgs)) throw new Error('Maven arguments differ from the fixed Kanboard smoke command');
  if (input.cwd !== 'experiments/kanboard/bewt-suite') throw new Error('Unexpected caller-reported working directory');
  if (input.sourceCommit !== SOURCE_COMMIT || input.benchmarkCommit !== BEWT_SOURCE_COMMIT) throw new Error('Source commit does not match the pinned benchmark');
  if (!['EXITED', 'TIMED_OUT', 'SPAWN_FAILED'].includes(input.processStatus)) throw new Error('Invalid process status');
  if (input.processStatus === 'EXITED' ? (!Number.isInteger(input.exitCode) || input.exitCode < 0) : input.exitCode !== null) throw new Error('Exit code does not match process status');
  const validTimestamp = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  if (!validTimestamp(input.startedAt) || !validTimestamp(input.endedAt) || Date.parse(input.endedAt) < Date.parse(input.startedAt)) throw new Error('Invalid invocation timestamps');
  for (const name of ['stdout', 'stderr']) {
    if (!Buffer.isBuffer(input[name])) throw new Error(`${name} must be captured bytes`);
  }
  const xmlAbsent = input.rawXml === null && input.sanitizedXml === null;
  if (!xmlAbsent && (!Buffer.isBuffer(input.rawXml) || !input.rawXml.length || !Buffer.isBuffer(input.sanitizedXml) || !input.sanitizedXml.length)) throw new Error('Raw and sanitized XML must both be absent or nonempty bytes');
  const result = {
    schemaVersion: '1.0.0', runId: run.runId,
    evidenceStatus: 'CALLER_SUPPLIED_UNVERIFIED',
    command: { executable: input.executable, args: expectedArgs, cwd: 'experiments/kanboard/bewt-suite', executablePathRecorded: false },
    sourceCommit: input.sourceCommit, benchmarkCommit: input.benchmarkCommit,
    processStatus: input.processStatus, exitCode: input.exitCode, startedAt: input.startedAt, endedAt: input.endedAt,
    sha256: { stdout: hash(input.stdout), stderr: hash(input.stderr), rawXml: xmlAbsent ? null : hash(input.rawXml), sanitizedXml: xmlAbsent ? null : hash(input.sanitizedXml) },
    rawBytesPersisted: false, sanitizedBytesPersisted: false,
    sanitizationLinkVerified: false, executionVerified: false,
  };
  await publishExclusive(run, 'maven-evidence.json', `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

async function publishExclusive(run, name, contents) {
  // Atomic publication does not provide fsync durability or defend against a hostile filesystem.
  const temporary = path.join(run.dir, `.evidence-${randomUUID()}.tmp`);
  await writeFile(temporary, contents, { flag: 'wx', mode: 0o600 });
  try { await link(temporary, path.join(run.dir, name)); }
  finally { await unlink(temporary); }
}

async function assertOutsideGitTree(root) {
  let current = root;
  while (true) {
    try {
      await lstat(path.join(current, '.git'));
      throw new Error('Private evidence cannot be stored inside a Git worktree');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const parent = path.dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function assertArtifactIdentity(runId, name) {
  assertRunId(runId);
  if (!ARTIFACT_NAMES.has(name)) throw new Error('Unsupported private artifact name');
}
function assertKey(key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('Encryption key must be 32 bytes');
}
function artifactAad(runId, name) { return Buffer.from(`BEWT-CovExt/kanboard/private/v1/${runId}/${name}`, 'utf8'); }

/** Encrypt caller-captured raw bytes in memory and publish ciphertext without overwriting. */
export async function storeEncryptedArtifact(run, name, plaintext, key) {
  if (!run || !reserved.has(run)) throw new Error('Run was not reserved by this process');
  assertArtifactIdentity(run.runId, name); assertKey(key);
  if (!Buffer.isBuffer(plaintext) || plaintext.length > MAX_PRIVATE_BYTES) throw new Error('Invalid or oversized private artifact');
  if (await realpath(run.dir) !== run.dir) throw new Error('Run directory resolves to a different path');
  await assertOutsideGitTree(run.root);
  // Process-local guard only: the operator must supply a fresh random key per run across process restarts.
  const fingerprint = hash(key);
  const owner = keyOwners.get(fingerprint);
  if (owner && owner !== run) throw new Error('Encryption key is already assigned to another run in this process');
  if (runKeyHashes.has(run) && runKeyHashes.get(run) !== fingerprint) throw new Error('All artifacts in a run must use the same key');
  keyOwners.set(fingerprint, run);
  runKeyHashes.set(run, fingerprint);
  const seen = usedNonces.get(run);
  let nonce;
  do { nonce = randomBytes(12); } while (seen.has(nonce.toString('hex')));
  seen.add(nonce.toString('hex'));
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(artifactAad(run.runId, name));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const envelope = { schemaVersion: '1.0.0', algorithm: 'AES-256-GCM', runId: run.runId, artifactName: name, nonceHex: nonce.toString('hex'), tagHex: cipher.getAuthTag().toString('hex'), ciphertextBase64: ciphertext.toString('base64'), plaintextSha256: hash(plaintext) };
  await publishExclusive(run, `${name}.aesgcm.json`, `${JSON.stringify(envelope)}\n`);
  return { artifactName: name, plaintextSha256: envelope.plaintextSha256, ciphertextSha256: hash(ciphertext), plaintextPersisted: false };
}

/** Decrypt an envelope in memory; expected identity is supplied independently by the caller. */
export function decryptArtifact(envelope, expectedRunId, expectedName, key) {
  assertArtifactIdentity(expectedRunId, expectedName); assertKey(key);
  if (!envelope || envelope.schemaVersion !== '1.0.0' || envelope.algorithm !== 'AES-256-GCM' || envelope.runId !== expectedRunId || envelope.artifactName !== expectedName) throw new Error('Private artifact identity mismatch');
  if (!/^[a-f0-9]{24}$/.test(envelope.nonceHex) || !/^[a-f0-9]{32}$/.test(envelope.tagHex) || !/^[a-f0-9]{64}$/.test(envelope.plaintextSha256) || typeof envelope.ciphertextBase64 !== 'string') throw new Error('Malformed private artifact envelope');
  if (envelope.ciphertextBase64.length > Math.ceil(MAX_PRIVATE_BYTES / 3) * 4) throw new Error('Malformed or oversized ciphertext');
  const ciphertext = Buffer.from(envelope.ciphertextBase64, 'base64');
  if (ciphertext.length > MAX_PRIVATE_BYTES || ciphertext.toString('base64') !== envelope.ciphertextBase64) throw new Error('Malformed or oversized ciphertext');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.nonceHex, 'hex'));
  decipher.setAAD(artifactAad(expectedRunId, expectedName));
  decipher.setAuthTag(Buffer.from(envelope.tagHex, 'hex'));
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  if (hash(plaintext) !== envelope.plaintextSha256) throw new Error('Private artifact plaintext hash mismatch');
  return plaintext;
}

async function readBoundedJson(file, maximumBytes) {
  const info = await lstat(file);
  if (!info.isFile() || info.size > maximumBytes) throw new Error('Evidence file is not a regular file or is oversized');
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Verify encrypted raw artifacts match a saved caller-supplied summary, without claiming a real run. */
export async function verifyRawArtifactBinding(run, key) {
  if (!run || !reserved.has(run)) throw new Error('Run was not reserved by this process');
  assertKey(key);
  if (await realpath(run.dir) !== run.dir) throw new Error('Run directory resolves to a different path');
  await assertOutsideGitTree(run.root);
  const record = await readBoundedJson(path.join(run.dir, 'maven-evidence.json'), 65536);
  if (record.runId !== run.runId || record.evidenceStatus !== 'CALLER_SUPPLIED_UNVERIFIED' || record.executionVerified !== false || record.sanitizationLinkVerified !== false) throw new Error('Invalid caller-supplied evidence record');
  const pairs = [['maven-stdout', 'stdout'], ['maven-stderr', 'stderr'], ['surefire-original', 'rawXml']];
  const hashes = {};
  for (const [name, field] of pairs) {
    if (!/^[a-f0-9]{64}$/.test(record.sha256?.[field] ?? '')) throw new Error('Raw evidence binding is incomplete');
    const envelope = await readBoundedJson(path.join(run.dir, `${name}.aesgcm.json`), MAX_ENVELOPE_BYTES);
    const bytes = decryptArtifact(envelope, run.runId, name, key);
    if (hash(bytes) !== record.sha256[field]) throw new Error('Raw evidence hash mismatch');
    hashes[field] = hash(bytes);
  }
  return { status: 'RAW_HASH_BINDING_MATCH', hashes, executionVerified: false, sanitizationLinkVerified: false };
}
