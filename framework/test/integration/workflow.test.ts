import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentWorkflowState, BaselineInventory, CandidateScenario, CoverageGap, Outcome, ValidationResult } from "../../src/contracts.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices } from "../../src/runtime/workflow.js";

const commit = "b31302f4e99c3293bd742c6d076a721e168118b0";
function candidate(revision: number): CandidateScenario {
  return {
    candidateId: "EC-C04", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", revision,
    gherkin: `Feature: Forgotten password\n  Scenario: Guest gets generic confirmation revision ${revision}\n    Given a guest opens the forgotten password page\n    When they submit an unregistered email\n    Then the generic confirmation is displayed`,
    preconditions: ["ExpressCart is running with a clean isolated database."],
    oracle: ["The UI shows the configured generic confirmation."],
    noveltyRationale: "The baseline lacks this exact generic response behavior.",
    sourceReferences: [{ repositoryCommit: commit, sourceVersion: "1.1.19", runId: "baseline", artifactPath: "docs/tasks/T01-B/evidence/baseline.json" }],
    reviewStatus: "PROPOSED",
  };
}
const baseline: BaselineInventory = {
  appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", collectedAt: "2026-11-07T00:00:00Z",
  cases: [], observedScenarioCount: 0,
};
type FailureClassification = "GENERATED_TEST_DEFECT" | "APPLICATION_BEHAVIOR" | "ENVIRONMENT_OR_HARNESS" | "UNCLASSIFIED";
function validation(candidateRecord: CandidateScenario, invocationId: string, repairAttempts = 0, outcomes: Partial<Record<"compile" | "fixture" | "e2e" | "cleanup", Outcome>> = {}, failures: Partial<Record<"compile" | "e2e", FailureClassification>> = {}): ValidationResult {
  const stage = (name: "compile" | "fixture" | "e2e" | "cleanup") => {
    const outcome = outcomes[name] ?? "PASS";
    if (outcome === "NOT_RUN") return { invocationId, outcome, sourceCommit: commit, sourceVersion: "1.1.19", evidence: [] };
    const stageRunId = `${invocationId}-${name}`;
    return { invocationId, stageRunId, outcome, ...(failures[name as "compile" | "e2e"] ? { failureClassification: failures[name as "compile" | "e2e"] } : {}), sourceCommit: commit, sourceVersion: "1.1.19", evidence: [{ repositoryCommit: commit, sourceVersion: "1.1.19", runId: stageRunId, artifactPath: `docs/tasks/T01-B/evidence/${invocationId}/${name}.log` }] };
  };
  return {
    appId: candidateRecord.appId, candidateId: candidateRecord.candidateId, candidateRevision: candidateRecord.revision,
    invocationId, artifact: { path: `extension/expresscart/selenium/${candidateRecord.candidateId}/revision-${candidateRecord.revision}/Test.java`, sha256: "b".repeat(64), origin: repairAttempts ? "REPAIRED" : "GENERATED" },
    sourceCommit: commit, sourceVersion: "1.1.19", compile: stage("compile"), fixture: stage("fixture"), e2e: stage("e2e"), cleanup: stage("cleanup"),
    oracleDecision: { decisionId: `${invocationId}-oracle`, appId: candidateRecord.appId, candidateId: candidateRecord.candidateId, candidateRevision: candidateRecord.revision, decision: "UNVERIFIED", reviewerId: "test", decidedAt: "2026-11-07T00:00:00Z", rationale: "Integration stub does not verify an independent oracle.", evidence: [] },
    noveltyDecision: { decisionId: `${invocationId}-novelty`, appId: candidateRecord.appId, candidateId: candidateRecord.candidateId, candidateRevision: candidateRecord.revision, decision: "UNVERIFIED", reviewerId: "test", decidedAt: "2026-11-07T00:00:00Z", rationale: "Integration stub does not make a novelty decision.", evidence: [] },
    repeats: [], repairAttempts, evidence: [], technicalEligibility: Object.values(outcomes).includes("FAIL") ? "INELIGIBLE" : "UNVERIFIED", researchAcceptance: { status: "NOT_REVIEWED" },
  };
}
function initialState(): AgentWorkflowState {
  return { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", runId: "t01b-integration", currentRole: "coverage_analysis", status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
}

test("durable graph records REVISE then a fresh review checkpoint then ACCEPT", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bewt-t01b-graph-"));
  const saver = openSqliteCheckpointer(join(folder, "checkpoints.sqlite"));
  const generated: number[] = [];
  let evidenceStatus: AgentWorkflowState["status"] | undefined;
  let proposalRevision = 0;
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async (): Promise<CoverageGap[]> => [{ gapId: "gap-1", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "Generic forgotten-password response", rationale: "No baseline scenario names this guest response.", sourceReferences: [candidate(1).sourceReferences[0]!] }],
    proposeCandidate: async (_baseline, _gaps, revision) => { proposalRevision++; return candidate(revision); },
    trustedReviewerId: () => "test-os-operator",
    prepareJava: async (item) => { generated.push(item.revision); return { path: `experiments/generated/${item.revision}.java`, testClass: "tests.ForgottenPasswordTest", sha256: "a".repeat(64), origin: "GENERATED" }; },
    validate: async (item, _artifact, attempts) => validation(item, `validation-${attempts}`, attempts),
    recordEvidence: async (state) => { evidenceStatus = state.workflow.status; return "docs/tasks/T01-B/evidence/integration/run.json"; },
  };
  const app = buildWorkflow(services, saver);
  const config = { configurable: { thread_id: "t01b-integration" } };
  try {
    let result = await app.invoke({ workflow: initialState() }, config);
    assert.equal(result.workflow.status, "AWAITING_HUMAN_REVIEW");
    const firstCheckpoint = result.workflow.checkpoint?.checkpointId;
    result = await app.invoke(resumeReview(result, "t01b-integration", firstCheckpoint!, "REVISE", "Clarify generic response oracle."), config);
    assert.equal(result.workflow.status, "AWAITING_HUMAN_REVIEW");
    assert.equal(result.workflow.candidate?.revision, 2);
    assert.equal(result.workflow.reviewDecisions.length, 1);
    const secondCheckpoint = result.workflow.checkpoint?.checkpointId;
    assert.ok(firstCheckpoint && secondCheckpoint && firstCheckpoint !== secondCheckpoint);
    result = await app.invoke(resumeReview(result, "t01b-integration", secondCheckpoint!, "ACCEPT", "Revision 2 approved for implementation."), config);
    assert.equal(result.workflow.status, "EXECUTION_COMPLETED");
    assert.equal(evidenceStatus, "EXECUTION_COMPLETED", "terminal evidence callback receives the terminal workflow snapshot");
    assert.equal(result.workflow.reviewDecisions.length, 2);
    assert.deepEqual(result.workflow.reviewDecisions.map((decision: { decision: string; candidateRevision: number }) => [decision.decision, decision.candidateRevision]), [["REVISE", 1], ["ACCEPT", 2]]);
    assert.deepEqual(generated, [2]);
    assert.equal(proposalRevision, 2);
    assert.equal(result.validation?.technicalEligibility, "UNVERIFIED");
    assert.equal(result.evidencePath, "docs/tasks/T01-B/evidence/integration/run.json");
  } finally {
    saver.db.close();
    await rm(folder, { recursive: true, force: true });
  }
});

