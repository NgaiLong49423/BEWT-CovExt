import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { sanitizeToolOutput, type BaselineInventory, type CandidateScenario, type CoverageGap } from "../contracts.js";
import { parseCandidateScenario } from "../contracts.js";
import { assertCanGenerateJava, assertCanRepairJava } from "../policy.js";
import { expectedGeneratedTestClass } from "./java-class.js";

const ModelOutput = z.object({
  gherkin: z.string().min(1).max(8_000),
  preconditions: z.array(z.string().min(1)).min(1).max(20),
  oracle: z.array(z.string().min(1)).min(1).max(20),
  noveltyRationale: z.string().min(20).max(2_000),
}).strict();
const JavaOutput = z.object({ javaSource: z.string().min(1).max(30_000), testClass: z.string().min(1).max(128).regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/) }).strict();

export type GenerationOutput = z.infer<typeof ModelOutput>;
export type GeneratedJavaOutput = z.infer<typeof JavaOutput>;
export function parseGenerationOutput(input: unknown): GenerationOutput { return ModelOutput.parse(input); }
export function parseGeneratedJavaOutput(input: unknown): GeneratedJavaOutput { return JavaOutput.parse(input); }
export interface GenerationRequest { baseline: BaselineInventory; gaps: CoverageGap[]; candidateId: string; revision: number; sourceContext?: string[]; }
export interface ModelTelemetry { provider: "Fake" | "Gemini"; model: string; calls: number; attempts: number; elapsedMs: number; status: "PASS" | "NOT_RUN" | "BLOCKED" | "FAIL"; errorCategory?: string; promptCharacters?: number; estimatedMaxCostUsd?: number; requestEvidence?: { promptSha256: string; sanitizedPrompt: string }; inputTokens?: number; outputTokens?: number; actualCostUsd?: number; }
export interface GenerationProvider { readonly name: "Fake" | "Gemini"; readonly model: string; generate(request: GenerationRequest): Promise<GenerationOutput>; }
export interface JavaGenerationProvider { readonly name: "Fake" | "Gemini"; readonly model: string; generateJava(candidate: CandidateScenario, workflow: import("../contracts.js").AgentWorkflowState, approvedImplementationContext?: string[]): Promise<GeneratedJavaOutput>; repairJava?(candidate: CandidateScenario, workflow: import("../contracts.js").AgentWorkflowState, currentJava: string, validation: import("../contracts.js").ValidationResult, attempt: number): Promise<GeneratedJavaOutput>; }

export function classifyModelError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "unknown";
  if (/\btimeout\b|timed out|_timeout\b/.test(message)) return "TIMEOUT";
  if (/api_key_invalid|invalid api key|\b401\b|\b403\b|unauthorized|permission denied/.test(message)) return "AUTHORIZATION";
  if (/\b429\b|rate[\s_-]+limit|quota|resource_exhausted/.test(message)) return "RATE_LIMIT";
  if (message.includes("validation") || message.includes("schema")) return "OUTPUT_SCHEMA";
  return "PROVIDER_ERROR";
}

export function invokeWithTimeout<T>(invoke: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return Promise.race([Promise.resolve().then(() => invoke(controller.signal)), new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new Error("MODEL_TIMEOUT")), { once: true });
  })]).finally(() => clearTimeout(timer));
}

function usageNumber(value: unknown, keys: string[]): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  for (const key of keys) if (typeof source[key] === "number" && Number.isFinite(source[key])) return source[key] as number;
  return undefined;
}

export function buildSanitizedRequestEvidence(prompt: string): NonNullable<ModelTelemetry["requestEvidence"]> {
  return { promptSha256: createHash("sha256").update(prompt).digest("hex"), sanitizedPrompt: sanitizeToolOutput(prompt) };
}

type JavaIdentifier = { name: string; start: number; end: number };
type JavaToken = { kind: "identifier" | "literal" | "symbol"; value: string; start: number; end: number };

function isWhitespaceCode(code: number): boolean {
  return (code >= 9 && code <= 13) || code === 32 || code === 160 || code === 5760 || (code >= 8192 && code <= 8202) || code === 8232 || code === 8233 || code === 8239 || code === 8287 || code === 12288 || code === 65279;
}

