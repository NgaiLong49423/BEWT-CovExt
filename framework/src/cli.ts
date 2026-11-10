import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ExpressCartExperimentAdapter, trustedReviewerId } from "../../adapters/expresscart/experiment.js";
import { parseApplicationManifest, parseCandidateScenario, sanitizeToolOutput, type CandidateScenario, type CoverageGap } from "./contracts.js";
import { assertBaselineMatchesManifest } from "./policy.js";
import { parseGherkin } from "./runtime/gherkin.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices, type RuntimeState } from "./runtime/workflow.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "./runtime/safe-path.js";
import { loadCanonicalConfig, loadGeminiApiKey } from "./runtime/config-loader.js";

const canonicalConfig = loadCanonicalConfig();
const repositoryRoot = dirname(canonicalConfig.envFilePath);
const canonicalGeminiKey = loadGeminiApiKey(repositoryRoot);
if (canonicalGeminiKey && !process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = canonicalGeminiKey;
}
const manifestRelativePath = "config/apps/expresscart.json";
const checkpointRelativePath = ".local-state/t01b-checkpoints/expresscart.sqlite";
const runStateDirectory = ".local-state/t01b-checkpoints/runs";
const candidateFeaturePath = "docs/research-results/sprint-02/revised/EC-C04-forgotten-password.feature";
const SOURCE_COMMIT = "b31302f4e99c3293bd742c6d076a721e168118b0";
const SOURCE_VERSION = "1.1.19";

async function writeUnique(relativePath: string, content: string): Promise<void> {
  const path = await resolveContainedOutputPath(repositoryRoot, relativePath);
  await writeFile(path, content, { flag: "wx" });
}

