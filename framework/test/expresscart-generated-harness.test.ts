import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseApplicationManifest, type AgentWorkflowState, type CandidateScenario, type EvidenceReference, type HumanReviewDecision } from "../src/contracts.js";
import { pauseAtHumanReview, submitReviewDecision, transitionWorkflow } from "../src/policy.js";
import { expectedGeneratedTestClass, registerGeneratedJava } from "../src/runtime/java-artifact-registry.js";
import { FakeJavaGenerationProvider } from "../src/runtime/model-provider.js";
import { createIsolatedExpressCartWorkspace, runRegisteredExpressCartSelenium } from "../../adapters/expresscart/generated-test-harness.js";
import { resolveExpressCartFixtureProfile } from "../../adapters/expresscart/experiment.js";

const sourceCommit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const manifest = parseApplicationManifest({ schemaVersion: "1.0.0", appId: "expresscart", benchmarkBaseVersion: "1.19",
  source: { repository: "https://github.com/mrvautin/expressCart", commit: sourceCommit, packageVersion: "1.1.19" },
  baseSuitePath: "experiments/expresscart/bewt-suite", runtime: { kind: "external", version: "1.1.19" },
  fixtureReset: { experimentKey: "unit-only", prepareTool: "prepare-fixture", cleanupTool: "cleanup-experiment", resetStrategy: "unit fixture", destructive: false },
  allowedTools: ["compile-maven-project", "run-selenium-test", "prepare-fixture", "cleanup-experiment"] });
const sourceRef: EvidenceReference = { repositoryCommit: sourceCommit, sourceVersion: "1.1.19", runId: "unit-source", artifactPath: "docs/tasks/T01-C/evidence/source.json" };
const candidate: CandidateScenario = { candidateId: "CAND-87654321-4321-4321-8321-cba987654321", appId: "expresscart", sourceCommit,
  sourceVersion: "1.1.19", revision: 1,
  gherkin: "Feature: Isolated workspace\n  Scenario: Register a generated test\n    Given a candidate has current approval\n    When the class is staged\n    Then historical tests remain outside the workspace",
  preconditions: ["Temporary unit fixture only."], oracle: ["Only approved files are copied."],
  noveltyRationale: "Synthetic harness test; no research claim.", sourceReferences: [sourceRef], reviewStatus: "PROPOSED" };

test("ExpressCart fixture selection requires the candidate's pinned behavior, not the historical EC-C04 class", () => {
  assert.equal(resolveExpressCartFixtureProfile({ ...candidate, candidateId: "EC-C04" }), "legacy-ec-c04");
  const invalidReset = { ...candidate, gherkin: "Feature: Reset token\n  Scenario: Invalid or expired token\n    Given an invalid password reset token\n    When I open the reset link\n    Then the invalid token message is shown",
    sourceReferences: [{ ...sourceRef, artifactPath: "experiments/expresscart/source/routes/customer.js" }] };
  assert.equal(resolveExpressCartFixtureProfile(invalidReset), "invalid-reset-token");
  assert.throws(() => resolveExpressCartFixtureProfile({ ...invalidReset, sourceReferences: [{ ...sourceRef, sourceVersion: "wrong" }] }), /no approved ExpressCart fixture profile/);
  assert.throws(() => resolveExpressCartFixtureProfile({ ...invalidReset, gherkin: "Feature: Token\n  Scenario: valid token\n    Given reset\n    When token\n    Then pass" }), /no approved ExpressCart fixture profile/);
});