function javaTokens(source: string): JavaToken[] {
  const tokens: JavaToken[] = [];
  const isStart = (code: number): boolean => (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 36 || code === 95;
  const isPart = (code: number): boolean => isStart(code) || (code >= 48 && code <= 57);
  let index = 0;
  while (index < source.length) {
    const char = source[index]!;
    const next = source[index + 1];
    if (isWhitespaceCode(source.charCodeAt(index))) { index += 1; continue; }
    if (char === "/" && next === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n" && source[index] !== "\r") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) return tokens;
      index = end + 2;
      continue;
    }
    if (source.startsWith('"""', index)) {
      const start = index;
      index += 3;
      while (index < source.length) {
        if (source.startsWith('"""', index)) {
          let slashes = 0;
          for (let back = index - 1; back >= start && source[back] === "\\"; back -= 1) slashes += 1;
          if (slashes % 2 === 0) { index += 3; break; }
        }
        index += 1;
      }
      tokens.push({ kind: "literal", value: source.slice(start, index), start, end: index });
      continue;
    }
    if (char === "\"" || char === "'") {
      const start = index;
      const quote = char;
      index += 1;
      while (index < source.length) {
        if (source[index] === "\\") { index += 2; continue; }
        if (source[index] === quote) { index += 1; break; }
        index += 1;
      }
      tokens.push({ kind: "literal", value: source.slice(start, index), start, end: index });
      continue;
    }
    if (!isStart(source.charCodeAt(index))) {
      tokens.push({ kind: "symbol", value: char, start: index, end: index + 1 });
      index += 1;
      continue;
    }
    const start = index;
    index += 1;
    while (index < source.length && isPart(source.charCodeAt(index))) index += 1;
    tokens.push({ kind: "identifier", value: source.slice(start, index), start, end: index });
  }
  return tokens;
}

function javaIdentifiers(source: string): JavaIdentifier[] {
  return javaTokens(source).filter((token) => token.kind === "identifier").map(({ value, start, end }) => ({ name: value, start, end }));
}

type ExecutableAssertion = { canonical: string };

function matchingDelimiter(tokens: JavaToken[], openIndex: number, open: string, close: string): number | undefined {
  let depth = 0;
  for (let index = openIndex; index < tokens.length; index += 1) {
    if (tokens[index]!.value === open) depth += 1;
    else if (tokens[index]!.value === close && --depth === 0) return index;
  }
  return undefined;
}

function testMethodBodies(tokens: JavaToken[]): Array<[number, number]> {
  const bodies: Array<[number, number]> = [];
  for (let annotation = 0; annotation < tokens.length - 1; annotation += 1) {
    if (tokens[annotation]!.value !== "@" || tokens[annotation + 1]!.value !== "Test") continue;
    let index = annotation + 2;
    if (tokens[index]?.value === "(") {
      const end = matchingDelimiter(tokens, index, "(", ")");
      if (end === undefined) continue;
      index = end + 1;
    }
    // Skip modifiers/return type/parameters/throws until the annotated method body.
    while (index < tokens.length && tokens[index]!.value !== "{" && tokens[index]!.value !== ";") {
      if (tokens[index]!.value === "(") {
        const end = matchingDelimiter(tokens, index, "(", ")");
        if (end === undefined) break;
        index = end + 1;
      } else index += 1;
    }
    if (tokens[index]?.value !== "{") continue;
    const end = matchingDelimiter(tokens, index, "{", "}");
    if (end !== undefined) bodies.push([index + 1, end]);
    annotation += 1;
  }
  return bodies;
}

function assertionCalls(source: string): ExecutableAssertion[] {
  const tokens = javaTokens(source);
  const bodies = testMethodBodies(tokens);
  const assertions: ExecutableAssertion[] = [];
  for (const [start, end] of bodies) {
    for (let index = start; index + 1 < end; index += 1) {
      const token = tokens[index]!;
      if (token.kind !== "identifier" || !(/^(?:assert[A-Z][A-Za-z0-9_]*|fail)$/.test(token.value)) || tokens[index + 1]!.value !== "(") continue;
      const close = matchingDelimiter(tokens, index + 1, "(", ")");
      if (close === undefined || close >= end) continue;
      const callTokens = tokens.slice(index, close + 1);
      const canonical = callTokens.map((part, position) => {
        const isByLocatorString = part.kind === "literal" && position >= 4 && callTokens[position - 1]!.value === "(" &&
          callTokens[position - 2]!.kind === "identifier" && ["id", "name", "className", "tagName", "linkText", "partialLinkText", "cssSelector", "xpath"].includes(callTokens[position - 2]!.value) &&
          callTokens[position - 3]!.value === "." && callTokens[position - 4]!.value === "By";
        return isByLocatorString ? "<locator-string>" : `${part.kind}:${part.value}`;
      }).join(" ");
      assertions.push({ canonical });
    }
  }
  return assertions;
}

/** Require executable assertions inside an @Test method; this is lexical evidence, not oracle semantic proof. */
export function executableAssertionCount(source: string): number { return assertionCalls(source).length; }

/** Preserve the generated assertion calls across repair; locator literals passed directly to Selenium By factories may change. */
export function assertExecutableAssertionsPreserved(before: string, after: string): void {
  const expected = assertionCalls(before).map((assertion) => assertion.canonical);
  const actual = assertionCalls(after).map((assertion) => assertion.canonical);
  if (expected.length === 0 || expected.length !== actual.length || expected.some((assertion, index) => assertion !== actual[index])) {
    throw new Error("Java repair must preserve every executable test assertion without changing its oracle expression");
  }
}

function hasApprovedPackage(source: string): boolean {
  let index = 0;
  while (index < source.length) {
    while (index < source.length && isWhitespaceCode(source.charCodeAt(index))) index += 1;
    if (source.startsWith("//", index)) {
      while (index < source.length && source[index] !== "\n" && source[index] !== "\r") index += 1;
      continue;
    }
    if (source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) return false;
      index = end + 2;
      continue;
    }
    break;
  }
  if (!source.startsWith("package", index)) return false;
  index += "package".length;
  if (index >= source.length || !isWhitespaceCode(source.charCodeAt(index))) return false;
  while (index < source.length && isWhitespaceCode(source.charCodeAt(index))) index += 1;
  if (!source.startsWith("tests", index)) return false;
  index += "tests".length;
  const nextCode = source.charCodeAt(index);
  if ((nextCode >= 48 && nextCode <= 57) || (nextCode >= 65 && nextCode <= 90) || (nextCode >= 97 && nextCode <= 122) || nextCode === 95 || nextCode === 36) return false;
  while (index < source.length && isWhitespaceCode(source.charCodeAt(index))) index += 1;
  return source.charAt(index) === ";";
}

