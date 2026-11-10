import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMINI_38_GHERKIN_PROFILE,
  GEMINI_38_JAVA_PROFILE,
  planGemini38Gherkin,
  planGemini38Java,
} from "../src/runtime/gemini-model-config.js";

const gherkinInput = { asOf: "2026-11-10", promptCharacters: 7900, maxOutputTokens: 2000, requestedEstimatedCeilingUsd: 0.04 };
const javaInput = { asOf: "2026-11-10", promptCharacters: 7900, maxOutputTokens: 4000, requestedEstimatedCeilingUsd: 0.05, repairAttempt: 1 };

test("versioned 3.8 Gherkin preflight prices the source-backed prompt without claiming a billing cap", () => {
  const plan = planGemini38Gherkin(gherkinInput);
  assert.equal(plan.model, "gemini-3.8-flash");
  assert.equal(plan.profileId, GEMINI_38_GHERKIN_PROFILE.profileId);
  assert.ok(Math.abs(plan.estimatedMaxCostUsd - 0.0312) < 1e-12);
  assert.equal(plan.maxRequests, 1);
  assert.equal(plan.maxRetries, 0);
  assert.equal(plan.estimateIsProviderBillingCap, false);
});

test("versioned 3.8 Java preflight prices the source-backed prompt and bounds repair attempts <= 2", () => {
  const plan = planGemini38Java(javaInput);
  assert.equal(plan.model, "gemini-3.8-flash");
  assert.equal(plan.profileId, GEMINI_38_JAVA_PROFILE.profileId);
  assert.equal(plan.maxRepairAttempts, 2);
  assert.equal(plan.maxRetries, 0);
  assert.equal(plan.estimateIsProviderBillingCap, false);

  // Attempt 2 is valid
  const plan2 = planGemini38Java({ ...javaInput, repairAttempt: 2 });
  assert.equal(plan2.maxRepairAttempts, 2);

  // Attempt 3 must fail closed
  assert.throws(() => planGemini38Java({ ...javaInput, repairAttempt: 3 }), /BOUNDED_REPAIR_LIMIT_EXCEEDED/);
  assert.throws(() => planGemini38Java({ ...javaInput, repairAttempt: 0 }), /BOUNDED_REPAIR_LIMIT_EXCEEDED/);
});

test("preflight fails closed for stale pricing, invalid bounds, and insufficient estimated budget", () => {
  for (const asOf of ["2026-11-09", "2027-01-01", "2026-11-99", "tomorrow"]) {
    assert.throws(() => planGemini38Gherkin({ ...gherkinInput, asOf }), /OUT_OF_DATE/);
    assert.throws(() => planGemini38Java({ ...javaInput, asOf }), /OUT_OF_DATE/);
  }
  for (const patch of [
    { promptCharacters: 8001 },
    { promptCharacters: 0 },
    { promptCharacters: 1.5 },
    { maxOutputTokens: 2001 },
    { maxOutputTokens: 0 },
    { requestedEstimatedCeilingUsd: 0 },
    { requestedEstimatedCeilingUsd: 0.041 },
    { requestedEstimatedCeilingUsd: Number.NaN },
  ]) {
    assert.throws(() => planGemini38Gherkin({ ...gherkinInput, ...patch }), /LIMIT_INVALID/);
  }
  assert.throws(() => planGemini38Gherkin({ ...gherkinInput, requestedEstimatedCeilingUsd: 0.02 }), /BUDGET_EXCEEDED/);
});
