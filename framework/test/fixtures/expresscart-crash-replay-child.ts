import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ExpressCartExperimentAdapter, parseExpressCartManifest, trustedReviewerId } from "../../../adapters/expresscart/experiment.js";
import { parseCandidateScenario, type AgentWorkflowState, type CandidateScenario } from "../../src/contracts.js";
import { ensureContainedDirectory } from "../../src/runtime/safe-path.js";
import { buildWorkflow, openSqliteCheckpointer, resumeReview, type RuntimeServices } from "../../src/runtime/workflow.js";

const [mode, dbPath, runId, markerPath] = process.argv.slice(2);
if (!mode || !dbPath || !runId || !markerPath) throw new Error("mode, SQLite path, run ID and marker path are required");
const root = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const sourceCommit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const sourceVersion = "1.1.19";
const manifest = parseExpressCartManifest(await readFile(resolve(root, "config/apps/expresscart.json"), "utf8"));
const adapter = new ExpressCartExperimentAdapter(root, manifest, {
  afterFixture: async (state) => {
    if (mode !== "crash") return;
    await writeFile(markerPath, JSON.stringify({ runId, invocationId: state.validationInvocationId, createdAt: new Date().toISOString() }));
    // Keep the dedicated child alive until the parent watchdog terminates it.
    const holdProcessOpen = setInterval(() => undefined, 1_000);
    await new Promise<void>(() => {});
    clearInterval(holdProcessOpen);
  },
});
const approvedFeaturePath = "docs/research-results/sprint-02/revised/EC-C04-forgotten-password.feature";
const sourceGherkin = await readFile(resolve(root, approvedFeaturePath), "utf8");
const candidate: CandidateScenario = parseCandidateScenario({
  candidateId: "EC-C04", appId: "expresscart", sourceCommit, sourceVersion, revision: 1,
  gherkin: sourceGherkin,
  preconditions: ["A fresh unregistered email must be confirmed absent from the isolated Mongo customers collection before the browser flow."],
  oracle: ["The forgotten-password form displays the exact generic response for an unregistered email."],
  noveltyRationale: "Previously reviewed implementation candidate; this task tests runtime recovery only.",
  sourceReferences: [{ repositoryCommit: sourceCommit, sourceVersion, runId: "crash-replay-approved-candidate", artifactPath: approvedFeaturePath }],
  reviewStatus: "PROPOSED",
});
const baseline = await adapter.readBaseline();
const reference = baseline.cases.flatMap((item) => item.sourceReferences)[0]!;
const services: RuntimeServices = {
  readBaseline: async () => baseline,
  analyzeCoverage: async () => [{ gapId: "crash-replay-gap", appId: "expresscart", sourceCommit, sourceVersion, behavior: "Forgotten password generic response", rationale: "The reviewed EC-C04 scenario is the targeted runtime slice.", sourceReferences: [reference] }],
  proposeCandidate: async () => candidate,
  trustedReviewerId,
  prepareJava: async (item, state) => adapter.prepareJava(item, state),
  validate: async (item, artifact, attempts, state) => adapter.validate(item, artifact as never, attempts, state),
  recordEvidence: async (state) => {
    const directory = `docs/tasks/T01-B/evidence/${runId}`;
    await ensureContainedDirectory(root, directory);
    const path = resolve(root, directory, "validation-result.json");
    const data = { runId, sourceCommit, sourceVersion, snapshotKind: "terminal-finalization", workflowStatus: state.workflow.status, candidateId: state.workflow.candidate?.candidateId,
      candidateRevision: state.workflow.candidate?.revision, reviewDecisions: state.workflow.reviewDecisions, artifacts: state.workflow.artifacts,
      validation: state.validation, validationHistory: state.validationHistory, roleResults: state.roleResults, terminalError: state.terminalError,
      model: { provider: "Gemini", status: "NOT_RUN", calls: 0 } };
    await writeFile(path, JSON.stringify(data, null, 2), { flag: "wx" });
    return `${directory}/validation-result.json`;
  },
};
const saver = openSqliteCheckpointer(dbPath);
try {
  const app = buildWorkflow(services, saver);
  const config = { configurable: { thread_id: runId } };
  if (mode === "crash") {
    const initial: AgentWorkflowState = { appId: "expresscart", sourceCommit, sourceVersion, runId, currentRole: "coverage_analysis", status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
    const waiting = await app.invoke({ workflow: initial }, config);
    if (waiting.workflow.status !== "AWAITING_HUMAN_REVIEW" || !waiting.workflow.checkpoint) throw new Error(`expected review interrupt, got ${waiting.workflow.status}`);
    await app.invoke(resumeReview(waiting, runId, waiting.workflow.checkpoint.checkpointId, "ACCEPT", "Approved for the crash recovery integration test only."), config);
    throw new Error("after-fixture watchdog hook unexpectedly returned");
  }
  if (mode === "resume") {
    const result = await app.invoke(null as never, config) as { workflow: AgentWorkflowState; validation?: { invocationId: string; compile: { outcome: string }; fixture: { outcome: string }; e2e: { outcome: string }; cleanup: { outcome: string } }; validationHistory?: Array<{ invocationId: string }>; evidencePath?: string; terminalError?: { category: string; message: string } };
    const previousInvocation = JSON.parse(await readFile(markerPath, "utf8")).invocationId as string;
    if (!result.validation) throw new Error(`replayed validation node produced no validation result: workflow=${result.workflow.status}, terminalError=${JSON.stringify(result.terminalError ?? null)}, keys=${Object.keys(result).join(",")}`);
    if (result.workflow.status !== "EXECUTION_COMPLETED") throw new Error(`expected terminal graph completion, got ${result.workflow.status}`);
    if (result.validation.invocationId === previousInvocation) throw new Error("replay reused a prior invocation identity");
    if (result.validation.compile.outcome !== "PASS" || result.validation.fixture.outcome !== "PASS" || result.validation.e2e.outcome !== "PASS" || result.validation.cleanup.outcome !== "PASS") {
      throw new Error(`current-code E2E/recovery did not PASS: ${JSON.stringify({ validation: result.validation, history: result.validationHistory })}`);
    }
    process.stdout.write(`${JSON.stringify({ runId, previousInvocation, validation: result.validation, validationHistory: result.validationHistory, workflowStatus: result.workflow.status, evidencePath: result.evidencePath })}\n`);
  } else throw new Error(`unknown mode ${mode}`);
} finally {
  saver.db.close();
}
