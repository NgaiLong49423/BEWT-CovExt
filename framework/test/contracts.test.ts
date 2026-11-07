import test from "node:test";
import assert from "node:assert/strict";
import {
  ContractError,
  APP_IDS,
  type ApplicationAdapter,
  parseApplicationManifest,
  parseBaselineInventory,
  parseCandidateScenario,
  parseCoverageGap,
  parseEvidenceReference,
  parseHumanReviewDecision,
  parseToolRequest,
  parseToolResult,
  parseValidationResult,
  parseWorkflowState,
  sanitizeToolOutput,
  type AgentWorkflowState,
  type ApplicationManifest,
  type CandidateScenario,
  type EvidenceReference,
  type HumanReviewDecision,
} from "../src/contracts.js";
import { assertBaselineMatchesManifest, assertCanGenerateJava, authorizeToolRequest, blockWorkflow, failWorkflow, pauseAtHumanReview, reviseCandidate, startRepair, submitReviewDecision, transitionWorkflow } from "../src/policy.js";

const sha = "b31302f4e99c3293bd742c6d076a721e168118b0";
const evidence: EvidenceReference = { repositoryCommit: sha, sourceVersion: "1.1.19", runId: "run-001", artifactPath: "docs/evidence/run-001/result.json" };
const manifest: ApplicationManifest = {
  schemaVersion: "1.0.0", appId: "expresscart", benchmarkBaseVersion: "1.19",
  source: { repository: "https://github.com/mrvautin/expressCart", commit: sha, packageVersion: "1.1.19" },
  baseSuitePath: "experiments/expresscart/bewt-suite",
  runtime: { kind: "docker", version: "node-14/mongo-4.4", image: "bewt-covext/expresscart:1.1.19", imageDigest: `sha256:${"a".repeat(64)}` },
  fixtureReset: { experimentKey: "expresscart-t01a", prepareTool: "prepare-fixture", cleanupTool: "cleanup-experiment", resetStrategy: "scoped experiment fixture", destructive: true },
  allowedTools: ["read-baseline-inventory", "read-approved-manifest", "validate-gherkin", "generate-source-artifact", "compile-maven-project", "run-selenium-test", "prepare-fixture", "collect-test-evidence", "cleanup-experiment"],
};
const candidate: CandidateScenario = {
  candidateId: "EC-C91", appId: "expresscart", sourceCommit: sha, sourceVersion: "1.1.19", revision: 1,
  gherkin: "Feature: Guest checkout\n  Scenario: Reject empty email\n    Given the checkout page is open\n    When the guest submits an empty email\n    Then an email validation error is shown",
  preconditions: ["The checkout page is available with an empty cart."],
  oracle: ["A visible email validation message is shown."],
  noveltyRationale: "The original inventory has no empty-email checkout validation scenario.",
  sourceReferences: [evidence], reviewStatus: "PROPOSED",
};

function initialState(overrides: Partial<AgentWorkflowState> = {}): AgentWorkflowState {
  return {
    appId: "expresscart", sourceCommit: sha, sourceVersion: "1.1.19", runId: "run-001", currentRole: "coverage_analysis", status: "STARTED",
    candidate, reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0,
    ...overrides,
  };
}

function atReview(candidateOverride = candidate): AgentWorkflowState {
  const state = initialState({ candidate: candidateOverride });
  const baseline = transitionWorkflow(state, "BASELINE_COLLECTED");
  const generated = transitionWorkflow(baseline, "CANDIDATES_GENERATED");
  const review = transitionWorkflow(generated, "AWAITING_HUMAN_REVIEW");
  return pauseAtHumanReview(review, { threadId: "thread-001", checkpointId: "checkpoint-001", pausedAt: "2026-11-07T12:00:00Z" });
}

function review(decision: HumanReviewDecision["decision"], id = `decision-${decision.toLowerCase()}`, target = candidate, threadId = "thread-001", checkpointId = "checkpoint-001"): HumanReviewDecision {
  return {
    decisionId: id, runId: "run-001", threadId, checkpointId,
    candidateId: target.candidateId, candidateRevision: target.revision, appId: target.appId,
    reviewerId: "reviewer-01", decision, decidedAt: "2026-11-07T12:01:00Z", rationale: `Reviewed candidate revision ${target.revision}.`,
  };
}

function execution(stageRunId: string, outcome: "PASS" | "FAIL" | "BLOCKED" | "NOT_RUN" | "INCONCLUSIVE" = "PASS", artifactName = "result.json", invocationId = "validation-001") {
  const notExecuted = outcome === "NOT_RUN" || (outcome === "BLOCKED" && stageRunId.length === 0);
  return {
    invocationId, ...(notExecuted ? {} : { stageRunId }), outcome, sourceCommit: sha, sourceVersion: "1.1.19",
    evidence: notExecuted ? [] : [{ ...evidence, runId: stageRunId, artifactPath: `docs/evidence/${stageRunId}/${artifactName}` }],
  };
}

function repeat(invocationId: string, outcome: "PASS" | "FAIL" | "BLOCKED" | "NOT_RUN" | "INCONCLUSIVE" = "PASS") {
  return {
    invocationId, sourceCommit: sha, sourceVersion: "1.1.19",
    compile: execution(`${invocationId}-compile`, outcome, "compile.xml", invocationId),
    fixture: execution(`${invocationId}-fixture`, outcome, "fixture.json", invocationId),
    e2e: execution(`${invocationId}-e2e`, outcome, "e2e.json", invocationId),
    cleanup: execution(`${invocationId}-cleanup`, outcome, "cleanup.json", invocationId),
  };
}

