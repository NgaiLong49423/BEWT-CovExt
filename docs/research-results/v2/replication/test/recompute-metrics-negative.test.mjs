import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
  isHumanOracleAndNoveltyApproval,
  reviewSignaturePayload,
  evaluateRq2Evidence,
  evaluateRq3Evidence,
  validateGherkinSyntax,
  auditJavaSeleniumQuality,
  readGitHeadCommit,
  runRecompute,
} from '../recompute-metrics.mjs';

const validScenario = `Feature: Cart stock boundary
  Scenario: Reject quantity above available stock
    Given a product has one item in stock
    When a customer requests quantity two
    Then the application rejects the quantity and leaves the cart unchanged`;

function makeSignedReview(fields = {}) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const review = {
    candidateId: 'MOCK-001', application: 'bludit', reviewerIdentity: 'reviewer@example.invalid', reviewerRole: 'Team Lead',
    approvedAt: '2026-11-12T00:00:00Z', rationale: 'Reviewed the application source and exact oracle.',
    reviewStatus: 'APPROVED', oracleDecision: 'APPROVED', noveltyDecision: 'APPROVED', ...fields,
  };
  review.signature = { algorithm: 'Ed25519', keyId: 'test-key', value: sign(null, Buffer.from(reviewSignaturePayload(review)), privateKey).toString('base64') };
  return { review, privateKey, trustedReviewers: { 'test-key': { reviewerIdentity: review.reviewerIdentity, reviewerRole: review.reviewerRole, publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }) } } };
}

function sha(value) { return createHash('sha256').update(value).digest('hex'); }

function signStatement(record, privateKey) {
  return { ...record, signature: { algorithm: 'Ed25519', keyId: 'test-key', value: sign(null, Buffer.from(reviewSignaturePayload(record)), privateKey).toString('base64') } };
}

function createRuntimeFixture({ runCount = 4, failingOracleRun = null, mutateRun = null, badSourceCommit = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'bewt-rq3-fixture-'));
  const candidateId = 'MOCK-001';
  const app = 'bludit';
  const sourceCommit = 'a'.repeat(40);
  const imageDigest = 'sha256:' + 'b'.repeat(64);
  const sourcePath = join(root, 'extension', app, 'MockCase.java');
  mkdirSync(join(root, 'extension', app), { recursive: true });
  const javaSource = 'package test;\npublic class MockCase {}\n';
  writeFileSync(sourcePath, javaSource);
  const javaHash = sha(javaSource);
  const gherkinHash = sha(validScenario);
  const candidate = { candidateId, application: app, applicationVersion: '2.3.4', javaClass: 'test.MockCase', javaSourcePath: relative(root, sourcePath), javaSourceSha256: javaHash, gherkinScenario: validScenario, gherkinSha256: gherkinHash, oracle: 'One cart item remains after an over-stock request.' };
  const { review, trustedReviewers } = makeSignedReview({ candidateId, application: app });
  const trace = { javaSourceSha256Observed: javaHash, gherkinScenarioSha256Observed: gherkinHash, registrationHashMatchesObservedJava: true, semanticAudit: { status: 'MATCHED', reviewerDecision: 'APPROVED' } };
  const config = { appId: app, benchmarkBaseVersion: candidate.applicationVersion, source: { commit: sourceCommit }, runtime: { imageDigest } };
  const configPath = join(root, 'config', 'apps', app + '.json');
  mkdirSync(join(root, 'config', 'apps'), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config));
  const resultPath = join(root, 'docs', 'tasks', 'g3-evidence', app, candidateId);
  const appReview = new Map([[candidateId, review]]);
  for (let i = 0; i < runCount; i++) {
    const runId = 'RUN-' + i;
    const runDir = join(resultPath, runId);
    mkdirSync(runDir, { recursive: true });
    const fileArtifact = (name, content) => {
      const path = join(runDir, name);
      writeFileSync(path, content);
      return { path: relative(root, path).replaceAll('\\', '/'), sha256: sha(readFileSync(path)) };
    };
    const compileLog = fileArtifact('compile.log', 'BUILD SUCCESS\n');
    const junitText = '<?xml version="1.0"?><testsuite tests="1" failures="0" errors="0" skipped="0"><testcase classname="test.MockCase" name="testBusinessOracle"/></testsuite>';
    const junit = fileArtifact('TEST-test.MockCase.xml', junitText);
    const reset = fileArtifact('reset.json', JSON.stringify({ appId: app, runId, outcome: 'PASS' }));
    const cleanup = fileArtifact('cleanup.json', JSON.stringify({ appId: app, runId, outcome: 'PASS', zeroResidualVerified: true }));
    const run = {
      schemaVersion: '1.0.0', candidateId, runId, runType: i === 0 ? 'INITIAL' : 'RERUN', rerunIndex: i,
      startedAtUtc: '2026-11-12T00:00:00Z', finishedAtUtc: '2026-11-12T00:00:10Z',
      application: { appId: app, version: candidate.applicationVersion, sourceCommit: badSourceCommit && i === 0 ? 'c'.repeat(40) : sourceCommit, imageDigest },
      test: { javaSourceSha256: javaHash, gherkinSha256: gherkinHash },
      runtime: { javaVersion: '21', mavenVersion: '3.9.9', seleniumVersion: '4.35.0', dockerVersion: '27.0' },
      compile: { outcome: 'PASS', command: 'mvn -B test-compile', log: compileLog },
      execution: { exitCode: 0, junitXmlPath: junit.path, junitXmlSha256: junit.sha256 },
      oracleVerification: { status: failingOracleRun === i ? 'FAIL' : 'PASS', javaSourceSha256: javaHash, gherkinSha256: gherkinHash },
      reset: { outcome: 'PASS', evidence: reset }, cleanup: { outcome: 'PASS', evidence: cleanup },
    };
    mutateRun?.(run, i);
    writeFileSync(join(runDir, 'run-record.json'), JSON.stringify(run));
  }
  return { root, candidate, traceabilityById: new Map([[candidateId, trace]]), reviews: appReview, trustedReviewers, dispose: () => rmSync(root, { recursive: true, force: true }) };
}


