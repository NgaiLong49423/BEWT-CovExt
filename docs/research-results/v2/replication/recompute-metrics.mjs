#!/usr/bin/env node
/**
 * Evidence-first BEWT-CovExt metric audit.
 *
 * This tool reports what the checked-in evidence can establish. It does not
 * convert implementation authorization, proposal labels, raw JUnit passes,
 * missing values, or token estimates into research acceptance.
 * Install the pinned parser dependency with `npm ci --prefix framework`.
 */

import { readFileSync, existsSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, join, relative, dirname, basename } from 'node:path';
import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '../../../../framework/node_modules/@cucumber/gherkin/dist/index.js';

export const APPS = ['bludit', 'claroline', 'expresscart', 'joomla', 'kanboard', 'mantisbt', 'mediawiki', 'prestashop'];
export const TARGET_CASES = 40;

export function validateGherkinSyntax(source) {
  if (typeof source !== 'string' || source.trim() === '') {
    return { valid: false, error: 'Empty or non-string Gherkin source', scenarioCount: 0, steps: 0 };
  }
  try {
    let nextId = 0;
    const parser = new Parser(new AstBuilder(() => `metrics-${++nextId}`), new GherkinClassicTokenMatcher());
    const document = parser.parse(source);
    const scenarios = (document.feature?.children ?? []).filter((child) => child.scenario).map((child) => child.scenario);
    if (scenarios.length !== 1) {
      return { valid: false, error: `Expected exactly one scenario; found ${scenarios.length}`, scenarioCount: scenarios.length, steps: 0 };
    }
    const steps = scenarios[0].steps ?? [];
    const hasKeyword = (keyword) => steps.some((step) => step.keyword.trim() === keyword);
    if (!hasKeyword('Given') || !hasKeyword('When') || !hasKeyword('Then')) {
      return {
        valid: false,
        error: `Scenario must contain Given, When and Then steps (Given: ${hasKeyword('Given')}, When: ${hasKeyword('When')}, Then: ${hasKeyword('Then')})`,
        scenarioCount: 1,
        steps: steps.length,
      };
    }
    return {
      valid: true,
      feature: document.feature.name,
      scenario: scenarios[0].name,
      scenarioCount: 1,
      steps: steps.length,
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Gherkin parse failure', scenarioCount: 0, steps: 0 };
  }
}

export function reviewSignaturePayload(record) {
  const fields = ['candidateId', 'application', 'behavioralUnitId', 'baselineCommit', 'inventorySha256', 'baselineDenominator', 'decision', 'reviewStatus', 'oracleDecision', 'noveltyDecision', 'reviewerIdentity', 'reviewerRole', 'approvedAt', 'rationale'];
  const payload = Object.fromEntries(fields.map((field) => [field, record?.[field] ?? null]));
  return JSON.stringify(payload);
}

export function verifySignedStatement(record, trustedReviewers = {}) {
  const signature = record?.signature;
  if (!signature || typeof signature !== 'object' || signature.algorithm !== 'Ed25519' || typeof signature.keyId !== 'string' || typeof signature.value !== 'string') return false;
  const key = trustedReviewers[signature.keyId];
  if (!key || key.reviewerIdentity !== record.reviewerIdentity || key.reviewerRole !== record.reviewerRole || typeof key.publicKeyPem !== 'string') return false;
  try {
    return verifySignature(null, Buffer.from(reviewSignaturePayload(record), 'utf8'), createPublicKey(key.publicKeyPem), Buffer.from(signature.value, 'base64'));
  } catch {
    return false;
  }
}

export function isHumanOracleAndNoveltyApproval(record, trustedReviewers = {}) {
  if (!record || typeof record !== 'object') return false;
  const reviewer = typeof record.reviewerIdentity === 'string' ? record.reviewerIdentity.trim() : '';
  const assigned = Boolean(reviewer && reviewer !== 'UNASSIGNED_PENDING_TEAM_LEAD_REVIEW');
  const timestamp = Date.parse(record.approvedAt ?? '');
  return assigned &&
    typeof record.reviewerRole === 'string' && record.reviewerRole.trim().length > 0 &&
    Number.isFinite(timestamp) &&
    typeof record.rationale === 'string' && record.rationale.trim().length > 0 &&
    record.reviewStatus === 'APPROVED' &&
    record.oracleDecision === 'APPROVED' &&
    record.noveltyDecision === 'APPROVED' &&
    verifySignedStatement(record, trustedReviewers);
}

export function verifyPrimaryReviewRecord(line, expectedSha256, candidateId) {
  if (typeof line !== 'string' || typeof expectedSha256 !== 'string' || !candidateId) return false;
  const observed = createHash('sha256').update(line, 'utf8').digest('hex');
  if (observed !== expectedSha256) return false;
  try { return JSON.parse(line).candidateId === candidateId; } catch { return false; }
}

function readRefCommit(commonDir, gitDir, refName) {
  const refPattern = /^refs\/(?:heads|remotes|tags)\/[A-Za-z0-9._/-]+$/;
  if (!refPattern.test(refName) || refName.includes('..') || refName.endsWith('/')) {
    throw new Error('INVALID_GIT_HEAD_REF');
  }
  for (const directory of [gitDir, commonDir]) {
    const refPath = join(directory, ...refName.split('/'));
    if (existsSync(refPath)) {
      const sha = readFileSync(refPath, 'utf8').trim();
      if (/^[0-9a-f]{40,64}$/i.test(sha)) return sha;
      throw new Error('INVALID_GIT_REF_CONTENT');
    }
  }
  for (const directory of new Set([gitDir, commonDir])) {
    const packedRefs = join(directory, 'packed-refs');
    if (!existsSync(packedRefs)) continue;
    const line = readFileSync(packedRefs, 'utf8').split(/\r?\n/).find((entry) => entry.endsWith(` ${refName}`));
    const sha = line?.split(' ')[0];
    if (sha && /^[0-9a-f]{40,64}$/i.test(sha)) return sha;
  }
  throw new Error('GIT_HEAD_REF_NOT_FOUND');
}

/** Read the current commit from Git metadata without launching a PATH-resolved process. */
export function readGitHeadCommit(rootDir) {
  const markerPath = join(resolve(rootDir), '.git');
  if (!existsSync(markerPath)) throw new Error('GIT_METADATA_NOT_FOUND');
  let gitDir;
  if (statSync(markerPath).isDirectory()) {
    gitDir = markerPath;
  } else {
    const marker = readFileSync(markerPath, 'utf8').trim();
    if (marker.slice(0, 7).toLowerCase() !== 'gitdir:') throw new Error('INVALID_GIT_DIRECTORY_POINTER');
    const pointer = marker.slice(7).trim();
    if (!pointer) throw new Error('INVALID_GIT_DIRECTORY_POINTER');
    gitDir = resolve(rootDir, pointer);
  }
  let commonDir = gitDir;
  const commonDirFile = join(gitDir, 'commondir');
  if (existsSync(commonDirFile)) commonDir = resolve(gitDir, readFileSync(commonDirFile, 'utf8').trim());
  const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();
  if (/^[0-9a-f]{40,64}$/i.test(head)) return head;
  const symbolic = head.match(/^ref:\s*(\S+)$/);
  if (!symbolic) throw new Error('INVALID_GIT_HEAD');
  return readRefCommit(commonDir, gitDir, symbolic[1]);
}

/** A heuristic screen only; this cannot establish scenario/oracle equivalence. */
export function auditJavaSeleniumQuality(javaSource) {
  if (typeof javaSource !== 'string' || !javaSource.trim()) return { pass: false, error: 'Empty Java source' };
  if (/currentUrl\.length\(\)\s*>=?\s*0/.test(javaSource)) return { pass: false, error: 'Tautological URL-length assertion' };
  if (/Assert\.assertTrue\s*\(\s*true\s*\)/.test(javaSource)) return { pass: false, error: 'Tautological true assertion' };
  if (/Assert\.assertFalse\s*\(\s*false\s*\)/.test(javaSource)) return { pass: false, error: 'Tautological false assertion' };
  if (/Assert\.assertNotNull\s*\(\s*driver\s*\)/.test(javaSource)) return { pass: false, error: 'Driver presence is not a business oracle' };
  if (!/(driver\.get\(|findElement\(|\.click\(|\.sendKeys\(|\.submit\()/.test(javaSource)) return { pass: false, error: 'No browser interaction found' };
  if (!/(assertEquals|assertTrue|assertFalse|assertNotNull)\s*\(/.test(javaSource)) return { pass: false, error: 'No assertion found' };
  return { pass: true, limitation: 'Heuristic only; semantic review is still required.' };
}

function readJson(path, label) {
  if (!existsSync(path)) throw new Error(`MISSING_REQUIRED_EVIDENCE: ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`INVALID_REQUIRED_EVIDENCE: ${label}: ${error instanceof Error ? error.message : 'invalid JSON'}`);
  }
}

function readTrustedReviewers(root) {
  const path = join(root, 'data', 'reviews', 'trusted-reviewers.json');
  if (!existsSync(path)) return {};
  const data = readJson(path, 'trusted reviewer key registry');
  if (!Array.isArray(data.trustedReviewers)) throw new Error('INVALID_TRUSTED_REVIEWER_REGISTRY');
  const result = {};
  for (const key of data.trustedReviewers) {
    if (!key.keyId || !key.reviewerIdentity || !key.reviewerRole || !key.publicKeyPem || result[key.keyId]) throw new Error('INVALID_TRUSTED_REVIEWER_KEY');
    result[key.keyId] = key;
  }
  return result;
}

function readReviews(root) {
  const records = new Map();
  for (const app of APPS) {
    const path = join(root, 'data', 'reviews', app, 'human-review-decisions.jsonl');
    if (!existsSync(path)) throw new Error(`MISSING_REQUIRED_EVIDENCE: human review ledger for ${app}: ${path}`);
    const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter((line) => line.trim());
    for (const [index, line] of lines.entries()) {
      let record;
      try { record = JSON.parse(line); } catch { throw new Error(`INVALID_REVIEW_RECORD: ${relative(root, path)}:${index + 1}`); }
      if (!record.candidateId || records.has(record.candidateId)) throw new Error(`DUPLICATE_OR_MISSING_REVIEW_ID: ${relative(root, path)}:${index + 1}`);
      records.set(record.candidateId, record);
    }
  }
  return records;
}

function candidateSemanticAudit(candidate, traceabilityById) {
  return traceabilityById.get(candidate.candidateId)?.semanticAudit ?? candidate.semanticAudit ?? { status: 'NOT_EVALUATED', reviewerDecision: 'NOT_RECORDED' };
}

function summarizeCandidates(candidates, traceabilityById, reviews, trustedReviewers = {}) {
  const details = candidates.map((candidate) => {
    const parsed = validateGherkinSyntax(candidate.gherkinScenario);
    const review = reviews.get(candidate.candidateId) ?? {};
    const semanticAudit = candidateSemanticAudit(candidate, traceabilityById);
    const humanApproved = isHumanOracleAndNoveltyApproval(review, trustedReviewers);
    const semanticMatched = semanticAudit.status === 'MATCHED' && semanticAudit.reviewerDecision === 'APPROVED';
    return {
      candidateId: candidate.candidateId,
      application: candidate.application,
      gherkinSyntaxValid: parsed.valid,
      gherkinError: parsed.valid ? null : parsed.error,
      implementationAuthorization: review.decision ?? 'UNKNOWN',
      humanOracleAndNoveltyApproved: humanApproved,
      semanticMappingStatus: semanticAudit.status,
      semanticMappingApproved: semanticMatched,
      eligibleForValidated: humanApproved && semanticMatched,
    };
  });
  return details;
}

function loadTraceability(root, candidates) {
  const path = join(root, 'docs', 'final-acceptance', '40-CASE-TRACEABILITY.json');
  if (!existsSync(path)) return { byId: new Map(), hashMismatches: null, unavailable: true };
  const data = readJson(path, 'case-level semantic traceability');
  if (!Array.isArray(data.candidates)) throw new Error('INVALID_TRACEABILITY: candidates array missing');
  const byId = new Map(data.candidates.map((entry) => [entry.candidateId, entry]));
  if (byId.size !== data.candidates.length) throw new Error('DUPLICATE_TRACEABILITY_ID');
  const candidateIds = new Set(candidates.map((candidate) => candidate.candidateId));
  if (candidateIds.size !== candidates.length || candidateIds.size !== byId.size || [...candidateIds].some((id) => !byId.has(id))) {
    throw new Error('INCONSISTENT_CANDIDATE_IDS: dataset and semantic traceability differ');
  }
  const sourceHashMismatches = [];
  const gherkinHashMismatches = [];
  for (const candidate of candidates) {
    const entry = byId.get(candidate.candidateId);
    const reviewPath = resolve(root, entry.humanReviewRecordPath ?? '');
    if (!entry.humanReviewRecordLine || !existsSync(reviewPath)) throw new Error(`MISSING_PRIMARY_REVIEW_RECORD: ${candidate.candidateId}`);
    const reviewLine = readFileSync(reviewPath, 'utf8').split(/\r?\n/)[entry.humanReviewRecordLine - 1];
    if (!reviewLine) throw new Error(`MISSING_PRIMARY_REVIEW_LINE: ${candidate.candidateId}`);
    if (!verifyPrimaryReviewRecord(reviewLine, entry.humanReviewRecordSha256, candidate.candidateId)) throw new Error(`PRIMARY_REVIEW_RECORD_INTEGRITY_MISMATCH: ${candidate.candidateId}`);
    const observedGherkinHash = createHash('sha256').update(candidate.gherkinScenario, 'utf8').digest('hex');
    if (entry.gherkinScenarioSha256Observed !== observedGherkinHash) throw new Error(`STALE_GHERKIN_TRACEABILITY_HASH: ${candidate.candidateId}`);
    if (candidate.gherkinSha256 !== observedGherkinHash) gherkinHashMismatches.push(candidate.candidateId);
    const sourcePath = resolve(root, candidate.javaSourcePath);
    if (!existsSync(sourcePath)) throw new Error(`MISSING_JAVA_SOURCE: ${candidate.candidateId}`);
    const observedHash = createHash('sha256').update(readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n'), 'utf8').digest('hex');
    if (entry.javaSourceSha256Observed !== observedHash) throw new Error(`STALE_TRACEABILITY_HASH: ${candidate.candidateId}`);
    const registrationPath = join(dirname(sourcePath), 'registration.json');
    const registration = readJson(registrationPath, `artifact registration for ${candidate.candidateId}`);
    if (registration.sourceSha256 !== observedHash) throw new Error(`REGISTRATION_HASH_MISMATCH: ${candidate.candidateId}`);
    if (candidate.javaSourceSha256 !== observedHash) sourceHashMismatches.push(candidate.candidateId);
  }
  return { byId, sourceHashMismatches, gherkinHashMismatches, unavailable: false };
}

function rawExecutionSummary(root) {
  const path = join(root, 'docs', 'tasks', 'g3-evidence', 'all-40-candidates-g3-consolidated-summary.json');
  if (!existsSync(path)) return { status: 'NOT_AVAILABLE', source: relative(root, path) };
  const data = readJson(path, 'G3 consolidated raw outcome summary');
  const countFiles = (directory, targetName) => {
    if (!existsSync(directory)) return 0;
    let count = 0;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) count += countFiles(path, targetName);
      else if (targetName === 'junit' ? entry.name.startsWith('TEST-') && entry.name.endsWith('.xml') : entry.name === targetName) count++;
    }
    return count;
  };
  let cleanupResidualFailuresObserved = 0;
  let runRecordsWithCompleteIdentity = 0;
  const requiredIdentityFields = ['sourceCommit', 'testSourceSha256', 'imageDigest', 'runtimeManifest', 'javaVersion', 'dockerVersion'];
  const g3Root = join(root, 'docs', 'tasks', 'g3-evidence');
  const inspectCleanup = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspectCleanup(path);
      else if (entry.name === 'cleanup-result.json') {
        const cleanup = readJson(path, 'G3 cleanup result');
        if (cleanup.zeroResidualVerified === false) cleanupResidualFailuresObserved++;
      } else if (entry.name === 'run-record.json') {
        const run = readJson(path, 'G3 run record');
        if (requiredIdentityFields.every((field) => typeof run[field] === 'string' && run[field].trim())) runRecordsWithCompleteIdentity++;
      }
    }
  };
  if (existsSync(g3Root)) inspectCleanup(g3Root);
  return {
    status: 'REPORTED_RAW_OUTCOMES_NOT_SEMANTICALLY_VALIDATED',
    source: relative(root, path),
    totalCandidates: data.totalCandidates ?? null,
    initialPassCandidates: data.initialPassCandidates ?? (Number.isFinite(data.initialPassRate) && Number.isInteger(data.totalCandidates) ? Math.round(data.initialPassRate * data.totalCandidates) : null),
    validatedCandidatesReported: data.validatedCandidates ?? null,
    flakyCandidatesReported: data.flakyCandidates ?? null,
    failedCandidatesReported: data.failedCandidates ?? null,
    totalRunInvocationsReported: data.totalIndividualRuns ?? data.totalRunInvocations ?? null,
    runRecordFilesObserved: countFiles(g3Root, 'run-record.json'),
    junitXmlFilesObserved: countFiles(g3Root, 'junit'),
    runRecordsWithCompleteIdentity,
    cleanupResidualFailuresObserved,
  };
}

function fileSha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function evidencePath(root, runDirectory, artifactPath) {
  if (typeof artifactPath !== 'string' || !artifactPath.trim()) return null;
  const resolvedPath = resolve(root, artifactPath);
  const fromRoot = relative(root, resolvedPath);
  const fromRun = relative(runDirectory, resolvedPath);
  if (!fromRoot || fromRoot.startsWith('..') || fromRoot.includes(':') || fromRun.startsWith('..') || fromRun.includes(':')) return null;
  return resolvedPath;
}

function verifyEvidenceArtifact(root, runDirectory, artifact) {
  const path = evidencePath(root, runDirectory, artifact?.path);
  if (!path || !existsSync(path) || typeof artifact?.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(artifact.sha256)) return { valid: false, reason: 'MISSING_OR_INVALID_EVIDENCE_ARTIFACT' };
  const observed = fileSha256(path);
  return observed === artifact.sha256 ? { valid: true, path } : { valid: false, reason: 'EVIDENCE_ARTIFACT_HASH_MISMATCH' };
}

function collectRunRecords(root) {
  const base = join(root, 'docs', 'tasks', 'g3-evidence');
  const records = [];
  const walk = (directory) => {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === 'run-record.json') {
        try { records.push({ path, record: JSON.parse(readFileSync(path, 'utf8')) }); }
        catch { records.push({ path, record: null }); }
      }
    }
  };
  walk(base);
  return records;
}

function parseJUnitOutcome(xml, expectedClass) {
  const match = xml.match(/<testsuite\b([^>]*)>/i);
  if (!match) return { valid: false, reason: 'JUNIT_TESTSUITE_MISSING' };
  const attribute = (name) => {
    const value = match[1].match(new RegExp('\\b' + name + '="(\\d+)"'));
    return value ? Number(value[1]) : null;
  };
  const tests = attribute('tests');
  const failures = attribute('failures');
  const errors = attribute('errors');
  const skipped = attribute('skipped') ?? 0;
  const classMatch = xml.match(/<testcase\b[^>]*className="([^"]+)"|<testcase\b[^>]*classname="([^"]+)"/i);
  const actualClass = classMatch?.[1] ?? classMatch?.[2] ?? null;
  if (![tests, failures, errors].every(Number.isInteger) || tests < 1) return { valid: false, reason: 'INVALID_JUNIT_COUNTS' };
  if (actualClass && expectedClass && actualClass !== expectedClass) return { valid: false, reason: 'JUNIT_CLASS_MISMATCH', tests, failures, errors, skipped };
  return { valid: true, tests, failures, errors, skipped, outcome: failures === 0 && errors === 0 && skipped === 0 ? 'PASS' : 'FAIL' };
}

function readArtifactJson(root, runDirectory, artifact) {
  const verified = verifyEvidenceArtifact(root, runDirectory, artifact);
  if (!verified.valid) return { ...verified, data: null };
  try { return { ...verified, data: JSON.parse(readFileSync(verified.path, 'utf8')) }; }
  catch { return { valid: false, reason: 'INVALID_JSON_EVIDENCE_ARTIFACT', data: null }; }
}

function summarizedRunIds(summary) {
  const ids = new Set();
  for (const candidate of summary?.results ?? []) {
    if (candidate.initialRun?.runId) ids.add(candidate.initialRun.runId);
    for (const run of candidate.reruns ?? []) if (run.runId) ids.add(run.runId);
  }
  return ids;
}

function runRecordAccounting(root, summary, records) {
  const summaryIds = summarizedRunIds(summary);
  const fileIds = new Set(records.map((item) => item.record?.runId).filter(Boolean));
  const runRecordCountByCandidate = {};
  for (const item of records) {
    const parts = relative(root, dirname(item.path)).replaceAll('\\', '/').split('/');
    const index = parts.indexOf('g3-evidence');
    const candidateId = index >= 0 ? parts[index + 2] : null;
    if (candidateId) runRecordCountByCandidate[candidateId] = (runRecordCountByCandidate[candidateId] ?? 0) + 1;
  }
  const extraRunRecords = records.filter((item) => item.record?.runId && !summaryIds.has(item.record.runId)).map((item) => {
    const parts = relative(root, dirname(item.path)).replaceAll('\\', '/').split('/');
    const index = parts.indexOf('g3-evidence');
    const app = index >= 0 ? parts[index + 1] : null;
    const candidateId = index >= 0 ? parts[index + 2] : null;
    return { runId: item.record.runId, applicationByDirectory: app, candidateIdByDirectory: candidateId, taskLabel: item.record.labels?.task ?? null, purpose: item.record.purpose ?? item.record.runPurpose ?? 'NOT_RECORDED', classification: 'UNSUMMARIZED_RUN_PURPOSE_UNRESOLVED', evidencePath: relative(root, item.path) };
  });
  const candidateOutcomesReported = (summary?.results ?? []).map((candidate) => {
    const reruns = candidate.reruns ?? [];
    const attempts = [candidate.initialRun, ...reruns].filter(Boolean);
    const failures = attempts.filter((run) => run.outcome !== 'PASS').length;
    const rerunFailures = reruns.filter((run) => run.outcome !== 'PASS').length;
    return {
      candidateId: candidate.candidateId,
      application: candidate.application,
      initialOutcomeReported: candidate.initialRun?.outcome ?? null,
      rerunOutcomesReported: reruns.map((run) => run.outcome),
      rerunFailureRateAmongReruns: reruns.length === 3 ? rerunFailures / 3 : null,
      failureRateAcrossInitialAndReruns: attempts.length === 4 ? failures / 4 : null,
      runIdsReported: attempts.map((run) => run.runId).filter(Boolean),
    };
  });
  return {
    summaryRunIds: summaryIds.size,
    runRecordFileCount: records.length,
    matchingRunRecords: records.filter((item) => summaryIds.has(item.record?.runId)).length,
    runRecordCountByCandidate,
    missingRunRecordIds: [...summaryIds].filter((id) => !fileIds.has(id)),
    extraRunRecords,
    candidateOutcomesReported,
  };
}

function validateSourceBoundRun(root, candidate, trace, config, item, reviewValid) {
  const run = item.record;
  const runDirectory = dirname(item.path);
  const errors = [];
  if (!run || run.schemaVersion !== '1.0.0') return { valid: false, errors: ['RUN_RECORD_SCHEMA_INVALID'], outcome: null };
  const expectedRelative = ['docs', 'tasks', 'g3-evidence', candidate.application, candidate.candidateId, run.runId].join('/');
  const actualRelative = relative(root, runDirectory).replaceAll('\\', '/');
  if (actualRelative !== expectedRelative) errors.push('RUN_DIRECTORY_IDENTITY_MISMATCH');
  if (run.candidateId !== candidate.candidateId || run.runId !== basename(runDirectory)) errors.push('RUN_CANDIDATE_OR_ID_MISMATCH');
  if (!['INITIAL', 'RERUN'].includes(run.runType) || (run.runType === 'INITIAL' && run.rerunIndex !== 0) || (run.runType === 'RERUN' && ![1, 2, 3].includes(run.rerunIndex))) errors.push('RUN_TYPE_OR_INDEX_INVALID');
  if (!run.startedAtUtc || !run.finishedAtUtc || !Number.isFinite(Date.parse(run.startedAtUtc)) || !Number.isFinite(Date.parse(run.finishedAtUtc)) || Date.parse(run.finishedAtUtc) < Date.parse(run.startedAtUtc)) errors.push('RUN_TIMESTAMP_INVALID');
  if (!config || run.application?.appId !== candidate.application || run.application?.sourceCommit !== config.source?.commit || run.application?.version !== config.benchmarkBaseVersion || !config.runtime?.imageDigest || run.application?.imageDigest !== config.runtime.imageDigest) errors.push('APPLICATION_SOURCE_OR_IMAGE_PROVENANCE_MISMATCH');
  if (run.test?.javaSourceSha256 !== trace.javaSourceSha256Observed || run.test?.javaSourceSha256 !== candidate.javaSourceSha256 || run.test?.gherkinSha256 !== trace.gherkinScenarioSha256Observed || run.test?.gherkinSha256 !== candidate.gherkinSha256) errors.push('TEST_SOURCE_HASH_MISMATCH');
  if (!['javaVersion', 'mavenVersion', 'seleniumVersion', 'dockerVersion'].every((field) => typeof run.runtime?.[field] === 'string' && run.runtime[field].trim())) errors.push('RUNTIME_VERSION_INCOMPLETE');

  const compileLog = verifyEvidenceArtifact(root, runDirectory, run.compile?.log);
  if (!compileLog.valid || !['PASS', 'FAIL'].includes(run.compile?.outcome) || typeof run.compile?.command !== 'string' || !run.compile.command.toLowerCase().includes('mvn')) errors.push('COMPILE_EVIDENCE_MISSING_OR_INVALID');
  const junitPath = evidencePath(root, runDirectory, run.execution?.junitXmlPath);
  let junit = { valid: false, reason: 'JUNIT_EVIDENCE_MISSING' };
  if (junitPath && existsSync(junitPath)) {
    const observedJunitHash = fileSha256(junitPath);
    if (observedJunitHash !== run.execution?.junitXmlSha256) errors.push('JUNIT_HASH_MISMATCH');
    else junit = parseJUnitOutcome(readFileSync(junitPath, 'utf8'), candidate.javaClass);
  }
  if (!junit.valid) errors.push(junit.reason);
  if (!['PASS', 'FAIL'].includes(run.compile?.outcome)) errors.push('COMPILE_OUTCOME_INVALID');
  if (!Number.isInteger(run.execution?.exitCode)) errors.push('MAVEN_EXIT_CODE_MISSING');
  if (!['PASS', 'FAIL'].includes(run.oracleVerification?.status) || run.oracleVerification?.javaSourceSha256 !== run.test?.javaSourceSha256 || run.oracleVerification?.gherkinSha256 !== run.test?.gherkinSha256) errors.push('ORACLE_VERIFICATION_MISSING_OR_MISMATCHED');

  const reset = readArtifactJson(root, runDirectory, run.reset?.evidence);
  if (!reset.valid || run.reset?.outcome !== 'PASS' || reset.data?.appId !== candidate.application || reset.data?.runId !== run.runId || reset.data?.outcome !== 'PASS') errors.push(reset.reason ?? 'RESET_NOT_VERIFIED');
  const cleanup = readArtifactJson(root, runDirectory, run.cleanup?.evidence);
  if (!cleanup.valid || run.cleanup?.outcome !== 'PASS' || cleanup.data?.appId !== candidate.application || cleanup.data?.runId !== run.runId || cleanup.data?.zeroResidualVerified !== true || cleanup.data?.outcome !== 'PASS') errors.push(cleanup.reason ?? 'CLEANUP_NOT_VERIFIED');

  const outcome = errors.length === 0 && run.compile?.outcome === 'PASS' && run.execution?.exitCode === 0 && junit.outcome === 'PASS' && run.oracleVerification?.status === 'PASS' ? 'PASS' : 'FAIL';
  if (errors.length) return { valid: false, errors: [...new Set(errors)], outcome, junit };
  return { valid: true, errors: [], outcome, junit, runType: run.runType, rerunIndex: run.rerunIndex, durationSeconds: (Date.parse(run.finishedAtUtc) - Date.parse(run.startedAtUtc)) / 1000 };
}

export function evaluateRq3Evidence({ rootDir = '.', candidates, traceabilityById, reviews, trustedReviewers = {}, rawExecution = null }) {
  const root = resolve(rootDir);
  const raw = rawExecution ?? rawExecutionSummary(root);
  const allRecords = collectRunRecords(root);
  const summaryPath = join(root, 'docs', 'tasks', 'g3-evidence', 'all-40-candidates-g3-consolidated-summary.json');
  const rawSummary = existsSync(summaryPath) ? readJson(summaryPath, 'G3 summarized run accounting') : null;
  const runAccounting = runRecordAccounting(root, rawSummary, allRecords);
  const seenIds = new Set();
  const duplicates = new Set();
  for (const item of allRecords) {
    if (!item.record?.runId) continue;
    if (seenIds.has(item.record.runId)) duplicates.add(item.record.runId);
    seenIds.add(item.record.runId);
  }
  const byCandidate = new Map(candidates.map((candidate) => [candidate.candidateId, []]));
  const unboundRunRecordCount = allRecords.filter((item) => !item.record?.candidateId || !byCandidate.has(item.record?.candidateId)).length;
  for (const item of allRecords) if (byCandidate.has(item.record?.candidateId)) byCandidate.get(item.record.candidateId).push(item);
  const dispositions = candidates.map((candidate) => {
    const trace = traceabilityById.get(candidate.candidateId) ?? {};
    const reviewValid = isHumanOracleAndNoveltyApproval(reviews.get(candidate.candidateId), trustedReviewers);
    const configPath = join(root, 'config', 'apps', candidate.application + '.json');
    const config = existsSync(configPath) ? readJson(configPath, 'application runtime manifest') : null;
    const records = byCandidate.get(candidate.candidateId) ?? [];
    const evaluations = records.map((item) => ({ item, evaluation: validateSourceBoundRun(root, candidate, trace, config, item, reviewValid) }));
    if (duplicates.size) for (const entry of evaluations) if (duplicates.has(entry.item.record?.runId)) entry.evaluation = { valid: false, outcome: entry.evaluation.outcome, errors: [...(entry.evaluation.errors ?? []), 'DUPLICATE_RUN_ID'] };
    const verified = evaluations.filter((entry) => entry.evaluation.valid);
    const initial = verified.filter((entry) => entry.evaluation.runType === 'INITIAL');
    const reruns = verified.filter((entry) => entry.evaluation.runType === 'RERUN');
    const oneInitial = initial.length === 1;
    const exactReruns = reruns.length === 3 && [1, 2, 3].every((index) => reruns.filter((entry) => entry.evaluation.rerunIndex === index).length === 1);
    const allVerified = oneInitial && exactReruns;
    const orderedOutcomes = allVerified ? [initial[0].evaluation.outcome, ...[1, 2, 3].map((index) => reruns.find((entry) => entry.evaluation.rerunIndex === index).evaluation.outcome)] : [];
    const reviewApproved = reviewValid && trace.semanticAudit?.status === 'MATCHED' && trace.semanticAudit?.reviewerDecision === 'APPROVED';
    const validated = allVerified && orderedOutcomes.every((outcome) => outcome === 'PASS') && reviewApproved && trace.javaSourceSha256Observed === candidate.javaSourceSha256 && trace.gherkinScenarioSha256Observed === candidate.gherkinSha256;
    const pathRunRecordCount = runAccounting.runRecordCountByCandidate[candidate.candidateId] ?? 0;
    const hasEvidence = records.length > 0 || pathRunRecordCount > 0;
    const completeButFailing = allVerified && orderedOutcomes.some((outcome) => outcome !== 'PASS');
    const status = validated ? 'VALIDATED' : completeButFailing ? 'FAIL' : !hasEvidence ? 'NOT_RUN' : verified.length ? 'PARTIALLY_VERIFIED' : 'BLOCKED';
    const outcomeCounts = { PASS: evaluations.filter((entry) => entry.evaluation.outcome === 'PASS').length, FAIL: evaluations.filter((entry) => entry.evaluation.outcome === 'FAIL').length };
    const rerunFailCount = reruns.filter((entry) => entry.evaluation.outcome === 'FAIL').length;
    const allTrialFailCount = evaluations.filter((entry) => entry.evaluation.outcome === 'FAIL').length;
    return {
      candidateId: candidate.candidateId,
      application: candidate.application,
      status,
      validated,
      sourceBoundRunRecords: records.length,
      unboundPathRunRecords: Math.max(0, pathRunRecordCount - records.length),
      verifiedRunRecords: verified.length,
      protocolComplete: allVerified,
      initialOutcome: oneInitial ? initial[0].evaluation.outcome : null,
      rerunOutcomes: exactReruns ? [1, 2, 3].map((index) => reruns.find((entry) => entry.evaluation.rerunIndex === index).evaluation.outcome) : [],
      outcomeCounts,
      outcome: completeButFailing ? 'FAIL' : allVerified ? 'PASS' : verified.length ? 'PARTIALLY_VERIFIED' : 'BLOCKED',
      rerunFailureRate: exactReruns ? rerunFailCount / 3 : null,
      allTrialFailureRate: allVerified ? allTrialFailCount / 4 : null,
      evidenceErrors: [...evaluations.flatMap((entry) => entry.evaluation.errors ?? []), ...(pathRunRecordCount > records.length ? ['UNBOUND_LEGACY_RUN_RECORD'] : [])],
    };
  });
  const verifiedRunRecords = dispositions.reduce((sum, item) => sum + item.verifiedRunRecords, 0);
  const protocolCompleteCandidates = dispositions.filter((item) => item.protocolComplete).length;
  const validatedCandidates = dispositions.filter((item) => item.validated).length;
  const recordedProtocolCandidates = dispositions.filter((item) => item.sourceBoundRunRecords > 0).length;
  const outcome = protocolCompleteCandidates === candidates.length && candidates.length > 0
    ? 'PASS'
    : verifiedRunRecords > 0 || raw.status !== 'NOT_AVAILABLE' ? 'PARTIALLY_VERIFIED' : 'NOT_EVALUATED';
  return {
    outcome,
    interpretation: 'PASS means all registered candidates have complete, source-bound 1+3 trial evidence and the research outcomes are calculable; it does not mean every candidate passed.',
    candidateCount: candidates.length,
    sourceBoundCandidateCount: recordedProtocolCandidates,
    verifiedRunRecords,
    protocolCompleteCandidates,
    validatedCandidates,
    failedCandidates: dispositions.filter((item) => item.protocolComplete && item.outcomeCounts.FAIL > 0).length,
    rawExecution: raw,
    rawRunRecordFilesObserved: allRecords.length,
    runRecordAccounting: runAccounting,
    unboundRunRecordFilesObserved: unboundRunRecordCount,
    duplicateRunIds: [...duplicates],
    requiredCleanReruns: 3,
    flakinessDefinition: 'A candidate is flaky when its initial run and three reruns do not all have the same derived JUnit outcome; rerunFailureRate and allTrialFailureRate use separate denominators.',
    candidates: dispositions,
    reason: protocolCompleteCandidates === candidates.length ? null : 'Source-bound protocol evidence is incomplete; reported historical outcomes remain separate and do not establish VALIDATED cases.',
  };
}

function validateBaselineTaxonomy(root, taxonomy, trustedReviewers) {
  if (!taxonomy || taxonomy.auditStatus !== 'VERIFIED_BY_INDEPENDENT_REVIEW' || !taxonomy.baselineReview) return { valid: false, reason: 'BASELINE_REVIEW_OR_TAXONOMY_STATUS_MISSING', denominator: null, ids: new Set() };
  const review = taxonomy.baselineReview;
  if (review.decision !== 'APPROVED' || review.baselineCommit !== taxonomy.baselineReference?.commit || !/^[0-9a-f]{64}$/i.test(review.inventorySha256 ?? '') || !verifySignedStatement(review, trustedReviewers)) return { valid: false, reason: 'BASELINE_ATTESTATION_INVALID', denominator: null, ids: new Set() };
  const ids = new Set();
  let total = 0;
  const digestRows = [];
  for (const app of APPS) {
    const units = taxonomy.perApplicationBaselines?.[app]?.baselineBehavioralUnits;
    if (!Array.isArray(units)) return { valid: false, reason: 'BASELINE_UNIT_INVENTORY_MISSING:' + app, denominator: null, ids };
    if (taxonomy.perApplicationBaselines[app].baselineUniqueBehavioralUnits !== units.length) return { valid: false, reason: 'BASELINE_UNIT_COUNT_MISMATCH:' + app, denominator: null, ids };
    for (const unit of units) {
      if (!unit.behavioralUnitId || !unit.evidence?.path || !/^[0-9a-f]{64}$/i.test(unit.evidence.sha256 ?? '') || ids.has(unit.behavioralUnitId)) return { valid: false, reason: 'BASELINE_UNIT_INVALID_OR_DUPLICATE:' + app, denominator: null, ids };
      const evidencePath = resolve(root, unit.evidence.path);
      const rel = relative(root, evidencePath);
      if (!existsSync(evidencePath) || rel.startsWith('..') || fileSha256(evidencePath) !== unit.evidence.sha256) return { valid: false, reason: 'BASELINE_SOURCE_HASH_MISMATCH:' + unit.behavioralUnitId, denominator: null, ids };
      ids.add(unit.behavioralUnitId);
      digestRows.push({ application: app, behavioralUnitId: unit.behavioralUnitId, sourceSha256: unit.evidence.sha256 });
      total++;
    }
  }
  digestRows.sort((a, b) => a.application.localeCompare(b.application) || a.behavioralUnitId.localeCompare(b.behavioralUnitId));
  const digest = createHash('sha256').update(JSON.stringify(digestRows), 'utf8').digest('hex');
  const denominator = taxonomy.defensibleDenominator?.totalBaselineDenominator;
  if (!Number.isInteger(denominator) || denominator !== total || denominator !== taxonomy.aggregateBaselineCounts?.totalBehavioralUnits || review.inventorySha256 !== digest) return { valid: false, reason: 'BASELINE_DENOMINATOR_OR_INVENTORY_DIGEST_MISMATCH', denominator: null, ids };
  return { valid: true, reason: null, denominator, ids };
}

export function evaluateRq2Evidence({ rootDir = '.', taxonomy, candidates, reviews, trustedReviewers = {}, traceabilityById, rq3 }) {
  const root = resolve(rootDir);
  const baseline = validateBaselineTaxonomy(root, taxonomy, trustedReviewers);
  if (!baseline.valid) return { outcome: 'NOT_EVALUATED', baselineStatus: 'NOT_VERIFIED', baselineDenominator: null, proposedCandidates: candidates.length, finalHumanDispositionCount: 0, approvedNewBehaviorUnits: null, implementedNewBehaviorUnits: null, validatedNewBehaviorUnits: null, coverageGain: null, coverageGainPercent: null, reason: baseline.reason };
  const mappings = taxonomy.candidateToTaxonomyMapping ?? {};
  const allEntries = APPS.flatMap((app) => Array.isArray(mappings[app]) ? mappings[app].map((entry) => ({ ...entry, application: app })) : []);
  const byId = new Map(allEntries.map((entry) => [entry.candidateId, entry]));
  const rows = [];
  const seenBehaviorIds = new Set();
  for (const candidate of candidates) {
    const entry = byId.get(candidate.candidateId);
    const review = reviews.get(candidate.candidateId);
    const trace = traceabilityById.get(candidate.candidateId) ?? {};
    const approval = entry?.approval;
    const unitId = entry?.behavioralUnitId;
    const sourceEvidenceValid = Array.isArray(entry?.sourceEvidence) && entry.sourceEvidence.length > 0 && entry.sourceEvidence.every((evidence) => {
      const path = resolve(root, evidence.path ?? '');
      const rel = relative(root, path);
      return evidence.path && /^[0-9a-f]{64}$/i.test(evidence.sha256 ?? '') && existsSync(path) && !rel.startsWith('..') && fileSha256(path) === evidence.sha256;
    });
    const approved = Boolean(entry && entry.candidateId === candidate.candidateId && entry.application === candidate.application && unitId && !baseline.ids.has(unitId) && !seenBehaviorIds.has(unitId) && approval?.decision === 'APPROVED' && approval.candidateId === candidate.candidateId && approval.application === candidate.application && approval.behavioralUnitId === unitId && verifySignedStatement(approval, trustedReviewers) && isHumanOracleAndNoveltyApproval(review, trustedReviewers) && trace.semanticAudit?.status === 'MATCHED' && trace.semanticAudit?.reviewerDecision === 'APPROVED' && sourceEvidenceValid);
    if (approved) seenBehaviorIds.add(unitId);
    const implemented = approved && trace.javaSourceSha256Observed === candidate.javaSourceSha256 && trace.registrationHashMatchesObservedJava === true && trace.gherkinScenarioSha256Observed === candidate.gherkinSha256;
    const run = rq3.candidates.find((item) => item.candidateId === candidate.candidateId);
    const validated = implemented && run?.status === 'VALIDATED';
    rows.push({ candidateId: candidate.candidateId, application: candidate.application, behavioralUnitId: unitId ?? null, approved, implemented, validated, reason: !entry ? 'MAPPING_MISSING' : !approved ? 'APPROVAL_OR_SOURCE_EVIDENCE_INVALID' : !implemented ? 'IMPLEMENTATION_HASH_NOT_MATCHED' : !validated ? 'SOURCE_BOUND_1_PLUS_3_RERUNS_NOT_VALIDATED' : null });
  }
  const finalDispositionCount = candidates.filter((candidate) => {
    const review = reviews.get(candidate.candidateId);
    return isHumanOracleAndNoveltyApproval(review, trustedReviewers) || (review?.decision === 'REJECTED' && verifySignedStatement(review, trustedReviewers));
  }).length;
  const approvedNewBehaviorUnits = rows.filter((row) => row.approved).length;
  const implementedNewBehaviorUnits = rows.filter((row) => row.implemented).length;
  const validatedNewBehaviorUnits = rows.filter((row) => row.validated).length;
  const outcome = finalDispositionCount === candidates.length && rows.length === candidates.length ? 'PASS' : finalDispositionCount > 0 ? 'PARTIALLY_VERIFIED' : 'BLOCKED';
  return {
    outcome,
    baselineStatus: 'VERIFIED_BY_SIGNED_INDEPENDENT_REVIEW',
    baselineDenominator: baseline.denominator,
    proposedCandidates: candidates.length,
    finalHumanDispositionCount: finalDispositionCount,
    approvedNewBehaviorUnits,
    implementedNewBehaviorUnits,
    validatedNewBehaviorUnits,
    coverageGain: validatedNewBehaviorUnits / baseline.denominator,
    coverageGainPercent: validatedNewBehaviorUnits / baseline.denominator * 100,
    candidateDetails: rows,
    reason: outcome === 'PASS' ? null : 'Only signed candidate decisions and source-backed, non-overlapping behavioral units are included; unresolved proposals remain pending.',
  };
}

function modelUsageSummary(root) {
  const reportPath = join(root, 'docs', 'tasks', 'T01-C', 'MODEL-USAGE-AND-COST.md');
  if (!existsSync(reportPath)) return { status: 'UNKNOWN', source: relative(root, reportPath), successfulCalls: null, tokens: null, actualCost: null };
  const report = readFileSync(reportPath, 'utf8');
  const firstRow = report.split(/\r?\n/).find((line) => line.includes('gemini-3.1-flash-lite')) ?? '';
  const attempts = Number(firstRow.match(/\|\s*(\d+)\s*\/\s*\d+/)?.[1] ?? Number.NaN);
  return {
    status: 'PARTIALLY_REPORTED_USAGE_NO_SUCCESSFUL_RESPONSE_TELEMETRY',
    source: relative(root, reportPath),
    modelReported: 'gemini-3.1-flash-lite',
    attemptsReported: Number.isFinite(attempts) ? attempts : null,
    successfulCalls: 0,
    inputTokens: null,
    outputTokens: null,
    actualCostUsd: null,
    comparisonOrSavings: 'NOT_MEASURED',
  };
}

export function runRecompute(options = {}) {
  const root = resolve(options.rootDir || '.');
  if (options.overrideCandidates) {
    const candidates = options.overrideCandidates;
    const trustedReviewers = options.trustedReviewers ?? {};
    const details = summarizeCandidates(candidates, new Map(), new Map(candidates.map((candidate) => [candidate.candidateId, candidate.humanReview ?? candidate.review ?? {}])), trustedReviewers);
    const syntacticallyValid = details.filter((entry) => entry.gherkinSyntaxValid).length;
    const humanApproved = details.filter((entry) => entry.humanOracleAndNoveltyApproved).length;
    const semanticMatched = details.filter((entry) => entry.semanticMappingApproved).length;
    const syntaxInvalid = syntacticallyValid !== candidates.length;
    return {
      rq1: { outcome: syntaxInvalid ? 'FAIL' : humanApproved < candidates.length ? 'BLOCKED' : semanticMatched < candidates.length ? 'NOT_EVALUATED' : 'PASS', totalCandidates: candidates.length, validGherkinSyntax: syntacticallyValid, humanApprovedCount: humanApproved, semanticNoveltyCount: semanticMatched, details },
      rq2: { outcome: 'NOT_EVALUATED', reason: 'Override candidates do not include a verified baseline and behavioral-unit mapping.' },
      rq3: { outcome: 'NOT_EVALUATED', reason: 'Override candidates do not include source-bound runtime evidence.' },
      rq4: { outcome: 'NOT_EVALUATED', reason: 'Override candidates do not include provider usage telemetry.' },
    };
  }

  const datasetPath = join(root, 'docs', 'research-results', 'v2', 'dataset', '40-candidate-dataset.json');
  const dataset = readJson(datasetPath, 'candidate registry');
  const candidates = dataset.candidates;
  if (!Array.isArray(candidates) || candidates.length !== TARGET_CASES) throw new Error(`INCONSISTENT_CANDIDATE_COUNT: expected ${TARGET_CASES}`);
  const ids = candidates.map((candidate) => candidate.candidateId);
  if (new Set(ids).size !== ids.length) throw new Error('DUPLICATE_CANDIDATE_ID');
  const reviews = readReviews(root);
  const trustedReviewers = options.trustedReviewers ?? readTrustedReviewers(root);
  if (reviews.size !== TARGET_CASES || ids.some((id) => !reviews.has(id))) throw new Error('INCONSISTENT_CANDIDATE_IDS: registry and review ledgers differ');
  const traceability = loadTraceability(root, candidates);
  const details = summarizeCandidates(candidates, traceability.byId, reviews, trustedReviewers);
  const validGherkinSyntax = details.filter((entry) => entry.gherkinSyntaxValid).length;
  const humanApprovedCount = details.filter((entry) => entry.humanOracleAndNoveltyApproved).length;
  const semanticNoveltyCount = details.filter((entry) => entry.semanticMappingApproved).length;
  const eligibleCount = details.filter((entry) => entry.eligibleForValidated).length;
  const rq1Outcome = validGherkinSyntax !== TARGET_CASES ? 'FAIL' : humanApprovedCount < TARGET_CASES ? 'BLOCKED' : semanticNoveltyCount < TARGET_CASES ? 'NOT_EVALUATED' : 'PASS';

  const taxonomyPath = join(root, 'data', 'coverage', 'behavioral-taxonomy-baseline.json');
  const taxonomy = existsSync(taxonomyPath) ? readJson(taxonomyPath, 'behavioral baseline taxonomy') : null;
  const g3 = rawExecutionSummary(root);
  const rq3 = evaluateRq3Evidence({ rootDir: root, candidates, traceabilityById: traceability.byId, reviews, trustedReviewers, rawExecution: g3 });
  rq3.eligibleBehaviorallyValidatedCases = rq3.validatedCandidates;
  rq3.sourceHashMismatches = traceability.sourceHashMismatches;
  rq3.gherkinHashMismatches = traceability.gherkinHashMismatches;
  const rq2 = evaluateRq2Evidence({ rootDir: root, taxonomy, candidates, reviews, trustedReviewers, traceabilityById: traceability.byId, rq3 });
  rq2.validatedCases = rq2.validatedNewBehaviorUnits;

  const invocationLedgerPath = join(root, 'data', 'runs', 'model-invocation-ledger.json');
  const invocationLedger = existsSync(invocationLedgerPath) ? readJson(invocationLedgerPath, 'model invocation ledger') : null;
  const rq4 = invocationLedger && Array.isArray(invocationLedger.invocations)
    ? { outcome: 'PARTIALLY_VERIFIED', source: relative(root, invocationLedgerPath), successfulCalls: invocationLedger.invocations.filter((call) => call.status === 'SUCCESS' && call.responseHash).length, inputTokens: null, outputTokens: null, actualCostUsd: null, comparisonOrSavings: 'NOT_MEASURED' }
    : { outcome: 'PARTIALLY_VERIFIED', ...modelUsageSummary(root), reason: 'No structured successful-response usage telemetry or actual billing record is available.' };

  return {
    schemaVersion: '1.0.0',
    auditBaselineCommit: options.baselineCommit ?? 'UNSPECIFIED',
    candidateCount: TARGET_CASES,
    checks: { uniqueCandidateIds: true, reviewRecords: reviews.size, traceabilityAvailable: !traceability.unavailable, datasetSourceHashMismatches: traceability.sourceHashMismatches?.length ?? null, datasetGherkinHashMismatches: traceability.gherkinHashMismatches?.length ?? null },
    rq1: { outcome: rq1Outcome, totalCandidates: TARGET_CASES, validGherkinSyntax, humanApprovedCount, semanticNoveltyCount, details },
    rq2,
    rq3,
    rq4,
  };
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(result) {
  const raw = result.rq3.rawExecution ?? {};
  const runAccounting = result.rq3.runRecordAccounting ?? {};
  const rows = [
    ['researchQuestion', 'status', 'measure', 'value', 'denominator', 'evidenceOrReason'],
    ['RQ1', result.rq1.outcome, 'syntacticValidity', result.rq1.validGherkinSyntax, result.rq1.totalCandidates, 'Cucumber Gherkin parser'],
    ['RQ1', result.rq1.outcome, 'humanOracleNoveltyApprovals', result.rq1.humanApprovedCount, result.rq1.totalCandidates, 'Signed primary review records only'],
    ['RQ1', result.rq1.outcome, 'semanticMappingsApproved', result.rq1.semanticNoveltyCount, result.rq1.totalCandidates, 'Case traceability audit'],
    ['RQ2', result.rq2.outcome, 'baselineBehaviorUnits', result.rq2.baselineDenominator, '', result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'baselineStatus', result.rq2.baselineStatus, '', result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'approvedNewBehaviorUnits', result.rq2.approvedNewBehaviorUnits, result.rq2.proposedCandidates, result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'implementedNewBehaviorUnits', result.rq2.implementedNewBehaviorUnits, result.rq2.proposedCandidates, result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'validatedNewBehaviorUnits', result.rq2.validatedNewBehaviorUnits, result.rq2.baselineDenominator, result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'coverageGain', result.rq2.coverageGain, result.rq2.baselineDenominator, result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'coverageGainPercent', result.rq2.coverageGainPercent, '', result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'validatedCases', result.rq2.validatedCases, result.candidateCount, result.rq2.reason],
    ['RQ3', result.rq3.outcome, 'eligibleBehaviorallyValidatedCases', result.rq3.eligibleBehaviorallyValidatedCases, result.candidateCount, result.rq3.reason],
    ['RQ3', result.rq3.outcome, 'protocolCompleteSourceBoundCandidates', result.rq3.protocolCompleteCandidates, result.rq3.candidateCount, 'One initial plus three source-bound reruns'],
    ['RQ3', result.rq3.outcome, 'sourceBoundCandidates', result.rq3.sourceBoundCandidateCount, result.rq3.candidateCount, 'Per-run candidate identity and provenance required'],
    ['RQ3', result.rq3.outcome, 'verifiedSourceBoundRunRecords', result.rq3.verifiedRunRecords, result.rq3.rawRunRecordFilesObserved, 'Schema, source hashes, compile, JUnit, reset and cleanup verified'],
    ['RQ3', result.rq3.outcome, 'summaryRunIds', runAccounting.summaryRunIds, '', 'G3 consolidated summary'],
    ['RQ3', result.rq3.outcome, 'matchingRunRecords', runAccounting.matchingRunRecords, runAccounting.runRecordFileCount, 'Run IDs matched to physical run-record JSON'],
    ['RQ3', result.rq3.outcome, 'unsummarizedRunRecords', runAccounting.extraRunRecords?.length ?? '', runAccounting.runRecordFileCount, 'Purpose unresolved unless explicitly recorded'],
    ['RQ3', result.rq3.outcome, 'unboundRunRecordFilesObserved', result.rq3.unboundRunRecordFilesObserved, result.rq3.rawRunRecordFilesObserved, 'Candidate identity absent or unregistered'],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawInitialPassCandidatesReported', raw.initialPassCandidates ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawThreeRerunPassCandidatesReported', raw.validatedCandidatesReported ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawFlakyCandidatesReported', raw.flakyCandidatesReported ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawFailedCandidatesReported', raw.failedCandidatesReported ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'runRecordsWithCompleteIdentity', raw.runRecordsWithCompleteIdentity ?? '', raw.runRecordFilesObserved ?? '', 'Required app/test/image/runtime identity fields'],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'cleanupResidualFailuresObserved', raw.cleanupResidualFailuresObserved ?? '', raw.totalRunInvocationsReported ?? '', 'Raw cleanup-result.json files'],
    ...(runAccounting.candidateOutcomesReported ?? []).flatMap((candidate) => [
      ['RQ3_REPORTED', 'REPORTED_ONLY', `${candidate.candidateId}_rerunFailureRate`, candidate.rerunFailureRateAmongReruns, 3, `Outcomes: ${(candidate.rerunOutcomesReported ?? []).join('|')}`],
      ['RQ3_REPORTED', 'REPORTED_ONLY', `${candidate.candidateId}_allTrialFailureRate`, candidate.failureRateAcrossInitialAndReruns, 4, `Initial: ${candidate.initialOutcomeReported ?? 'UNKNOWN'}`],
    ]),
    ['RQ4', result.rq4.outcome, 'successfulModelCalls', result.rq4.successfulCalls ?? '', '', result.rq4.reason ?? result.rq4.status],
    ['RQ4', result.rq4.outcome, 'actualCostUsd', result.rq4.actualCostUsd ?? '', '', 'UNKNOWN unless provider billing evidence exists'],
  ];
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve('.');
    const baselineCommit = readGitHeadCommit(root);
    const result = runRecompute({ rootDir: root, baselineCommit });
    const outDir = join(root, 'docs', 'final-acceptance');
    const jsonOut = join(outDir, 'RQ1-RQ4-results.json');
    const csvOut = join(outDir, 'RQ1-RQ4-results.csv');
    writeFileSync(jsonOut, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    writeFileSync(csvOut, toCsv(result), 'utf8');
    console.log(JSON.stringify({ json: relative(root, jsonOut), csv: relative(root, csvOut), rq1: result.rq1.outcome, rq2: result.rq2.outcome, rq3: result.rq3.outcome, rq4: result.rq4.outcome }, null, 2));
  } catch (error) {
    console.error('METRICS_AUDIT_BLOCKED:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  }
}
