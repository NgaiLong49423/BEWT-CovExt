/**
 * Offline, versioned Gemini 3.8 Flash model configuration and pricing profile.
 * Source grounded: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
 * and https://ai.google.dev/gemini-api/docs/pricing
 * Standard rates: USD 0.75 / million input tokens; USD 3.75 / million output tokens.
 */

export const GEMINI_38_GHERKIN_PROFILE = Object.freeze({
  schemaVersion: "1.0.0",
  model: "gemini-3.8-flash",
  profileId: "gemini-3.8-flash-standard-2026-11-10-v1",
  pricingSource: "https://ai.google.dev/gemini-api/docs/pricing",
  modelSource: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
  validFromUtc: "2026-11-10",
  validThroughUtc: "2026-12-31",
  inputUsdPerMillion: 0.75,
  outputUsdPerMillion: 3.75,
  tokensPerCharacterEstimate: 4,
  maxPromptCharacters: 8000,
  maxOutputTokens: 2000,
  maxRequests: 1,
  maxRetries: 0,
  timeoutMs: 60000,
  maxEstimatedCallUsd: 0.04,
} as const);

export const GEMINI_38_JAVA_PROFILE = Object.freeze({
  schemaVersion: "1.0.0",
  model: "gemini-3.8-flash",
  profileId: "gemini-3.8-flash-java-standard-2026-11-10-v1",
  pricingSource: "https://ai.google.dev/gemini-api/docs/pricing",
  modelSource: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
  validFromUtc: "2026-11-10",
  validThroughUtc: "2026-12-31",
  inputUsdPerMillion: 0.75,
  outputUsdPerMillion: 3.75,
  tokensPerCharacterEstimate: 4,
  maxPromptCharacters: 8000,
  maxOutputTokens: 4000,
  maxRequests: 1,
  maxRepairAttempts: 2, // strictly bounded: repairAttempts < 2
  maxRetries: 0,
  timeoutMs: 60000,
  maxEstimatedCallUsd: 0.05,
} as const);

export interface GeminiPlanInput {
  asOf: string;
  promptCharacters: number;
  maxOutputTokens: number;
  requestedEstimatedCeilingUsd: number;
}

/** Conservative planning heuristic, not a guarantee of provider billing or token count. */
export function planGemini38Gherkin(input: GeminiPlanInput) {
  const profile = GEMINI_38_GHERKIN_PROFILE;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.asOf) ? new Date(`${input.asOf}T00:00:00.000Z`) : new Date(NaN);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.asOf || input.asOf < profile.validFromUtc || input.asOf > profile.validThroughUtc) {
    throw new Error("MODEL_PRICING_PROFILE_OUT_OF_DATE");
  }
  if (!Number.isSafeInteger(input.promptCharacters) || input.promptCharacters < 1 || input.promptCharacters > profile.maxPromptCharacters ||
      !Number.isSafeInteger(input.maxOutputTokens) || input.maxOutputTokens < 1 || input.maxOutputTokens > profile.maxOutputTokens ||
      !Number.isFinite(input.requestedEstimatedCeilingUsd) || input.requestedEstimatedCeilingUsd <= 0 || input.requestedEstimatedCeilingUsd > profile.maxEstimatedCallUsd) {
    throw new Error("MODEL_PREFLIGHT_LIMIT_INVALID");
  }
  const estimatedMaxCostUsd = (input.promptCharacters * profile.tokensPerCharacterEstimate * profile.inputUsdPerMillion +
    input.maxOutputTokens * profile.outputUsdPerMillion) / 1_000_000;
  if (estimatedMaxCostUsd > input.requestedEstimatedCeilingUsd) throw new Error("MODEL_INPUT_BUDGET_EXCEEDED");
  return {
    profileId: profile.profileId,
    model: profile.model,
    maxRequests: profile.maxRequests,
    maxRetries: profile.maxRetries,
    timeoutMs: profile.timeoutMs,
    promptCharacters: input.promptCharacters,
    maxOutputTokens: input.maxOutputTokens,
    requestedEstimatedCeilingUsd: input.requestedEstimatedCeilingUsd,
    estimatedMaxCostUsd,
    estimateIsProviderBillingCap: false as const,
  };
}

export function planGemini38Java(input: GeminiPlanInput & { repairAttempt?: number }) {
  const profile = GEMINI_38_JAVA_PROFILE;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.asOf) ? new Date(`${input.asOf}T00:00:00.000Z`) : new Date(NaN);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.asOf || input.asOf < profile.validFromUtc || input.asOf > profile.validThroughUtc) {
    throw new Error("MODEL_PRICING_PROFILE_OUT_OF_DATE");
  }
  if (input.repairAttempt !== undefined) {
    if (!Number.isInteger(input.repairAttempt) || input.repairAttempt < 1 || input.repairAttempt > profile.maxRepairAttempts) {
      throw new Error(`BOUNDED_REPAIR_LIMIT_EXCEEDED: repairAttempt must be <= ${profile.maxRepairAttempts}`);
    }
  }
  if (!Number.isSafeInteger(input.promptCharacters) || input.promptCharacters < 1 || input.promptCharacters > profile.maxPromptCharacters ||
      !Number.isSafeInteger(input.maxOutputTokens) || input.maxOutputTokens < 1 || input.maxOutputTokens > profile.maxOutputTokens ||
      !Number.isFinite(input.requestedEstimatedCeilingUsd) || input.requestedEstimatedCeilingUsd <= 0 || input.requestedEstimatedCeilingUsd > profile.maxEstimatedCallUsd) {
    throw new Error("MODEL_PREFLIGHT_LIMIT_INVALID");
  }
  const estimatedMaxCostUsd = (input.promptCharacters * profile.tokensPerCharacterEstimate * profile.inputUsdPerMillion +
    input.maxOutputTokens * profile.outputUsdPerMillion) / 1_000_000;
  if (estimatedMaxCostUsd > input.requestedEstimatedCeilingUsd) throw new Error("MODEL_INPUT_BUDGET_EXCEEDED");
  return {
    profileId: profile.profileId,
    model: profile.model,
    maxRequests: profile.maxRequests,
    maxRepairAttempts: profile.maxRepairAttempts,
    maxRetries: profile.maxRetries,
    timeoutMs: profile.timeoutMs,
    promptCharacters: input.promptCharacters,
    maxOutputTokens: input.maxOutputTokens,
    requestedEstimatedCeilingUsd: input.requestedEstimatedCeilingUsd,
    estimatedMaxCostUsd,
    estimateIsProviderBillingCap: false as const,
  };
}
