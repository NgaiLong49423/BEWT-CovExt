import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { BaselineInventory, CandidateScenario, CoverageGap } from "../contracts.js";
import { parseCandidateScenario } from "../contracts.js";

const ModelOutput = z.object({
  gherkin: z.string().min(1).max(8_000),
  preconditions: z.array(z.string().min(1)).min(1).max(20),
  oracle: z.array(z.string().min(1)).min(1).max(20),
  noveltyRationale: z.string().min(20).max(2_000),
}).strict();
const JavaOutput = z.object({ javaSource: z.string().min(1).max(30_000), testClass: z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/) }).strict();

export type GenerationOutput = z.infer<typeof ModelOutput>;
export type GeneratedJavaOutput = z.infer<typeof JavaOutput>;
export interface GenerationRequest { baseline: BaselineInventory; gaps: CoverageGap[]; candidateId: string; revision: number; sourceContext?: string[]; }
export interface ModelTelemetry { provider: "Fake" | "Gemini"; model: string; calls: number; attempts: number; elapsedMs: number; status: "PASS" | "NOT_RUN" | "BLOCKED" | "FAIL"; errorCategory?: string; promptCharacters?: number; estimatedMaxCostUsd?: number; inputTokens?: number; outputTokens?: number; actualCostUsd?: number; }
export interface GenerationProvider { readonly name: "Fake" | "Gemini"; readonly model: string; generate(request: GenerationRequest): Promise<GenerationOutput>; }

export function classifyModelError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "unknown";
  if (/\btimeout\b|timed out/.test(message)) return "TIMEOUT";
  if (/api_key_invalid|invalid api key|\b401\b|\b403\b|unauthorized|permission denied/.test(message)) return "AUTHORIZATION";
  if (/\b429\b|rate[\s_-]+limit|quota|resource_exhausted/.test(message)) return "RATE_LIMIT";
  if (message.includes("validation") || message.includes("schema")) return "OUTPUT_SCHEMA";
  return "PROVIDER_ERROR";
}

function invokeWithTimeout<T>(invoke: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([invoke(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("MODEL_TIMEOUT")), timeoutMs); })])
    .finally(() => { if (timer) clearTimeout(timer); });
}

function usageNumber(value: unknown, keys: string[]): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  for (const key of keys) if (typeof source[key] === "number" && Number.isFinite(source[key])) return source[key] as number;
  return undefined;
}

/** Static guard only; compilation and suite integration remain separate runtime evidence. */
export function validateGeneratedJavaContract(output: GeneratedJavaOutput): void {
  if (!new RegExp(`\\bclass\\s+${output.testClass}\\b`).test(output.javaSource)) throw new Error("generated Java must declare the returned class name");
  if (!/extends\s+BaseTest\b/.test(output.javaSource)) throw new Error("generated Java must extend the suite BaseTest");
  if (!/@Test\b/.test(output.javaSource)) throw new Error("generated Java must contain a JUnit test method");
  if (/\b(?:Runtime\.getRuntime\(\)\.exec|new\s+ProcessBuilder)\b/.test(output.javaSource)) throw new Error("generated Java must not spawn arbitrary processes");
}

/** Deterministic offline provider. It exists for contract/integration tests, never as Gemini evidence. */
export class FakeGenerationProvider implements GenerationProvider {
  readonly name = "Fake" as const;
  readonly model = "deterministic-test-double";
  async generate(request: GenerationRequest): Promise<GenerationOutput> {
    const first = request.gaps[0];
    if (!first) throw new Error("coverage analysis supplied no grounded gaps");
    return ModelOutput.parse({
      gherkin: `Feature: ${first.behavior}\n\n  Scenario: Verify ${first.behavior.toLowerCase()}\n    Given the application is running in an isolated test environment\n    When the documented behavior is exercised\n    Then the observed result matches the approved oracle`,
      preconditions: ["The isolated application fixture is available."],
      oracle: [`Observe the outcome for: ${first.behavior}`],
      noveltyRationale: "Offline synthetic proposal for testing workflow contracts only; novelty requires independent review.",
    });
  }
}

