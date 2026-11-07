import assert from "node:assert/strict";
import test from "node:test";
import { candidateFromGeneration, classifyModelError, FakeGenerationProvider, GeminiGenerationProvider, newCandidateId, validateGeneratedJavaContract } from "../src/runtime/model-provider.js";
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
  assert.throws(() => new GeminiGenerationProvider("gemini-test", { authorized: false, apiKey: "test-only" }), /LIVE_MODEL_AUTHORIZATION_REQUIRED/);
});

test("model error classifier does not mistake generateContent for rate limiting", () => {
  assert.equal(classifyModelError(new Error("400 Bad Request API_KEY_INVALID")), "AUTHORIZATION");
  assert.equal(classifyModelError(new Error("429 RESOURCE_EXHAUSTED")), "RATE_LIMIT");
  assert.equal(classifyModelError(new Error("network failure calling generateContent")), "PROVIDER_ERROR");
});

test("generated Java contract binds the declared class, BaseTest, and JUnit and rejects process execution", () => {
  const source = { javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() {} }", testClass: "GeneratedTest" };
  assert.doesNotThrow(() => validateGeneratedJavaContract(source));
  assert.throws(() => validateGeneratedJavaContract({ ...source, testClass: "OtherTest" }), /declare the returned class/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, testClass: "OtherTest" }, "ExpectedTest"), /deterministic candidate-bound/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package wrong; class GeneratedTest extends BaseTest { @Test void behavior() {} }" }), /approved tests package/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class GeneratedTest { @Test void behavior() {} }" }), /extend the suite BaseTest/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() { Runtime.getRuntime().exec(\"mvn\"); } }" }), /spawn arbitrary processes/);
  assert.throws(() => validateGeneratedJavaContract({ ...source, javaSource: "package tests; class GeneratedTest extends BaseTest { @Test void behavior() { new MongoClient(); } }" }), /bypass browser interaction/);
});

test("bounded Gemini provider pins model and refuses oversized prompts before network access", async () => {
  assert.throws(() => new GeminiGenerationProvider("unapproved-model", { authorized: true, apiKey: "test-only" }), /permits only/);
  const provider = new GeminiGenerationProvider("gemini-3.1-flash-lite", { authorized: true, apiKey: "test-only" });
  const oversizedBaseline: BaselineInventory = { ...baseline, cases: Array.from({ length: 40 }, (_, index) => ({ caseId: `c${index}`, gherkinPath: "base.feature", scenarioName: "x".repeat(400), baseTestPaths: [], behaviorTags: [], sourceReferences: [] })), observedScenarioCount: 40 };
  await assert.rejects(provider.generate({ baseline: oversizedBaseline, gaps, candidateId: "CAND-test", revision: 1 }), /MODEL_INPUT_BUDGET_EXCEEDED/);
  assert.equal(provider.lastTelemetry.calls, 0);
  assert.equal(provider.lastTelemetry.status, "BLOCKED");
  await assert.rejects(provider.generate({ baseline, gaps, candidateId: "CAND-test", revision: 1 }), /budget is exhausted/);
});
