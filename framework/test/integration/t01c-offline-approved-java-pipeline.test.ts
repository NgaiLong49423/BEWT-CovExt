import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { parseApplicationManifest, parseValidationResult, type AgentWorkflowState, type BaselineInventory, type CoverageGap, type EvidenceReference, type GeneratedJavaArtifact, type ValidationResult } from "../../src/contracts.js";
import { candidateFromGeneration, FakeGenerationProvider, FakeJavaGenerationProvider, newCandidateId, parseGeneratedJavaOutput, validateGeneratedJavaContract } from "../../src/runtime/model-provider.js";
import { expectedGeneratedTestClass, loadRegisteredGeneratedJava, registerGeneratedJava, registerRepairedJava, verifyRegisteredGeneratedJava } from "../../src/runtime/java-artifact-registry.js";
import { assertCanGenerateJava, assertCanRepairJava } from "../../src/policy.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices, type RuntimeState } from "../../src/runtime/workflow.js";
import { compileIsolatedExpressCartWorkspace, createIsolatedExpressCartWorkspace } from "../../../adapters/expresscart/generated-test-harness.js";
import { ensureContainedDirectory, resolveContainedOutputPath } from "../../src/runtime/safe-path.js";
import { sanitizeToolOutput } from "../../src/contracts.js";
import { reserveValidationInvocation } from "../../src/runtime/validation-invocation.js";

const sourceCommit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const sourceVersion = "1.1.19";
const manifest = parseApplicationManifest({ schemaVersion: "1.0.0", appId: "expresscart", benchmarkBaseVersion: "1.19",
  source: { repository: "https://github.com/mrvautin/expressCart", commit: sourceCommit, packageVersion: sourceVersion },
  baseSuitePath: "experiments/expresscart/bewt-suite", runtime: { kind: "external", version: sourceVersion },
  fixtureReset: { experimentKey: "offline-test", prepareTool: "prepare-fixture", cleanupTool: "cleanup-experiment", resetStrategy: "controlled compile-only test", destructive: false },
  allowedTools: ["compile-maven-project", "run-selenium-test", "prepare-fixture", "cleanup-experiment"] });
const source: EvidenceReference = { repositoryCommit: sourceCommit, sourceVersion, runId: "offline-source", artifactPath: "docs/tasks/T01-C/evidence/offline-source.json" };
const baseline: BaselineInventory = { appId: "expresscart", sourceCommit, sourceVersion, collectedAt: "2026-11-08T03:00:00Z", cases: [], observedScenarioCount: 0 };
const gap: CoverageGap = { gapId: "offline-source-gap", appId: "expresscart", sourceCommit, sourceVersion,
  behavior: "Synthetic offline behavior used to exercise the approved generation path",
  rationale: "This controlled fixture is not research evidence and does not establish novelty.", sourceReferences: [source] };

function validation(candidateId: string, runId: string, compileOutcome: "PASS" | "FAIL"): ValidationResult {
  const invocationId = "offline-validation-01";
  const execution = (stage: string, outcome: "PASS" | "FAIL" | "NOT_RUN") => {
    const hasRun = outcome === "PASS" || outcome === "FAIL";
    const stageRunId = hasRun ? `${invocationId}-${stage}` : undefined;
    return { invocationId, ...(stageRunId ? { stageRunId } : {}), outcome, sourceCommit, sourceVersion,
      evidence: stageRunId ? [{ ...source, runId: stageRunId, artifactPath: `docs/tasks/T01-C/evidence/${runId}/isolated-maven-compile.json` }] : [] } as const;
  };
  const decision = (decisionId: string) => ({ decisionId, appId: "expresscart" as const, candidateId, candidateRevision: 1,
    decision: "UNVERIFIED" as const, reviewerId: "not-reviewed", decidedAt: "2026-11-08T03:01:00Z", rationale: "No research decision was made by the offline harness test.", evidence: [] });
  return {
    appId: "expresscart", candidateId, candidateRevision: 1, invocationId,
    artifact: { path: `extension/expresscart/selenium/${candidateId}/revision-1/Test.java`, sha256: "c".repeat(64), origin: "GENERATED" }, sourceCommit, sourceVersion,
    compile: execution("compile", compileOutcome), fixture: execution("fixture", "NOT_RUN"), e2e: execution("e2e", "NOT_RUN"), cleanup: execution("cleanup", "NOT_RUN"),
    oracleDecision: decision("offline-oracle"), noveltyDecision: decision("offline-novelty"), repeats: [], repairAttempts: 0,
    evidence: [{ ...source, runId: "offline-validation", artifactPath: "docs/tasks/T01-C/evidence/offline/validation.json" }],
    technicalEligibility: "UNVERIFIED", researchAcceptance: { status: "NOT_REVIEWED" },
  } as ValidationResult;
}

