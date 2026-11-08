import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const APP_IMAGE_REF = 'olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af';
export const BROWSER_IMAGE_REF = 'selenium/standalone-chrome@sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f';
export const SOURCE_COMMIT = '0501249ff3e9a5ea83a06155cd2971dc36197056';
export const SOURCE_VERSION = '1.11.10';
export const APP_TEST_CLASS = 'test.Claroline_AddUserTest';

export function validateRunId(runId) {
  if (typeof runId !== 'string' || !/^t03b2-[a-z0-9]{1,20}-\d{8}-r[1-9]\d*$/.test(runId)) {
    throw new Error('runId must be a unique t03b2-* date/run identity');
  }
  return runId;
}

/** Create an exclusive run evidence directory; existing run IDs are immutable. */
export function createEvidenceDirectory(baseDir, runId) {
  validateRunId(runId);
  const directory = resolve(baseDir, runId);
  mkdirSync(directory, { recursive: false });
  return directory;
}

export function labelsForRun(runId) {
  validateRunId(runId);
  return {
    project: 'bewt-covext', owner: 'bewt-covext', 'managed-by': 'bewt-covext-agent',
    app: 'claroline', task: 't03b2-g0', runId,
  };
}

export function namesForRun(runId) {
  validateRunId(runId);
  const base = `bewt-covext-claroline-${runId}`;
  return { app: `${base}-app`, browser: `${base}-selenium`, network: `${base}-net` };
}

