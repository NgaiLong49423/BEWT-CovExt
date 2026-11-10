import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ExpressCartExperimentAdapter, trustedReviewerId } from "../../adapters/expresscart/experiment.js";
import { getAdapterForApp } from "../../adapters/index.js";
import { parseApplicationManifest, parseCandidateScenario, parseCoverageGap, parseToolResult, parseValidationResult, sanitizeToolOutput, type AgentWorkflowState, type AppId, type CoverageGap, type GeneratedJavaArtifact, type ToolResult, type ValidationResult } from "./contracts.js";
import { assertBaselineMatchesManifest } from "./policy.js";
import { analyzeSourceBackedCoverage } from "./runtime/coverage-analysis.js";
import { candidateFromGeneration, GeminiGenerationProvider, GeminiJavaGenerationProvider, newCandidateId, parseGeneratedJavaOutput, type GenerationOutput } from "./runtime/model-provider.js";
import { parseGherkin } from "./runtime/gherkin.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices, type RuntimeState } from "./runtime/workflow.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "./runtime/safe-path.js";
import { verifyExpressCartSourceInputs } from "../../adapters/expresscart/source-identity.js";
import { loadRegisteredGeneratedJava, loadRegisteredRepairedJava, registerGeneratedJava, registerRepairedJava } from "./runtime/java-artifact-registry.js";
import { completePendingModelCall, hasReservedModelCall, readModelRunBudget, recordModelCall, reserveModelCall } from "./runtime/model-call-ledger.js";
import { readHistoricalBehaviorIndex } from "../../adapters/expresscart/historical-behavior-index.js";
import { reserveValidationInvocation } from "./runtime/validation-invocation.js";
import { loadCanonicalConfig, loadGeminiApiKey } from "./runtime/config-loader.js";

const canonicalConfig = loadCanonicalConfig();
const root = dirname(canonicalConfig.envFilePath);
const canonicalGeminiKey = loadGeminiApiKey(root);
const effectiveApiKey = canonicalGeminiKey ?? process.env.GEMINI_API_KEY;
if (canonicalGeminiKey && !process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = canonicalGeminiKey;
}
const sourceCommit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const sourceVersion = "1.1.19";
const manifestPath = "config/apps/expresscart.json";
const historicalIndexPath = "data/coverage/expresscart/historical-candidate-behavior-index.json";
const evidenceRoot = "docs/tasks/T01-C/evidence";

async function writeUnique(relativePath: string, content: string): Promise<void> {
  await writeFile(await resolveContainedOutputPath(root, relativePath), content, { flag: "wx" });
}

