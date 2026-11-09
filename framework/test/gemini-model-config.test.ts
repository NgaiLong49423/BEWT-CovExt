import assert from "node:assert/strict";
import test from "node:test";
import { GEMINI_38_GHERKIN_PROFILE, planGemini38Gherkin } from "../src/runtime/gemini-model-config.js";

const input = { asOf: "2026-11-10", promptCharacters: 7900, maxOutputTokens: 2000, requestedEstimatedCeilingUsd: 0.04 };

test("versioned 3.8 preflight prices the source-backed prompt without claiming a billing cap", () => {
  const plan = planGemini38Gherkin(input);
  assert.equal(plan.model, "gemini-3.8-flash");
  assert.equal(plan.profileId, GEMINI_38_GHERKIN_PROFILE.profileId);
  assert.ok(Math.abs(plan.estimatedMaxCostUsd - 0.0312) < 1e-12);
  assert.equal(plan.maxRequests, 1);
  assert.equal(plan.maxRetries, 0);
  assert.equal(plan.estimateIsProviderBillingCap, false);
});

test("preflight fails closed for stale pricing, invalid bounds, and insufficient estimated budget", () => {
  for (const asOf of ["2026-11-09", "2027-01-01", "2026-11-99", "tomorrow"]) assert.throws(() => planGemini38Gherkin({ ...input, asOf }), /OUT_OF_DATE/);
  for (const patch of [{ promptCharacters: 8001 }, { promptCharacters: 0 }, { promptCharacters: 1.5 }, { maxOutputTokens: 2001 },
    { maxOutputTokens: 0 }, { requestedEstimatedCeilingUsd: 0 }, { requestedEstimatedCeilingUsd: 0.041 },
    { requestedEstimatedCeilingUsd: Number.NaN }]) {
    assert.throws(() => planGemini38Gherkin({ ...input, ...patch }), /LIMIT_INVALID/);
  }
  assert.throws(() => planGemini38Gherkin({ ...input, requestedEstimatedCeilingUsd: 0.02 }), /BUDGET_EXCEEDED/);
});