function normalizedName(value) { return String(value || '').replace(/^\//, ''); }
function sameLabels(actual, expected) {
  if (!actual || typeof actual !== 'object') return false;
  const keys = Object.keys(expected).sort();
  return keys.every(key => actual[key] === expected[key]) && Object.keys(actual).length === keys.length;
}

export class CleanupBlockedError extends Error {
  constructor(message, options) { super(message, options); this.name = 'CleanupBlockedError'; this.outcome = 'BLOCKED'; }
}

export function dockerErrorText(error) {
  const stderr = error?.stderr?.toString?.().trim();
  const stdout = error?.stdout?.toString?.().trim();
  return stderr || stdout || error?.message || String(error);
}

export function isExactNotFound(error, kind, target) {
  if (!error || Number(error.status) !== 1) return false;
  const text = dockerErrorText(error).trim().replace(/\r?\n/g, ' ');
  const escaped = String(target).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = kind === 'container'
    ? new RegExp(`^Error: No such object: ${escaped}$`, 'i')
    : kind === 'network'
      ? new RegExp(`^Error response from daemon: network ${escaped} not found$`, 'i')
      : null;
  return Boolean(pattern?.test(text));
}

export function parseSurefireXml(xml, expectedClass = APP_TEST_CLASS) {
  if (typeof xml !== 'string' || !xml.trim()) return { outcome: 'BLOCKED', reason: 'Surefire XML missing or empty' };
  const suiteMatch = xml.match(/<testsuite\b([^>]*)>/i);
  if (!suiteMatch) return { outcome: 'BLOCKED', reason: 'Surefire XML has no testsuite element' };
  const attributes = Object.fromEntries([...suiteMatch[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  const cases = [...xml.matchAll(/<testcase\b([^>]*)\/?\s*>/gi)].map(m => Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a => [a[1], a[2]])));
  const counters = {
    tests: Number(attributes.tests ?? cases.length),
    failures: Number(attributes.failures ?? 0),
    errors: Number(attributes.errors ?? 0),
    skipped: Number(attributes.skipped ?? 0),
  };
  const classNames = [...new Set(cases.map(testCase => testCase.classname).filter(Boolean))];
  if (cases.length !== 1 || counters.tests !== 1) return { outcome: 'BLOCKED', reason: `expected exactly one testcase; saw ${cases.length}`, ...counters, classNames };
  if (classNames.length !== 1 || classNames[0] !== expectedClass) return { outcome: 'FAIL', reason: `unexpected testcase class: ${classNames.join(',') || 'missing'}`, ...counters, classNames };
  if (counters.failures !== 0 || counters.errors !== 0 || counters.skipped !== 0) return { outcome: 'FAIL', reason: 'testcase has failure, error, or skip', ...counters, classNames };
  return { outcome: 'PASS', ...counters, classNames };
}

export function sanitizeSurefireXml(xml, localRoots = []) {
  let output = String(xml)
    .replace(/<properties\b[^>]*>[\s\S]*?<\/properties>/gi, '')
    .replace(/<system-out\b[^>]*>[\s\S]*?<\/system-out>/gi, '')
    .replace(/<system-err\b[^>]*>[\s\S]*?<\/system-err>/gi, '');
  for (const root of localRoots.filter(Boolean)) {
    const normalized = String(root).replace(/[\\/]+/g, '[\\\\/]');
    output = output.replace(new RegExp(normalized, 'gi'), '<LOCAL_PATH>');
  }
  return output;
}

export function snapshotInventory(dockerExec = args => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()) {
  try {
    const list = args => { const text = dockerExec(args); return text ? text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).sort() : []; };
    return {
      containers: list(['ps', '-aq', '--no-trunc']),
      networks: list(['network', 'ls', '-q', '--no-trunc']),
      volumes: list(['volume', 'ls', '-q']),
      images: list(['image', 'ls', '-q', '--no-trunc']),
    };
  } catch (error) {
    throw new CleanupBlockedError(`Docker inventory BLOCKED: ${dockerErrorText(error)}`, { cause: error });
  }
}

export function assertOwnedContainer(resource, expected) {
  const labels = resource?.Config?.Labels;
  if (resource?.Id !== expected.id || normalizedName(resource?.Name) !== expected.name || resource?.Config?.Image !== expected.imageRef || !sameLabels(labels, expected.labels)) {
    throw new CleanupBlockedError(`recorded ${expected.role || 'container'} identity, image, or complete ownership labels do not match`);
  }
  if (!Array.isArray(resource.Mounts) || resource.Mounts.length !== 0) {
    throw new CleanupBlockedError(`recorded ${expected.role || 'container'} has an unexpected mount; no resource may be removed`);
  }
  return resource;
}

export function assertOwnedNetwork(network, expected) {
  const endpointIds = Object.keys(network?.Containers || {}).sort();
  if (network?.Id !== expected.id || network?.Name !== expected.name || !sameLabels(network?.Labels, expected.labels)) {
    throw new CleanupBlockedError('recorded network identity or complete ownership labels do not match');
  }
  if (endpointIds.length !== expected.containerIds.length || endpointIds.some((id, index) => id !== expected.containerIds[index])) {
    throw new CleanupBlockedError('network endpoints do not exactly match the verified recorded containers');
  }
  return network;
}
/** Record a returned Docker ID before interpreting a nonzero create status. */
export function recordCreatedResource({ kind, role, name, imageRef, result, record, onRecord = () => {} }) {
  const output = Buffer.isBuffer(result?.stdout) ? result.stdout.toString('utf8') : String(result?.stdout ?? '');
  const id = output.trim().split(/\s+/)[0];
  const hasId = /^[a-f0-9]{64}$/i.test(id || '');
  if (hasId) {
    const value = kind === 'network' ? { id, name } : { role, id, name, imageRef };
    if (kind === 'network') record.network = value;
    else if (kind === 'container') record.containers.push(value);
    else throw new Error(`unsupported Docker resource kind: ${kind}`);
    onRecord(value);
  }
  if (Number(result?.status) !== 0) {
    throw new Error(`${kind} create failed${hasId ? ' after returning a resource ID that was recorded' : ' without returning a recordable resource ID'}`);
  }
  if (!hasId) throw new Error(`${kind} create did not return a full Docker resource ID`);
  return id;
}