async function readOptionalJson(relativePath: string): Promise<unknown | undefined> {
  try { return JSON.parse(await readFile(await resolveContainedExistingPath(root, relativePath), "utf8")) as unknown; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}

async function readCoverageReviewData(runId: string): Promise<{ analysis: unknown[]; gaps: CoverageGap[] }> {
  const path = await resolveContainedExistingPath(root, `${evidenceRoot}/${runId}/source-coverage-analysis.json`);
  const value = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  if (!Array.isArray(value.coverageAnalysis) || !Array.isArray(value.candidateGaps)) throw new Error("coverage review evidence is incomplete");
  return { analysis: value.coverageAnalysis, gaps: value.candidateGaps.map(parseCoverageGap) };
}

function executionReference(result: ToolResult, invocationId: string, appState: AgentWorkflowState) {
  const runIds = [...new Set(result.evidence.map((reference) => reference.runId))];
  if (runIds.length > 1) throw new Error(`${result.tool} produced evidence from multiple stage runs`);
  const stageRunId = runIds[0];
  return { invocationId, ...(stageRunId ? { stageRunId } : {}), outcome: result.outcome, ...(result.failureClassification ? { failureClassification: result.failureClassification } : {}),
    sourceCommit: appState.sourceCommit, sourceVersion: appState.sourceVersion, evidence: result.evidence };
}

async function approvedJavaContext(candidate: NonNullable<AgentWorkflowState["candidate"]>): Promise<string[]> {
  const context: string[] = [];
  const basePath = "experiments/expresscart/bewt-suite/src/test/java/tests/BaseTest.java";
  const base = await readFile(await resolveContainedExistingPath(root, basePath), "utf8");
  const baseContract = base.split(/\r?\n/).filter((line) => /public\s+WebDriver\s+driver|public\s+String\s+appUrl|void\s+setupNativeBrowser\s*\(/.test(line)).join("\n");
  context.push(`Approved existing BaseTest declarations (${basePath}):\n${baseContract}`);
  if (candidate.sourceReferences.some((reference) => reference.artifactPath === "experiments/expresscart/source/routes/customer.js")) {
    const pageObjectBasePath = "experiments/expresscart/bewt-suite/src/main/java/po/PageObject.java";
    const pageObjectBase = await readFile(await resolveContainedExistingPath(root, pageObjectBasePath), "utf8");
    const resetPagePath = "adapters/expresscart/java/CustomerPasswordResetPage.java";
    const resetPage = await readFile(await resolveContainedExistingPath(root, resetPagePath), "utf8");
    context.push(`Existing PageObject base (${pageObjectBasePath}):\n${pageObjectBase}`);
    const resetPageApi = resetPage.split(/\r?\n/).filter((line) => /public\s+(?:final\s+class\s+CustomerPasswordResetPage|CustomerPasswordResetPage\s*\(|void\s+openResetLink\s*\(|boolean\s+redirectedToForgotPage\s*\(|String\s+notificationMessage\s*\()/.test(line)).join("\n");
    context.push(`Approved source-grounded reset PageObject API (${resetPagePath}):\n${resetPageApi}`);
    const routePath = "experiments/expresscart/source/routes/customer.js";
    const route = await readFile(await resolveContainedExistingPath(root, routePath), "utf8");
    const start = route.indexOf("// reset password form");
    const end = route.indexOf("// reset password action", start + 1);
    if (start < 0 || end < 0) throw new Error("approved candidate source context no longer matches the pinned reset route");
    context.push(`Pinned UI route behavior (${routePath}):\n${route.slice(start, end).trim()}`);
    const viewPath = "experiments/expresscart/source/views/reset.hbs";
    context.push(`Pinned reset page selectors (${viewPath}):\n${(await readFile(await resolveContainedExistingPath(root, viewPath), "utf8")).slice(0, 1_000)}`);
  }
  return context;
}

async function main(args: string[]): Promise<void> {
  const [command, ...rest] = args;
  if (!command || !["start", "review", "status"].includes(command)) throw new Error("Usage: npm run agent:t01c -- <start|review|status> [args]");
  const appId = command === "start" ? (rest[0] ?? "expresscart") : "expresscart";
  if (appId !== "expresscart") throw new Error(`No verified runtime adapter/manifest is configured for app '${appId}'. The program target remains all 8 applications.`);
  const manifest = parseApplicationManifest(JSON.parse(await readFile(await resolveContainedExistingPath(root, manifestPath), "utf8")));
  const adapter = new ExpressCartExperimentAdapter(root, manifest);
  const historicalBehaviorIndex = await readHistoricalBehaviorIndex(root, historicalIndexPath);
  if (historicalBehaviorIndex.sourceCommit !== sourceCommit || historicalBehaviorIndex.sourceVersion !== sourceVersion) throw new Error("historical candidate index does not match the pinned ExpressCart source");
  const candidateId = newCandidateId();
  let provider: GeminiGenerationProvider | undefined;
  let javaProvider: GeminiJavaGenerationProvider | undefined;
  let runIdForEvidence = "pending-run";
  let sourceContext: string[] = [];
  const checkpointDir = await ensureContainedDirectory(root, ".local-state/t01c-checkpoints");
  const saver = openSqliteCheckpointer(resolve(checkpointDir, "t01c.sqlite"));
  try {
    const services: RuntimeServices = {
      readBaseline: () => adapter.readBaseline(),
      analyzeCoverage: async (baseline) => {
        assertBaselineMatchesManifest(manifest, baseline);
        const sourcePin = await verifyExpressCartSourceInputs(root, manifest);
        if (sourcePin.sourceCommit !== baseline.sourceCommit || sourcePin.packageVersion !== baseline.sourceVersion) throw new Error("source-code identity does not match the pinned baseline");
        const routePath = "experiments/expresscart/source/routes/customer.js";
        const route = await readFile(await resolveContainedExistingPath(root, routePath), "utf8");
        const start = route.indexOf("// reset password form");
        const end = route.indexOf("// reset password action", start + 1);
        if (start < 0 || end < 0) throw new Error("pinned source does not contain the expected reset-token route block");
        const routeContext = route.slice(start, end).trim();
        const reference = { repositoryCommit: sourceCommit, sourceVersion, runId: `t01c-source-${runIdForEvidence}`, artifactPath: routePath };
        const results = analyzeSourceBackedCoverage({ baseline, historicalProposalBehaviorIds: historicalBehaviorIndex.candidates.map((item) => item.behaviorId), sourceClaims: [{ behaviorId: "customer.password.reset.invalid-or-expired-token", behavioralCategory: "Account recovery and reset-token security", behavior: "An invalid or expired password-reset token redirects to the forgot-password page and displays the invalid-or-expired message.", evidenceSummary: "The pinned GET /customer/reset/:token route checks resetToken and resetTokenExpiry > Date.now(), sets the session error message when no live token is found, then redirects to /forgot.", sourceReferences: [reference] }] });
        const gap = results.find((item) => item.disposition === "CANDIDATE_GAP")?.gap;
        if (!gap) throw new Error(`source-backed candidate gap unavailable: ${results.map((item) => `${item.behaviorId}:${item.disposition}`).join(",")}`);
        const evidenceDirectory = `${evidenceRoot}/${runIdForEvidence}`;
        await ensureContainedDirectory(root, evidenceDirectory);
        await writeUnique(`${evidenceDirectory}/source-coverage-analysis.json`, JSON.stringify({ runId: runIdForEvidence, appId: baseline.appId, sourceCommit, sourceVersion,
          baselineObservedScenarios: baseline.observedScenarioCount, sourceIdentity: sourcePin, coverageAnalysis: results, candidateGaps: results.flatMap((result) => result.gap ? [result.gap] : []),
          sourceClaims: results.map(({ behaviorId, behavioralCategory, disposition, sourceReferences, rationale }) => ({ behaviorId, behavioralCategory, disposition, sourceReferences, rationale })),
          sourceArtifactSha256: createHash("sha256").update(route).digest("hex"), historicalBehaviorIndexPath: historicalIndexPath,
          historicalCandidates: historicalBehaviorIndex.candidates,
          historicApprovalReused: false, researchNovelty: "UNVERIFIED" }, null, 2));
        sourceContext = [
          `Pinned application source excerpt (${routePath}):\n${routeContext}`,
          `Baseline observed scenarios: ${baseline.cases.map((item) => `${item.caseId}: ${item.scenarioName}`).slice(0, 31).join("; ")}`,
          `Historical Sprint 01–05 candidate behavior topics: ${JSON.stringify(historicalBehaviorIndex.candidates.map(({ candidateId, behaviorId }) => ({ candidateId, behaviorId })))}. Do not present overlapping behavior as novel; full source records are pinned in source-coverage-analysis.json.`,
          `Coverage assessment: ${JSON.stringify(results.map(({ behaviorId, behavioralCategory, baselineComparison, candidateConfidence, uncertainties, rationale }) => ({ behaviorId, behavioralCategory, baselineComparison, candidateConfidence, uncertainties, rationale })))}.`,
          "Coverage gap status is a candidate only; technical behavior, oracle, testability, and novelty remain subject to human review.",
        ];
        return [gap];
      },
      proposeCandidate: async (baseline, gaps, revision, reviewContext) => {
        if (!provider) throw new Error("T01-C model provider was not explicitly authorized for start");
        const requestCandidateId = reviewContext?.previousCandidate?.candidateId ?? candidateId;
        const request = { baseline, gaps, candidateId: requestCandidateId, revision, sourceContext };
        const directory = `${evidenceRoot}/${runIdForEvidence}`;
        await ensureContainedDirectory(root, directory);
        const reservation = await reserveModelCall(root, evidenceRoot, runIdForEvidence, "gherkin");
        let output: GenerationOutput;
        try {
          output = await provider.generate(request);
          await recordModelCall(root, evidenceRoot, runIdForEvidence, reservation.callNumber, "PASS", provider.lastTelemetry);
        }
        catch (error) {
          await recordModelCall(root, evidenceRoot, runIdForEvidence, reservation.callNumber, provider.lastTelemetry.status, provider.lastTelemetry, error);
          await writeUnique(`${directory}/model-generation-failure.json`, JSON.stringify({ runId: runIdForEvidence, status: provider.lastTelemetry.status,
            telemetry: provider.lastTelemetry, error: sanitizeToolOutput(error instanceof Error ? error.message : "model request failed") }, null, 2));
          throw error;
        }
        const candidate = candidateFromGeneration(output, request);
        parseGherkin(candidate.gherkin);
        await writeUnique(`${directory}/model-generation.json`, JSON.stringify({ runId: runIdForEvidence, appId: candidate.appId, candidateId: candidate.candidateId,
          revision: candidate.revision, sourceCommit, sourceVersion, provider: provider.name, model: provider.model, modelTelemetry: provider.lastTelemetry,
          gherkinOrigin: "GENERATED_BY_GEMINI", candidate, historicalApprovalReused: false, noveltyDecision: "UNVERIFIED", liveJavaGenerated: false }, null, 2));
        return candidate;
      },
      trustedReviewerId,
      prepareJava: async (candidate, workflow) => {
        if (!javaProvider) throw new Error("LIVE_MODEL_AUTHORIZATION_REQUIRED_FOR_POST_ACCEPT_JAVA");
        let recovered: GeneratedJavaArtifact | undefined;
        try { recovered = await loadRegisteredGeneratedJava(root, workflow, candidate); }
        catch (error) { if (!(error instanceof Error) || !error.message.includes("incomplete immutable Java registration")) throw error; }
        if (recovered) {
          await writeUnique(`${evidenceRoot}/${workflow.runId}/java-generation-recovered-${randomUUID()}.json`, JSON.stringify({ runId: workflow.runId,
            candidateId: candidate.candidateId, revision: candidate.revision, artifactPath: recovered.path, artifactSha256: recovered.sha256,
            origin: "GENERATED", resumedWithoutDuplicateModelCall: true }, null, 2));
          return { path: recovered.path, testClass: recovered.testClass, sha256: recovered.sha256!, origin: "GENERATED" };
        }
        const responsePath = `${evidenceRoot}/${workflow.runId}/java-generation-response.json`;
        let response = await readOptionalJson(responsePath) as { output?: unknown; telemetry?: unknown } | undefined;
        let output = response ? parseGeneratedJavaOutput(response.output) : undefined;
        if (response) await completePendingModelCall(root, evidenceRoot, workflow.runId, "java", response.telemetry ?? response);
        if (!output) {
          if (await hasReservedModelCall(root, evidenceRoot, workflow.runId, "java")) throw new Error("JAVA_GENERATION_CALL_ALREADY_RESERVED_WITHOUT_RECOVERABLE_RESPONSE; replay blocked to prevent duplicate model generation");
          const context = await approvedJavaContext(candidate);
          const reservation = await reserveModelCall(root, evidenceRoot, workflow.runId, "java");
          try {
            output = await javaProvider.generateJava(candidate, workflow, context);
            await writeUnique(responsePath, JSON.stringify({ runId: workflow.runId, candidateId: candidate.candidateId, revision: candidate.revision,
              sourceCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion, provider: javaProvider.name, model: javaProvider.model,
              telemetry: javaProvider.lastTelemetry, output }, null, 2));
            await recordModelCall(root, evidenceRoot, workflow.runId, reservation.callNumber, "PASS", javaProvider.lastTelemetry);
          } catch (error) {
            await recordModelCall(root, evidenceRoot, workflow.runId, reservation.callNumber, javaProvider.lastTelemetry.status, javaProvider.lastTelemetry, error);
            throw error;
          }
        }
        const registered = await registerGeneratedJava(root, workflow, candidate, output);
        const directory = `${evidenceRoot}/${workflow.runId}`;
        await ensureContainedDirectory(root, directory);
        await writeUnique(`${directory}/java-generation.json`, JSON.stringify({ runId: workflow.runId, candidateId: candidate.candidateId,
          revision: candidate.revision, sourceCommit: candidate.sourceCommit, sourceVersion: candidate.sourceVersion,
          provider: javaProvider.name, model: javaProvider.model, modelTelemetry: javaProvider.lastTelemetry,
          artifact: registered.registration, contextSourcePaths: candidate.sourceReferences.map((reference) => reference.artifactPath),
          generatedSourcePath: registered.artifact.path, generatedSourceSha256: registered.artifact.sha256,
          immutableFirstGeneration: true, historicalArtifactReused: false }, null, 2));
        return { path: registered.artifact.path, testClass: registered.artifact.testClass, sha256: registered.artifact.sha256!, origin: "GENERATED" };
      },
      repairJava: async (candidate, firstRuntime, currentRuntime, validation, attempt, workflow) => {
        if (!javaProvider?.repairJava) throw new Error("PRODUCTION_JAVA_REPAIR_NOT_IMPLEMENTED");
        if (!Number.isInteger(attempt) || attempt < 1 || attempt > 2 || workflow.repairAttempts !== attempt) throw new Error("repair attempt does not match the bounded workflow counter");
        const isGeneratedDefect = (validation.compile.outcome === "FAIL" && validation.compile.failureClassification === "GENERATED_TEST_DEFECT") ||
          (validation.e2e.outcome === "FAIL" && validation.e2e.failureClassification === "GENERATED_TEST_DEFECT");
        if (!isGeneratedDefect) throw new Error("repair is permitted only for a GENERATED_TEST_DEFECT validation failure");
        const first: GeneratedJavaArtifact = { kind: "generated_java", path: firstRuntime.path, testClass: firstRuntime.testClass, sha256: firstRuntime.sha256,
          origin: firstRuntime.origin, candidateId: candidate.candidateId, revision: candidate.revision };
        const current: GeneratedJavaArtifact = { kind: "generated_java", path: currentRuntime.path, testClass: currentRuntime.testClass, sha256: currentRuntime.sha256,
          origin: currentRuntime.origin, candidateId: candidate.candidateId, revision: candidate.revision };
        const currentSource = await readFile(await resolveContainedExistingPath(root, current.path), "utf8");
        let recovered: GeneratedJavaArtifact | undefined;
        try { recovered = await loadRegisteredRepairedJava(root, workflow, candidate, attempt); }
        catch (error) { if (!(error instanceof Error) || !error.message.includes("incomplete immutable repair registration")) throw error; }
        if (recovered) return { path: recovered.path, testClass: recovered.testClass, sha256: recovered.sha256!, origin: "REPAIRED" };
        const responsePath = `${evidenceRoot}/${workflow.runId}/java-repair-${attempt}-response.json`;
        const response = await readOptionalJson(responsePath) as { output?: unknown; telemetry?: unknown } | undefined;
        let output = response ? parseGeneratedJavaOutput(response.output) : undefined;
        const stage = `repair-${attempt}` as "repair-1" | "repair-2";
        if (response) await completePendingModelCall(root, evidenceRoot, workflow.runId, stage, response.telemetry ?? response);
        if (!output && await hasReservedModelCall(root, evidenceRoot, workflow.runId, stage)) throw new Error(`JAVA_REPAIR_${attempt}_CALL_ALREADY_RESERVED_WITHOUT_RECOVERABLE_RESPONSE; replay blocked to prevent duplicate model repair`);
        const reservation = output ? undefined : await reserveModelCall(root, evidenceRoot, workflow.runId, stage);
        let callRecorded = false;
        try {
          if (!output) {
            output = await javaProvider.repairJava(candidate, workflow, currentSource, validation, attempt);
            await writeUnique(responsePath, JSON.stringify({ runId: workflow.runId, candidateId: candidate.candidateId, revision: candidate.revision,
              attempt, sourceCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion, provider: javaProvider.name, model: javaProvider.model,
              telemetry: javaProvider.lastTelemetry, output }, null, 2));
            await recordModelCall(root, evidenceRoot, workflow.runId, reservation!.callNumber, "PASS", javaProvider.lastTelemetry);
            callRecorded = true;
          }
          const repaired = await registerRepairedJava(root, workflow, candidate, first, current, attempt, output);
          await writeUnique(`${evidenceRoot}/${workflow.runId}/java-repair-${attempt}.json`, JSON.stringify({ runId: workflow.runId, candidateId: candidate.candidateId,
            revision: candidate.revision, attempt, sourceCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion,
            provider: javaProvider.name, model: javaProvider.model, telemetry: javaProvider.lastTelemetry,
            parentArtifactPath: current.path, parentArtifactSha256: current.sha256, firstGeneratedArtifactPath: first.path,
            firstGeneratedArtifactSha256: first.sha256, artifact: repaired.registration, assertionsPreserved: true }, null, 2));
          return { path: repaired.artifact.path, testClass: repaired.artifact.testClass, sha256: repaired.artifact.sha256!, origin: "REPAIRED" };
        } catch (error) {
          if (reservation && !callRecorded) await recordModelCall(root, evidenceRoot, workflow.runId, reservation.callNumber, javaProvider.lastTelemetry.status, javaProvider.lastTelemetry, error);
          await writeUnique(`${evidenceRoot}/${workflow.runId}/java-repair-${attempt}-failure.json`, JSON.stringify({ runId: workflow.runId, candidateId: candidate.candidateId,
            revision: candidate.revision, attempt, parentArtifactPath: current.path, parentArtifactSha256: current.sha256,
            error: sanitizeToolOutput(error instanceof Error ? error.message : "repair failed"), telemetry: javaProvider.lastTelemetry }, null, 2));
          throw error;
        }
      },
      validate: async (candidate, artifact, repairAttempts, workflow) => {
        await adapter.reconcilePriorT01cInvocations(candidate, workflow);
        const allocation = await reserveValidationInvocation(root, evidenceRoot, workflow.runId);
        const invocationId = allocation.invocationId;
        const invocationState: AgentWorkflowState = { ...workflow, validationInvocationId: invocationId };
        const invocationDirectory = allocation.evidenceDirectory;
        const generatedArtifact: GeneratedJavaArtifact = { kind: "generated_java", path: artifact.path, testClass: artifact.testClass,
          sha256: artifact.sha256, origin: artifact.origin, candidateId: candidate.candidateId, revision: candidate.revision };
        const stageFailure = (tool: ToolResult["tool"], error: unknown): ToolResult => parseToolResult({ tool, outcome: tool === "cleanup-experiment" ? "BLOCKED" : "FAIL",
          stdout: "", stderr: sanitizeToolOutput(error instanceof Error ? error.message : "stage failed"), evidence: [] });
        let compile: ToolResult = { tool: "compile-maven-project", outcome: "NOT_RUN", stdout: "", stderr: "", evidence: [] };
        let fixture: ToolResult = { tool: "prepare-fixture", outcome: "NOT_RUN", stdout: "", stderr: "", evidence: [] };
        let e2e: ToolResult = { tool: "run-selenium-test", outcome: "NOT_RUN", stdout: "", stderr: "", evidence: [] };
        let cleanup: ToolResult = { tool: "cleanup-experiment", outcome: "NOT_RUN", stdout: "", stderr: "", evidence: [] };
        try { compile = await adapter.compileGenerated(candidate, generatedArtifact, invocationState); }
        catch (error) { compile = stageFailure("compile-maven-project", error); }
        if (compile.outcome === "PASS") {
          try { fixture = await adapter.prepareFixture(candidate, manifest.fixtureReset.experimentKey, invocationState, generatedArtifact); }
          catch (error) { fixture = stageFailure("prepare-fixture", error); }
          if (fixture.outcome === "PASS") {
            try { e2e = await adapter.runGeneratedSelenium(candidate, generatedArtifact, invocationState); }
            catch (error) { e2e = stageFailure("run-selenium-test", error); }
          }
        }
        try { cleanup = await adapter.cleanup(candidate, manifest.fixtureReset.experimentKey, invocationState, generatedArtifact); }
        catch (error) { cleanup = stageFailure("cleanup-experiment", error); }
        const decision = (suffix: string) => ({ decisionId: `${workflow.runId}-${suffix}-${randomUUID()}`, appId: candidate.appId,
          candidateId: candidate.candidateId, candidateRevision: candidate.revision, decision: "UNVERIFIED" as const,
          reviewerId: "not-reviewed", decidedAt: new Date().toISOString(),
          rationale: "No research oracle or novelty acceptance decision was made by the T01-C execution agent.", evidence: [] });
        const resultPath = `${invocationDirectory}/validation-result.json`;
        const parsed = parseValidationResult({ appId: candidate.appId, candidateId: candidate.candidateId, candidateRevision: candidate.revision,
          invocationId, artifact: { path: generatedArtifact.path, sha256: generatedArtifact.sha256, origin: generatedArtifact.origin }, sourceCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion,
          compile: executionReference(compile, invocationId, workflow), fixture: executionReference(fixture, invocationId, workflow),
          e2e: executionReference(e2e, invocationId, workflow), cleanup: executionReference(cleanup, invocationId, workflow),
          oracleDecision: decision("oracle"), noveltyDecision: decision("novelty"), repeats: [], repairAttempts,
          evidence: [{ repositoryCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion, runId: invocationId, artifactPath: resultPath }],
          researchAcceptance: { status: "NOT_REVIEWED" } });
        await writeUnique(resultPath, JSON.stringify(parsed, null, 2));
        return parsed;
      },
      recordEvidence: async (state) => {
        const directory = `${evidenceRoot}/${state.workflow.runId}`;
        await ensureContainedDirectory(root, directory);
        const path = `${directory}/workflow-final-${randomUUID()}.json`;
        await writeUnique(path, JSON.stringify({ runId: state.workflow.runId, status: state.workflow.status, candidate: state.workflow.candidate,
          reviewDecisions: state.workflow.reviewDecisions, artifacts: state.workflow.artifacts, terminalError: state.terminalError,
          validation: state.validation, validationHistory: state.validationHistory,
          liveModelTelemetry: { gherkin: provider?.lastTelemetry ?? { status: "NOT_RUN", calls: 0 }, java: javaProvider?.lastTelemetry ?? { status: "NOT_RUN", calls: 0 } } }, null, 2));
        return path;
      },
    };
    const app = buildWorkflow(services, saver);
    if (command === "start") {
      if (!rest.includes("--live-authorized")) throw new Error("A live model action requires the explicit --live-authorized flag; no request was sent.");
      const maxCallsArg = rest.find((argument) => argument.startsWith("--max-api-requests="));
      const maxCostArg = rest.find((argument) => argument.startsWith("--max-cost-usd="));
      const modelArg = rest.find((argument) => argument.startsWith("--model="));
      const requestedModel = modelArg ? modelArg.slice("--model=".length) : "gemini-3.8-flash";
      const selectedModel = (requestedModel === "gemini-3.8-flash" || requestedModel === "gemini-3.1-flash-lite") ? requestedModel : "gemini-3.8-flash";
      const maxApiRequests = maxCallsArg ? Number(maxCallsArg.slice("--max-api-requests=".length)) : 1;
      const defaultCeiling = selectedModel === "gemini-3.8-flash" ? 0.04 : 0.02;
      const runCostCeilingUsd = maxCostArg ? Number(maxCostArg.slice("--max-cost-usd=".length)) : defaultCeiling;
      const perCallCostCeilingUsd = runCostCeilingUsd / maxApiRequests;
      const maxAllowedPerCall = selectedModel === "gemini-3.8-flash" ? 0.05 : 0.02;
      if (!Number.isInteger(maxApiRequests) || maxApiRequests < 1 || maxApiRequests > 4 || !Number.isFinite(runCostCeilingUsd) || runCostCeilingUsd <= 0 ||
          perCallCostCeilingUsd > maxAllowedPerCall || perCallCostCeilingUsd < 0.001) throw new Error(`T01-C run budget must allow 1..4 calls with a verified per-call ceiling no greater than USD ${maxAllowedPerCall}`);
      const runId = `t01c-${randomUUID()}`;
      runIdForEvidence = runId;
      await ensureContainedDirectory(root, `${evidenceRoot}/${runId}`);
      await writeUnique(`${evidenceRoot}/${runId}/model-run-budget.json`, JSON.stringify({ runId, model: selectedModel, apiRequestsAllowed: maxApiRequests,
        runCostCeilingUsd, perCallCostCeilingUsd, retriesAllowed: 0, timeoutMs: 60_000, maxPromptCharacters: 8_000,
        gherkinMaxOutputTokens: 2_000, javaMaxOutputTokens: 4_000,
        pricingBasis: selectedModel === "gemini-3.8-flash" ? "Gemini 3.8 Flash Standard text rates; conservative 4 tokens per prompt character" : "Gemini 3.1 Flash-Lite Standard text rates; conservative 4 tokens per prompt character",
        authorizationFlagPresent: true, exhaustedCallsRemainConsumed: true }, null, 2));
      provider = new GeminiGenerationProvider(selectedModel, { authorized: true, timeoutMs: 60_000, costCeilingUsd: perCallCostCeilingUsd, ...(effectiveApiKey ? { apiKey: effectiveApiKey } : {}) });
      const initial: AgentWorkflowState = { appId: manifest.appId, sourceCommit, sourceVersion, runId, currentRole: "coverage_analysis", status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
      const result = await app.invoke({ workflow: initial }, { configurable: { thread_id: runId } }) as RuntimeState;
      if (result.workflow.status !== "AWAITING_HUMAN_REVIEW" || !result.workflow.candidate || !result.workflow.checkpoint) throw new Error(`LangGraph did not pause at human review: ${result.workflow.status}; ${result.terminalError?.message ?? "no detail"}`);
      const reviewData = await readCoverageReviewData(runId);
      const packet = { runId, threadId: runId, checkpointId: result.workflow.checkpoint.checkpointId, appId: result.workflow.appId,
        coverageGaps: reviewData.gaps, coverageAnalysis: reviewData.analysis, candidate: result.workflow.candidate,
        sourceCommit, sourceVersion, model: provider.model, modelTelemetry: provider.lastTelemetry, decisionOptions: ["ACCEPT", "REVISE", "REJECT"],
        modelBudgetPath: `${evidenceRoot}/${runId}/model-run-budget.json`,
        note: "ACCEPT is implementation authorization only. A separate --live-authorized flag and remaining run budget are required before Java generation. Research novelty/oracle review remains separate." };
      await writeUnique(`${evidenceRoot}/${runId}/human-review-request.json`, JSON.stringify(packet, null, 2));
      process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
      return;
    }
    const threadId = rest[0];
    if (!threadId) throw new Error(`Usage: npm run agent:t01c -- ${command} <thread-id> [decision rationale]`);
    const config = { configurable: { thread_id: threadId } };
    const snapshot = await app.getState(config);
    const state = snapshot.values as RuntimeState;
    if (!state?.workflow) throw new Error("T01-C LangGraph state was not found");
    if (command === "status") { process.stdout.write(`${JSON.stringify({ threadId, workflow: state.workflow, terminalError: state.terminalError }, null, 2)}\n`); return; }
    const [decision, ...rawReasonParts] = rest.slice(1);
    const liveAuthorized = rawReasonParts.includes("--live-authorized");
    const rationale = rawReasonParts.filter((part) => part !== "--live-authorized").join(" ").trim();
    if (!decision || !["ACCEPT", "REVISE", "REJECT"].includes(decision) || rationale.length < 5) throw new Error('Usage: npm run agent:t01c -- review <thread-id> <ACCEPT|REVISE|REJECT> "<rationale>" [--live-authorized]');
    if ((decision === "ACCEPT" || decision === "REVISE") && !liveAuthorized) throw new Error(`${decision} requires an explicit --live-authorized flag for post-review model use; no decision was submitted.`);
    if (decision === "ACCEPT" || decision === "REVISE") {
      runIdForEvidence = state.workflow.runId;
      const budget = await readModelRunBudget(root, evidenceRoot, runIdForEvidence);
      const budgetModel = (budget.model === "gemini-3.8-flash" || budget.model === "gemini-3.1-flash-lite") ? budget.model : "gemini-3.8-flash";
      if (decision === "ACCEPT") javaProvider = new GeminiJavaGenerationProvider(budgetModel, { authorized: true, timeoutMs: 60_000, costCeilingUsd: budget.perCallCostCeilingUsd, ...(effectiveApiKey ? { apiKey: effectiveApiKey } : {}) });
      else {
        provider = new GeminiGenerationProvider(budgetModel, { authorized: true, timeoutMs: 60_000, costCeilingUsd: budget.perCallCostCeilingUsd, ...(effectiveApiKey ? { apiKey: effectiveApiKey } : {}) });
        if (state.workflow.candidate) sourceContext = await approvedJavaContext(state.workflow.candidate);
      }
    }
    const review = resumeReview(state, threadId, state.workflow.checkpoint?.checkpointId ?? "", decision as "ACCEPT" | "REVISE" | "REJECT", sanitizeToolOutput(rationale));
    const result = await app.invoke(review, config) as RuntimeState;
    if (decision === "REVISE" && result.workflow.status === "AWAITING_HUMAN_REVIEW" && result.workflow.candidate && result.workflow.checkpoint) {
      const reviewData = await readCoverageReviewData(result.workflow.runId);
      const packet = { runId: result.workflow.runId, threadId, checkpointId: result.workflow.checkpoint.checkpointId, appId: result.workflow.appId,
        coverageGaps: reviewData.gaps, coverageAnalysis: reviewData.analysis, candidate: result.workflow.candidate,
        sourceCommit: result.workflow.sourceCommit, sourceVersion: result.workflow.sourceVersion, model: provider?.model ?? "gemini-3.1-flash-lite",
        modelTelemetry: provider?.lastTelemetry ?? { status: "NOT_RUN" }, decisionOptions: ["ACCEPT", "REVISE", "REJECT"],
        priorReviewDecisions: result.workflow.reviewDecisions, modelBudgetPath: `${evidenceRoot}/${result.workflow.runId}/model-run-budget.json` };
      const packetPath = `${evidenceRoot}/${result.workflow.runId}/human-review-request-revision-${result.workflow.candidate.revision}.json`;
      await writeUnique(packetPath, JSON.stringify(packet, null, 2));
      process.stdout.write(`${JSON.stringify({ ...packet, packetPath }, null, 2)}\n`);
      return;
    }
    process.stdout.write(`${JSON.stringify({ runId: result.workflow.runId, status: result.workflow.status, reviewDecisions: result.workflow.reviewDecisions, terminalError: result.terminalError }, null, 2)}\n`);
  } finally { saver.db.close(); }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`T01-C agent failed closed: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exitCode = 1;
});