function hasWhitespaceSequence(tokens: JavaIdentifier[], source: string, first: string, second: string): boolean {
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = tokens[index]!;
    const right = tokens[index + 1]!;
    if (left.name !== first || right.name !== second) continue;
    let cursor = left.end;
    while (cursor < right.start && isWhitespaceCode(source.charCodeAt(cursor))) cursor += 1;
    if (cursor === right.start) return true;
  }
  return false;
}

function isJavaIdentifier(name: string): boolean {
  if (name.length < 1 || name.length > 128) return false;
  const code = name.charCodeAt(0);
  if (!((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 36 || code === 95)) return false;
  for (let index = 1; index < name.length; index += 1) {
    const part = name.charCodeAt(index);
    if (!((part >= 65 && part <= 90) || (part >= 97 && part <= 122) || (part >= 48 && part <= 57) || part === 36 || part === 95)) return false;
  }
  return true;
}

function hasNewConstructor(tokens: JavaIdentifier[], source: string, className: string): boolean {
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const keyword = tokens[index]!;
    const type = tokens[index + 1]!;
    if (keyword.name !== "new" || type.name !== className || source.slice(keyword.end, type.start).trim() !== "") continue;
    let next = type.end;
    while (next < source.length && isWhitespaceCode(source.charCodeAt(next))) next += 1;
    if (source.charAt(next) === "(") return true;
  }
  return false;
}

