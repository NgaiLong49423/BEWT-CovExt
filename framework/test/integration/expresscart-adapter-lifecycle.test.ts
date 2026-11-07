import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ExpressCartExperimentAdapter } from "../../../adapters/expresscart/experiment.js";
import { parseExpressCartManifest } from "../../../adapters/expresscart/experiment.js";
import { runFixedProcess } from "../../src/runtime/process.js";
import type { AgentWorkflowState, CandidateScenario } from "../../src/contracts.js";

const root = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const commit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");

test("actual ExpressCart adapter isolates validation invocations and repair evidence", async () => {
  const manifest = parseExpressCartManifest(await readFile(resolve(root, "config/apps/expresscart.json"), "utf8"));
  const adapter = new ExpressCartExperimentAdapter(root, manifest);
  const runId = `adapter-lifecycle-${randomUUID()}`;
  const candidate: CandidateScenario = {
    candidateId: "EC-C04", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", revision: 1,
    gherkin: "Feature: Forgot password\n  Scenario: Generic response\n    Given a visitor opens forgot password\n    When the visitor submits an unused email\n    Then a generic confirmation is displayed",
    preconditions: ["isolated fixture"], oracle: ["generic response"], noveltyRationale: "test lifecycle only",
    sourceReferences: [{ repositoryCommit: commit, sourceVersion: "1.1.19", runId: "adapter-lifecycle-test", artifactPath: "docs/tasks/T01-B/evidence/adapter-lifecycle-test/reference.json" }],
    reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION",
  };
  const decision = { decisionId: "adapter-lifecycle-accepted", runId, threadId: runId, checkpointId: `${runId}-checkpoint`, candidateId: candidate.candidateId, candidateRevision: candidate.revision,
    appId: "expresscart" as const, reviewerId: "adapter-lifecycle-test", decision: "ACCEPT" as const, decidedAt: new Date().toISOString(), rationale: "Test-only adapter contract authorization." };
  const state: AgentWorkflowState = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", runId,
    currentRole: "validation_repair", status: "VALIDATING", candidate, reviewDecisions: [decision], appliedDecisionIds: [decision.decisionId], artifacts: [], repairAttempts: 0 };
  const artifact = { kind: "generated_java" as const, path: "experiments/expresscart/bewt-suite/src/test/java/tests/ForgottenPasswordTest.java", testClass: "tests.ForgottenPasswordTest", sha256: hash("first immutable reused input"), origin: "REUSED" as const, candidateId: candidate.candidateId, revision: candidate.revision };
  const first = await adapter.validate(candidate, artifact, 0, state);
  const repairedArtifact = { ...artifact, sha256: hash("separate repair artifact"), origin: "REPAIRED" as const };
  const second = await adapter.validate(candidate, repairedArtifact, 1, { ...state, repairAttempts: 1 });

  assert.notEqual(first.invocationId, second.invocationId);
  assert.equal(first.repairAttempts, 0);
  assert.equal(second.repairAttempts, 1);
  for (const validation of [first, second]) {
    assert.equal(validation.compile.outcome, "PASS");
    assert.equal(validation.fixture.outcome, "PASS");
    assert.equal(validation.e2e.outcome, "FAIL", "dispatcher must refuse Selenium when the approved artifact is not registered");
    assert.equal(validation.cleanup.outcome, "PASS", "fixture cleanup must still run after dispatcher refusal");
  }
  for (const validation of [first, second]) {
    for (const stage of [validation.compile, validation.fixture, validation.e2e, validation.cleanup]) {
      for (const ref of stage.evidence) assert.ok(ref.artifactPath.includes(`/invocations/${validation.invocationId}/`), ref.artifactPath);
    }
  }
  assert.ok(first.compile.evidence.every((ref) => !ref.artifactPath.includes(second.invocationId)));
  assert.ok(second.compile.evidence.every((ref) => !ref.artifactPath.includes(first.invocationId)));

  const recoveryState = { ...state, runId: `${runId}-restart`, validationInvocationId: `inv-recovery-${randomUUID()}` };
  const prepared = await adapter.prepareFixture(candidate, manifest.fixtureReset.experimentKey, recoveryState);
  assert.equal(prepared.outcome, "PASS");
  const restartedAdapter = new ExpressCartExperimentAdapter(root, manifest);
  const mismatch = await restartedAdapter.cleanup({ ...candidate, revision: 2 }, manifest.fixtureReset.experimentKey, recoveryState);
  assert.equal(mismatch.outcome, "BLOCKED", "candidate revision mismatch after process restart must refuse cleanup");
  const failingRunner: typeof runFixedProcess = async (executable, args, options) => {
    if (executable === "docker" && args[0] === "compose" && args.includes("down")) return { exitCode: 1, stdout: "", stderr: "injected scoped down failure", durationMs: 1 };
    return runFixedProcess(executable, args, options);
  };
  const failureAdapter = new ExpressCartExperimentAdapter(root, manifest, { processRunner: failingRunner });
  const failedCleanup = await failureAdapter.cleanup(candidate, manifest.fixtureReset.experimentKey, recoveryState);
  assert.equal(failedCleanup.outcome, "BLOCKED", "cleanup command failure must remain BLOCKED, never PASS");
  const recoveredCleanup = await restartedAdapter.cleanup(candidate, manifest.fixtureReset.experimentKey, recoveryState);
  assert.equal(recoveredCleanup.outcome, "PASS", "new adapter instance must recover and clean only the verified invocation project");
});