test("offline LangGraph path pauses before effects, then uses fake Java only after current ACCEPT and records controlled validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01c-offline-full-"));
  const repositoryRoot = resolve(process.cwd(), "..");
  const saver = openSqliteCheckpointer(join(root, "checkpoints.sqlite"));
  const gherkin = new FakeGenerationProvider();
  const java = new FakeJavaGenerationProvider();
  const candidateId = newCandidateId();
  let javaCalls = 0;
  let validationCalls = 0;
  const runId = `t01c-offline-approved-${randomUUID()}`;
  const suite = join(root, manifest.baseSuitePath);
  await mkdir(join(suite, "src/test/java/tests"), { recursive: true });
  await mkdir(join(suite, "src/main/java/po"), { recursive: true });
  await mkdir(join(root, "adapters/expresscart/java"), { recursive: true });
  await writeFile(join(suite, "pom.xml"), await readFile(join(repositoryRoot, manifest.baseSuitePath, "pom.xml")));
  await writeFile(join(suite, "src/test/java/tests/BaseTest.java"), await readFile(join(repositoryRoot, manifest.baseSuitePath, "src/test/java/tests/BaseTest.java")));
  await writeFile(join(suite, "src/main/java/po/PageObject.java"), await readFile(join(repositoryRoot, manifest.baseSuitePath, "src/main/java/po/PageObject.java")));
  const resetPageObject = await readFile(join(repositoryRoot, "adapters/expresscart/java/CustomerPasswordResetPage.java"));
  await writeFile(join(suite, "src/main/java/po/CustomerPasswordResetPage.java"), resetPageObject);
  await writeFile(join(root, "adapters/expresscart/java/CustomerPasswordResetPage.java"), resetPageObject);
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async () => [gap],
    proposeCandidate: async (inventory, gaps, revision) => candidateFromGeneration(await gherkin.generate({ baseline: inventory, gaps, candidateId, revision }), { baseline: inventory, gaps, candidateId, revision }),
    trustedReviewerId: () => "offline-unit-reviewer",
    prepareJava: async (approved, workflow) => {
      javaCalls++;
      const output = await java.generateJava(approved, workflow);
      const registered = await registerGeneratedJava(root, workflow, approved, output);
      return { path: registered.artifact.path, testClass: registered.artifact.testClass, sha256: registered.artifact.sha256!, origin: "GENERATED" };
    },
    validate: async (approved, artifact, _attempts, workflow) => {
      validationCalls++;
      await verifyRegisteredGeneratedJava(root, workflow, approved, { kind: "generated_java", ...artifact, candidateId: approved.candidateId, revision: approved.revision });
      const isolated = await createIsolatedExpressCartWorkspace(root, manifest, workflow, approved,
        { kind: "generated_java", ...artifact, candidateId: approved.candidateId, revision: approved.revision }, "offline-validation-01");
      const compileResult = await compileIsolatedExpressCartWorkspace(isolated);
      const evidenceDirectory = await ensureContainedDirectory(repositoryRoot, `docs/tasks/T01-C/evidence/${runId}`);
      const compileEvidencePath = await resolveContainedOutputPath(repositoryRoot, `docs/tasks/T01-C/evidence/${runId}/isolated-maven-compile.json`);
      await writeFile(compileEvidencePath, JSON.stringify({ runId, candidateId: approved.candidateId, revision: approved.revision,
        sourceCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion, invocationId: "offline-validation-01",
        workspaceOwner: isolated.metadataPath, generatedJavaOrigin: "Fake test double (synthetic only)", compileOutcome: compileResult.exitCode === 0 ? "PASS" : "FAIL",
        exitCode: compileResult.exitCode, durationMs: compileResult.durationMs, stdout: sanitizeToolOutput(compileResult.stdout), stderr: sanitizeToolOutput(compileResult.stderr),
        fixture: "NOT_RUN", e2e: "NOT_RUN", cleanup: "NOT_RUN", researchAcceptance: "NOT_REVIEWED" }, null, 2), { flag: "wx" });
      assert.ok(evidenceDirectory);
      return validation(approved.candidateId, runId, compileResult.exitCode === 0 ? "PASS" : "FAIL");
    },
    recordEvidence: async () => "docs/tasks/T01-C/evidence/offline/workflow.json",
  };
  const app = buildWorkflow(services, saver);
  const initial: AgentWorkflowState = { appId: "expresscart", sourceCommit, sourceVersion, runId, currentRole: "coverage_analysis",
    status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
  const config = { configurable: { thread_id: initial.runId } };
  try {
    let state = await app.invoke({ workflow: initial }, config) as RuntimeState;
    assert.equal(state.workflow.status, "AWAITING_HUMAN_REVIEW");
    assert.equal(state.workflow.candidate?.reviewStatus, "PROPOSED");
    assert.equal(javaCalls, 0);
    assert.equal(validationCalls, 0);

    const checkpoint = state.workflow.checkpoint!;
    state = await app.invoke(resumeReview(state, initial.runId, checkpoint.checkpointId, "ACCEPT", "Synthetic test-only authorization of the current fake candidate."), config) as RuntimeState;
    assert.equal(state.workflow.status, "EXECUTION_COMPLETED", JSON.stringify(state.terminalError));
    assert.equal(state.workflow.candidate?.reviewStatus, "ACCEPTED_FOR_IMPLEMENTATION");
    assert.equal(state.generatedArtifact?.origin, "GENERATED");
    assert.equal(state.validation?.compile.outcome, "PASS");
    assert.equal(state.validation?.fixture.outcome, "NOT_RUN");
    assert.equal(state.validation?.e2e.outcome, "NOT_RUN");
    assert.equal(state.validation?.technicalEligibility, "UNVERIFIED");
    assert.equal(state.validation?.researchAcceptance.status, "NOT_REVIEWED");
    assert.equal(javaCalls, 1);
    assert.equal(validationCalls, 1);
  } finally { saver.db.close(); await rm(root, { recursive: true, force: true }); }
});