function createTaxonomyFixture() {
  const root = mkdtempSync(join(tmpdir(), 'bewt-rq2-fixture-'));
  const signed = makeSignedReview({ candidateId: 'MOCK-RQ2', application: 'bludit' });
  const baselinePath = join(root, 'baseline', 'bludit.feature');
  const newBehaviorPath = join(root, 'evidence', 'new-behavior.txt');
  mkdirSync(join(root, 'baseline'), { recursive: true });
  mkdirSync(join(root, 'evidence'), { recursive: true });
  writeFileSync(baselinePath, 'Feature: baseline behavior\n Scenario: baseline scenario\n');
  writeFileSync(newBehaviorPath, 'Source proof for a non-overlapping additional behavior.\n');
  const baseUnit = { behavioralUnitId: 'BL-UBU-001', evidence: { path: relative(root, baselinePath), sha256: sha(readFileSync(baselinePath)) } };
  const digestRows = [{ application: 'bludit', behavioralUnitId: baseUnit.behavioralUnitId, sourceSha256: baseUnit.evidence.sha256 }];
  const inventorySha256 = sha(JSON.stringify(digestRows));
  const baselineReview = signStatement({ decision: 'APPROVED', baselineCommit: 'c'.repeat(40), inventorySha256, baselineDenominator: 1, reviewerIdentity: signed.review.reviewerIdentity, reviewerRole: signed.review.reviewerRole, approvedAt: signed.review.approvedAt, rationale: 'Verified the pinned baseline inventory.', reviewStatus: 'APPROVED' }, signed.privateKey);
  const candidate = { candidateId: 'MOCK-RQ2', application: 'bludit', applicationVersion: '2.3.4', javaSourceSha256: 'd'.repeat(64), gherkinSha256: 'e'.repeat(64) };
  const approval = signStatement({ candidateId: candidate.candidateId, application: candidate.application, behavioralUnitId: 'BL-UBU-NEW-001', decision: 'APPROVED', reviewerIdentity: signed.review.reviewerIdentity, reviewerRole: signed.review.reviewerRole, approvedAt: signed.review.approvedAt, rationale: 'Behavior is absent from the verified baseline.', reviewStatus: 'APPROVED', oracleDecision: 'APPROVED', noveltyDecision: 'APPROVED' }, signed.privateKey);
  const perApplicationBaselines = Object.fromEntries(['bludit','claroline','expresscart','joomla','kanboard','mantisbt','mediawiki','prestashop'].map((app) => [app, { baselineUniqueBehavioralUnits: app === 'bludit' ? 1 : 0, baselineBehavioralUnits: app === 'bludit' ? [baseUnit] : [] }]));
  const taxonomy = {
    schemaVersion: '2.0.0', auditStatus: 'VERIFIED_BY_INDEPENDENT_REVIEW', baselineReference: { commit: 'c'.repeat(40) },
    baselineReview, aggregateBaselineCounts: { totalBehavioralUnits: 1 }, defensibleDenominator: { totalBaselineDenominator: 1 },
    perApplicationBaselines,
    candidateToTaxonomyMapping: { bludit: [{ candidateId: candidate.candidateId, application: 'bludit', behavioralUnitId: 'BL-UBU-NEW-001', approval, sourceEvidence: [{ path: relative(root, newBehaviorPath), sha256: sha(readFileSync(newBehaviorPath)) }] }] },
  };
  const trace = { javaSourceSha256Observed: candidate.javaSourceSha256, registrationHashMatchesObservedJava: true, gherkinScenarioSha256Observed: candidate.gherkinSha256, semanticAudit: { status: 'MATCHED', reviewerDecision: 'APPROVED' } };
  const rq3 = { candidates: [{ candidateId: candidate.candidateId, status: 'VALIDATED' }] };
  return { root, candidate, taxonomy, review: signed.review, trustedReviewers: signed.trustedReviewers, traceabilityById: new Map([[candidate.candidateId, trace]]), rq3, dispose: () => rmSync(root, { recursive: true, force: true }) };
}

