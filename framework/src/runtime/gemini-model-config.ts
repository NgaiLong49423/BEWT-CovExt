/** Offline, versioned preflight profile. This module does not authorize or invoke a provider. */
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

/** Conservative planning heuristic, not a guarantee of provider billing or token count. */
export function planGemini38Gherkin(input: { asOf: string; promptCharacters: number; maxOutputTokens: number; requestedEstimatedCeilingUsd: number }) {
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
  return { profileId: profile.profileId, model: profile.model, maxRequests: profile.maxRequests, maxRetries: profile.maxRetries,
    timeoutMs: profile.timeoutMs, promptCharacters: input.promptCharacters, maxOutputTokens: input.maxOutputTokens,
    requestedEstimatedCeilingUsd: input.requestedEstimatedCeilingUsd, estimatedMaxCostUsd,
    estimateIsProviderBillingCap: false as const };
}
