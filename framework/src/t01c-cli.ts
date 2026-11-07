import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ExpressCartExperimentAdapter, trustedReviewerId } from "../../adapters/expresscart/experiment.js";
import { parseApplicationManifest, parseCandidateScenario, parseCoverageGap, parseValidationResult, sanitizeToolOutput, type AgentWorkflowState, type CoverageGap, type GeneratedJavaArtifact, type ToolResult } from "./contracts.js";
import { assertBaselineMatchesManifest } from "./policy.js";
import { analyzeSourceBackedCoverage } from "./runtime/coverage-analysis.js";
import { candidateFromGeneration, GeminiGenerationProvider, GeminiJavaGenerationProvider, newCandidateId, type GenerationOutput } from "./runtime/model-provider.js";
import { parseGherkin } from "./runtime/gherkin.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices, type RuntimeState } from "./runtime/workflow.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "./runtime/safe-path.js";
import { verifyExpressCartSourceInputs } from "../../adapters/expresscart/source-identity.js";
import { registerGeneratedJava } from "./runtime/java-artifact-registry.js";
import { readModelRunBudget, recordModelCall, reserveModelCall } from "./runtime/model-call-ledger.js";

const root = resolve(process.cwd(), "..");
const sourceCommit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const sourceVersion = "1.1.19";
const manifestPath = "config/apps/expresscart.json";
const evidenceRoot = "docs/tasks/T01-C/evidence";