async function main(args: string[]): Promise<void> {
  const [command, ...rest] = args;
  const manifestPath = await resolveContainedExistingPath(repositoryRoot, manifestRelativePath);
  const manifest = parseApplicationManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  const adapter = new ExpressCartExperimentAdapter(repositoryRoot, manifest);
  const localStateDir = await ensureContainedDirectory(repositoryRoot, ".local-state/t01b-checkpoints");
  const checkpointer = openSqliteCheckpointer(resolve(localStateDir, "expresscart.sqlite"));
  try {
    const services: RuntimeServices = {
      readBaseline: () => adapter.readBaseline(),
      analyzeCoverage: async (baseline) => {
        assertBaselineMatchesManifest(manifest, baseline);
        const reference = baseline.cases[0]?.sourceReferences[0];
        if (!reference) throw new Error("pinned baseline has no source evidence to support a coverage gap");
        return [{ gapId: "expresscart-gap-forgotten-password", appId: "expresscart", sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION,
          behavior: "Public forgotten-password response for an unregistered email",
          rationale: "The sanitized Sprint 01 feature inventory records 31 scenarios and none names the generic forgotten-password response; the pinned source route is addressed by the EC-C04 candidate. This is a candidate gap, not an independently accepted novelty finding.",
          sourceReferences: [reference] } satisfies CoverageGap];
      },
      proposeCandidate: async (baseline, gaps, revision, reviewContext) => {
        assertBaselineMatchesManifest(manifest, baseline);
        const source = await readFile(await resolveContainedExistingPath(repositoryRoot, candidateFeaturePath), "utf8");
        parseGherkin(source);
        const note = reviewContext?.reviewerRationale?.trim().replace(/[\r\n]+/g, " ");
        const gherkin = revision === 1 || !reviewContext?.previousCandidate
          ? source
          : `${reviewContext.previousCandidate.gherkin.trimEnd()}\n\n# Human review revision ${revision}: ${note?.slice(0, 400) || "clarification requested"}\n`;
        return parseCandidateScenario({ candidateId: "EC-C04", appId: "expresscart", sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, revision,
          gherkin,
          preconditions: ["A fresh unregistered email must be confirmed absent from the isolated Mongo customers collection before the browser flow."],
          oracle: ["The forgotten-password form displays the exact generic response for an unregistered email."],
          noveltyRationale: "Reuses the historically reviewed EC-C04 candidate as the T01-B implementation target. Current novelty approval remains UNVERIFIED and is not inferred from the historical implementation decision.",
          sourceReferences: [...new Map([...gaps.flatMap((gap) => gap.sourceReferences), { repositoryCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, runId: "ec-c04-reviewed-gherkin", artifactPath: candidateFeaturePath }].map((reference) => [`${reference.runId}:${reference.artifactPath}`, reference])).values()],
          reviewStatus: "PROPOSED" });
      },
      trustedReviewerId,
      prepareJava: async (candidate, workflow) => adapter.prepareJava(candidate, workflow),
      validate: (candidate, artifact, attempts, workflow) => adapter.validate(candidate, artifact as never, attempts, workflow),
      recordEvidence: async (state) => {
        const directory = `docs/tasks/T01-B/evidence/${state.workflow.runId}`;
        await ensureContainedDirectory(repositoryRoot, directory);
        const resultPath = `${directory}/validation-result.json`;
        const data = { runId: state.workflow.runId, sourceCommit: state.workflow.sourceCommit, sourceVersion: state.workflow.sourceVersion,
          snapshotKind: "terminal-finalization", workflowStatus: state.workflow.status, candidateId: state.workflow.candidate?.candidateId, candidateRevision: state.workflow.candidate?.revision,
          reviewDecisions: state.workflow.reviewDecisions, artifacts: state.workflow.artifacts,
          validation: state.validation, validationHistory: state.validationHistory,
          model: { provider: "Gemini", status: process.env.GEMINI_API_KEY ? "NOT_RUN" : "MODEL_RUN_BLOCKED", calls: 0, reason: "No real Gemini invocation was authorized for this T01-B run; candidate Gherkin and the Java suite are reused historical artifacts." },
          roleResults: state.roleResults, terminalError: state.terminalError,
        };
        await writeUnique(resultPath, JSON.stringify(data, null, 2));
        return resultPath;
      },
    };
    const app = buildWorkflow(services, checkpointer);
    if (command === "start") {
      const runId = `t01b-${randomUUID()}`;
      const threadId = runId;
      const config = { configurable: { thread_id: threadId } };
      const state = { workflow: { appId: "expresscart" as const, sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, runId, currentRole: "coverage_analysis" as const, status: "STARTED" as const, reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 } };
      await ensureContainedDirectory(repositoryRoot, runStateDirectory);
      await writeUnique(`${runStateDirectory}/${runId}.json`, JSON.stringify({ runId, threadId, startedAt: new Date().toISOString() }, null, 2));
      const result = await app.invoke(state, config) as RuntimeState;
      const candidate = result.workflow.candidate;
      const checkpoint = result.workflow.checkpoint;
      if (result.workflow.status !== "AWAITING_HUMAN_REVIEW" || !candidate || !checkpoint) throw new Error(`workflow did not pause for review: ${result.workflow.status}`);
      const packet = { runId, threadId, checkpointId: checkpoint.checkpointId, candidateId: candidate.candidateId, candidateRevision: candidate.revision,
        appId: candidate.appId, sourceCommit: candidate.sourceCommit, sourceVersion: candidate.sourceVersion, reviewStatus: candidate.reviewStatus,
        gherkinOrigin: "REUSED_HISTORICAL_CANDIDATE", gherkin: candidate.gherkin, preconditions: candidate.preconditions, oracle: candidate.oracle,
        noveltyRationale: candidate.noveltyRationale, currentRunNoveltyDecision: "UNVERIFIED", historicalApprovalNotReused: true,
        roleResults: result.roleResults, reviewerIdentitySource: "OS user principal SHA-256 pseudonym; no caller-provided reviewerId accepted" };
      const requestPath = `docs/tasks/T01-B/evidence/${runId}/human-review-request.json`;
      await ensureContainedDirectory(repositoryRoot, `docs/tasks/T01-B/evidence/${runId}`);
      await writeUnique(requestPath, JSON.stringify(packet, null, 2));
      process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
      process.stdout.write(`\nReview command: npm run agent -- review ${threadId} ACCEPT "<rationale>"\n`);
      return;
    }
    if (command === "review") {
      const [threadId, decisionInput, ...rationaleParts] = rest;
      if (!threadId || !["ACCEPT", "REVISE", "REJECT"].includes(decisionInput ?? "") || rationaleParts.join(" ").trim().length < 5) {
        throw new Error('Usage: npm run agent -- review <thread-id> <ACCEPT|REVISE|REJECT> "<rationale>"');
      }
      const config = { configurable: { thread_id: threadId } };
      const snapshot = await app.getState(config);
      const state = snapshot.values as RuntimeState;
      if (!state?.workflow?.checkpoint || state.workflow.checkpoint.threadId !== threadId) throw new Error("thread has no matching pending human-review checkpoint");
      const rationale = rationaleParts.join(" ").trim();
      const command = resumeReview(state, threadId, state.workflow.checkpoint.checkpointId, decisionInput as "ACCEPT" | "REVISE" | "REJECT", rationale);
      const result = await app.invoke(command, config) as RuntimeState;
      if (result.terminalError) {
        const directory = `docs/tasks/T01-B/evidence/${result.workflow.runId}`;
        await ensureContainedDirectory(repositoryRoot, directory);
        await writeUnique(`${directory}/workflow-terminal.json`, JSON.stringify({ runId: result.workflow.runId, status: result.workflow.status,
          terminalError: { category: result.terminalError.category, message: sanitizeToolOutput(result.terminalError.message) },
          reviewDecisions: result.workflow.reviewDecisions, artifacts: result.workflow.artifacts, roleResults: result.roleResults,
          sourceCommit: result.workflow.sourceCommit, sourceVersion: result.workflow.sourceVersion, javaGenerationStarted: result.workflow.artifacts.some((item) => item.kind === "generated_java") }, null, 2));
      }
      process.stdout.write(`${JSON.stringify({ runId: result.workflow.runId, status: result.workflow.status, reviewDecisions: result.workflow.reviewDecisions, artifacts: result.workflow.artifacts, validation: result.validation, evidencePath: result.evidencePath, terminalError: result.terminalError }, null, 2)}\n`);
      return;
    }
    if (command === "status") {
      const threadId = rest[0];
      if (!threadId) throw new Error("Usage: npm run agent -- status <thread-id>");
      const snapshot = await app.getState({ configurable: { thread_id: threadId } });
      const state = snapshot.values as RuntimeState;
      if (state?.terminalError) {
        const directory = `docs/tasks/T01-B/evidence/${state.workflow.runId}`;
        await ensureContainedDirectory(repositoryRoot, directory);
        const terminalPath = `${directory}/workflow-terminal.json`;
        try { await resolveContainedExistingPath(repositoryRoot, terminalPath); }
        catch {
          await writeUnique(terminalPath, JSON.stringify({ runId: state.workflow.runId, status: state.workflow.status,
            terminalError: { category: state.terminalError.category, message: sanitizeToolOutput(state.terminalError.message) },
            reviewDecisions: state.workflow.reviewDecisions, artifacts: state.workflow.artifacts, roleResults: state.roleResults,
            sourceCommit: state.workflow.sourceCommit, sourceVersion: state.workflow.sourceVersion,
            javaGenerationStarted: state.workflow.artifacts.some((item) => item.kind === "generated_java") }, null, 2));
        }
      }
      process.stdout.write(`${JSON.stringify({ threadId, state: state?.workflow, terminalError: state?.terminalError, roleResults: state?.roleResults }, null, 2)}\n`);
      return;
    }
    throw new Error("Usage: npm run agent -- <start|review|status>");
  } finally {
    checkpointer.db.close();
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`T01-B agent failed closed: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exitCode = 1;
});