/** Static guard only; compilation and suite integration remain separate runtime evidence. */
export function validateGeneratedJavaContract(output: GeneratedJavaOutput, expectedTestClass?: string, requiredPageObject?: string): void {
  if (output.javaSource.length < 1 || output.javaSource.length > 30_000) throw new Error("generated Java source must be within the configured size limit");
  if (!isJavaIdentifier(output.testClass)) throw new Error("generated Java class name must be a valid bounded identifier");
  if (expectedTestClass !== undefined && output.testClass !== expectedTestClass) throw new Error("generated Java class must match the deterministic candidate-bound class name");
  const identifiers = javaIdentifiers(output.javaSource);
  if (executableAssertionCount(output.javaSource) === 0) throw new Error("generated Java must contain an executable assertion inside a JUnit test method");
  if (!hasApprovedPackage(output.javaSource)) throw new Error("generated Java must use the approved tests package");
  if (!hasWhitespaceSequence(identifiers, output.javaSource, "class", output.testClass)) throw new Error("generated Java must declare the returned class name");
  if (!hasWhitespaceSequence(identifiers, output.javaSource, "extends", "BaseTest")) throw new Error("generated Java must extend the suite BaseTest");
  if (!identifiers.some((token) => token.name === "Test" && output.javaSource[token.start - 1] === "@")) throw new Error("generated Java must contain a JUnit test method");
  if (requiredPageObject && (!isJavaIdentifier(requiredPageObject) || !hasNewConstructor(identifiers, output.javaSource, requiredPageObject))) throw new Error("generated Java must use the approved source-specific Page Object API");
  if (output.javaSource.includes("Runtime.getRuntime().exec") || hasWhitespaceSequence(identifiers, output.javaSource, "new", "ProcessBuilder")) throw new Error("generated Java must not spawn arbitrary processes");
  if (["HttpClient", "MongoClient", "DriverManager", "RestAssured", "OkHttpClient"].some((name) => identifiers.some((token) => token.name === name)) || output.javaSource.includes("java.net.http") || output.javaSource.includes("java.sql.")) throw new Error("generated Java must not bypass browser interaction through API or database clients");
}

/** Deterministic offline provider. It exists for contract/integration tests, never as Gemini evidence. */
export class FakeGenerationProvider implements GenerationProvider {
  readonly name = "Fake" as const;
  readonly model = "deterministic-test-double";
  async generate(request: GenerationRequest): Promise<GenerationOutput> {
    const first = request.gaps[0];
    if (!first) throw new Error("coverage analysis supplied no grounded gaps");
    return parseGenerationOutput({
      gherkin: `Feature: ${first.behavior}\n\n  Scenario: Verify ${first.behavior.toLowerCase()}\n    Given the application is running in an isolated test environment\n    When the documented behavior is exercised\n    Then the observed result matches the approved oracle`,
      preconditions: ["The isolated application fixture is available."],
      oracle: [`Observe the outcome for: ${first.behavior}`],
      noveltyRationale: "Offline synthetic proposal for testing workflow contracts only; novelty requires independent review.",
    });
  }
}

/** Synthetic source for offline approval, registry and isolated-workspace tests only. */
export class FakeJavaGenerationProvider implements JavaGenerationProvider {
  readonly name = "Fake" as const;
  readonly model = "deterministic-test-double";
  async generateJava(candidate: CandidateScenario, workflow: import("../contracts.js").AgentWorkflowState): Promise<GeneratedJavaOutput> {
    assertCanGenerateJava(workflow, candidate);
    const testClass = expectedGeneratedTestClass(candidate);
    const output = parseGeneratedJavaOutput({ testClass, javaSource: `package tests;\n\nimport org.junit.Test;\nimport org.junit.Assert;\n\npublic class ${testClass} extends BaseTest {\n  @Test public void syntheticOfflineContract() { Assert.assertNotNull(appUrl); }\n}\n` });
    validateGeneratedJavaContract(output, testClass);
    return output;
  }
  async repairJava(candidate: CandidateScenario, workflow: import("../contracts.js").AgentWorkflowState, currentJava: string, validation: import("../contracts.js").ValidationResult, attempt: number): Promise<GeneratedJavaOutput> {
    assertCanRepairJava(workflow, candidate);
    if (attempt < 1 || attempt > 2 || !hasGeneratedTestDefect(validation)) throw new Error("repair requires an eligible generated-test defect and attempt 1 or 2");
    const output = parseGeneratedJavaOutput({ testClass: expectedGeneratedTestClass(candidate), javaSource: `${currentJava}\n// synthetic repair attempt ${attempt}; no research or runtime claim\n` });
    validateGeneratedJavaContract(output, expectedGeneratedTestClass(candidate));
    return output;
  }
}

