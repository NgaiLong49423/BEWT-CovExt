import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildSanitizedRequestEvidence, candidateFromGeneration, classifyModelError, estimateTokenCostUsd, FakeGenerationProvider, GeminiGenerationProvider, invokeWithTimeout, newCandidateId, parseGeneratedJavaOutput, parseGenerationOutput, validateGeneratedJavaContract } from "../src/runtime/model-provider.js";
import type { BaselineInventory, CoverageGap } from "../src/contracts.js";

const commit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const baseline: BaselineInventory = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", collectedAt: "2026-11-08T00:00:00Z", cases: [], observedScenarioCount: 0 };
const gaps: CoverageGap[] = [{ gapId: "gap-source-01", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", behavior: "Evidence-backed behavior under review", rationale: "The pinned source reference describes this behavior; absence from an inventory alone is not treated as proof of novelty.", sourceReferences: [{ repositoryCommit: commit, sourceVersion: "1.1.19", runId: "source-inventory", artifactPath: "docs/tasks/T01-C/evidence/source-inventory.json" }] }];

test("fake provider creates a schema-valid proposed candidate with source pins", async () => {
  const candidateId = newCandidateId();
  const output = await new FakeGenerationProvider().generate({ baseline, gaps, candidateId, revision: 1 });
  const candidate = candidateFromGeneration(output, { baseline, gaps, candidateId, revision: 1 });
  assert.equal(candidate.reviewStatus, "PROPOSED");
  assert.equal(candidate.sourceCommit, commit);
  assert.equal(candidate.candidateId, candidateId);
  assert.match(output.gherkin, /Scenario:/);
});

test("Gemini provider refuses construction without explicit live-model authorization", () => {
  assert.throws(() => new GeminiGenerationProvider("gemini-test", { authorized: false, apiKey: "test" }), /LIVE_MODEL_AUTHORIZATION_REQUIRED/);
});

test("model error classifier does not mistake generateContent for rate limiting", () => {
  assert.equal(classifyModelError(new Error("400 Bad Request API_KEY_INVALID")), "AUTHORIZATION");
  assert.equal(classifyModelError(new Error("429 RESOURCE_EXHAUSTED")), "RATE_LIMIT");
  assert.equal(classifyModelError(new Error("network failure calling generateContent")), "PROVIDER_ERROR");
});

test("model request evidence is hashed and redacts secrets and private identifiers", () => {
  const evidence = buildSanitizedRequestEvidence("email person@example.test password=hunter2 API_KEY=secret-value");
  assert.match(evidence.promptSha256, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(evidence.sanitizedPrompt, /person@example\.test|hunter2|secret-value/);
  assert.match(evidence.sanitizedPrompt, /REDACTED/);
});

test("token-usage cost telemetry is a list-price estimate, never labeled as billed actual cost", () => {
  assert.equal(estimateTokenCostUsd(1_000, 2_000), 0.00325);
  assert.throws(() => estimateTokenCostUsd(-1, 2_000), /non-negative safe integers/);
  assert.throws(() => estimateTokenCostUsd(Number.MAX_SAFE_INTEGER + 1, 2_000), /non-negative safe integers/);
});

test("T01-C reset-token coverage claim asserts only source-confirmed redirect behavior", async () => {
  const cli = await readFile(new URL("../src/t01c-cli.ts", import.meta.url), "utf8");
  assert.match(cli, /sets session message keys and redirects to \/forgot without rendering the reset form/);
  assert.match(cli, /this claim asserts only the redirect destination, not page existence or message visibility/);
  assert.doesNotMatch(cli, /redirects to the forgot-password page and displays the invalid-or-expired message/);
});

test("structured generation parser rejects incomplete model output", () => {
  assert.throws(() => parseGenerationOutput({ gherkin: "Scenario: missing metadata" }));
});

test("model timeout aborts the in-flight invocation and classifies as TIMEOUT", async () => {
  let observedSignal: AbortSignal | undefined;
  await assert.rejects(invokeWithTimeout((signal) => {
    observedSignal = signal;
    return new Promise<never>(() => {});
  }, 5), /MODEL_TIMEOUT/);
  assert.equal(observedSignal?.aborted, true);
  assert.equal(classifyModelError(new Error("MODEL_TIMEOUT")), "TIMEOUT");
});

test("generated Java contract binds the declared class, BaseTest, and JUnit and rejects process execution", () => {
  const source = { javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() { Assert.assertTrue(true); } }", testClass: "GeneratedTest" };
  assert.doesNotThrow(() => validateGeneratedJavaContract(source));
  assert.throws(() => validateGeneratedJavaContract({ ...source, testClass: "OtherTest" }), /declare the returned class/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, testClass: "OtherTest" }, "ExpectedTest"), /deterministic candidate-bound/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package wrong; class GeneratedTest extends BaseTest { @Test void behavior() { Assert.assertTrue(true); } }" }), /approved tests package/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class GeneratedTest { @Test void behavior() { Assert.assertTrue(true); } }" }), /extend the suite BaseTest/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() { Assert.assertTrue(true); Runtime.getRuntime().exec(\"mvn\"); } }" }), /spawn arbitrary processes/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() { Assert.assertTrue(true); new MongoClient(); } }" }), /bypass browser interaction/);
  assert.throws(() => validateGeneratedJavaContract(source, undefined, "CustomerPasswordResetPage"), /source-specific Page Object/);
  assert.doesNotThrow(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() { new CustomerPasswordResetPage(driver, appUrl); Assert.assertTrue(true); } }" }, undefined, "CustomerPasswordResetPage"));
});

