import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentWorkflowState, BaselineInventory, CoverageGap } from "../../src/contracts.js";
import { candidateFromGeneration, FakeGenerationProvider, newCandidateId } from "../../src/runtime/model-provider.js";
import { buildWorkflow, openSqliteCheckpointer, type RuntimeServices } from "../../src/runtime/workflow.js";

const commit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const baseline: BaselineInventory = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", collectedAt: "2026-11-08T00:00:00Z", cases: [], observedScenarioCount: 0 };
const reference = { repositoryCommit: commit, sourceVersion: "1.1.19", runId: "offline-source-fixture", artifactPath: "docs/tasks/T01-C/evidence/offline-source.json" };

test("offline generation enters the shared LangGraph review checkpoint without Java side effects", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bewt-t01c-model-"));
  const saver = openSqliteCheckpointer(join(folder, "checkpoints.sqlite"));
  const provider = new FakeGenerationProvider();
  const candidateId = newCandidateId();
  let javaCalls = 0;
  const gap: CoverageGap = { gapId: "gap-offline", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "Offline contract behavior", rationale: "Synthetic integration input only; not study evidence.", sourceReferences: [reference] };
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async () => [gap],
    proposeCandidate: async (input, gaps, revision) => candidateFromGeneration(await provider.generate({ baseline: input, gaps, candidateId, revision }), { baseline: input, gaps, candidateId, revision }),
    trustedReviewerId: () => "test-only",
    prepareJava: async () => { javaCalls++; throw new Error("must not run before human acceptance"); },
    validate: async () => { throw new Error("not reached"); },
    recordEvidence: async () => "not-reached",
  };
  const app = buildWorkflow(services, saver);
  const workflow: AgentWorkflowState = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", runId: "t01c-offline-test", currentRole: "coverage_analysis", status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
  try {
    const state = await app.invoke({ workflow }, { configurable: { thread_id: workflow.runId } });
    assert.equal(state.workflow.status, "AWAITING_HUMAN_REVIEW");
    assert.equal(state.workflow.candidate?.reviewStatus, "PROPOSED");
    assert.equal(state.workflow.candidate?.candidateId, candidateId);
    assert.ok(state.workflow.checkpoint?.checkpointId);
    assert.equal(javaCalls, 0);
  } finally {
    saver.db.close();
    await rm(folder, { recursive: true, force: true });
  }
});