test("offline production-shaped repair loop preserves the first Java artifact and records two real isolated Maven attempts", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01c-offline-repair-loop-"));
  const repositoryRoot = resolve(process.cwd(), "..");
  const saver = openSqliteCheckpointer(join(root, "checkpoints.sqlite"));
  const gherkin = new FakeGenerationProvider();
  const candidateId = newCandidateId();
  const runId = `t01c-offline-repair-${randomUUID()}`;
  const suite = join(root, manifest.baseSuitePath);
  await mkdir(join(suite, "src/test/java/tests"), { recursive: true });
  await mkdir(join(suite, "src/main/java/po"), { recursive: true });
  await mkdir(join(root, "adapters/expresscart/java"), { recursive: true });
  await writeFile(join(suite, "pom.xml"), await readFile(join(repositoryRoot, manifest.baseSuitePath, "pom.xml")));
  await writeFile(join(suite, "src/test/java/tests/BaseTest.java"), await readFile(join(repositoryRoot, manifest.baseSuitePath, "src/test/java/tests/BaseTest.java")));
  await writeFile(join(suite, "src/main/java/po/PageObject.java"), await readFile(join(repositoryRoot, manifest.baseSuitePath, "src/main/java/po/PageObject.java")));
  const resetPageObject = await readFile(join(repositoryRoot, "adapters/expresscart/java/CustomerPasswordResetPage.java"));
  await writeFile(join(suite, "src/main/java/po/CustomerPasswordResetPage.java"), resetPageObject);
  await writeFile(join(root, "adapters/expresscart/java/CustomerPasswordResetPage.java"), resetPageObject);

  let generationCalls = 0;
  let repairCalls = 0;
  const fakeJavaProvider = {
    name: "Fake" as const,
    model: "offline-repair-fixture",
    async generateJava(approved: import("../../src/contracts.js").CandidateScenario, workflow: AgentWorkflowState) {
      assertCanGenerateJava(workflow, approved);
      generationCalls += 1;
      const valid = await new FakeJavaGenerationProvider().generateJava(approved, workflow);
      const javaSource = valid.javaSource.replace("Assert.assertNotNull(appUrl);", "Assert.assertNotNull(appUrl); missingHarnessApi();");
      const output = parseGeneratedJavaOutput({ ...valid, javaSource });
      validateGeneratedJavaContract(output, valid.testClass);
      return output;
    },
    async repairJava(approved: import("../../src/contracts.js").CandidateScenario, workflow: AgentWorkflowState, sourceText: string,
      failed: ValidationResult, attempt: number) {
      assertCanRepairJava(workflow, approved);
      assert.equal(failed.compile.failureClassification, "GENERATED_TEST_DEFECT");
      assert.ok(attempt === 1 || attempt === 2);
      repairCalls += 1;
      const output = parseGeneratedJavaOutput({ testClass: expectedGeneratedTestClass(approved), javaSource: sourceText.replace(" missingHarnessApi();", "") + `\n// offline fake repair ${attempt}\n` });
      validateGeneratedJavaContract(output, output.testClass);
      return output;
    },
  };
  const invocationIds: string[] = [];
  const repairs: string[] = [];
  const services: RuntimeServices = {
    readBaseline: async () => baseline,
    analyzeCoverage: async () => [gap],
    proposeCandidate: async (inventory, gaps, revision) => candidateFromGeneration(await gherkin.generate({ baseline: inventory, gaps, candidateId, revision }), { baseline: inventory, gaps, candidateId, revision }),
    trustedReviewerId: () => "offline-test-only-reviewer",
    prepareJava: async (approved, workflow) => {
      const recovered = await loadRegisteredGeneratedJava(root, workflow, approved);
      if (recovered) return { path: recovered.path, testClass: recovered.testClass, sha256: recovered.sha256!, origin: "GENERATED" };
      const output = await fakeJavaProvider.generateJava(approved, workflow);
      const registered = await registerGeneratedJava(root, workflow, approved, output);
      return { path: registered.artifact.path, testClass: registered.artifact.testClass, sha256: registered.artifact.sha256!, origin: "GENERATED" };
    },
    repairJava: async (approved, first, current, failed, attempt, workflow) => {
      const firstArtifact = { kind: "generated_java" as const, ...first, candidateId: approved.candidateId, revision: approved.revision } as GeneratedJavaArtifact;
      const currentArtifact = { kind: "generated_java" as const, ...current, candidateId: approved.candidateId, revision: approved.revision } as GeneratedJavaArtifact;
      const currentSource = await readFile(join(root, current.path), "utf8");
      const output = await fakeJavaProvider.repairJava(approved, workflow, currentSource, failed, attempt);
      const registered = await registerRepairedJava(root, workflow, approved, firstArtifact, currentArtifact, attempt, output);
      repairs.push(registered.artifact.path);
      return { path: registered.artifact.path, testClass: registered.artifact.testClass, sha256: registered.artifact.sha256!, origin: "REPAIRED" };
    },
    validate: async (approved, runtimeArtifact, repairAttempts, workflow) => {
      const artifact: GeneratedJavaArtifact = { kind: "generated_java", ...runtimeArtifact, candidateId: approved.candidateId, revision: approved.revision };
      await verifyRegisteredGeneratedJava(root, workflow, approved, artifact);
      const allocation = await reserveValidationInvocation(root, "docs/tasks/T01-C/evidence", runId);
      invocationIds.push(allocation.invocationId);
      const validationWorkflow = { ...workflow, validationInvocationId: allocation.invocationId };
      const workspace = await createIsolatedExpressCartWorkspace(root, manifest, validationWorkflow, approved, artifact, allocation.invocationId);
      const compile = await compileIsolatedExpressCartWorkspace(workspace);
      const compileOutcome = compile.exitCode === 0 ? "PASS" as const : "FAIL" as const;
      const compileRun = `${allocation.invocationId}-compile`;
      const compilePath = `${allocation.evidenceDirectory}/maven-compile.json`;
      const compileEvidence = { ...source, runId: compileRun, artifactPath: compilePath };
      await writeFile(await resolveContainedOutputPath(root, compilePath), JSON.stringify({ invocationId: allocation.invocationId,
        candidateId: approved.candidateId, revision: approved.revision, artifactPath: artifact.path, artifactSha256: artifact.sha256, artifactOrigin: artifact.origin,
        outcome: compileOutcome, exitCode: compile.exitCode, stdout: sanitizeToolOutput(compile.stdout), stderr: sanitizeToolOutput(compile.stderr) }, null, 2), { flag: "wx" });
      const diagnostic = `${compile.stdout}\n${compile.stderr}`;
      const generatedDefect = compileOutcome === "FAIL" && diagnostic.includes(`${artifact.testClass.slice("tests.".length)}.java`) && /cannot find symbol/i.test(diagnostic);
      const stage = (outcome: "PASS" | "FAIL" | "NOT_RUN", runId: string, path: string, classification?: string) => outcome === "NOT_RUN"
        ? { invocationId: allocation.invocationId, outcome, sourceCommit, sourceVersion, evidence: [] }
        : { invocationId: allocation.invocationId, stageRunId: runId, outcome, ...(classification ? { failureClassification: classification } : {}), sourceCommit, sourceVersion,
          evidence: [{ ...source, runId, artifactPath: path }] };
      const resultPath = `${allocation.evidenceDirectory}/validation-result.json`;
      const validation = parseValidationResult({ appId: approved.appId, candidateId: approved.candidateId, candidateRevision: approved.revision,
        invocationId: allocation.invocationId, artifact: { path: artifact.path, sha256: artifact.sha256, origin: artifact.origin }, sourceCommit, sourceVersion,
        compile: stage(compileOutcome, compileRun, compilePath, compileOutcome === "FAIL" ? generatedDefect ? "GENERATED_TEST_DEFECT" : "ENVIRONMENT_OR_HARNESS" : undefined),
        fixture: stage("NOT_RUN", "", ""), e2e: stage("NOT_RUN", "", ""), cleanup: stage("NOT_RUN", "", ""),
        oracleDecision: { decisionId: `${allocation.invocationId}-oracle`, appId: approved.appId, candidateId: approved.candidateId, candidateRevision: approved.revision,
          decision: "UNVERIFIED", reviewerId: "not-reviewed", decidedAt: new Date().toISOString(), rationale: "Offline fixture has no research oracle decision.", evidence: [] },
        noveltyDecision: { decisionId: `${allocation.invocationId}-novelty`, appId: approved.appId, candidateId: approved.candidateId, candidateRevision: approved.revision,
          decision: "UNVERIFIED", reviewerId: "not-reviewed", decidedAt: new Date().toISOString(), rationale: "Offline fixture has no research novelty decision.", evidence: [] },
        repeats: [], repairAttempts, evidence: [{ ...source, runId: allocation.invocationId, artifactPath: resultPath }], researchAcceptance: { status: "NOT_REVIEWED" } });
      await writeFile(await resolveContainedOutputPath(root, resultPath), JSON.stringify(validation, null, 2), { flag: "wx" });
      return validation;
    },
    recordEvidence: async (state) => {
      const resultPath = `docs/tasks/T01-C/evidence/${runId}/workflow-final.json`;
      await ensureContainedDirectory(root, `docs/tasks/T01-C/evidence/${runId}`);
      await writeFile(await resolveContainedOutputPath(root, resultPath), JSON.stringify({ runId, workflow: state.workflow, validationHistory: state.validationHistory }, null, 2), { flag: "wx" });
      return resultPath;
    },
  };
  const app = buildWorkflow(services, saver);
  const initial: AgentWorkflowState = { appId: "expresscart", sourceCommit, sourceVersion, runId, currentRole: "coverage_analysis", status: "STARTED",
    reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
  const config = { configurable: { thread_id: runId } };
  try {
    let state = await app.invoke({ workflow: initial }, config) as RuntimeState;
    assert.equal(state.workflow.status, "AWAITING_HUMAN_REVIEW");
    state = await app.invoke(resumeReview(state, runId, state.workflow.checkpoint!.checkpointId, "ACCEPT", "Synthetic test-only approval for the fake-provider repair test."), config) as RuntimeState;
    assert.equal(state.workflow.status, "EXECUTION_COMPLETED", JSON.stringify(state.terminalError));
    assert.equal(generationCalls, 1);
    assert.equal(repairCalls, 1);
    assert.equal(state.workflow.repairAttempts, 1);
    assert.equal(state.validationHistory?.length, 2);
    assert.equal(new Set(invocationIds).size, 2);
    assert.equal(state.firstGeneratedArtifact?.origin, "GENERATED");
    assert.equal(state.generatedArtifact?.origin, "REPAIRED");
    assert.notEqual(state.firstGeneratedArtifact?.sha256, state.generatedArtifact?.sha256);
    assert.equal(state.validationHistory?.[0]?.compile.outcome, "FAIL");
    assert.equal(state.validationHistory?.[0]?.compile.failureClassification, "GENERATED_TEST_DEFECT");
    assert.equal(state.validation?.compile.outcome, "PASS");
    assert.equal(state.validation?.fixture.outcome, "NOT_RUN");
    assert.equal(state.validation?.e2e.outcome, "NOT_RUN");
    const invocationRoot = join(root, "docs/tasks/T01-C/evidence", runId, "invocations");
    assert.deepEqual((await readdir(invocationRoot)).sort(), [...invocationIds].sort());
    const validationPaths = await Promise.all(invocationIds.map((id) => readFile(join(invocationRoot, id, "validation-result.json"), "utf8")));
    assert.equal(new Set(validationPaths).size, 2);
    assert.equal(repairs.length, 1);
    const evidenceDirectory = process.env.BEWT_T01C_EVIDENCE_DIR;
    if (evidenceDirectory) {
      const firstRegistration = JSON.parse(await readFile(join(root, repairs[0]!.replace(/\/[^/]+$/, "/registration.json")), "utf8"));
      const firstGeneratedPath = join(root, state.firstGeneratedArtifact!.path);
      const generatedSource = await readFile(firstGeneratedPath, "utf8");
      const repairedSource = await readFile(join(root, repairs[0]!), "utf8");
      await mkdir(evidenceDirectory, { recursive: true });
      await writeFile(join(evidenceDirectory, "offline-repair-loop.json"), JSON.stringify({
        classification: "SYNTHETIC_OFFLINE_TEST_ONLY",
        sourceCommit, sourceVersion, candidateId, revision: 1, workflowRunId: runId,
        generationCalls, repairCalls, repairAttempts: state.workflow.repairAttempts,
        invocations: state.validationHistory?.map((validation, index) => ({ invocationId: validation.invocationId,
          artifact: validation.artifact, compile: validation.compile.outcome,
          compileFailureClassification: validation.compile.failureClassification,
          fixture: validation.fixture.outcome, e2e: validation.e2e.outcome, cleanup: validation.cleanup.outcome,
          evidencePaths: ["offline-repair-loop.json", "offline-generation-repair-integration.txt"], attempt: index + 1 })) ?? [],
        firstGenerated: { path: state.firstGeneratedArtifact!.path, sha256: createHash("sha256").update(generatedSource).digest("hex") },
        repaired: { path: repairs[0], sha256: createHash("sha256").update(repairedSource).digest("hex"), origin: firstRegistration.origin,
          parentArtifactPath: firstRegistration.parentArtifactPath, firstGeneratedArtifactPath: firstRegistration.firstGeneratedArtifactPath,
          assertionsPreserved: true },
        limitation: "Maven test-compile only; fixture, Selenium, and cleanup are NOT_RUN in this offline fake-provider test."
      }, null, 2) + "\n", { flag: "wx" });
    }
  } finally { saver.db.close(); await rm(root, { recursive: true, force: true }); }
});