function hasGeneratedTestDefect(validation: import("../contracts.js").ValidationResult): boolean {
  return (validation.compile.outcome === "FAIL" && validation.compile.failureClassification === "GENERATED_TEST_DEFECT") ||
    (validation.e2e.outcome === "FAIL" && validation.e2e.failureClassification === "GENERATED_TEST_DEFECT");
}

import { GEMINI_38_GHERKIN_PROFILE, GEMINI_38_JAVA_PROFILE } from "./gemini-model-config.js";

const ALLOWED_GEMINI_MODELS = new Set(["gemini-3.1-flash-lite", "gemini-3.8-flash"]);

function getGeminiPricing(model: string) {
  if (model === "gemini-3.8-flash") {
    return { inputUsdPerMillion: GEMINI_38_JAVA_PROFILE.inputUsdPerMillion, outputUsdPerMillion: GEMINI_38_JAVA_PROFILE.outputUsdPerMillion, defaultJavaCeilingUsd: GEMINI_38_JAVA_PROFILE.maxEstimatedCallUsd, defaultGherkinCeilingUsd: GEMINI_38_GHERKIN_PROFILE.maxEstimatedCallUsd };
  }
  return { inputUsdPerMillion: 0.25, outputUsdPerMillion: 1.5, defaultJavaCeilingUsd: 0.02, defaultGherkinCeilingUsd: 0.02 };
}

/** Live Java generation is explicitly separate from Gherkin generation and requires current ACCEPT. */
export class GeminiJavaGenerationProvider implements JavaGenerationProvider {
  readonly name = "Gemini" as const;
  lastTelemetry: ModelTelemetry = { provider: "Gemini", model: "unavailable", calls: 0, attempts: 0, elapsedMs: 0, status: "NOT_RUN", estimatedMaxCostUsd: 0 };
  private readonly modelClient: { invoke(input: string, options?: { signal?: AbortSignal }): Promise<unknown> };
  private used = false;
  private readonly repairAttempts = new Set<number>();
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly costCeilingUsd: number;
  constructor(readonly model: string, options: { authorized: boolean; apiKey?: string; timeoutMs?: number; maxOutputTokens?: number; costCeilingUsd?: number }) {
    if (!options.authorized) throw new Error("LIVE_MODEL_AUTHORIZATION_REQUIRED");
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is required when live model use is explicitly authorized");
    if (!ALLOWED_GEMINI_MODELS.has(model)) throw new Error(`bounded run permits only ${Array.from(ALLOWED_GEMINI_MODELS).join(", ")}`);
    const pricing = getGeminiPricing(model);
    this.maxOutputTokens = options.maxOutputTokens ?? 4_000;
    this.costCeilingUsd = options.costCeilingUsd ?? pricing.defaultJavaCeilingUsd;
    if (this.maxOutputTokens < 1 || this.maxOutputTokens > 4_000 || this.costCeilingUsd <= 0 || this.costCeilingUsd > pricing.defaultJavaCeilingUsd) throw new Error("Java model budget exceeds the per-call ceiling");
    this.timeoutMs = options.timeoutMs ?? 60_000;
    if (this.timeoutMs < 1 || this.timeoutMs > 60_000) throw new Error("bounded run timeout cannot exceed 60 seconds");
    const structured = new ChatGoogleGenerativeAI({ model, apiKey, temperature: 0, maxRetries: 0, maxOutputTokens: this.maxOutputTokens }).withStructuredOutput(JavaOutput, { includeRaw: true });
    this.modelClient = structured as unknown as { invoke(input: string): Promise<unknown> };
  }
  async generateJava(candidate: CandidateScenario, workflow: import("../contracts.js").AgentWorkflowState, approvedImplementationContext: string[] = []): Promise<GeneratedJavaOutput> {
    assertCanGenerateJava(workflow, candidate);
    if (this.used) throw new Error("T01-C Java request budget is exhausted");
    const expectedClass = expectedGeneratedTestClass(candidate);
    const context = approvedImplementationContext.slice(0, 8).map((item) => item.slice(0, 1_000));
    const prompt = [
      "Implement exactly one Java Selenium/JUnit test from this accepted candidate. Do not claim any test has run.",
      "Use package tests, extend the existing BaseTest, use only APIs/selectors demonstrated in the supplied approved source context, and interact through the browser UI. When the approved source context provides a Page Object for this behavior, call its documented API instead of implementing selectors in the test.",
      "Do not use direct HTTP/API/database access, credentials, process execution, arbitrary build commands, or weaken the accepted oracle.",
      `The required simple class name is exactly ${expectedClass}. Return only javaSource and testClass.`,
      JSON.stringify({ candidate: { candidateId: candidate.candidateId, revision: candidate.revision, sourceCommit: candidate.sourceCommit,
        sourceVersion: candidate.sourceVersion, gherkin: candidate.gherkin, preconditions: candidate.preconditions, oracle: candidate.oracle,
        sourceReferences: candidate.sourceReferences }, approvedImplementationContext: context }),
    ].join("\n\n");
    return this.invokeJava(prompt, candidate, expectedClass, "MODEL_CALL_FAILED", () => { this.used = true; });
  }

