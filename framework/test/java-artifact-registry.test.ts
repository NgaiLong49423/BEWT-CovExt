import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentWorkflowState, CandidateScenario, EvidenceReference, HumanReviewDecision } from "../src/contracts.js";
import { pauseAtHumanReview, startRepair, submitReviewDecision, transitionWorkflow } from "../src/policy.js";
import { expectedGeneratedTestClass, registerGeneratedJava, registerRepairedJava, verifyRegisteredGeneratedJava } from "../src/runtime/java-artifact-registry.js";
import { FakeJavaGenerationProvider, validateGeneratedJavaContract } from "../src/runtime/model-provider.js";

const sourceCommit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const sourceReference: EvidenceReference = { repositoryCommit: sourceCommit, sourceVersion: "1.1.19", runId: "unit-source", artifactPath: "docs/tasks/T01-C/evidence/source.json" };
const proposed: CandidateScenario = {
  candidateId: "CAND-12345678-1234-4234-8234-123456789abc", appId: "expresscart", sourceCommit, sourceVersion: "1.1.19", revision: 1,
  gherkin: "Feature: Registry fixture\n  Scenario: Verify registry binding\n    Given the candidate is approved\n    When the generated class is registered\n    Then the hash and revision are pinned",
  preconditions: ["Offline unit-test fixture only."], oracle: ["The contract test observes the registered metadata."],
  noveltyRationale: "Synthetic unit-test candidate; it makes no research novelty claim.", sourceReferences: [sourceReference], reviewStatus: "PROPOSED",
};