function recordedDecision(decision: "APPROVED" | "REJECTED" | "UNVERIFIED", decisionId: string, withEvidence = decision !== "UNVERIFIED") {
  return {
    decisionId, appId: "expresscart", candidateId: "EC-C91", candidateRevision: 1,
    decision, reviewerId: "reviewer-01", decidedAt: "2026-11-07T12:10:00Z", rationale: `${decision} with recorded evidence.`,
    evidence: withEvidence ? [{ ...evidence, runId: `review-${decisionId}`, artifactPath: `docs/evidence/reviews/${decisionId}.json` }] : [],
  };
}

function validationResult(overrides: Record<string, unknown> = {}) {
  return {
    appId: "expresscart", candidateId: "EC-C91", candidateRevision: 1, invocationId: "validation-001", sourceCommit: sha, sourceVersion: "1.1.19",
    compile: execution("run-compile"), fixture: execution("run-fixture"), e2e: execution("run-e2e"), cleanup: execution("run-cleanup"),
    oracleDecision: recordedDecision("APPROVED", "oracle-approved"), noveltyDecision: recordedDecision("APPROVED", "novelty-approved"),
    repeats: [repeat("rerun-1"), repeat("rerun-2"), repeat("rerun-3")], repairAttempts: 1,
    evidence: [{ ...evidence, runId: "run-validation", artifactPath: "docs/evidence/run-validation/index.json" }],
    researchAcceptance: { status: "NOT_REVIEWED" },
    ...overrides,
  };
}

function partialValidationResult(overrides: Record<string, unknown> = {}) {
  const invocationId = "partial-validation-001";
  return validationResult({
    invocationId,
    compile: execution("", "NOT_RUN", "compile.xml", invocationId),
    fixture: execution("", "BLOCKED", "fixture.json", invocationId),
    e2e: execution("", "NOT_RUN", "e2e.json", invocationId),
    cleanup: execution("", "NOT_RUN", "cleanup.json", invocationId),
    oracleDecision: recordedDecision("UNVERIFIED", "partial-oracle", false),
    noveltyDecision: recordedDecision("UNVERIFIED", "partial-novelty", false),
    repeats: [], evidence: [],
    ...overrides,
  });
}

test("valid application manifest accepts a pinned app-neutral schema", () => {
  assert.deepEqual(parseApplicationManifest(manifest), manifest);
  for (const appId of APP_IDS) assert.equal(parseApplicationManifest({ ...manifest, appId }).appId, appId);
});

test("shared application adapter contract is implementable without app-specific framework types", async () => {
  const joomlaManifest = parseApplicationManifest({
    ...manifest, appId: "joomla", benchmarkBaseVersion: "3.10.11",
    source: { repository: "https://github.com/joomla/joomla-cms", commit: sha, packageVersion: "3.10.11" },
    baseSuitePath: "experiments/joomla/bewt-suite",
    fixtureReset: { ...manifest.fixtureReset, experimentKey: "joomla-t01a" },
  });
  const inventory = parseBaselineInventory({ appId: "joomla", sourceCommit: sha, sourceVersion: "3.10.11", collectedAt: "2026-11-07T12:00:00Z", cases: [], observedScenarioCount: 0 });
  const result = parseToolResult({ tool: "compile-maven-project", outcome: "PASS", stdout: "", stderr: "", evidence: [] });
  const adapter: ApplicationAdapter = {
    manifest: joomlaManifest,
    readBaseline: async () => inventory,
    prepareFixture: async () => ({ ...result, tool: "prepare-fixture" }),
    compile: async () => result,
    runSelenium: async () => ({ ...result, tool: "run-selenium-test" }),
    collectEvidence: async () => [evidence],
    cleanup: async () => ({ ...result, tool: "cleanup-experiment" }),
  };
  assert.equal((await adapter.readBaseline()).appId, "joomla");
  assert.equal(adapter.manifest.appId, "joomla");
  assert.doesNotThrow(() => assertBaselineMatchesManifest(adapter.manifest, inventory));
  assert.throws(() => assertBaselineMatchesManifest(adapter.manifest, { ...inventory, appId: "expresscart" }), /app ID does not match/);
  assert.throws(() => assertBaselineMatchesManifest(adapter.manifest, { ...inventory, sourceVersion: "wrong-version" }), /source pin does not match/);
});

test("invalid manifest rejects unknown app, short source pin, missing Docker image, unsafe paths, and unknown fields", () => {
  assert.throws(() => parseApplicationManifest({ ...manifest, appId: "unknown" }), ContractError);
  assert.throws(() => parseApplicationManifest({ ...manifest, source: { ...manifest.source, commit: "1234" } }), /full 40-character/);
  assert.throws(() => parseApplicationManifest({ ...manifest, runtime: { kind: "docker", version: "1", image: "mutable:latest" } }), /pinned sha256 digest/);
  assert.throws(() => parseApplicationManifest({ ...manifest, baseSuitePath: "../../outside" }), /normalized repository-relative/);
  assert.throws(() => parseApplicationManifest({ ...manifest, command: "rm -rf" }), /unsupported fields/);
  assert.throws(() => parseApplicationManifest({ ...manifest, allowedTools: ["read-baseline-inventory"] }), /fixture prepare\/cleanup tools must be in the app allowlist/);
});