test('uses the Cucumber parser to accept a complete scenario', () => {
  const result = validateGherkinSyntax(validScenario);
  assert.equal(result.valid, true);
  assert.equal(result.scenarioCount, 1);
  assert.equal(result.steps, 3);
});

const rejectedGherkinCases = [
  ['empty input', ''],
  ['scenario missing Feature', 'Scenario: Missing feature\n Given a state\n When an action\n Then a result'],
  ['malformed input that regex line scanning would accept', 'Feature: X\n Scenario: Y\n Given a state\n When an action\n Then a result\n And'],
  ['scenario missing When', 'Feature: X\n Scenario: Y\n Given a state\n Then a result'],
  ['scenario missing Then', 'Feature: X\n Scenario: Y\n Given a state\n When an action'],
];
for (const [description, scenario] of rejectedGherkinCases) {
  test(`rejects ${description}`, () => assert.equal(validateGherkinSyntax(scenario).valid, false));
}

test('rejects tautological Java assertions', () => {
  const result = auditJavaSeleniumQuality('driver.get("/x"); Assert.assertTrue(currentUrl.length() >= 0);');
  assert.equal(result.pass, false);
});

test('rejects driver-presence as the only oracle', () => {
  const result = auditJavaSeleniumQuality('driver.get("/x"); Assert.assertNotNull(driver);');
  assert.equal(result.pass, false);
});

test('implementation authorization alone is not human oracle or novelty approval', () => {
  assert.equal(isHumanOracleAndNoveltyApproval({ decision: 'APPROVED_FOR_IMPLEMENTATION' }), false);
  assert.equal(isHumanOracleAndNoveltyApproval({
    decision: 'APPROVED_FOR_IMPLEMENTATION',
    reviewerIdentity: 'UNASSIGNED_PENDING_TEAM_LEAD_REVIEW',
    reviewStatus: 'PENDING_HUMAN_SIGNATURE',
  }), false);
});

test('requires a trusted Ed25519 signature in addition to complete review fields', () => {
  const signed = makeSignedReview();
  assert.equal(isHumanOracleAndNoveltyApproval(signed.review, signed.trustedReviewers), true);
  assert.equal(isHumanOracleAndNoveltyApproval(signed.review, {}), false);
  assert.equal(isHumanOracleAndNoveltyApproval({ ...signed.review, signature: 'forged' }, signed.trustedReviewers), false);
  assert.equal(isHumanOracleAndNoveltyApproval({ ...signed.review, noveltyDecision: 'REJECTED' }, signed.trustedReviewers), false);
});