  async repairJava(candidate: CandidateScenario, workflow: import("../contracts.js").AgentWorkflowState, currentJava: string,
    validation: import("../contracts.js").ValidationResult, attempt: number): Promise<GeneratedJavaOutput> {
    assertCanRepairJava(workflow, candidate);
    if (!Number.isInteger(attempt) || attempt < 1 || attempt > 2 || this.repairAttempts.has(attempt) || !hasGeneratedTestDefect(validation)) {
      throw new Error("repair requires a new bounded attempt and a GENERATED_TEST_DEFECT classification");
    }
    if (currentJava.length > 5_000) throw new Error("repair source exceeds the bounded prompt budget");
    const expectedClass = expectedGeneratedTestClass(candidate);
    const failure = [validation.compile, validation.e2e].filter((stage) => stage.outcome === "FAIL" && stage.failureClassification === "GENERATED_TEST_DEFECT")
      .map((stage) => stage.evidence.map((item) => item.artifactPath).join(", ")).join("; ").slice(0, 1_000);
    const prompt = [
      "Repair the existing Java Selenium/JUnit test for only the classified generated-test defect. Do not claim any test ran successfully.",
      "Preserve the accepted scenario, every assertion of the approved oracle, browser-only interaction, package, class, and existing approved APIs. Do not weaken, delete, skip, or rewrite assertions to force a pass. Do not use HTTP, database access, credentials, process execution, or arbitrary commands.",
      `Return the exact class ${expectedClass} and the complete replacement source. This is repair attempt ${attempt} of at most 2.`,
      JSON.stringify({ candidate: { candidateId: candidate.candidateId, revision: candidate.revision, sourceCommit: candidate.sourceCommit,
        sourceVersion: candidate.sourceVersion, gherkin: candidate.gherkin, oracle: candidate.oracle },
        classifiedFailureEvidence: failure, currentJavaSource: currentJava }),
    ].join("\n\n");
    const output = await this.invokeJava(prompt, candidate, expectedClass, "MODEL_REPAIR_FAILED", () => { this.repairAttempts.add(attempt); });
    try { assertExecutableAssertionsPreserved(currentJava, output.javaSource); }
    catch (error) {
      this.lastTelemetry = { ...this.lastTelemetry, status: "FAIL", errorCategory: "OUTPUT_CONTRACT" };
      throw error;
    }
    return output;
  }