test("locally built image identity is pinned by source inputs without posing as a registry digest", () => {
  const sourceBuilt = {
    ...manifest,
    runtime: {
      kind: "source-built", version: "node-14.21.3-bullseye-slim", image: "bewt-covext/expresscart:local",
      sourceCommit: sha, buildContextPath: "experiments/expresscart/source", buildContextDigestAlgorithm: "path-nul-sha256-newline-v1", buildContextSha256: "a".repeat(64),
      dockerfilePath: "experiments/expresscart/source/Dockerfile.experiment", dockerfileSha256: "b".repeat(64),
      observedImageId: "c".repeat(64),
    },
  };
  const parsed = parseApplicationManifest(sourceBuilt);
  assert.equal(parsed.runtime.kind, "source-built");
  assert.equal(parsed.runtime.observedImageId, `sha256:${"c".repeat(64)}`);
  assert.throws(() => parseApplicationManifest({ ...sourceBuilt, runtime: { ...sourceBuilt.runtime, sourceCommit: "1111111111111111111111111111111111111111" } }), /must match the application source pin/);
  assert.throws(() => parseApplicationManifest({ ...sourceBuilt, runtime: { ...sourceBuilt.runtime, buildContextSha256: "short" } }), /full 64-character SHA-256/);
  assert.throws(() => parseApplicationManifest({ ...sourceBuilt, runtime: { ...sourceBuilt.runtime, buildContextDigestAlgorithm: "unspecified" } }), /not supported/);
  assert.throws(() => parseApplicationManifest({ ...sourceBuilt, runtime: { ...sourceBuilt.runtime, imageDigest: `sha256:${"d".repeat(64)}` } }), /unsupported fields/);
});

test("baseline inventory preserves declared count separately from observed scenario count", () => {
  const inventory = parseBaselineInventory({
    appId: "expresscart", sourceCommit: sha, sourceVersion: "1.1.19", collectedAt: "2026-11-07T12:00:00Z",
    cases: [{ caseId: "BASE-01", gherkinPath: "bewt-original/expresscart/gherkin/cart.feature", scenarioName: "Empty cart", baseTestPaths: ["src/test/java/tests/EmptyCartTest.java"], behaviorTags: ["cart"], sourceReferences: [evidence] }],
    declaredBusinessCaseCount: 31, observedScenarioCount: 1,
  });
  assert.equal(inventory.declaredBusinessCaseCount, 31);
  assert.equal(inventory.observedScenarioCount, 1);
  assert.throws(() => parseBaselineInventory({ ...inventory, observedScenarioCount: 31 }), /must equal the measured cases length/);
  assert.throws(() => parseBaselineInventory({ ...inventory, cases: [{ ...inventory.cases[0], sourceReferences: [{ ...evidence, repositoryCommit: "1111111111111111111111111111111111111111" }] }] }), /does not match inventory source pin/);
});

test("coverage gaps, candidate scenarios, and evidence references require provenance", () => {
  assert.equal(parseEvidenceReference(evidence).repositoryCommit, sha);
  assert.equal(parseCandidateScenario(candidate).candidateId, "EC-C91");
  assert.equal(parseCoverageGap({ gapId: "gap-01", appId: "expresscart", sourceCommit: sha, sourceVersion: "1.1.19", behavior: "empty email validation", rationale: "No mapped Base scenario", sourceReferences: [evidence] }).sourceReferences.length, 1);
  assert.throws(() => parseCoverageGap({ gapId: "gap-01", appId: "expresscart", sourceCommit: sha, sourceVersion: "wrong", behavior: "empty email validation", rationale: "No mapped Base scenario", sourceReferences: [evidence] }), /does not match its source pin/);
  assert.throws(() => parseEvidenceReference({ ...evidence, artifactPath: "../../secret.txt" }), /normalized repository-relative/);
  assert.throws(() => parseCandidateScenario({ ...candidate, sourceReferences: [{ ...evidence, sourceVersion: "other-version" }] }), /does not match candidate source pin/);
});

test("state transitions follow the explicit flow and reject skipped or research-only states", () => {
  assert.throws(() => transitionWorkflow(initialState(), "JAVA_GENERATED"), /invalid workflow transition/);
  assert.throws(() => transitionWorkflow(initialState(), "VALIDATED" as never), /research statuses are not workflow statuses/);
  const flow = atReview();
  assert.equal(flow.status, "AWAITING_HUMAN_REVIEW");
  assert.equal(flow.checkpoint?.threadId, "thread-001");
  assert.equal(flow.currentRole, "gherkin_generation");
});

