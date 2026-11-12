import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isHumanOracleAndNoveltyApproval,
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

test('requires assigned reviewer, signature, timestamp, oracle and novelty decisions', () => {
  const partial = {
    reviewer: 'Reviewer', reviewerRole: 'Independent reviewer', signature: 'signed', approvedAt: '2026-11-12T00:00:00Z',
    rationale: 'Reviewed source, overlap and oracle.', reviewStatus: 'APPROVED', oracleDecision: 'APPROVED',
  };
  assert.equal(isHumanOracleAndNoveltyApproval(partial), false);
  assert.equal(isHumanOracleAndNoveltyApproval({ ...partial, noveltyDecision: 'APPROVED' }), true);
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

test('correctly signed review does not establish semantic mapping or runtime evidence', () => {
  const humanReview = {
    reviewer: 'Reviewer', reviewerRole: 'Independent reviewer', signature: 'signed', approvedAt: '2026-11-12T00:00:00Z',
    rationale: 'Reviewed source, overlap and oracle.', reviewStatus: 'APPROVED', oracleDecision: 'APPROVED', noveltyDecision: 'APPROVED',
  };
  const result = runRecompute({ overrideCandidates: [{
    candidateId: 'MOCK-002', application: 'bludit', gherkinScenario: validScenario,
    humanReview, semanticAudit: { status: 'MATCHED', reviewerDecision: 'APPROVED' },
  }] });
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