test('unapproved candidate is BLOCKED and unknown RQ evidence stays NOT_EVALUATED', () => {
  const result = runRecompute({ overrideCandidates: [{
    candidateId: 'MOCK-001', application: 'bludit', gherkinScenario: validScenario,
    decision: 'APPROVED_FOR_IMPLEMENTATION', reviewer: 'Team Lead',
  }] });
  assert.equal(result.rq1.outcome, 'BLOCKED');
  assert.equal(result.rq1.humanApprovedCount, 0);
  assert.equal(result.rq2.outcome, 'NOT_EVALUATED');
  assert.equal(result.rq3.outcome, 'NOT_EVALUATED');
  assert.equal(result.rq4.outcome, 'NOT_EVALUATED');
});

test('valid signed review does not establish runtime validation by itself', () => {
  const signed = makeSignedReview({ candidateId: 'MOCK-002' });
  const result = runRecompute({ overrideCandidates: [{
    candidateId: 'MOCK-002', application: 'bludit', gherkinScenario: validScenario,
    humanReview: signed.review, semanticAudit: { status: 'MATCHED', reviewerDecision: 'APPROVED' },
  }], trustedReviewers: signed.trustedReviewers });
  assert.equal(result.rq1.humanApprovedCount, 1);
  assert.equal(result.rq1.semanticNoveltyCount, 1);
  assert.equal(result.rq3.outcome, 'NOT_EVALUATED');
});

test('invalid scenario fails syntax validation without inventing other RQ results', () => {
  const result = runRecompute({ overrideCandidates: [{
    candidateId: 'MOCK-003', application: 'bludit', gherkinScenario: 'Feature: invalid\n Scenario: invalid\n Given x\n When y',
  }] });
  assert.equal(result.rq1.outcome, 'FAIL');
  assert.equal(result.rq1.validGherkinSyntax, 0);
  assert.equal(result.rq2.outcome, 'NOT_EVALUATED');
});

test('main recomputation detects dataset hash mismatch and blocks case validation', () => {
  const result = runRecompute({ rootDir: process.cwd(), baselineCommit: 'fixture-sha' });
  assert.equal(result.checks.datasetSourceHashMismatches, 1);
  assert.equal(result.checks.datasetGherkinHashMismatches, 0);
  assert.deepEqual(result.rq3.sourceHashMismatches, ['JO-GAP-004']);
  assert.deepEqual(result.rq3.gherkinHashMismatches, []);
  assert.equal(result.rq1.humanApprovedCount, 0);
  assert.equal(result.rq3.eligibleBehaviorallyValidatedCases, 0);
  assert.equal(result.rq3.rawExecution.runRecordFilesObserved, 84);
  assert.equal(result.rq3.rawExecution.junitXmlFilesObserved, 85);
  assert.equal(result.rq3.rawExecution.runRecordsWithCompleteIdentity, 0);
  assert.equal(result.rq3.rawExecution.cleanupResidualFailuresObserved, 1);
});

test('main recomputation is deterministic for the same evidence snapshot', () => {
  const first = runRecompute({ rootDir: process.cwd(), baselineCommit: 'fixture-sha' });
  const second = runRecompute({ rootDir: process.cwd(), baselineCommit: 'fixture-sha' });
  assert.deepEqual(first, second);
});