function acceptedState(): AgentWorkflowState {
  const initial: AgentWorkflowState = { appId: candidate.appId, sourceCommit, sourceVersion: candidate.sourceVersion, runId: "harness-run-01",
    currentRole: "coverage_analysis", status: "STARTED", candidate, reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
  const pending = pauseAtHumanReview(transitionWorkflow(transitionWorkflow(transitionWorkflow(initial, "BASELINE_COLLECTED"), "CANDIDATES_GENERATED"), "AWAITING_HUMAN_REVIEW"),
    { threadId: "harness-thread", checkpointId: "harness-checkpoint", pausedAt: "2026-11-08T02:00:00Z" });
  const decision: HumanReviewDecision = { decisionId: "harness-accept", runId: initial.runId, threadId: "harness-thread", checkpointId: "harness-checkpoint",
    candidateId: candidate.candidateId, candidateRevision: 1, appId: candidate.appId, reviewerId: "unit-reviewer", decision: "ACCEPT",
    decidedAt: "2026-11-08T02:01:00Z", rationale: "Synthetic approval only for harness unit test." };
  return submitReviewDecision(pending, decision);
}

test("isolated ExpressCart workspace contains only approved POM/PageObject/BaseTest and exact registered class", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01c-isolated-maven-"));
  const state = acceptedState();
  const generatedClass = expectedGeneratedTestClass(candidate);
    const javaSource = (await new FakeJavaGenerationProvider().generateJava(state.candidate!, state)).javaSource;
  try {
    const suite = join(root, manifest.baseSuitePath);
    await mkdir(join(suite, "src/main/java/po"), { recursive: true });
    await mkdir(join(suite, "src/test/java/tests"), { recursive: true });
    await mkdir(join(root, "adapters/expresscart/java"), { recursive: true });
    await writeFile(join(suite, "pom.xml"), "<project><modelVersion>4.0.0</modelVersion></project>\n");
    await writeFile(join(suite, "src/main/java/po/PageObject.java"), "package po; public class PageObject { public PageObject(org.openqa.selenium.WebDriver driver) {} }\n");
    await writeFile(join(root, "adapters/expresscart/java/CustomerPasswordResetPage.java"), "package po; public final class CustomerPasswordResetPage extends PageObject {}\n");
    await writeFile(join(suite, "src/test/java/tests/BaseTest.java"), "package tests; public class BaseTest { protected String appUrl = \"http://127.0.0.1\"; }\n");
    await writeFile(join(suite, "src/test/java/tests/ForgottenPasswordTest.java"), "historical sentinel\n");
    const { artifact } = await registerGeneratedJava(root, state, state.candidate!, { testClass: generatedClass, javaSource });
    const workspace = await createIsolatedExpressCartWorkspace(root, manifest, state, state.candidate!, artifact, "invocation-01");
    const javaFolder = join(workspace.path, "src/test/java/tests");
    const pageObjectFolder = join(workspace.path, "src/main/java/po");
    const files = (await import("node:fs/promises")).readdir(javaFolder);
    assert.deepEqual((await files).sort(), ["BaseTest.java", `${generatedClass}.java`].sort());
    assert.deepEqual((await (await import("node:fs/promises")).readdir(pageObjectFolder)).sort(), ["CustomerPasswordResetPage.java", "PageObject.java"]);
    assert.equal(await readFile(join(workspace.path, "pom.xml"), "utf8"), "<project><modelVersion>4.0.0</modelVersion></project>\n");
    const owner = JSON.parse(await readFile(join(root, workspace.metadataPath), "utf8")) as Record<string, unknown>;
    assert.equal(owner.excludedHistoricalTests, true);
    assert.equal(owner.noApplicationSourceCopied, true);
    assert.equal(owner.testClass, `tests.${generatedClass}`);
    assert.deepEqual(owner.copiedFiles, ["pom.xml", "src/main/java/po/PageObject.java", "src/main/java/po/CustomerPasswordResetPage.java", "src/test/java/tests/BaseTest.java", `src/test/java/tests/${generatedClass}.java`]);
    await assert.rejects(createIsolatedExpressCartWorkspace(root, manifest, state, state.candidate!, artifact, "invocation-01"), /already exists/);

    const forgedWorkspace = { ...workspace, path: suite };
    await assert.rejects(runRegisteredExpressCartSelenium(root, manifest, state, state.candidate!, artifact, forgedWorkspace, {
      baseUrl: "http://127.0.0.1:1234", evidenceDirectory: root, mavenBuildDirectory: root,
      unregisteredEmail: "00000000-0000-0000-0000-000000000000@example.invalid", chromeDriverPath: join(root, "driver"), chromeBinaryPath: join(root, "chrome"),
    }), /deterministic run-scoped location/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