/** Construction requires explicit authorization; no API request occurs before generate(). */
export class GeminiGenerationProvider implements GenerationProvider {
  readonly name = "Gemini" as const;
  lastTelemetry: ModelTelemetry = { provider: "Gemini", model: "unavailable", calls: 0, attempts: 0, elapsedMs: 0, status: "NOT_RUN", estimatedMaxCostUsd: 0 };
  private readonly modelClient: { invoke(input: string): Promise<unknown> };
  private used = false;
  constructor(readonly model: string, options: { authorized: boolean; apiKey?: string; timeoutMs?: number }) {
    if (!options.authorized) throw new Error("LIVE_MODEL_AUTHORIZATION_REQUIRED");
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is required when live model use is explicitly authorized");
    if (model !== "gemini-3.1-flash-lite") throw new Error("bounded T01-C run permits only gemini-3.1-flash-lite");
    const structured = new ChatGoogleGenerativeAI({ model, apiKey, temperature: 0, maxRetries: 0, maxOutputTokens: 2_000 }).withStructuredOutput(ModelOutput, { includeRaw: true });
    this.modelClient = structured as unknown as { invoke(input: string): Promise<unknown> };
    this.timeoutMs = options.timeoutMs ?? 60_000;
    if (this.timeoutMs < 1 || this.timeoutMs > 60_000) throw new Error("bounded T01-C run timeout cannot exceed 60 seconds");
  }
  private readonly timeoutMs: number;
  async generate(request: GenerationRequest): Promise<GenerationOutput> {
    if (this.used) throw new Error("T01-C one-request model budget is exhausted");
    this.used = true;
    const startedAt = Date.now();
    const prompt = [
      "Generate one Gherkin browser-test candidate grounded only in the supplied source-backed gap and baseline summary.",
      "Do not generate Java yet; Java generation is a separate post-ACCEPT stage. Do not claim novelty is verified.",
      "Do not invent selectors, methods, source facts, test evidence, or behavior. Return only the required structured candidate fields.",
      JSON.stringify({ sourceContext: (request.sourceContext ?? []).slice(0, 8).map((item) => item.slice(0, 1_000)) }),
      JSON.stringify({ appId: request.baseline.appId, sourceCommit: request.baseline.sourceCommit, sourceVersion: request.baseline.sourceVersion,
        gaps: request.gaps.slice(0, 10).map(({ gapId, behavior, rationale, sourceReferences }) => ({ gapId, behavior, rationale, sourceReferences: sourceReferences.slice(0, 3) })),
        baselineCases: request.baseline.cases.slice(0, 40).map(({ caseId, scenarioName, behaviorTags }) => ({ caseId, scenarioName, behaviorTags })) }),
    ].join("\n\n");
    const promptCharacters = Array.from(prompt).length;
    const estimatedMaxCostUsd = (promptCharacters * 4 * 0.25 + 2_000 * 1.5) / 1_000_000;
    if (promptCharacters > 8_000 || estimatedMaxCostUsd > 0.02) {
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 0, attempts: 0, elapsedMs: Date.now() - startedAt, status: "BLOCKED", errorCategory: "INPUT_BUDGET", promptCharacters, estimatedMaxCostUsd };
      throw new Error("MODEL_INPUT_BUDGET_EXCEEDED");
    }
    try {
      const response = await invokeWithTimeout(() => this.modelClient.invoke(prompt), this.timeoutMs) as { parsed?: unknown; raw?: unknown };
      const output = ModelOutput.parse(response.parsed);
      const raw = response.raw as { usage_metadata?: unknown; response_metadata?: { tokenUsage?: unknown } } | undefined;
      const usage = raw?.usage_metadata ?? raw?.response_metadata?.tokenUsage;
      const inputTokens = usageNumber(usage, ["input_tokens", "prompt_tokens", "inputTokens"]);
      const outputTokens = usageNumber(usage, ["output_tokens", "completion_tokens", "outputTokens"]);
      const actualCostUsd = inputTokens !== undefined && outputTokens !== undefined ? (inputTokens * 0.25 + outputTokens * 1.5) / 1_000_000 : undefined;
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 1, attempts: 1, elapsedMs: Date.now() - startedAt, status: "PASS", promptCharacters, estimatedMaxCostUsd,
        ...(inputTokens === undefined ? {} : { inputTokens }), ...(outputTokens === undefined ? {} : { outputTokens }), ...(actualCostUsd === undefined ? {} : { actualCostUsd }) };
      return output;
    } catch (error) {
      const category = classifyModelError(error);
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 1, attempts: 1, elapsedMs: Date.now() - startedAt, status: category === "AUTHORIZATION" ? "BLOCKED" : "FAIL", errorCategory: category, promptCharacters, estimatedMaxCostUsd };
      throw new Error(`MODEL_CALL_FAILED:${category}:${error instanceof Error ? error.message.slice(0, 300) : "unknown"}`);
    }
  }
}

export function candidateFromGeneration(output: GenerationOutput, request: GenerationRequest): CandidateScenario {
  return parseCandidateScenario({ gherkin: output.gherkin, preconditions: output.preconditions, oracle: output.oracle,
    noveltyRationale: output.noveltyRationale, candidateId: request.candidateId, appId: request.baseline.appId,
    sourceCommit: request.baseline.sourceCommit, sourceVersion: request.baseline.sourceVersion, revision: request.revision,
    sourceReferences: [...new Map(request.gaps.flatMap((gap) => gap.sourceReferences).map((ref) => [`${ref.runId}:${ref.artifactPath}`, ref])).values()],
    reviewStatus: "PROPOSED" });
}

export function newCandidateId(): string { return `CAND-${randomUUID()}`; }
