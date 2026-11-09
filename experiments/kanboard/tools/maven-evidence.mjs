import { createHash, randomUUID } from 'node:crypto';
import { link, mkdir, realpath, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertRunId, seleniumTestArguments, SOURCE_COMMIT, BEWT_SOURCE_COMMIT } from './kanboard-g0.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const reserved = new WeakSet();

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
  // Write the complete temporary file first, then publish via an exclusive hard link.
  // A failed write before publication cannot leave a truncated final evidence record; this does not guarantee crash durability.
  const temporary = path.join(run.dir, `.maven-evidence-${randomUUID()}.tmp`);
  const final = path.join(run.dir, 'maven-evidence.json');
  await writeFile(temporary, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  try {
    await link(temporary, final);
  } finally {
    await unlink(temporary);
  }
  return result;
}