  private async invokeJava(prompt: string, candidate: CandidateScenario, expectedClass: string, failureCode: string, consumeCall: () => void): Promise<GeneratedJavaOutput> {
    const promptCharacters = Array.from(prompt).length;
    const requestEvidence = buildSanitizedRequestEvidence(prompt);
    const pricing = getGeminiPricing(this.model);
    const estimatedMaxCostUsd = (promptCharacters * 4 * pricing.inputUsdPerMillion + this.maxOutputTokens * pricing.outputUsdPerMillion) / 1_000_000;
    if (promptCharacters > 8_000 || estimatedMaxCostUsd > this.costCeilingUsd) {
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 0, attempts: 0, elapsedMs: 0, status: "BLOCKED", errorCategory: "INPUT_BUDGET", promptCharacters, estimatedMaxCostUsd };
      throw new Error("MODEL_INPUT_BUDGET_EXCEEDED");
    }
    consumeCall();
    const startedAt = Date.now();
    try {
      const response = await invokeWithTimeout((signal) => this.modelClient.invoke(prompt, { signal }), this.timeoutMs) as { parsed?: unknown; raw?: unknown };
      const output = parseGeneratedJavaOutput(response.parsed);
      const requiresResetPageObject = candidate.sourceReferences.some((reference) => reference.artifactPath === "experiments/expresscart/source/routes/customer.js");
      validateGeneratedJavaContract(output, expectedClass, requiresResetPageObject ? "CustomerPasswordResetPage" : undefined);
      const raw = response.raw as { usage_metadata?: unknown; response_metadata?: { tokenUsage?: unknown } } | undefined;
      const usage = raw?.usage_metadata ?? raw?.response_metadata?.tokenUsage;
      const inputTokens = usageNumber(usage, ["input_tokens", "prompt_tokens", "inputTokens"]);
      const outputTokens = usageNumber(usage, ["output_tokens", "completion_tokens", "outputTokens"]);
      const actualCostUsd = inputTokens !== undefined && outputTokens !== undefined ? (inputTokens * pricing.inputUsdPerMillion + outputTokens * pricing.outputUsdPerMillion) / 1_000_000 : undefined;
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 1, attempts: 1, elapsedMs: Date.now() - startedAt, status: "PASS", promptCharacters, estimatedMaxCostUsd, requestEvidence,
        ...(inputTokens === undefined ? {} : { inputTokens }), ...(outputTokens === undefined ? {} : { outputTokens }), ...(actualCostUsd === undefined ? {} : { actualCostUsd }) };
      return output;
    } catch (error) {
      const category = classifyModelError(error);
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 1, attempts: 1, elapsedMs: Date.now() - startedAt, status: category === "AUTHORIZATION" ? "BLOCKED" : "FAIL", errorCategory: category, promptCharacters, estimatedMaxCostUsd, requestEvidence };
      throw new Error(`${failureCode}:${category}:${error instanceof Error ? error.message.slice(0, 300) : "unknown"}`);
    }
  }
}

