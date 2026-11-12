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
import { resolve, join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
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

export function isHumanOracleAndNoveltyApproval(record) {
  if (!record || typeof record !== 'object') return false;
  const reviewer = typeof record.reviewerIdentity === 'string' ? record.reviewerIdentity.trim() : '';
  const reviewerName = typeof record.reviewer === 'string' ? record.reviewer.trim() : '';
  const assigned = Boolean(reviewerName || (reviewer && reviewer !== 'UNASSIGNED_PENDING_TEAM_LEAD_REVIEW'));
  const timestamp = Date.parse(record.approvedAt ?? '');
  return assigned &&
    typeof record.reviewerRole === 'string' && record.reviewerRole.trim().length > 0 &&
    Boolean(record.signature) &&
    Number.isFinite(timestamp) &&
    typeof record.rationale === 'string' && record.rationale.trim().length > 0 &&
    record.reviewStatus === 'APPROVED' &&
    record.oracleDecision === 'APPROVED' &&
    record.noveltyDecision === 'APPROVED';
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

function summarizeCandidates(candidates, traceabilityById, reviews) {
  const details = candidates.map((candidate) => {
    const parsed = validateGherkinSyntax(candidate.gherkinScenario);
    const review = reviews.get(candidate.candidateId) ?? {};
    const semanticAudit = candidateSemanticAudit(candidate, traceabilityById);
    const humanApproved = isHumanOracleAndNoveltyApproval(review);
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
    const observedHash = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
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
    const details = summarizeCandidates(candidates, new Map(), new Map(candidates.map((candidate) => [candidate.candidateId, candidate.humanReview ?? candidate.review ?? {}])));
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
  if (reviews.size !== TARGET_CASES || ids.some((id) => !reviews.has(id))) throw new Error('INCONSISTENT_CANDIDATE_IDS: registry and review ledgers differ');
  const traceability = loadTraceability(root, candidates);
  const details = summarizeCandidates(candidates, traceability.byId, reviews);
  const validGherkinSyntax = details.filter((entry) => entry.gherkinSyntaxValid).length;
  const humanApprovedCount = details.filter((entry) => entry.humanOracleAndNoveltyApproved).length;
  const semanticNoveltyCount = details.filter((entry) => entry.semanticMappingApproved).length;
  const eligibleCount = details.filter((entry) => entry.eligibleForValidated).length;
  const rq1Outcome = validGherkinSyntax !== TARGET_CASES ? 'FAIL' : humanApprovedCount < TARGET_CASES ? 'BLOCKED' : semanticNoveltyCount < TARGET_CASES ? 'NOT_EVALUATED' : 'PASS';

  const taxonomyPath = join(root, 'data', 'coverage', 'behavioral-taxonomy-baseline.json');
  const taxonomy = existsSync(taxonomyPath) ? readJson(taxonomyPath, 'behavioral baseline taxonomy') : null;
  const taxonomyStatus = taxonomy?.auditStatus ?? taxonomy?.denominatorStatus ?? 'NOT_ESTABLISHED';
  const baselineVerified = taxonomyStatus === 'VERIFIED_BY_INDEPENDENT_REVIEW' && Number.isInteger(taxonomy?.defensibleDenominator?.totalBaselineDenominator);
  const rq2 = {
    outcome: 'NOT_EVALUATED',
    baselineStatus: baselineVerified ? 'VERIFIED' : 'NOT_ESTABLISHED',
    baselineDenominator: baselineVerified ? taxonomy.defensibleDenominator.totalBaselineDenominator : null,
    proposedCandidates: TARGET_CASES,
    verifiedNewBehaviorUnits: null,
    validatedCases: eligibleCount,
    coverageGain: null,
    reason: 'A proposed test count is not a behavioral-unit denominator; no independently approved new-UBU mapping is present.',
  };

  const g3 = rawExecutionSummary(root);
  const rq3 = {
    outcome: 'NOT_EVALUATED',
    eligibleBehaviorallyValidatedCases: eligibleCount,
    rawExecution: g3,
    sourceHashMismatches: traceability.sourceHashMismatches,
    gherkinHashMismatches: traceability.gherkinHashMismatches,
    reason: traceability.unavailable ? 'Case-level semantic audit is missing.' : 'Raw runs are not bound to source/test/image identity and do not repair semantic mismatches.',
  };

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
  const rows = [
    ['researchQuestion', 'status', 'measure', 'value', 'denominator', 'evidenceOrReason'],
    ['RQ1', result.rq1.outcome, 'syntacticValidity', result.rq1.validGherkinSyntax, result.rq1.totalCandidates, 'Cucumber Gherkin parser'],
    ['RQ1', result.rq1.outcome, 'humanOracleNoveltyApprovals', result.rq1.humanApprovedCount, result.rq1.totalCandidates, 'Signed primary review records only'],
    ['RQ1', result.rq1.outcome, 'semanticMappingsApproved', result.rq1.semanticNoveltyCount, result.rq1.totalCandidates, 'Case traceability audit'],
    ['RQ2', result.rq2.outcome, 'baselineBehaviorUnits', result.rq2.baselineDenominator, '', result.rq2.reason],
    ['RQ2', result.rq2.outcome, 'validatedCases', result.rq2.validatedCases, result.candidateCount, result.rq2.reason],
    ['RQ3', result.rq3.outcome, 'eligibleBehaviorallyValidatedCases', result.rq3.eligibleBehaviorallyValidatedCases, result.candidateCount, result.rq3.reason],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawInitialPassCandidatesReported', raw.initialPassCandidates ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawThreeRerunPassCandidatesReported', raw.validatedCandidatesReported ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawFlakyCandidatesReported', raw.flakyCandidatesReported ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'rawFailedCandidatesReported', raw.failedCandidatesReported ?? '', raw.totalCandidates ?? '', raw.source ?? ''],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'runRecordsWithCompleteIdentity', raw.runRecordsWithCompleteIdentity ?? '', raw.runRecordFilesObserved ?? '', 'Required app/test/image/runtime identity fields'],
    ['RQ3', raw.status ?? 'NOT_AVAILABLE', 'cleanupResidualFailuresObserved', raw.cleanupResidualFailuresObserved ?? '', raw.totalRunInvocationsReported ?? '', 'Raw cleanup-result.json files'],
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