test("REJECT terminates before Java preparation", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bewt-t01b-reject-"));
  const saver = openSqliteCheckpointer(join(folder, "checkpoints.sqlite"));
  let javaCalls = 0;
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async () => [{ gapId: "gap-reject", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "candidate behavior", rationale: "grounded by the baseline", sourceReferences: [candidate(1).sourceReferences[0]!] }],
    proposeCandidate: async (_b, _g, revision) => candidate(revision),
    trustedReviewerId: () => "test-os-operator",
    prepareJava: async () => { javaCalls++; return { path: "experiments/generated/reject.java", testClass: "tests.ForgottenPasswordTest", sha256: "c".repeat(64), origin: "GENERATED" }; },
    validate: async (item, _artifact, attempts) => validation(item, `reject-validation-${attempts}`, attempts),
    recordEvidence: async () => "docs/tasks/T01-B/evidence/reject.json",
  };
  try {
    const app = buildWorkflow(services, saver);
    const config = { configurable: { thread_id: "t01b-reject" } };
    let state = await app.invoke({ workflow: { ...initialState(), runId: "t01b-reject" } }, config);
    state = await app.invoke(resumeReview(state, "t01b-reject", state.workflow.checkpoint!.checkpointId, "REJECT", "Candidate is not accepted."), config);
    assert.equal(state.workflow.status, "REJECTED");
    assert.equal(javaCalls, 0);
    assert.equal(state.validation, undefined);
  } finally { saver.db.close(); await rm(folder, { recursive: true, force: true }); }
});