test("human approval is bound to app/candidate/revision and required before Java generation", () => {
  const paused = atReview();
  assert.throws(() => transitionWorkflow(paused, "ACCEPTED_FOR_IMPLEMENTATION"), /submitReviewDecision/);
  assert.throws(() => assertCanGenerateJava({ ...paused, status: "ACCEPTED_FOR_IMPLEMENTATION" }, { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" }), /requires an applied human approval/);
  const approved = submitReviewDecision(paused, review("ACCEPT"));
  const acceptedCandidate = { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" as const };
  assert.equal(approved.status, "ACCEPTED_FOR_IMPLEMENTATION");
  assert.doesNotThrow(() => assertCanGenerateJava(approved, acceptedCandidate));
  assert.throws(() => submitReviewDecision(paused, review("ACCEPT", "wrong-app", { ...candidate, appId: "joomla" })), /does not match this app/);
  assert.throws(() => submitReviewDecision(paused, review("ACCEPT", "wrong-revision", { ...candidate, revision: 2 })), /does not match this app/);
  assert.throws(() => submitReviewDecision(paused, { ...review("ACCEPT", "wrong-run"), runId: "run-other" }), /run\/thread\/checkpoint/);
  assert.throws(() => submitReviewDecision(paused, { ...review("ACCEPT", "wrong-thread"), threadId: "thread-other" }), /run\/thread\/checkpoint/);
  assert.throws(() => submitReviewDecision(paused, { ...review("ACCEPT", "wrong-checkpoint"), checkpointId: "checkpoint-other" }), /run\/thread\/checkpoint/);
  assert.throws(() => submitReviewDecision(approved, review("ACCEPT")), /already been applied/);
});

test("revision review accepts only the fresh checkpoint decision and current approved revision", () => {
  const firstReview = atReview();
  const reviseFirst = submitReviewDecision(firstReview, review("REVISE", "revise-1"));
  assert.throws(() => transitionWorkflow(reviseFirst, "CANDIDATES_GENERATED"), /must be submitted through reviseCandidate/);
  const secondCandidate = { ...candidate, revision: 2, reviewStatus: "PROPOSED" as const, gherkin: `${candidate.gherkin}\n    And a second check is visible` };
  const secondGenerated = reviseCandidate(reviseFirst, secondCandidate);
  const secondAwaiting = transitionWorkflow(secondGenerated, "AWAITING_HUMAN_REVIEW");
  assert.deepEqual(secondGenerated.reviewDecisions.map((item) => item.decisionId), ["revise-1"]);
  assert.deepEqual(secondGenerated.appliedDecisionIds, ["revise-1"]);
  assert.throws(() => parseWorkflowState({ ...secondAwaiting, checkpoint: firstReview.checkpoint }), /must be unused by prior decisions/);
  assert.throws(() => pauseAtHumanReview(secondAwaiting, { threadId: "thread-001", checkpointId: "checkpoint-001", pausedAt: "2026-11-07T12:02:00Z" }), /must be new/);
  const secondPaused = pauseAtHumanReview(secondAwaiting, { threadId: "thread-001", checkpointId: "checkpoint-002", pausedAt: "2026-11-07T12:02:00Z" });
  assert.throws(() => submitReviewDecision(secondPaused, review("ACCEPT", "stale-accept", candidate, "thread-001", "checkpoint-002")), /does not match this app, candidate, and revision/);
  assert.throws(() => submitReviewDecision(secondPaused, review("ACCEPT", "stale-checkpoint", secondCandidate)), /run\/thread\/checkpoint/);
  const acceptedSecond = submitReviewDecision(secondPaused, review("ACCEPT", "accept-2", secondCandidate, "thread-001", "checkpoint-002"));
  assert.deepEqual(acceptedSecond.reviewDecisions.map((item) => item.decisionId), ["revise-1", "accept-2"]);
  assert.deepEqual(acceptedSecond.appliedDecisionIds, ["revise-1", "accept-2"]);
  assert.throws(() => parseWorkflowState({ ...acceptedSecond, reviewDecisions: [...acceptedSecond.reviewDecisions, review("REVISE", "duplicate-revision", secondCandidate, "thread-001", "checkpoint-002")] }), /only one review decision/);
  const acceptedCandidate = { ...secondCandidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" as const };
  assert.doesNotThrow(() => assertCanGenerateJava(acceptedSecond, acceptedCandidate));
  assert.throws(() => assertCanGenerateJava(acceptedSecond, { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" }), /exact human-approved candidate revision/);
  const { checkpoint: _secondCheckpoint, ...secondPausedWithoutCheckpoint } = secondPaused;
  const replayState = { ...secondPausedWithoutCheckpoint, candidate: acceptedSecond.candidate!, reviewDecisions: acceptedSecond.reviewDecisions, appliedDecisionIds: acceptedSecond.appliedDecisionIds };
  assert.throws(() => submitReviewDecision(replayState, review("ACCEPT", "accept-2", secondCandidate, "thread-001", "checkpoint-002")), /already been applied/);
});

test("multiple revise decisions remain append-only across revisions before final acceptance", () => {
  const rev1State = atReview();
  const rev1Decision = review("REVISE", "revise-r1");
  const rev2State = reviseCandidate(submitReviewDecision(rev1State, rev1Decision), { ...candidate, revision: 2, reviewStatus: "PROPOSED" });
  const rev2Awaiting = transitionWorkflow(rev2State, "AWAITING_HUMAN_REVIEW");
  const rev2Paused = pauseAtHumanReview(rev2Awaiting, { threadId: "thread-001", checkpointId: "checkpoint-002", pausedAt: "2026-11-07T12:02:00Z" });
  const rev2Decision = review("REVISE", "revise-r2", { ...candidate, revision: 2 }, "thread-001", "checkpoint-002");
  const rev3State = reviseCandidate(submitReviewDecision(rev2Paused, rev2Decision), { ...candidate, revision: 3, reviewStatus: "PROPOSED" });
  assert.deepEqual(rev3State.reviewDecisions.map((item) => item.candidateRevision), [1, 2]);
  assert.deepEqual(rev3State.appliedDecisionIds, ["revise-r1", "revise-r2"]);
  assert.equal(rev3State.checkpoint, undefined);
  const rev3Paused = pauseAtHumanReview(transitionWorkflow(rev3State, "AWAITING_HUMAN_REVIEW"), { threadId: "thread-001", checkpointId: "checkpoint-003", pausedAt: "2026-11-07T12:03:00Z" });
  const accepted = submitReviewDecision(rev3Paused, review("ACCEPT", "accept-r3", { ...candidate, revision: 3 }, "thread-001", "checkpoint-003"));
  assert.deepEqual(accepted.reviewDecisions.map((item) => `${item.decision}:${item.candidateRevision}`), ["REVISE:1", "REVISE:2", "ACCEPT:3"]);
  assert.equal(accepted.appliedDecisionIds.length, 3);
  assert.doesNotThrow(() => assertCanGenerateJava(accepted, { ...candidate, revision: 3, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" }));
  const rejected = submitReviewDecision(atReview(), review("REJECT"));
  assert.equal(rejected.status, "REJECTED");
  assert.throws(() => assertCanGenerateJava(rejected, { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" }), /Java generation requires/);
});

test("decision IDs are single-use and checkpoint resume is bound to its thread/checkpoint/status", () => {
  const accepted = submitReviewDecision(atReview(), review("ACCEPT"));
  assert.throws(() => submitReviewDecision(accepted, review("ACCEPT")), /already been applied/);
  const replayBase = atReview();
  const replayDecision = review("ACCEPT", "single-use");
  const applied = submitReviewDecision(replayBase, replayDecision);
  const { checkpoint: _replayCheckpoint, ...replayBaseWithoutCheckpoint } = replayBase;
  assert.throws(() => submitReviewDecision({ ...replayBaseWithoutCheckpoint, reviewDecisions: applied.reviewDecisions, appliedDecisionIds: applied.appliedDecisionIds }, replayDecision), /already been applied/);
  const blocked = blockWorkflow(initialState(), { category: "MISSING_CONFIG", message: "model key is missing" }, { threadId: "thread-001", checkpointId: "checkpoint-002", pausedAt: "2026-11-07T12:02:00Z" });
  assert.throws(() => transitionWorkflow(blocked, "BASELINE_COLLECTED"), /recorded checkpoint status/);
  assert.equal(transitionWorkflow(blocked, "STARTED").status, "STARTED");
  assert.throws(() => transitionWorkflow(initialState(), "BLOCKED"), /use blockWorkflow/);
  assert.throws(() => transitionWorkflow(initialState(), "FAILED"), /use failWorkflow/);
  assert.equal(failWorkflow(initialState(), { category: "INVALID_INPUT", message: "missing baseline" }).status, "FAILED");
  assert.throws(() => parseWorkflowState({ ...initialState(), status: "BLOCKED", checkpoint: { threadId: "t", checkpointId: "c", pausedAt: "2026-11-07T12:00:00Z", resumeStatus: "STARTED" } }), /recorded error context/);
  assert.throws(() => parseWorkflowState({ ...initialState(), appliedDecisionIds: ["d", "d"] }), /must be unique/);
});

test("tool schema rejects unknown commands and traversal before authorization", () => {
  const request = { tool: "compile-maven-project", appId: "expresscart", sourceCommit: sha, candidateId: candidate.candidateId, revision: 1, projectPath: "experiments/expresscart/bewt-suite" } as const;
  assert.deepEqual(parseToolRequest(request), request);
  assert.throws(() => parseToolRequest({ ...request, command: "docker system prune" }), /unsupported fields/);
  assert.throws(() => parseToolRequest({ ...request, projectPath: "experiments/expresscart/../../other" }), /normalized repository-relative/);
  assert.throws(() => parseToolRequest({ tool: "exec-shell", appId: "expresscart", sourceCommit: sha }), /not supported/);
  const selenium = { tool: "run-selenium-test", appId: "expresscart", sourceCommit: sha, candidateId: candidate.candidateId, revision: 1, projectPath: "experiments/expresscart/bewt-suite", generatedArtifactPath: "experiments/expresscart/bewt-suite/src/test/java/tests/CheckoutTest.java", testClass: "tests.CheckoutTest" } as const;
  assert.deepEqual(parseToolRequest(selenium), selenium);
  assert.throws(() => parseToolRequest({ ...selenium, testClass: "../../CheckoutTest; rm -rf" }), /fully qualified Java class name/);
  assert.throws(() => parseToolRequest({ ...selenium, command: "mvn -Dtest=* test" }), /unsupported fields/);
});

test("Selenium execution is bound to the registered generated artifact, class and active revision", () => {
  const accepted = submitReviewDecision(atReview(), review("ACCEPT"));
  const generated = transitionWorkflow(accepted, "JAVA_GENERATED");
  const artifact = { kind: "generated_java" as const, path: "experiments/expresscart/bewt-suite/src/test/java/tests/CheckoutTest.java", candidateId: candidate.candidateId, revision: 1, testClass: "tests.CheckoutTest" };
  const validating = transitionWorkflow({ ...generated, artifacts: [artifact] }, "VALIDATING");
  const request = { tool: "run-selenium-test", appId: "expresscart", sourceCommit: sha, candidateId: candidate.candidateId, revision: 1, projectPath: "experiments/expresscart/bewt-suite", generatedArtifactPath: artifact.path, testClass: artifact.testClass } as const;
  const context = { manifest, state: validating, candidate: { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" as const }, allowedRoots: ["experiments/expresscart"] };
  assert.deepEqual(authorizeToolRequest(request, context), request);
  assert.throws(() => authorizeToolRequest({ ...request, projectPath: "experiments/expresscart/source" }, context), /must match the approved manifest Base suite/);
  assert.throws(() => authorizeToolRequest({ ...request, testClass: "tests.OtherTest" }, context), /registered for the approved candidate revision/);
  assert.throws(() => authorizeToolRequest({ ...request, generatedArtifactPath: "experiments/expresscart/bewt-suite/src/test/java/tests/OtherTest.java" }, context), /registered for the approved candidate revision/);
  assert.throws(() => authorizeToolRequest({ ...request, revision: 2 }, context), /candidate\/revision does not match/);
  const wrongArtifactRevision = { ...artifact, revision: 2 };
  const wrongRevisionState = transitionWorkflow({ ...generated, artifacts: [wrongArtifactRevision] }, "VALIDATING");
  assert.throws(() => authorizeToolRequest(request, { ...context, state: wrongRevisionState }), /registered for the approved candidate revision/);
});

test("tool allowlist, exact source/app pin, approval, root, and experiment ownership are enforced", () => {
  const approvedState = submitReviewDecision(atReview(), review("ACCEPT"));
  const javaGenerated = transitionWorkflow(approvedState, "JAVA_GENERATED");
  const validatingState = transitionWorkflow(javaGenerated, "VALIDATING");
  const approvedCandidate = { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" as const };
  const request = { tool: "compile-maven-project", appId: "expresscart", sourceCommit: sha, candidateId: candidate.candidateId, revision: 1, projectPath: "experiments/expresscart/bewt-suite" } as const;
  assert.deepEqual(authorizeToolRequest(request, { manifest, state: validatingState, candidate: approvedCandidate, allowedRoots: ["experiments/expresscart"] }), request);
  assert.throws(() => authorizeToolRequest({ ...request, projectPath: "experiments/expresscart/source" }, { manifest, state: validatingState, candidate: approvedCandidate, allowedRoots: ["experiments/expresscart"] }), /must match the approved manifest Base suite/);
  assert.throws(() => authorizeToolRequest(request, { manifest: { ...manifest, allowedTools: ["read-baseline-inventory", "prepare-fixture", "cleanup-experiment"] }, state: validatingState, candidate: approvedCandidate, allowedRoots: ["experiments/expresscart"] }), /not allowlisted/);
  assert.throws(() => authorizeToolRequest(request, { manifest, state: validatingState, candidate: approvedCandidate, allowedRoots: ["framework"] }), /outside approved roots/);
  assert.throws(() => authorizeToolRequest({ ...request, sourceCommit: "1111111111111111111111111111111111111111" }, { manifest, state: validatingState, candidate: approvedCandidate, allowedRoots: ["experiments/expresscart"] }), /source commit does not match/);
  assert.throws(() => authorizeToolRequest({ ...request, appId: "joomla" }, { manifest, state: validatingState, candidate: approvedCandidate, allowedRoots: ["experiments/expresscart"] }), /app ID does not match/);
  assert.throws(() => authorizeToolRequest(request, { manifest, state: validatingState, candidate: { ...approvedCandidate, sourceVersion: "wrong-version" }, allowedRoots: ["experiments/expresscart"] }), /source version does not match/);
  const labelOnly = { ...approvedCandidate, sourceVersion: "1.19", sourceReferences: [{ ...evidence, sourceVersion: "1.19" }] };
  assert.throws(() => authorizeToolRequest(request, { manifest, state: { ...validatingState, sourceVersion: "1.19", candidate: labelOnly }, candidate: labelOnly, allowedRoots: ["experiments/expresscart"] }), /source version does not match manifest/);
  const fixtureRequest = { tool: "prepare-fixture", appId: "expresscart", sourceCommit: sha, candidateId: candidate.candidateId, revision: 1, experimentKey: "foreign-project" } as const;
  assert.throws(() => authorizeToolRequest(fixtureRequest, { manifest, state: validatingState, candidate: approvedCandidate, allowedRoots: [] }), /ownership/);
  const cleanup = { ...fixtureRequest, tool: "cleanup-experiment" as const, experimentKey: manifest.fixtureReset.experimentKey };
  const blocked = blockWorkflow(validatingState, { category: "E2E_BLOCKED", message: "browser unavailable" }, { threadId: "thread-001", checkpointId: "checkpoint-blocked", pausedAt: "2026-11-07T12:03:00Z" });
  assert.doesNotThrow(() => authorizeToolRequest(cleanup, { manifest, state: blocked, candidate: approvedCandidate, allowedRoots: [] }));
  const evidenceRequest = { tool: "collect-test-evidence", appId: "expresscart", sourceCommit: sha, runId: "another-run", artifactPath: "docs/tasks/T01-A/evidence/result.xml" } as const;
  assert.throws(() => authorizeToolRequest(evidenceRequest, { manifest, state: validatingState, allowedRoots: ["docs"] }), /run ID does not match/);
  assert.throws(() => authorizeToolRequest(request, { manifest, state: initialState(), candidate: candidate, allowedRoots: ["experiments/expresscart"] }), /human-approved candidate revision/);
});

test("repair attempts are bounded at two in state and validation results", () => {
  assert.throws(() => parseWorkflowState(initialState({ repairAttempts: 3 })), /0 to 2/);
  const base = validationResult({ repairAttempts: 3 });
  assert.throws(() => parseValidationResult(base), /0 to 2/);
  const awaiting = atReview();
  const accepted = submitReviewDecision(awaiting, review("ACCEPT"));
  const java = transitionWorkflow(accepted, "JAVA_GENERATED");
  const validating = transitionWorkflow(java, "VALIDATING");
  assert.throws(() => transitionWorkflow(validating, "REPAIRING"), /startRepair/);
  const first = startRepair(validating);
  const second = startRepair(transitionWorkflow(first, "VALIDATING"));
  assert.equal(second.repairAttempts, 2);
  assert.throws(() => startRepair(transitionWorkflow(second, "VALIDATING")), /maximum of two/);
});

test("validation eligibility is computed from pinned run records and research acceptance stays separate", () => {
  const valid = validationResult();
  const parsed = parseValidationResult(valid);
  assert.equal(parsed.technicalEligibility, "ELIGIBLE");
  assert.equal(parsed.researchAcceptance.status, "NOT_REVIEWED");
  assert.deepEqual(parseValidationResult(parsed), parsed);
  assert.throws(() => parseValidationResult({ ...valid, technicalEligibility: "INELIGIBLE" }), /does not match the execution records/);
  assert.equal(parseValidationResult(validationResult({ e2e: execution("run-e2e", "NOT_RUN") })).technicalEligibility, "UNVERIFIED");
  assert.equal(parseValidationResult(validationResult({ e2e: execution("run-e2e", "FAIL") })).technicalEligibility, "INELIGIBLE");
  assert.equal(parseValidationResult(validationResult({ repeats: [repeat("rerun-only-one")] })).technicalEligibility, "UNVERIFIED");
  assert.equal(parseValidationResult(validationResult({ repeats: [repeat("rerun-two-1"), repeat("rerun-two-2")] })).technicalEligibility, "UNVERIFIED");

  const accepted = validationResult({ researchAcceptance: { status: "ACCEPTED", decision: recordedDecision("APPROVED", "research-accepted") } });
  assert.equal(parseValidationResult(accepted).researchAcceptance.status, "ACCEPTED");
  assert.equal(parseValidationResult(validationResult({ researchAcceptance: { status: "REJECTED", decision: recordedDecision("REJECTED", "research-rejected") } })).researchAcceptance.status, "REJECTED");
  assert.throws(() => parseValidationResult(validationResult({ researchAcceptance: { status: "ACCEPTED" } })), /requires a recorded approval/);
  assert.throws(() => parseValidationResult(validationResult({ researchAcceptance: { status: "ACCEPTED", decision: recordedDecision("APPROVED", "research-accepted") }, noveltyDecision: recordedDecision("UNVERIFIED", "novelty-unknown", false) })), /approved oracle\/novelty/);
  assert.throws(() => parseValidationResult(validationResult({ researchAcceptance: { status: "ACCEPTED", decision: recordedDecision("APPROVED", "research-accepted") }, e2e: execution("run-e2e", "FAIL") })), /requires technical eligibility/);
  assert.throws(() => parseValidationResult(partialValidationResult({
    e2e: execution("e2e-failed", "FAIL", "e2e.json", "partial-validation-001"),
    oracleDecision: recordedDecision("APPROVED", "partial-oracle-approved"),
    noveltyDecision: recordedDecision("APPROVED", "partial-novelty-approved"),
    researchAcceptance: { status: "ACCEPTED", decision: recordedDecision("APPROVED", "partial-research-approved") },
  })), /requires technical eligibility/);
  assert.throws(() => parseValidationResult(validationResult({ oracleDecision: { ...recordedDecision("APPROVED", "oracle-wrong-revision"), candidateRevision: 2 } })), /reference the validation app, candidate, and revision/);
  assert.throws(() => parseValidationResult({ ...valid, noveltyAndOracleApproved: true, researchStatus: "VALIDATED", repeats: ["PASS", "PASS", "PASS"] }), /unsupported fields/);
  assert.equal(parseValidationResult(validationResult({ researchAcceptance: { status: "UNVERIFIED", decision: recordedDecision("UNVERIFIED", "research-unknown", false) } })).researchAcceptance.status, "UNVERIFIED");
});

test("partial validation records NOT_RUN and BLOCKED without inventing stage run IDs or evidence", () => {
  const parsed = parseValidationResult(partialValidationResult());
  assert.equal(parsed.technicalEligibility, "UNVERIFIED");
  assert.equal(parsed.repeats.length, 0);
  for (const stage of [parsed.compile, parsed.fixture, parsed.e2e, parsed.cleanup]) {
    assert.equal(stage.stageRunId, undefined);
    assert.deepEqual(stage.evidence, []);
  }
  assert.equal(parsed.compile.outcome, "NOT_RUN");
  assert.equal(parsed.fixture.outcome, "BLOCKED");
  assert.equal(parseValidationResult(partialValidationResult({ compile: execution("compile-failed", "FAIL", "compile.log", "partial-validation-001") })).technicalEligibility, "INELIGIBLE");
  assert.equal(parseValidationResult(partialValidationResult({ e2e: execution("e2e-failed", "FAIL", "e2e.json", "partial-validation-001") })).technicalEligibility, "INELIGIBLE");
  assert.equal(parseValidationResult(partialValidationResult({ e2e: execution("e2e-inconclusive", "INCONCLUSIVE", "e2e.json", "partial-validation-001") })).technicalEligibility, "UNVERIFIED");
  assert.throws(() => parseValidationResult(partialValidationResult({ compile: { ...execution("", "NOT_RUN", "compile.xml", "partial-validation-001"), evidence: [evidence] } })), /NOT_RUN stage must not invent/);
});

test("validation stage records share invocation identity and repeat invocations stay distinct", () => {
  const parsed = parseValidationResult(validationResult());
  assert.deepEqual([parsed.compile, parsed.fixture, parsed.e2e, parsed.cleanup].map((stage) => stage.invocationId), [parsed.invocationId, parsed.invocationId, parsed.invocationId, parsed.invocationId]);
  assert.equal(new Set(parsed.repeats.map((repeatRecord) => repeatRecord.invocationId)).size, 3);
  assert.equal(new Set(parsed.repeats.map((repeatRecord) => repeatRecord.e2e.stageRunId)).size, 3);
  assert.equal(parsed.technicalEligibility, "ELIGIBLE");
  const firstRepeat = parsed.repeats[0]!;
  const wrongStageLink = { ...parsed, repeats: [{ ...firstRepeat, fixture: { ...firstRepeat.fixture, invocationId: "different-invocation" } }, ...parsed.repeats.slice(1)] };
  assert.throws(() => parseValidationResult(wrongStageLink), /stage invocation ID does not match/);
});

test("validation rejects missing, duplicate, stale, mismatched or unpinned run and cleanup evidence", () => {
  const valid = validationResult() as ReturnType<typeof validationResult> & { repeats: ReturnType<typeof repeat>[]; compile: ReturnType<typeof execution> };
  assert.throws(() => parseValidationResult({ ...valid, compile: undefined }), /compile must be an object/);
  assert.throws(() => parseValidationResult({ ...valid, repeats: [valid.repeats[0], valid.repeats[0], valid.repeats[2]] }), /invocation IDs must be distinct/);
  assert.throws(() => parseValidationResult({ ...valid, evidence: [valid.evidence[0], valid.evidence[0]] }), /must not be duplicated/);
  assert.throws(() => parseValidationResult({ ...valid, e2e: { ...execution("run-e2e"), sourceCommit: "1111111111111111111111111111111111111111" } }), /source pin does not match/);
  assert.throws(() => parseValidationResult({ ...valid, repeats: [repeat("rerun-1"), repeat("rerun-2"), { ...repeat("rerun-3"), cleanup: execution("other-run", "PASS", "cleanup.json", "wrong-invocation") }] }), /stage invocation ID does not match/);
  assert.throws(() => parseValidationResult({ ...valid, repeats: [repeat("rerun-1"), repeat("rerun-2"), { ...repeat("rerun-3"), cleanup: { ...execution("rerun-3"), evidence: [] } }] }), /requires a stage run ID and evidence/);
  assert.throws(() => parseValidationResult({ ...valid, repeats: [repeat("rerun-1"), repeat("rerun-2"), { ...repeat("rerun-3"), fixture: { ...execution("rerun-3"), evidence: [] } }] }), /requires a stage run ID and evidence/);
  assert.throws(() => parseValidationResult({ ...valid, compile: { ...valid.compile, evidence: [{ ...evidence, runId: "wrong-run" }] } }), /evidence does not match its stage run/);
  assert.throws(() => parseValidationResult({ ...valid, compile: { ...valid.compile, evidence: [{ ...valid.compile.evidence[0], sourceVersion: "wrong-version" }] } }), /evidence does not match its stage run and source pin/);
  assert.throws(() => parseValidationResult({ ...valid, repeats: [repeat("rerun-1"), repeat("rerun-2"), repeat("rerun-2")] }), /invocation IDs must be distinct/);
  assert.throws(() => parseValidationResult(validationResult({ noveltyDecision: recordedDecision("APPROVED", "oracle-approved") })), /decision IDs must be distinct/);
});

test("tool results permit empty output and redact credentials, private host data, paths and email", () => {
  assert.deepEqual(parseToolResult({ tool: "compile-maven-project", outcome: "PASS", stdout: "", stderr: "", evidence: [] }).stdout, "");
  const sanitized = sanitizeToolOutput("user person@example.test password=hunter2 token is value123 Bearer abcdefghijklmnop API_KEY=secret-value Host info: host: 'HOST-EXAMPLE', ip: '192.0.2.104' path=C:\\Users\\TestUser\\.cache\\selenium");
  assert.doesNotMatch(sanitized, /person@example\.test|hunter2|value123|abcdefghijklmnop|secret-value|HOST-EXAMPLE|192\.168\.2\.104|C:\\Users\\TestUser/);
  assert.match(sanitized, /REDACTED_HOST/);
  assert.match(sanitized, /REDACTED_IP/);
  assert.match(sanitized, /REDACTED_USER_PATH/);
  assert.throws(() => parseToolResult({ tool: "compile-maven-project", outcome: "PASS", stdout: "ok", stderr: "", evidence: [], command: "rm" }), /unsupported fields/);
});

test("missing configuration and inconsistent state/candidate data fail closed", () => {
  assert.throws(() => parseApplicationManifest({ ...manifest, allowedTools: [] }), /1\.\.9 items/);
  assert.throws(() => parseWorkflowState({ ...initialState(), candidate: { ...candidate, appId: "joomla" } }), /does not match workflow state/);
  assert.throws(() => parseWorkflowState({ ...initialState(), lastError: { category: "x", message: "" } }), /non-empty string/);
  assert.throws(() => parseWorkflowState({ ...initialState(), status: "REVISION_REQUIRED", candidate: { ...candidate, reviewStatus: "REVISION_REQUIRED" } }), /requires an applied revise decision/);
});
