import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { parseApplicationManifest, type AgentWorkflowState, type BaselineInventory, type CoverageGap, type EvidenceReference, type ValidationResult } from "../../src/contracts.js";
import { candidateFromGeneration, FakeGenerationProvider, FakeJavaGenerationProvider, newCandidateId } from "../../src/runtime/model-provider.js";
import { registerGeneratedJava, verifyRegisteredGeneratedJava } from "../../src/runtime/java-artifact-registry.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices, type RuntimeState } from "../../src/runtime/workflow.js";
import { compileIsolatedExpressCartWorkspace, createIsolatedExpressCartWorkspace } from "../../../adapters/expresscart/generated-test-harness.js";
import { ensureContainedDirectory, resolveContainedOutputPath } from "../../src/runtime/safe-path.js";
import { sanitizeToolOutput } from "../../src/contracts.js";

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
    appId: "expresscart", candidateId, candidateRevision: 1, invocationId, sourceCommit, sourceVersion,
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