test("generated Java contract bounds class identifiers and validates package, class, and APIs with deterministic scanning", () => {
  assert.throws(() => parseGeneratedJavaOutput({ javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() { Assert.assertTrue(true); } }", testClass: "A".repeat(129) }));
  const source = { javaSource: `package tests; class ${"A".repeat(128)} extends BaseTest { @Test void behavior() { Assert.assertTrue(true); } }`, testClass: "A".repeat(128) };
  assert.doesNotThrow(() => validateGeneratedJavaContract(source));
  assert.throws(() => validateGeneratedJavaContract({ ...source, testClass: "A".repeat(129) }), /valid bounded identifier/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "x".repeat(30_001) }), /configured size limit/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class NotTheClass extends BaseTest { @Test void behavior() { Assert.assertTrue(true); } }" }), /declare the returned class/);
  assert.doesNotThrow(() => validateGeneratedJavaContract({ javaSource: "// generated\npackage\n tests ;\nclass GeneratedTest\nextends BaseTest { @Test void behavior() { new\n CustomerPasswordResetPage\n (driver, appUrl); Assert.assertTrue(true); } }", testClass: "GeneratedTest" }, undefined, "CustomerPasswordResetPage"));
});

test("bounded Gemini provider pins model and refuses oversized prompts before network access", async () => {
  assert.throws(() => new GeminiGenerationProvider("unapproved-model", { authorized: true, apiKey: "test" }), /permits only/);
  const provider = new GeminiGenerationProvider("gemini-3.1-flash-lite", { authorized: true, apiKey: "test" });
  const oversizedBaseline: BaselineInventory = { ...baseline, cases: Array.from({ length: 40 }, (_, index) => ({ caseId: `c${index}`, gherkinPath: "base.feature", scenarioName: `case-${index}`, baseTestPaths: [], behaviorTags: [], sourceReferences: [] })), observedScenarioCount: 40 };
  await assert.rejects(provider.generate({ baseline: oversizedBaseline, gaps, candidateId: "CAND-test", revision: 1, sourceContext: Array.from({ length: 8 }, () => "x".repeat(1_000)) }), /MODEL_INPUT_BUDGET_EXCEEDED/);
  assert.equal(provider.lastTelemetry.calls, 0);
  assert.equal(provider.lastTelemetry.status, "BLOCKED");
  await assert.rejects(provider.generate({ baseline, gaps, candidateId: "CAND-test", revision: 1 }), /budget is exhausted/);
});