async function writeUnique(relativePath: string, content: string): Promise<void> {
  await writeFile(await resolveContainedOutputPath(root, relativePath), content, { flag: "wx" });
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
  return { invocationId, ...(stageRunId ? { stageRunId } : {}), outcome: result.outcome,
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
        const results = analyzeSourceBackedCoverage({ baseline, historicalProposalBehaviorIds: [
          "cart.discount.remove", "cart.empty", "product.publication.admin-state", "customer.password.forgotten-request", "admin.static-page.create-view",
        ], sourceClaims: [{ behaviorId: "customer.password.reset.invalid-or-expired-token", behavioralCategory: "Account recovery and reset-token security", behavior: "An invalid or expired password-reset token redirects to the forgot-password page and displays the invalid-or-expired message.", evidenceSummary: "The pinned GET /customer/reset/:token route checks resetToken and resetTokenExpiry > Date.now(), sets the session error message when no live token is found, then redirects to /forgot.", sourceReferences: [reference] }] });
        const gap = results.find((item) => item.disposition === "CANDIDATE_GAP")?.gap;
        if (!gap) throw new Error(`source-backed candidate gap unavailable: ${results.map((item) => `${item.behaviorId}:${item.disposition}`).join(",")}`);
        const evidenceDirectory = `${evidenceRoot}/${runIdForEvidence}`;
        await ensureContainedDirectory(root, evidenceDirectory);
        await writeUnique(`${evidenceDirectory}/source-coverage-analysis.json`, JSON.stringify({ runId: runIdForEvidence, appId: baseline.appId, sourceCommit, sourceVersion,
          baselineObservedScenarios: baseline.observedScenarioCount, sourceIdentity: sourcePin, coverageAnalysis: results, candidateGaps: results.flatMap((result) => result.gap ? [result.gap] : []),
          sourceClaims: results.map(({ behaviorId, behavioralCategory, disposition, sourceReferences, rationale }) => ({ behaviorId, behavioralCategory, disposition, sourceReferences, rationale })),
          sourceArtifactSha256: createHash("sha256").update(route).digest("hex"), historicProposalSet: "docs/research-results/sprint-02/CANDIDATE-REVIEW.md; EC-C01..EC-C05 topics",
          historicApprovalReused: false, researchNovelty: "UNVERIFIED" }, null, 2));
        sourceContext = [
          `Pinned application source excerpt (${routePath}):\n${routeContext}`,
          `Baseline observed scenarios: ${baseline.cases.map((item) => `${item.caseId}: ${item.scenarioName}`).slice(0, 31).join("; ")}`,
          "Historic proposal topics already recorded: discount removal, empty cart, product publication state, forgotten-password request, static-page create/view. Do not present those as novel.",
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
        const context = await approvedJavaContext(candidate);
        const reservation = await reserveModelCall(root, evidenceRoot, workflow.runId, "java");
        let output;
        try {
          output = await javaProvider.generateJava(candidate, workflow, context);
          await recordModelCall(root, evidenceRoot, workflow.runId, reservation.callNumber, "PASS", javaProvider.lastTelemetry);
        } catch (error) {
          await recordModelCall(root, evidenceRoot, workflow.runId, reservation.callNumber, javaProvider.lastTelemetry.status, javaProvider.lastTelemetry, error);
          throw error;
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
      validate: async (candidate, artifact, repairAttempts, workflow) => {
        const invocationId = workflow.validationInvocationId ?? workflow.runId;
        const generatedArtifact: GeneratedJavaArtifact = { kind: "generated_java", path: artifact.path, testClass: artifact.testClass,
          sha256: artifact.sha256, origin: artifact.origin, candidateId: candidate.candidateId, revision: candidate.revision };
        const compile = await adapter.compileGenerated(candidate, generatedArtifact, workflow);
        let fixture: ToolResult = { tool: "prepare-fixture", outcome: "NOT_RUN", stdout: "", stderr: "", evidence: [] };
        let e2e: ToolResult = { tool: "run-selenium-test", outcome: "NOT_RUN", stdout: "", stderr: "", evidence: [] };
        let cleanup: ToolResult = { tool: "cleanup-experiment", outcome: "NOT_RUN", stdout: "", stderr: "", evidence: [] };
        if (compile.outcome === "PASS") {
          fixture = await adapter.prepareFixture(candidate, manifest.fixtureReset.experimentKey, workflow);
          if (fixture.outcome === "PASS") e2e = await adapter.runGeneratedSelenium(candidate, generatedArtifact, workflow);
          cleanup = await adapter.cleanup(candidate, manifest.fixtureReset.experimentKey, workflow);
        }
        const decision = (suffix: string) => ({ decisionId: `${workflow.runId}-${suffix}-${randomUUID()}`, appId: candidate.appId,
          candidateId: candidate.candidateId, candidateRevision: candidate.revision, decision: "UNVERIFIED" as const,
          reviewerId: "not-reviewed", decidedAt: new Date().toISOString(),
          rationale: "No research oracle or novelty acceptance decision was made by the T01-C execution agent.", evidence: [] });
        const resultPath = `${evidenceRoot}/${workflow.runId}/validation-result.json`;
        const parsed = parseValidationResult({ appId: candidate.appId, candidateId: candidate.candidateId, candidateRevision: candidate.revision,
          invocationId, sourceCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion,
          compile: executionReference(compile, invocationId, workflow), fixture: executionReference(fixture, invocationId, workflow),
          e2e: executionReference(e2e, invocationId, workflow), cleanup: executionReference(cleanup, invocationId, workflow),
          oracleDecision: decision("oracle"), noveltyDecision: decision("novelty"), repeats: [], repairAttempts,
          evidence: [{ repositoryCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion, runId: invocationId, artifactPath: resultPath }],
          researchAcceptance: { status: "NOT_REVIEWED" } });
        await ensureContainedDirectory(root, `${evidenceRoot}/${workflow.runId}`);
        await writeUnique(resultPath, JSON.stringify(parsed, null, 2));
        return parsed;
      },
      recordEvidence: async (state) => {
        const directory = `${evidenceRoot}/${state.workflow.runId}`;
        await ensureContainedDirectory(root, directory);
        const path = `${directory}/workflow-final.json`;
        await writeUnique(path, JSON.stringify({ runId: state.workflow.runId, status: state.workflow.status, candidate: state.workflow.candidate,
          reviewDecisions: state.workflow.reviewDecisions, artifacts: state.workflow.artifacts, terminalError: state.terminalError,
          liveModelTelemetry: { gherkin: provider?.lastTelemetry ?? { status: "NOT_RUN", calls: 0 }, java: javaProvider?.lastTelemetry ?? { status: "NOT_RUN", calls: 0 } } }, null, 2));
        return path;
      },
    };
    const app = buildWorkflow(services, saver);
    if (command === "start") {
      if (!rest.includes("--live-authorized")) throw new Error("A live model action requires the explicit --live-authorized flag; no request was sent.");
      const maxCallsArg = rest.find((argument) => argument.startsWith("--max-api-requests="));
      const maxCostArg = rest.find((argument) => argument.startsWith("--max-cost-usd="));
      const maxApiRequests = maxCallsArg ? Number(maxCallsArg.slice("--max-api-requests=".length)) : 1;
      const runCostCeilingUsd = maxCostArg ? Number(maxCostArg.slice("--max-cost-usd=".length)) : 0.02;
      const perCallCostCeilingUsd = runCostCeilingUsd / maxApiRequests;
      if (!Number.isInteger(maxApiRequests) || maxApiRequests < 1 || maxApiRequests > 4 || !Number.isFinite(runCostCeilingUsd) || runCostCeilingUsd <= 0 ||
          perCallCostCeilingUsd > 0.02 || perCallCostCeilingUsd < 0.001) throw new Error("T01-C run budget must allow 1..4 calls with a verified per-call ceiling no greater than USD 0.02");
      const runId = `t01c-${randomUUID()}`;
      runIdForEvidence = runId;
      await ensureContainedDirectory(root, `${evidenceRoot}/${runId}`);
      await writeUnique(`${evidenceRoot}/${runId}/model-run-budget.json`, JSON.stringify({ runId, model: "gemini-3.1-flash-lite", apiRequestsAllowed: maxApiRequests,
        runCostCeilingUsd, perCallCostCeilingUsd, retriesAllowed: 0, timeoutMs: 60_000, maxPromptCharacters: 8_000,
        gherkinMaxOutputTokens: 2_000, javaMaxOutputTokens: 4_000,
        pricingBasis: "Gemini 3.1 Flash-Lite Standard text rates; conservative 4 tokens per prompt character",
        authorizationFlagPresent: true, exhaustedCallsRemainConsumed: true }, null, 2));
      provider = new GeminiGenerationProvider("gemini-3.1-flash-lite", { authorized: true, timeoutMs: 60_000, costCeilingUsd: perCallCostCeilingUsd });
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
      if (decision === "ACCEPT") javaProvider = new GeminiJavaGenerationProvider("gemini-3.1-flash-lite", { authorized: true, timeoutMs: 60_000, costCeilingUsd: budget.perCallCostCeilingUsd });
      else {
        provider = new GeminiGenerationProvider("gemini-3.1-flash-lite", { authorized: true, timeoutMs: 60_000, costCeilingUsd: budget.perCallCostCeilingUsd });
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
