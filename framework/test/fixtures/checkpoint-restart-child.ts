import { writeFile } from "node:fs/promises";
import type { AgentWorkflowState, BaselineInventory, CandidateScenario, ValidationResult } from "../../src/contracts.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices } from "../../src/runtime/workflow.js";

const [mode, dbPath, markerPath, threadId] = process.argv.slice(2);
if (!mode || !dbPath || !markerPath || !threadId) throw new Error("mode, sqlite path, marker path and thread ID required");
const commit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const baseline: BaselineInventory = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", collectedAt: "2026-11-07T00:00:00Z", cases: [], observedScenarioCount: 0 };
const candidate: CandidateScenario = {
  candidateId: "EC-C04", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", revision: 1,
  gherkin: "Feature: Forgotten password\n  Scenario: Generic response\n    Given a guest is at the form\n    When they submit an unknown email\n    Then generic confirmation is displayed",
  preconditions: ["The isolated application is running."], oracle: ["Generic confirmation is visible."],
  noveltyRationale: "This exact behavior is absent from the baseline.",
  sourceReferences: [{ repositoryCommit: commit, sourceVersion: "1.1.19", runId: "restart-test", artifactPath: "docs/tasks/T01-B/evidence/baseline.json" }],
  reviewStatus: "PROPOSED",
};
function validationResult(item: CandidateScenario, attempts: number): ValidationResult {
  const invocationId = `restart-validation-${attempts}`;
  const stage = (name: string) => {
    const stageRunId = `${invocationId}-${name}`;
    return { invocationId, stageRunId, outcome: "PASS" as const, sourceCommit: commit, sourceVersion: "1.1.19", evidence: [{ repositoryCommit: commit, sourceVersion: "1.1.19", runId: stageRunId, artifactPath: `docs/tasks/T01-B/evidence/${invocationId}/${name}.log` }] };
  };
  return { appId: item.appId, candidateId: item.candidateId, candidateRevision: item.revision, invocationId,
    artifact: { path: "experiments/generated/restart.java", sha256: "b".repeat(64), origin: "GENERATED" }, sourceCommit: commit, sourceVersion: "1.1.19", compile: stage("compile"), fixture: stage("fixture"), e2e: stage("e2e"), cleanup: stage("cleanup"), oracleDecision: { decisionId: `${invocationId}-oracle`, appId: item.appId, candidateId: item.candidateId, candidateRevision: item.revision, decision: "UNVERIFIED", reviewerId: "test", decidedAt: "2026-11-07T00:00:00Z", rationale: "Test stub", evidence: [] }, noveltyDecision: { decisionId: `${invocationId}-novelty`, appId: item.appId, candidateId: item.candidateId, candidateRevision: item.revision, decision: "UNVERIFIED", reviewerId: "test", decidedAt: "2026-11-07T00:00:00Z", rationale: "Test stub", evidence: [] }, repeats: [], repairAttempts: attempts, evidence: [], technicalEligibility: "UNVERIFIED", researchAcceptance: { status: "NOT_REVIEWED" } };
}
const initial: AgentWorkflowState = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", runId: threadId, currentRole: "coverage_analysis", status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
const services: RuntimeServices = {
  readBaseline: async () => baseline,
  analyzeCoverage: async () => [{ gapId: "gap-1", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "Generic response", rationale: "No baseline match.", sourceReferences: candidate.sourceReferences }],
  proposeCandidate: async () => candidate,
  trustedReviewerId: () => "restart-test-operator",
  prepareJava: async () => { await writeFile(markerPath, "generated-after-resume"); return { path: "experiments/generated/restart.java", testClass: "tests.ForgottenPasswordTest", sha256: "b".repeat(64), origin: "GENERATED" }; },
  validate: async (item, _artifact, attempts) => validationResult(item, attempts),
  recordEvidence: async () => "docs/tasks/T01-B/evidence/restart-test.json",
};
const saver = openSqliteCheckpointer(dbPath);
try {
  const app = buildWorkflow(services, saver);
  const config = { configurable: { thread_id: threadId } };
  if (mode === "pause") {
    const state = await app.invoke({ workflow: initial }, config);
    if (state.workflow.status !== "AWAITING_HUMAN_REVIEW") throw new Error("graph did not persist an interrupt");
    console.log(JSON.stringify({ status: state.workflow.status, checkpointId: state.workflow.checkpoint?.checkpointId }));
  } else if (mode === "resume") {
    const snapshot = await app.getState(config);
    const checkpointId = snapshot.values.workflow?.checkpoint?.checkpointId;
    if (!checkpointId) throw new Error("persisted review checkpoint was not recovered");
    const state = await app.invoke(resumeReview(snapshot.values, threadId, checkpointId, "ACCEPT", "Approved in process restart test."), config);
    if (state.workflow.status !== "EXECUTION_COMPLETED") throw new Error(`unexpected resumed status: ${state.workflow.status}`);
    console.log(JSON.stringify({ status: state.workflow.status, decisions: state.workflow.reviewDecisions.length }));
  } else throw new Error(`unknown child mode ${mode}`);
} finally {
  saver.db.close();
}