test("review resume is thread-bound and replay cannot trigger a second Java execution", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bewt-t01b-replay-"));
  const saver = openSqliteCheckpointer(join(folder, "checkpoints.sqlite"));
  let javaCalls = 0;
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async () => [{ gapId: "gap-replay", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "candidate behavior", rationale: "grounded by the baseline", sourceReferences: [candidate(1).sourceReferences[0]!] }],
    proposeCandidate: async (_b, _g, revision) => candidate(revision),
    trustedReviewerId: () => "test-os-operator",
    prepareJava: async () => { javaCalls++; return { path: "experiments/generated/replay.java", testClass: "tests.ForgottenPasswordTest", sha256: "d".repeat(64), origin: "GENERATED" }; },
    validate: async (item, _artifact, attempts) => validation(item, `replay-validation-${attempts}`, attempts),
    recordEvidence: async () => "docs/tasks/T01-B/evidence/replay.json",
  };
  try {
    const app = buildWorkflow(services, saver);
    const config = { configurable: { thread_id: "t01b-replay" } };
    let state = await app.invoke({ workflow: { ...initialState(), runId: "t01b-replay" } }, config);
    const pendingCheckpoint = state.workflow.checkpoint!.checkpointId;
    assert.throws(() => resumeReview(state, "wrong-thread", pendingCheckpoint, "ACCEPT", "wrong thread"), /does not match/);
    state = await app.invoke(resumeReview(state, "t01b-replay", pendingCheckpoint, "ACCEPT", "approved"), config);
    assert.equal(state.workflow.status, "EXECUTION_COMPLETED");
    assert.throws(() => resumeReview(state, "t01b-replay", pendingCheckpoint, "ACCEPT", "replay"), /no pending human review checkpoint/);
    assert.equal(javaCalls, 1);
  } finally { saver.db.close(); await rm(folder, { recursive: true, force: true }); }
});

test("repair loop records two distinct artifacts and never repairs the first source", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bewt-t01b-repair-"));
  const saver = openSqliteCheckpointer(join(folder, "checkpoints.sqlite"));
  const firstArtifact = { path: "experiments/generated/first.java", testClass: "tests.ForgottenPasswordTest", sha256: "e".repeat(64), origin: "GENERATED" as const };
  const repairs: string[] = [];
  let validationCalls = 0;
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async () => [{ gapId: "gap-repair", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "candidate behavior", rationale: "grounded by the baseline", sourceReferences: [candidate(1).sourceReferences[0]!] }],
    proposeCandidate: async (_b, _g, revision) => candidate(revision),
    trustedReviewerId: () => "test-os-operator",
    prepareJava: async () => firstArtifact,
    validate: async (item, _artifact, attempts) => {
      validationCalls++;
      return attempts < 2
        ? validation(item, `repair-validation-${attempts}`, attempts, { compile: "FAIL", fixture: "PASS", e2e: "NOT_RUN", cleanup: "PASS" }, { compile: "GENERATED_TEST_DEFECT" })
        : validation(item, `repair-validation-${attempts}`, attempts);
    },
    repairJava: async (_candidate, original, current, _result, attempt) => {
      assert.equal(original.sha256, firstArtifact.sha256);
      repairs.push(current.sha256);
      return { path: `experiments/generated/repair-${attempt}.java`, testClass: current.testClass, sha256: (attempt === 1 ? "f" : "a").repeat(64), origin: "REPAIRED" };
    },
    recordEvidence: async () => "docs/tasks/T01-B/evidence/repair.json",
  };
  try {
    const app = buildWorkflow(services, saver);
    const config = { configurable: { thread_id: "t01b-repair" } };
    let state = await app.invoke({ workflow: { ...initialState(), runId: "t01b-repair" } }, config);
    state = await app.invoke(resumeReview(state, "t01b-repair", state.workflow.checkpoint!.checkpointId, "ACCEPT", "approved"), config);
    assert.equal(state.workflow.repairAttempts, 2);
    assert.equal(validationCalls, 3);
    assert.equal(repairs.length, 2);
    assert.equal(state.workflow.artifacts.filter((artifact: { kind: string }) => artifact.kind === "generated_java").length, 3);
    assert.equal(state.validation?.repairAttempts, 2);
    assert.equal(state.validation?.technicalEligibility, "UNVERIFIED");
  } finally { saver.db.close(); await rm(folder, { recursive: true, force: true }); }
});