/** Construction requires explicit authorization; no API request occurs before generate(). */
export class GeminiGenerationProvider implements GenerationProvider {
  readonly name = "Gemini" as const;
  lastTelemetry: ModelTelemetry = { provider: "Gemini", model: "unavailable", calls: 0, attempts: 0, elapsedMs: 0, status: "NOT_RUN", estimatedMaxCostUsd: 0 };
  private readonly modelClient: { invoke(input: string, options?: { signal?: AbortSignal }): Promise<unknown> };
  private used = false;
  private readonly maxOutputTokens: number;
  private readonly costCeilingUsd: number;
  constructor(readonly model: string, options: { authorized: boolean; apiKey?: string; timeoutMs?: number; maxOutputTokens?: number; costCeilingUsd?: number }) {
    if (!options.authorized) throw new Error("LIVE_MODEL_AUTHORIZATION_REQUIRED");
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is required when live model use is explicitly authorized");
    if (!ALLOWED_GEMINI_MODELS.has(model)) throw new Error(`bounded run permits only ${Array.from(ALLOWED_GEMINI_MODELS).join(", ")}`);
    const pricing = getGeminiPricing(model);
    this.maxOutputTokens = options.maxOutputTokens ?? 2_000;
    this.costCeilingUsd = options.costCeilingUsd ?? pricing.defaultGherkinCeilingUsd;
    if (this.maxOutputTokens < 1 || this.maxOutputTokens > 2_000 || this.costCeilingUsd <= 0 || this.costCeilingUsd > pricing.defaultGherkinCeilingUsd) throw new Error("Gherkin model budget exceeds the per-call ceiling");
    const structured = new ChatGoogleGenerativeAI({ model, apiKey, temperature: 0, maxRetries: 0, maxOutputTokens: this.maxOutputTokens }).withStructuredOutput(ModelOutput, { includeRaw: true });
    this.modelClient = structured as unknown as { invoke(input: string): Promise<unknown> };
    this.timeoutMs = options.timeoutMs ?? 60_000;
    if (this.timeoutMs < 1 || this.timeoutMs > 60_000) throw new Error("bounded run timeout cannot exceed 60 seconds");
  }
  private readonly timeoutMs: number;
  async generate(request: GenerationRequest): Promise<GenerationOutput> {
    if (this.used) throw new Error("one-request model budget is exhausted");
    this.used = true;
    const startedAt = Date.now();
    const prompt = [
      "Generate one Gherkin browser-test candidate grounded only in the supplied source-backed gap and baseline summary.",
      "Do not generate Java yet; Java generation is a separate post-ACCEPT stage. Do not claim novelty is verified.",
      "Do not invent selectors, methods, source facts, test evidence, or behavior. Return only the required structured candidate fields.",
      JSON.stringify({ sourceContext: (request.sourceContext ?? []).slice(0, 8).map((item) => item.slice(0, 650)) }),
      JSON.stringify({ appId: request.baseline.appId, sourceCommit: request.baseline.sourceCommit, sourceVersion: request.baseline.sourceVersion,
        gaps: request.gaps.slice(0, 10).map(({ gapId, behavior, rationale, sourceReferences }) => ({ gapId, behavior, rationale, sourceReferences: sourceReferences.slice(0, 3) })),
        baselineCases: request.baseline.cases.slice(0, 40).map(({ caseId, scenarioName, behaviorTags }) => ({ caseId, scenarioName: scenarioName.slice(0, 120), behaviorTags: behaviorTags.slice(0, 5) })) }),
    ].join("\n\n");
    const promptCharacters = Array.from(prompt).length;
    const requestEvidence = buildSanitizedRequestEvidence(prompt);
    const pricing = getGeminiPricing(this.model);
    const estimatedMaxCostUsd = (promptCharacters * 4 * pricing.inputUsdPerMillion + this.maxOutputTokens * pricing.outputUsdPerMillion) / 1_000_000;
    if (promptCharacters > 8_000 || estimatedMaxCostUsd > this.costCeilingUsd) {
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 0, attempts: 0, elapsedMs: Date.now() - startedAt, status: "BLOCKED", errorCategory: "INPUT_BUDGET", promptCharacters, estimatedMaxCostUsd };
      throw new Error("MODEL_INPUT_BUDGET_EXCEEDED");
    }
    try {
      const response = await invokeWithTimeout((signal) => this.modelClient.invoke(prompt, { signal }), this.timeoutMs) as { parsed?: unknown; raw?: unknown };
      const output = parseGenerationOutput(response.parsed);
      const raw = response.raw as { usage_metadata?: unknown; response_metadata?: { tokenUsage?: unknown } } | undefined;
      const usage = raw?.usage_metadata ?? raw?.response_metadata?.tokenUsage;
      const inputTokens = usageNumber(usage, ["input_tokens", "prompt_tokens", "inputTokens"]);
      const outputTokens = usageNumber(usage, ["output_tokens", "completion_tokens", "outputTokens"]);
      const actualCostUsd = inputTokens !== undefined && outputTokens !== undefined ? (inputTokens * pricing.inputUsdPerMillion + outputTokens * pricing.outputUsdPerMillion) / 1_000_000 : undefined;
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 1, attempts: 1, elapsedMs: Date.now() - startedAt, status: "PASS", promptCharacters, estimatedMaxCostUsd, requestEvidence,
        ...(inputTokens === undefined ? {} : { inputTokens }), ...(outputTokens === undefined ? {} : { outputTokens }), ...(actualCostUsd === undefined ? {} : { actualCostUsd }) };
      return output;
    } catch (error) {
      const category = classifyModelError(error);
      this.lastTelemetry = { provider: "Gemini", model: this.model, calls: 1, attempts: 1, elapsedMs: Date.now() - startedAt, status: category === "AUTHORIZATION" ? "BLOCKED" : "FAIL", errorCategory: category, promptCharacters, estimatedMaxCostUsd, requestEvidence };
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