test('reads detached HEAD directly from Git metadata', () => {
  const root = mkdtempSync(join(tmpdir(), 'bewt-git-head-'));
  try {
    const gitDir = join(root, '.git');
    const expected = 'a'.repeat(40);
    mkdirSync(gitDir);
    writeFileSync(join(gitDir, 'HEAD'), `${expected}\n`);
    assert.equal(readGitHeadCommit(root), expected);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reads linked-worktree branch refs from the common Git directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'bewt-linked-head-'));
  try {
    const commonDir = join(root, 'git-common');
    const gitDir = join(commonDir, 'worktrees', 'audit');
    const refPath = join(commonDir, 'refs', 'heads', 'audit');
    const expected = 'b'.repeat(40);
    mkdirSync(gitDir, { recursive: true });
    mkdirSync(join(commonDir, 'refs', 'heads'), { recursive: true });
    writeFileSync(join(root, '.git'), 'gitdir: git-common/worktrees/audit\n');
    writeFileSync(join(gitDir, 'commondir'), '../..\n');
    writeFileSync(join(gitDir, 'HEAD'), 'ref: refs/heads/audit\n');
    writeFileSync(refPath, `${expected}\n`);
    assert.equal(readGitHeadCommit(root), expected);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('computes RQ3 VALIDATED only from a complete source-bound 1+3 evidence set', () => {
  const fixture = createRuntimeFixture();
  try {
    const result = evaluateRq3Evidence({ rootDir: fixture.root, candidates: [fixture.candidate], traceabilityById: fixture.traceabilityById, reviews: fixture.reviews, trustedReviewers: fixture.trustedReviewers, rawExecution: { status: 'NOT_AVAILABLE' } });
    assert.equal(result.outcome, 'PASS');
    assert.equal(result.validatedCandidates, 1);
    assert.equal(result.candidates[0].status, 'VALIDATED');
    assert.equal(result.candidates[0].verifiedRunRecords, 4);
    assert.equal(result.candidates[0].rerunFailureRate, 0);
    assert.equal(result.candidates[0].allTrialFailureRate, 0);
  } finally { fixture.dispose(); }
});

test('classifies missing reruns as PARTIALLY_VERIFIED, not VALIDATED', () => {
  const fixture = createRuntimeFixture({ runCount: 2 });
  try {
    const result = evaluateRq3Evidence({ rootDir: fixture.root, candidates: [fixture.candidate], traceabilityById: fixture.traceabilityById, reviews: fixture.reviews, trustedReviewers: fixture.trustedReviewers, rawExecution: { status: 'NOT_AVAILABLE' } });
    assert.equal(result.outcome, 'PARTIALLY_VERIFIED');
    assert.equal(result.validatedCandidates, 0);
    assert.equal(result.candidates[0].status, 'PARTIALLY_VERIFIED');
    assert.equal(result.candidates[0].protocolComplete, false);
  } finally { fixture.dispose(); }
});

test('records a failed oracle as a complete measured failure, never VALIDATED', () => {
  const fixture = createRuntimeFixture({ failingOracleRun: 2 });
  try {
    const result = evaluateRq3Evidence({ rootDir: fixture.root, candidates: [fixture.candidate], traceabilityById: fixture.traceabilityById, reviews: fixture.reviews, trustedReviewers: fixture.trustedReviewers, rawExecution: { status: 'NOT_AVAILABLE' } });
    assert.equal(result.outcome, 'PASS');
    assert.equal(result.protocolCompleteCandidates, 1);
    assert.equal(result.validatedCandidates, 0);
    assert.equal(result.failedCandidates, 1);
    assert.equal(result.candidates[0].status, 'FAIL');
    assert.equal(result.candidates[0].rerunFailureRate, 1 / 3);
    assert.equal(result.candidates[0].allTrialFailureRate, 1 / 4);
  } finally { fixture.dispose(); }
});

test('rejects source-hash and application-commit mismatches from RQ3 validation', () => {
  const fixture = createRuntimeFixture({ mutateRun: (run, i) => { if (i === 1) run.test.javaSourceSha256 = 'f'.repeat(64); } });
  try {
    const result = evaluateRq3Evidence({ rootDir: fixture.root, candidates: [fixture.candidate], traceabilityById: fixture.traceabilityById, reviews: fixture.reviews, trustedReviewers: fixture.trustedReviewers, rawExecution: { status: 'NOT_AVAILABLE' } });
    assert.equal(result.validatedCandidates, 0);
    assert.equal(result.candidates[0].status, 'PARTIALLY_VERIFIED');
    assert.ok(result.candidates[0].evidenceErrors.includes('TEST_SOURCE_HASH_MISMATCH'));
  } finally { fixture.dispose(); }
  const badCommit = createRuntimeFixture({ badSourceCommit: true });
  try {
    const result = evaluateRq3Evidence({ rootDir: badCommit.root, candidates: [badCommit.candidate], traceabilityById: badCommit.traceabilityById, reviews: badCommit.reviews, trustedReviewers: badCommit.trustedReviewers, rawExecution: { status: 'NOT_AVAILABLE' } });
    assert.equal(result.validatedCandidates, 0);
    assert.equal(result.candidates[0].protocolComplete, false);
    assert.ok(result.candidates[0].evidenceErrors.includes('APPLICATION_SOURCE_OR_IMAGE_PROVENANCE_MISMATCH'));
  } finally { badCommit.dispose(); }
});

test('refuses RQ2 without a signed, hashed behavioral baseline and computes actual gain when supplied', () => {
  const fixture = createTaxonomyFixture();
  try {
    const base = { rootDir: fixture.root, taxonomy: fixture.taxonomy, candidates: [fixture.candidate], reviews: new Map([[fixture.candidate.candidateId, fixture.review]]), trustedReviewers: fixture.trustedReviewers, traceabilityById: fixture.traceabilityById, rq3: fixture.rq3 };
    assert.equal(evaluateRq2Evidence({ ...base, taxonomy: null }).outcome, 'NOT_EVALUATED');
    const valid = evaluateRq2Evidence(base);
    assert.equal(valid.outcome, 'PASS');
    assert.equal(valid.baselineDenominator, 1);
    assert.equal(valid.approvedNewBehaviorUnits, 1);
    assert.equal(valid.implementedNewBehaviorUnits, 1);
    assert.equal(valid.validatedNewBehaviorUnits, 1);
    assert.equal(valid.coverageGain, 1);
    assert.equal(valid.coverageGainPercent, 100);
    const forged = structuredClone(fixture.taxonomy);
    forged.baselineReview.signature.value = Buffer.from('forged').toString('base64');
    assert.equal(evaluateRq2Evidence({ ...base, taxonomy: forged }).outcome, 'NOT_EVALUATED');
  } finally { fixture.dispose(); }
});


test('separates consolidated G3 runs from extra diagnostics and reports explicit JO rerun denominators', () => {
  const fixture = createRuntimeFixture({ runCount: 0 });
  try {
    const summaryPath = join(fixture.root, 'docs', 'tasks', 'g3-evidence', 'all-40-candidates-g3-consolidated-summary.json');
    mkdirSync(join(fixture.root, 'docs', 'tasks', 'g3-evidence'), { recursive: true });
    writeFileSync(summaryPath, JSON.stringify({ results: [{ candidateId: 'JO-GAP-003', application: 'joomla', initialRun: { runId: 'JO-INITIAL', outcome: 'PASS' }, reruns: [{ runId: 'JO-R1', outcome: 'PASS' }, { runId: 'JO-R2', outcome: 'FAIL' }, { runId: 'JO-R3', outcome: 'FAIL' }] }] }));
    const diagnosticDir = join(fixture.root, 'docs', 'tasks', 'g3-evidence', 'bludit', 'MOCK-001', 'DIAGNOSTIC-1');
    mkdirSync(diagnosticDir, { recursive: true });
    writeFileSync(join(diagnosticDir, 'run-record.json'), JSON.stringify({ runId: 'DIAGNOSTIC-1', labels: { task: 'g0-bludit' } }));
    const legacyDir = join(fixture.root, 'docs', 'tasks', 'g3-evidence', 'bludit', 'MOCK-001', 'LEGACY-1');
    mkdirSync(legacyDir, { recursive: true });
    writeFileSync(join(legacyDir, 'run-record.json'), JSON.stringify({ runId: 'LEGACY-1', labels: { task: 'g0-bludit' } }));
    const result = evaluateRq3Evidence({ rootDir: fixture.root, candidates: [fixture.candidate], traceabilityById: fixture.traceabilityById, reviews: fixture.reviews, trustedReviewers: fixture.trustedReviewers, rawExecution: { status: 'NOT_AVAILABLE' } });
    assert.equal(result.runRecordAccounting.summaryRunIds, 4);
    assert.equal(result.runRecordAccounting.matchingRunRecords, 0);
    assert.equal(result.runRecordAccounting.extraRunRecords.length, 2);
    assert.equal(result.runRecordAccounting.extraRunRecords.at(-1).classification, 'UNSUMMARIZED_RUN_PURPOSE_UNRESOLVED');
    assert.equal(result.candidates[0].status, 'BLOCKED');
    assert.equal(result.candidates[0].unboundPathRunRecords, 2);
    assert.ok(result.candidates[0].evidenceErrors.includes('UNBOUND_LEGACY_RUN_RECORD'));
    const jo = result.runRecordAccounting.candidateOutcomesReported[0];
    assert.equal(jo.rerunFailureRateAmongReruns, 2 / 3);
    assert.equal(jo.failureRateAcrossInitialAndReruns, 2 / 4);
  } finally { fixture.dispose(); }
});