test("application-behavior E2E failure is recorded without repairing generated Java", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bewt-t01c-application-failure-"));
  const saver = openSqliteCheckpointer(join(folder, "checkpoints.sqlite"));
  let repairCalls = 0;
  let evidenceRecorded = false;
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async () => [{ gapId: "gap-app-failure", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "pinned behavior", rationale: "source-backed", sourceReferences: [candidate(1).sourceReferences[0]!] }],
    proposeCandidate: async (_baseline, _gaps, revision) => candidate(revision),
    trustedReviewerId: () => "test-os-operator",
    prepareJava: async () => ({ path: "experiments/generated/application-failure.java", testClass: "tests.GeneratedTest", sha256: "c".repeat(64), origin: "GENERATED" }),
    validate: async (item, _artifact, attempts) => validation(item, `application-failure-${attempts}`, attempts, { e2e: "FAIL" }, { e2e: "APPLICATION_BEHAVIOR" }),
    repairJava: async () => { repairCalls++; throw new Error("application failure must not trigger repair"); },
    recordEvidence: async () => { evidenceRecorded = true; return "docs/tasks/T01-C/evidence/application-failure.json"; },
  };
  try {
    const app = buildWorkflow(services, saver);
    const config = { configurable: { thread_id: "t01c-application-failure" } };
    let state = await app.invoke({ workflow: { ...initialState(), runId: "t01c-application-failure" } }, config);
    state = await app.invoke(resumeReview(state, "t01c-application-failure", state.workflow.checkpoint!.checkpointId, "ACCEPT", "Synthetic policy test approval."), config);
    assert.equal(state.workflow.status, "EXECUTION_COMPLETED");
    assert.equal(state.validation?.e2e.failureClassification, "APPLICATION_BEHAVIOR");
    assert.equal(repairCalls, 0);
    assert.equal(evidenceRecorded, true);
  } finally { saver.db.close(); await rm(folder, { recursive: true, force: true }); }
});

test("SQLite checkpoint resumes after the first Node process exits", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bewt-t01b-restart-"));
  const dbPath = join(folder, "checkpoints.sqlite");
  const markerPath = join(folder, "generated.marker");
  const threadId = "t01b-process-restart";
  const child = fileURLToPath(new URL("../fixtures/checkpoint-restart-child.ts", import.meta.url));
  const run = (mode: "pause" | "resume") => spawnSync(process.execPath, ["--import", "tsx", child, mode, dbPath, markerPath, threadId], { encoding: "utf8", timeout: 30_000 });
  try {
    const first = run("pause");
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /AWAITING_HUMAN_REVIEW/);
    assert.equal(await readFile(markerPath, "utf8").catch(() => ""), "");
    const second = run("resume");
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /EXECUTION_COMPLETED/);
    assert.equal(await readFile(markerPath, "utf8"), "generated-after-resume");
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