function acceptedWorkflow(candidate: CandidateScenario): AgentWorkflowState {
  const started: AgentWorkflowState = { appId: candidate.appId, sourceCommit, sourceVersion: candidate.sourceVersion, runId: "unit-run-01",
    currentRole: "coverage_analysis", status: "STARTED", candidate, reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
  const awaiting = pauseAtHumanReview(transitionWorkflow(transitionWorkflow(transitionWorkflow(started, "BASELINE_COLLECTED"), "CANDIDATES_GENERATED"), "AWAITING_HUMAN_REVIEW"),
    { threadId: "unit-thread-01", checkpointId: "unit-checkpoint-01", pausedAt: "2026-11-08T02:00:00Z" });
  const decision: HumanReviewDecision = { decisionId: "unit-decision-01", runId: started.runId, threadId: "unit-thread-01", checkpointId: "unit-checkpoint-01",
    candidateId: candidate.candidateId, candidateRevision: candidate.revision, appId: candidate.appId, reviewerId: "unit-reviewer",
    decision: "ACCEPT", decidedAt: "2026-11-08T02:01:00Z", rationale: "Synthetic test approval for exercising the post-review contract." };
  return submitReviewDecision(awaiting, decision);
}

function javaOutput(candidate: CandidateScenario, useResetPageObject = false) {
  const testClass = expectedGeneratedTestClass(candidate);
  return { testClass, javaSource: `package tests;\n\nimport org.junit.Test;\npublic class ${testClass} extends BaseTest {\n  @Test public void syntheticContract() { ${useResetPageObject ? "new CustomerPasswordResetPage(driver, appUrl);" : "org.junit.Assert.assertNotNull(appUrl);"} }\n}\n` };
}

test("generated Java registration is immutable, candidate/revision-bound and requires current ACCEPT", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01c-java-registry-"));
  const candidate = { ...proposed };
  const paused: AgentWorkflowState = { appId: candidate.appId, sourceCommit, sourceVersion: candidate.sourceVersion, runId: "unit-run-01", currentRole: "coverage_analysis",
    status: "AWAITING_HUMAN_REVIEW", candidate, reviewDecisions: [], appliedDecisionIds: [],
    checkpoint: { threadId: "unit-thread-01", checkpointId: "pending", pausedAt: "2026-11-08T02:00:00Z", resumeStatus: "AWAITING_HUMAN_REVIEW" }, artifacts: [], repairAttempts: 0 };
  try {
    const fakeProvider = new FakeJavaGenerationProvider();
    await assert.rejects(fakeProvider.generateJava(candidate, paused), /requires ACCEPTED_FOR_IMPLEMENTATION/);
    await assert.rejects(registerGeneratedJava(root, paused, candidate, javaOutput(candidate)), /requires ACCEPTED_FOR_IMPLEMENTATION/);
    assert.equal(await import("node:fs/promises").then(({ readdir }) => readdir(root).catch(() => [] as string[])).then((items) => items.length), 0,
      "no artifact may be written before current-revision ACCEPT");

    const resetCandidate = { ...candidate, sourceReferences: [{ ...sourceReference, artifactPath: "experiments/expresscart/source/routes/customer.js" }] };
    const resetAccepted = acceptedWorkflow(resetCandidate);
    await assert.rejects(registerGeneratedJava(root, resetAccepted, resetAccepted.candidate!, javaOutput(resetCandidate)), /source-specific Page Object/);
    assert.equal(await import("node:fs/promises").then(({ readdir }) => readdir(root).catch(() => [] as string[])).then((items) => items.length), 0,
      "a reset-token test that bypasses the approved Page Object cannot be registered");
    assert.doesNotThrow(() => validateGeneratedJavaContract(javaOutput(resetAccepted.candidate!, true), expectedGeneratedTestClass(resetCandidate), "CustomerPasswordResetPage"));

    const accepted = acceptedWorkflow(candidate);
    const generated = await fakeProvider.generateJava(accepted.candidate!, accepted);
    const { artifact, registration } = await registerGeneratedJava(root, accepted, accepted.candidate!, generated);
    assert.equal(artifact.origin, "GENERATED");
    assert.equal(registration.candidateId, candidate.candidateId);
    assert.equal(registration.revision, candidate.revision);
    assert.equal(registration.sourceCommit, sourceCommit);
    const verified = await verifyRegisteredGeneratedJava(root, accepted, accepted.candidate!, artifact);
    assert.equal(verified.registration.sourceSha256, artifact.sha256);
    assert.equal((await readFile(verified.absolutePath, "utf8")), generated.javaSource);
    const repeatedRegistration = await registerGeneratedJava(root, accepted, accepted.candidate!, generated);
    assert.deepEqual(repeatedRegistration.artifact, artifact, "workflow replay must recover the exact immutable first source without EEXIST");
    await assert.rejects(registerGeneratedJava(root, accepted, accepted.candidate!, { ...generated, javaSource: `${generated.javaSource}//different bytes` }), /immutable artifact already exists with different content/);

    const changedCandidate = { ...accepted.candidate!, gherkin: `${accepted.candidate!.gherkin}\n    And a changed oracle step` };
    await assert.rejects(verifyRegisteredGeneratedJava(root, accepted, changedCandidate, artifact), /exact human-approved candidate revision/);
    const wrongRevision = { ...accepted.candidate!, revision: 2 };
    await assert.rejects(verifyRegisteredGeneratedJava(root, accepted, wrongRevision, artifact), /exact human-approved candidate revision/);

    await writeFile(verified.absolutePath, `${generated.javaSource}//tampered\n`);
    await assert.rejects(verifyRegisteredGeneratedJava(root, accepted, accepted.candidate!, artifact), /hash mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("repaired artifacts are immutable, assertion-preserving, and chained through both bounded attempts", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01c-java-repair-registry-"));
  try {
    const candidate = { ...proposed };
    const accepted = acceptedWorkflow(candidate);
    const approvedCandidate = accepted.candidate!;
    const provider = new FakeJavaGenerationProvider();
    const generated = await provider.generateJava(accepted.candidate!, accepted);
    const first = await registerGeneratedJava(root, accepted, accepted.candidate!, generated);
    const withFirst = { ...accepted, artifacts: [{ kind: "generated_java" as const, path: first.artifact.path, testClass: first.artifact.testClass,
      candidateId: candidate.candidateId, revision: candidate.revision, origin: "GENERATED" as const, sha256: first.artifact.sha256! }] };
    let repairing = startRepair(transitionWorkflow(transitionWorkflow(withFirst, "JAVA_GENERATED"), "VALIDATING"));
    const validation = { compile: { outcome: "FAIL", failureClassification: "GENERATED_TEST_DEFECT" }, e2e: { outcome: "NOT_RUN" } } as import("../src/contracts.js").ValidationResult;
    const firstRepairOutput = await provider.repairJava(approvedCandidate, repairing, generated.javaSource, validation, 1);
    const repair1 = await registerRepairedJava(root, repairing, approvedCandidate, first.artifact, first.artifact, 1, firstRepairOutput);
    assert.equal(repair1.artifact.origin, "REPAIRED");
    assert.notEqual(repair1.artifact.sha256, first.artifact.sha256);
    const withRepair1 = { ...repairing, artifacts: [...withFirst.artifacts, { kind: "generated_java" as const, path: repair1.artifact.path,
      testClass: repair1.artifact.testClass, candidateId: candidate.candidateId, revision: candidate.revision, origin: "REPAIRED" as const, sha256: repair1.artifact.sha256! }] };
    const verified1 = await verifyRegisteredGeneratedJava(root, withRepair1, approvedCandidate, repair1.artifact);
    assert.equal(verified1.registration.repairAttempt, 1);
    repairing = startRepair(transitionWorkflow(withRepair1, "VALIDATING"));
    const secondRepairOutput = await provider.repairJava(approvedCandidate, repairing, await readFile(verified1.absolutePath, "utf8"), validation, 2);
    const repair2 = await registerRepairedJava(root, repairing, approvedCandidate, first.artifact, repair1.artifact, 2, secondRepairOutput);
    const withRepair2 = { ...repairing, artifacts: [...withRepair1.artifacts, { kind: "generated_java" as const, path: repair2.artifact.path,
      testClass: repair2.artifact.testClass, candidateId: candidate.candidateId, revision: candidate.revision, origin: "REPAIRED" as const, sha256: repair2.artifact.sha256! }] };
    const verified2 = await verifyRegisteredGeneratedJava(root, withRepair2, approvedCandidate, repair2.artifact);
    assert.equal(verified2.registration.repairAttempt, 2);
    assert.equal(verified2.registration.parentArtifactPath, repair1.artifact.path);
    assert.equal(verified2.registration.firstGeneratedSourceSha256, first.artifact.sha256);
    await writeFile(verified2.absolutePath, `${secondRepairOutput.javaSource}// tamper\n`);
    await assert.rejects(verifyRegisteredGeneratedJava(root, withRepair2, approvedCandidate, repair2.artifact), /hash mismatch/);
    await assert.rejects(registerRepairedJava(root, repairing, approvedCandidate, first.artifact, repair1.artifact, 2,
      { ...secondRepairOutput, javaSource: secondRepairOutput.javaSource.replace("Assert.assertNotNull(appUrl);", "") }), /retain every assertion call/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
