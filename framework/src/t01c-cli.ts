import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ExpressCartExperimentAdapter, trustedReviewerId } from "../../adapters/expresscart/experiment.js";
import { parseApplicationManifest, parseCandidateScenario, sanitizeToolOutput, type AgentWorkflowState, type CoverageGap } from "./contracts.js";
import { assertBaselineMatchesManifest } from "./policy.js";
import { analyzeSourceBackedCoverage } from "./runtime/coverage-analysis.js";
import { candidateFromGeneration, GeminiGenerationProvider, newCandidateId, type GenerationOutput } from "./runtime/model-provider.js";
import { parseGherkin } from "./runtime/gherkin.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices, type RuntimeState } from "./runtime/workflow.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "./runtime/safe-path.js";
import { verifyExpressCartSourceInputs } from "../../adapters/expresscart/source-identity.js";

const root = resolve(process.cwd(), "..");
const sourceCommit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const sourceVersion = "1.1.19";
const manifestPath = "config/apps/expresscart.json";
const evidenceRoot = "docs/tasks/T01-C/evidence";

async function writeUnique(relativePath: string, content: string): Promise<void> {
  await writeFile(await resolveContainedOutputPath(root, relativePath), content, { flag: "wx" });
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
        ], sourceClaims: [{ behaviorId: "customer.password.reset.invalid-or-expired-token", behavior: "An invalid or expired password-reset token redirects to the forgot-password page and displays the invalid-or-expired message.", evidenceSummary: "The pinned GET /customer/reset/:token route checks resetToken and resetTokenExpiry > Date.now(), sets the session error message when no live token is found, then redirects to /forgot.", sourceReferences: [reference] }] });
        const gap = results.find((item) => item.disposition === "CANDIDATE_GAP")?.gap;
        if (!gap) throw new Error(`source-backed candidate gap unavailable: ${results.map((item) => `${item.behaviorId}:${item.disposition}`).join(",")}`);
        const evidenceDirectory = `${evidenceRoot}/${runIdForEvidence}`;
        await ensureContainedDirectory(root, evidenceDirectory);
        await writeUnique(`${evidenceDirectory}/source-coverage-analysis.json`, JSON.stringify({ runId: runIdForEvidence, appId: baseline.appId, sourceCommit, sourceVersion,
          baselineObservedScenarios: baseline.observedScenarioCount, sourceIdentity: sourcePin, sourceClaims: results.map(({ behaviorId, disposition, sourceReferences, rationale }) => ({ behaviorId, disposition, sourceReferences, rationale })),
          sourceArtifactSha256: createHash("sha256").update(route).digest("hex"), historicProposalSet: "docs/research-results/sprint-02/CANDIDATE-REVIEW.md; EC-C01..EC-C05 topics",
          historicApprovalReused: false, researchNovelty: "UNVERIFIED" }, null, 2));
        sourceContext = [
          `Pinned application source excerpt (${routePath}):\n${routeContext}`,
          `Baseline observed scenarios: ${baseline.cases.map((item) => `${item.caseId}: ${item.scenarioName}`).slice(0, 31).join("; ")}`,
          "Historic proposal topics already recorded: discount removal, empty cart, product publication state, forgotten-password request, static-page create/view. Do not present those as novel.",
          "The source claim is a token-validation flow. Coverage gap status is a candidate only; technical behavior, oracle, testability, and novelty remain subject to human review.",
        ];
        return [gap];
      },
      proposeCandidate: async (baseline, gaps, revision, reviewContext) => {
        if (reviewContext?.previousCandidate) throw new Error("the one-request T01-C model budget does not permit automatic revision generation");
        if (!provider) throw new Error("T01-C model provider was not explicitly authorized for start");
        const request = { baseline, gaps, candidateId, revision, sourceContext };
        const directory = `${evidenceRoot}/${runIdForEvidence}`;
        await ensureContainedDirectory(root, directory);
        const budgetPath = `${evidenceRoot}/one-live-model-request.json`;
        await writeUnique(budgetPath, JSON.stringify({ runId: runIdForEvidence, model: provider.model, apiRequestsAllowed: 1, retries: 0, timeoutMs: 60_000,
          maxPromptCharacters: 8_000, maxOutputTokens: 2_000, estimatedCostCeilingUsd: 0.02, pricingBasis: "Gemini 3.1 Flash-Lite Standard text rates; conservative 4 tokens per prompt character" }, null, 2));
        let output: GenerationOutput;
        try { output = await provider.generate(request); }
        catch (error) {
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
      prepareJava: async () => { throw new Error("POST_ACCEPT_JAVA_GENERATION_NOT_IMPLEMENTED: historical Java reuse is disabled for T01-C candidates"); },
      validate: async () => { throw new Error("T01-C generated-Java validation has not started"); },
      recordEvidence: async (state) => {
        const directory = `${evidenceRoot}/${state.workflow.runId}`;
        await ensureContainedDirectory(root, directory);
        const path = `${directory}/workflow-final.json`;
        await writeUnique(path, JSON.stringify({ runId: state.workflow.runId, status: state.workflow.status, candidate: state.workflow.candidate,
          reviewDecisions: state.workflow.reviewDecisions, artifacts: state.workflow.artifacts, terminalError: state.terminalError,
          liveModelTelemetry: provider?.lastTelemetry ?? { status: "NOT_RUN", calls: 0 } }, null, 2));
        return path;
      },
    };
    const app = buildWorkflow(services, saver);
    if (command === "start") {
      if (rest[1] !== "--live-authorized") throw new Error("A one-run live model action requires the explicit --live-authorized flag; no request was sent.");
      provider = new GeminiGenerationProvider("gemini-3.1-flash-lite", { authorized: true, timeoutMs: 60_000 });
      const runId = `t01c-${randomUUID()}`;
      runIdForEvidence = runId;
      const initial: AgentWorkflowState = { appId: manifest.appId, sourceCommit, sourceVersion, runId, currentRole: "coverage_analysis", status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
      const result = await app.invoke({ workflow: initial }, { configurable: { thread_id: runId } }) as RuntimeState;
      if (result.workflow.status !== "AWAITING_HUMAN_REVIEW" || !result.workflow.candidate || !result.workflow.checkpoint) throw new Error(`LangGraph did not pause at human review: ${result.workflow.status}; ${result.terminalError?.message ?? "no detail"}`);
      const packet = { runId, threadId: runId, checkpointId: result.workflow.checkpoint.checkpointId, appId: result.workflow.appId, candidate: result.workflow.candidate,
        sourceCommit, sourceVersion, model: provider.model, modelTelemetry: provider.lastTelemetry, decisionOptions: ["ACCEPT", "REVISE", "REJECT"],
        note: "ACCEPT is implementation authorization only. Research novelty/oracle review remains separate. Java generation is disabled until the post-ACCEPT generator is implemented." };
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
    const [decision, ...reasonParts] = rest.slice(1);
    const rationale = reasonParts.join(" ").trim();
    if (!decision || !["ACCEPT", "REVISE", "REJECT"].includes(decision) || rationale.length < 5) throw new Error('Usage: npm run agent:t01c -- review <thread-id> <ACCEPT|REVISE|REJECT> "<rationale>"');
    if (decision === "ACCEPT") throw new Error("POST_ACCEPT_JAVA_GENERATION_NOT_IMPLEMENTED; ACCEPT cannot continue until T01-C Java generation is available.");
    const review = resumeReview(state, threadId, state.workflow.checkpoint?.checkpointId ?? "", decision as "REVISE" | "REJECT", sanitizeToolOutput(rationale));
    const result = await app.invoke(review, config) as RuntimeState;
    process.stdout.write(`${JSON.stringify({ runId: result.workflow.runId, status: result.workflow.status, reviewDecisions: result.workflow.reviewDecisions, terminalError: result.terminalError }, null, 2)}\n`);
  } finally { saver.db.close(); }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`T01-C agent failed closed: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exitCode = 1;
});
