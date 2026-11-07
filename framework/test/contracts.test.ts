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

function review(decision: HumanReviewDecision["decision"], id = `decision-${decision.toLowerCase()}`, target = candidate): HumanReviewDecision {
  return {
    decisionId: id, runId: "run-001", threadId: "thread-001", checkpointId: "checkpoint-001",
    candidateId: target.candidateId, candidateRevision: target.revision, appId: target.appId,
    reviewerId: "reviewer-01", decision, decidedAt: "2026-11-07T12:01:00Z", rationale: `Reviewed candidate revision ${target.revision}.`,
  };
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
  assert.throws(() => submitReviewDecision(approved, review("ACCEPT")), /paused human-review checkpoint/);
});

test("revision and rejection decisions cannot pass the Java generation gate", () => {
  const revised = submitReviewDecision(atReview(), review("REVISE"));
  assert.equal(revised.status, "REVISION_REQUIRED");
  const nextCandidate = { ...candidate, revision: 2, reviewStatus: "PROPOSED" as const, gherkin: `${candidate.gherkin}\n    And a second check is visible` };
  assert.equal(reviseCandidate(revised, nextCandidate).status, "CANDIDATES_GENERATED");
  assert.throws(() => reviseCandidate(revised, { ...nextCandidate, revision: 3 }), /increment revision exactly once/);
  const rejected = submitReviewDecision(atReview(), review("REJECT"));
  assert.equal(rejected.status, "REJECTED");
  assert.throws(() => assertCanGenerateJava(rejected, { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" }), /Java generation requires/);
});

test("decision IDs are single-use and checkpoint resume is bound to its thread/checkpoint/status", () => {
  const accepted = submitReviewDecision(atReview(), review("ACCEPT"));
  assert.throws(() => submitReviewDecision(accepted, review("ACCEPT")), /paused human-review checkpoint/);
  const replayBase = atReview();
  const replayDecision = review("ACCEPT", "single-use");
  const applied = submitReviewDecision(replayBase, replayDecision);
  assert.throws(() => submitReviewDecision({ ...replayBase, reviewDecisions: applied.reviewDecisions, appliedDecisionIds: applied.appliedDecisionIds }, replayDecision), /already been applied/);
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
});

test("tool allowlist, exact source/app pin, approval, root, and experiment ownership are enforced", () => {
  const approvedState = submitReviewDecision(atReview(), review("ACCEPT"));
  const javaGenerated = transitionWorkflow(approvedState, "JAVA_GENERATED");
  const validatingState = transitionWorkflow(javaGenerated, "VALIDATING");
  const approvedCandidate = { ...candidate, reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" as const };
  const request = { tool: "compile-maven-project", appId: "expresscart", sourceCommit: sha, candidateId: candidate.candidateId, revision: 1, projectPath: "experiments/expresscart/bewt-suite" } as const;
  assert.deepEqual(authorizeToolRequest(request, { manifest, state: validatingState, candidate: approvedCandidate, allowedRoots: ["experiments/expresscart"] }), request);
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
  const base = { appId: "expresscart", candidateId: "EC-C91", candidateRevision: 1, sourceCommit: sha, sourceVersion: "1.1.19", compile: "FAIL", fixture: "NOT_RUN", e2e: "NOT_RUN", oracle: "NOT_RUN", cleanup: "NOT_RUN", repeats: [], repairAttempts: 3, noveltyAndOracleApproved: false, evidence: [], researchStatus: "NOT_EVALUATED" };
  assert.throws(() => parseValidationResult(base), /0 to 2/);
  assert.throws(() => parseValidationResult({ ...base, repairAttempts: 2, researchStatus: "VALIDATED" }), /VALIDATED requires/);
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

test("VALIDATED requires complete results, three passing repeats, review, and pinned evidence", () => {
  const valid = {
    appId: "expresscart", candidateId: "EC-C91", candidateRevision: 1, sourceCommit: sha, sourceVersion: "1.1.19",
    compile: "PASS", fixture: "PASS", e2e: "PASS", oracle: "PASS", cleanup: "PASS", repeats: ["PASS", "PASS", "PASS"],
    repairAttempts: 1, noveltyAndOracleApproved: true, evidence: [evidence], researchStatus: "VALIDATED",
  } as const;
  assert.equal(parseValidationResult(valid).researchStatus, "VALIDATED");
  assert.throws(() => parseValidationResult({ ...valid, repeats: ["PASS", "PASS", "FAIL"] }), /VALIDATED requires/);
  assert.throws(() => parseValidationResult({ ...valid, evidence: [{ ...evidence, sourceVersion: "wrong" }] }), /VALIDATED requires/);
  assert.throws(() => parseValidationResult({ ...valid, cleanup: "BLOCKED" }), /VALIDATED requires/);
  assert.equal(parseValidationResult({ ...valid, researchStatus: "NOT_EVALUATED", noveltyAndOracleApproved: false }).researchStatus, "NOT_EVALUATED");
});

test("tool results permit empty output while redacting credentials and personal email", () => {
  assert.deepEqual(parseToolResult({ tool: "compile-maven-project", outcome: "PASS", stdout: "", stderr: "", evidence: [] }).stdout, "");
  const sanitized = sanitizeToolOutput("user person@example.test password=hunter2 token is value123 Bearer abcdefghijklmnop API_KEY=secret-value");
  assert.doesNotMatch(sanitized, /person@example\.test|hunter2|value123|abcdefghijklmnop|secret-value/);
  assert.throws(() => parseToolResult({ tool: "compile-maven-project", outcome: "PASS", stdout: "ok", stderr: "", evidence: [], command: "rm" }), /unsupported fields/);
});

test("missing configuration and inconsistent state/candidate data fail closed", () => {
  assert.throws(() => parseApplicationManifest({ ...manifest, allowedTools: [] }), /1\.\.9 items/);
  assert.throws(() => parseWorkflowState({ ...initialState(), candidate: { ...candidate, appId: "joomla" } }), /does not match workflow state/);
  assert.throws(() => parseWorkflowState({ ...initialState(), lastError: { category: "x", message: "" } }), /non-empty string/);
});
