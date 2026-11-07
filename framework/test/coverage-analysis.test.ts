import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSourceBackedCoverage } from "../src/runtime/coverage-analysis.js";
import type { BaselineInventory, EvidenceReference } from "../src/contracts.js";

const commit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const baseline: BaselineInventory = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", collectedAt: "2026-11-08T00:00:00Z", cases: [{ caseId: "base-1", gherkinPath: "base.feature", scenarioName: "Existing behavior", baseTestPaths: ["BaseTest.java"], behaviorTags: ["existing.behavior"], sourceReferences: [{ repositoryCommit: commit, sourceVersion: "1.1.19", runId: "base", artifactPath: "baseline.json" }] }], observedScenarioCount: 1 };
const ref: EvidenceReference = { repositoryCommit: commit, sourceVersion: "1.1.19", runId: "source-scan", artifactPath: "source/Behavior.java" };

test("source-backed analyzer distinguishes covered, novel-to-baseline candidate, historical overlap and insufficient evidence", () => {
  const results = analyzeSourceBackedCoverage({ baseline, historicalProposalBehaviorIds: ["historic.behavior"], sourceClaims: [
    { behaviorId: "existing.behavior", behavior: "Existing", sourceReferences: [ref], evidenceSummary: "Route and assertion identified." },
    { behaviorId: "candidate.behavior", behavior: "Candidate", sourceReferences: [ref], evidenceSummary: "Source branch and response identified." },
    { behaviorId: "historic.behavior", behavior: "Historic", sourceReferences: [ref], evidenceSummary: "Source branch identified." },
    { behaviorId: "uncertain.behavior", behavior: "Uncertain", sourceReferences: [], evidenceSummary: "" },
  ] });
  assert.deepEqual(results.map((item) => item.disposition), ["COVERED", "CANDIDATE_GAP", "HISTORICAL_OVERLAP", "INSUFFICIENT_EVIDENCE"]);
  assert.equal(results[1]?.gap?.sourceReferences[0]?.repositoryCommit, commit);
  assert.match(results[1]?.rationale ?? "", /not a novelty decision/);
});

test("analyzer refuses wrong source pins and duplicate behavior IDs", () => {
  const stale = { ...ref, repositoryCommit: "a".repeat(40) };
  const results = analyzeSourceBackedCoverage({ baseline, historicalProposalBehaviorIds: [], sourceClaims: [
    { behaviorId: "stale", behavior: "Stale", sourceReferences: [stale], evidenceSummary: "Not pinned." },
    { behaviorId: "dup", behavior: "First", sourceReferences: [ref], evidenceSummary: "Supported." },
    { behaviorId: "dup", behavior: "Second", sourceReferences: [ref], evidenceSummary: "Supported." },
  ] });
  assert.deepEqual(results.map((item) => item.disposition), ["INSUFFICIENT_EVIDENCE", "CANDIDATE_GAP", "INSUFFICIENT_EVIDENCE"]);
  assert.ok(!results[0]?.gap);
  assert.ok(!results[2]?.gap);
});
