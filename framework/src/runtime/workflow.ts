import { Annotation, Command, END, START, StateGraph, interrupt, type Command as LangGraphCommand } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { randomUUID } from "node:crypto";
import {
  parseBaselineInventory, parseCandidateScenario, parseHumanReviewDecision, parseValidationResult,
  parseWorkflowState, type AgentRole, type AgentWorkflowState, type BaselineInventory,
  type CandidateScenario, type CoverageGap, type HumanDecision, type ValidationResult,
} from "../contracts.js";
import {
  assertCanGenerateJava, failWorkflow, pauseAtHumanReview, reviseCandidate, startRepair,
  submitReviewDecision, transitionWorkflow,
} from "../policy.js";

export interface RuntimeArtifact {
  path: string;
  testClass: string;
  sha256: string;
  origin: "GENERATED" | "REUSED" | "REPAIRED";
}

export interface RoleRunResult {
  outcome: "PASS" | "FAIL" | "BLOCKED" | "NOT_RUN" | "INCONCLUSIVE";
  startedAt: string;
  finishedAt: string;
  summary: string;
  errorCategory?: string;
}

export interface RuntimeState {
  workflow: AgentWorkflowState;
  baseline?: BaselineInventory | undefined;
  gaps?: CoverageGap[] | undefined;
  reviewInput?: { decision: HumanDecision; rationale: string } | undefined;
  generatedArtifact?: RuntimeArtifact | undefined;
  firstGeneratedArtifact?: RuntimeArtifact | undefined;
  validation?: ValidationResult | undefined;
  validationHistory?: ValidationResult[] | undefined;
  evidencePath?: string | undefined;
  roleResults?: Partial<Record<AgentRole, RoleRunResult>> | undefined;
  terminalError?: { category: string; message: string } | undefined;
}

export interface RuntimeServices {
  readBaseline(): Promise<BaselineInventory>;
  analyzeCoverage(baseline: BaselineInventory): Promise<CoverageGap[]>;
  proposeCandidate(baseline: BaselineInventory, gaps: CoverageGap[], revision: number, reviewContext?: { previousCandidate?: CandidateScenario; reviewerRationale?: string }): Promise<CandidateScenario>;
  trustedReviewerId(): string;
  prepareJava(candidate: CandidateScenario, workflow: AgentWorkflowState): Promise<RuntimeArtifact>;
  validate(candidate: CandidateScenario, artifact: RuntimeArtifact, repairAttempts: number, workflow: AgentWorkflowState): Promise<ValidationResult>;
  repairJava?(candidate: CandidateScenario, firstArtifact: RuntimeArtifact, currentArtifact: RuntimeArtifact, validation: ValidationResult, attempt: number): Promise<RuntimeArtifact>;
  recordEvidence(state: RuntimeState): Promise<string>;
}

const State = Annotation.Root({
  workflow: Annotation<AgentWorkflowState>,
  baseline: Annotation<BaselineInventory | undefined>,
  gaps: Annotation<CoverageGap[] | undefined>,
  reviewInput: Annotation<RuntimeState["reviewInput"]>,
  generatedArtifact: Annotation<RuntimeArtifact | undefined>,
  firstGeneratedArtifact: Annotation<RuntimeArtifact | undefined>,
  validation: Annotation<ValidationResult | undefined>,
  validationHistory: Annotation<ValidationResult[] | undefined>,
  evidencePath: Annotation<string | undefined>,
  roleResults: Annotation<RuntimeState["roleResults"]>,
  terminalError: Annotation<RuntimeState["terminalError"]>,
});

function now(): string { return new Date().toISOString(); }
function summarizeError(error: unknown): string { return error instanceof Error ? error.message.slice(0, 1_000) : "Unknown runtime error"; }
function result(startedAt: string, summary: string, outcome: RoleRunResult["outcome"] = "PASS", errorCategory?: string): RoleRunResult {
  return { outcome, startedAt, finishedAt: now(), summary, ...(errorCategory ? { errorCategory } : {}) };
}
function isRepairable(validation: ValidationResult): boolean {
  return (validation.compile.outcome === "FAIL" && validation.compile.failureClassification === "GENERATED_TEST_DEFECT") ||
    (validation.e2e.outcome === "FAIL" && validation.e2e.failureClassification === "GENERATED_TEST_DEFECT");
}

export function buildWorkflow(services: RuntimeServices, checkpointer: SqliteSaver) {
  const graph = new StateGraph(State)
    .addNode("coverage_analysis", async (state) => {
      const startedAt = now();
      try {
        const baseline = parseBaselineInventory(await services.readBaseline());
        const gaps = await services.analyzeCoverage(baseline);
        if (baseline.appId !== state.workflow.appId || baseline.sourceCommit !== state.workflow.sourceCommit || baseline.sourceVersion !== state.workflow.sourceVersion) {
          throw new Error("baseline app/source pin does not match workflow");
        }
        const workflow = transitionWorkflow(state.workflow, "BASELINE_COLLECTED");
        return { baseline, gaps, workflow, roleResults: { ...state.roleResults, coverage_analysis: result(startedAt, `Collected ${baseline.observedScenarioCount} scenarios and ${gaps.length} grounded gaps.`) } };
      } catch (error) {
        const message = summarizeError(error);
        return { workflow: failWorkflow(state.workflow, { category: "COVERAGE_ANALYSIS_FAILED", message }), terminalError: { category: "COVERAGE_ANALYSIS_FAILED", message }, roleResults: { ...state.roleResults, coverage_analysis: result(startedAt, message, "FAIL", "COVERAGE_ANALYSIS_FAILED") } };
      }
    })
    .addNode("gherkin_generation", async (state) => {
      const startedAt = now();
      try {
        if (!state.baseline || !state.gaps) throw new Error("coverage analysis output missing");
        const nextRevision = state.workflow.status === "REVISION_REQUIRED" ? (state.workflow.candidate?.revision ?? 0) + 1 : 1;
        const candidate = parseCandidateScenario(await services.proposeCandidate(state.baseline, state.gaps, nextRevision, state.workflow.status === "REVISION_REQUIRED"
          ? { ...(state.workflow.candidate ? { previousCandidate: state.workflow.candidate } : {}), ...(state.reviewInput?.rationale ? { reviewerRationale: state.reviewInput.rationale } : {}) }
          : undefined));
        const workflow = state.workflow.status === "REVISION_REQUIRED"
          ? reviseCandidate(state.workflow, candidate)
          : transitionWorkflow({ ...state.workflow, candidate }, "CANDIDATES_GENERATED");
        return { workflow, roleResults: { ...state.roleResults, gherkin_generation: result(startedAt, `Candidate ${candidate.candidateId} revision ${candidate.revision} is ready for review.`) } };
      } catch (error) {
        const message = summarizeError(error);
        return { workflow: failWorkflow(state.workflow, { category: "GHERKIN_GENERATION_FAILED", message }), terminalError: { category: "GHERKIN_GENERATION_FAILED", message }, roleResults: { ...state.roleResults, gherkin_generation: result(startedAt, message, "FAIL", "GHERKIN_GENERATION_FAILED") } };
      }
    })
    .addNode("prepare_review", (state) => {
      const awaiting = transitionWorkflow(state.workflow, "AWAITING_HUMAN_REVIEW");
      const workflow = pauseAtHumanReview(awaiting, {
        threadId: state.workflow.runId,
        checkpointId: randomUUID(), pausedAt: now(),
      });
      return { workflow, reviewInput: undefined };
    })
    .addNode("human_review", (state) => {
      const prompt = interrupt({
        runId: state.workflow.runId,
        threadId: state.workflow.checkpoint?.threadId,
        checkpointId: state.workflow.checkpoint?.checkpointId,
        candidate: state.workflow.candidate,
      }) as { decision: HumanDecision; rationale: string };
      if (!state.workflow.candidate || !state.workflow.checkpoint) throw new Error("review checkpoint/candidate missing");
      const decision = parseHumanReviewDecision({
        decisionId: randomUUID(), runId: state.workflow.runId,
        threadId: state.workflow.checkpoint.threadId, checkpointId: state.workflow.checkpoint.checkpointId,
        candidateId: state.workflow.candidate.candidateId, candidateRevision: state.workflow.candidate.revision,
        appId: state.workflow.appId, reviewerId: services.trustedReviewerId(), decision: prompt.decision,
        decidedAt: now(), rationale: prompt.rationale,
      });
      return { workflow: submitReviewDecision(state.workflow, decision), reviewInput: prompt };
    })
    .addNode("selenium_implementation", async (state) => {
      const startedAt = now();
      try {
        if (!state.workflow.candidate) throw new Error("approved candidate missing");
        assertCanGenerateJava(state.workflow, state.workflow.candidate);
        const artifact = await services.prepareJava(state.workflow.candidate, state.workflow);
        if (!/^[a-f0-9]{64}$/.test(artifact.sha256) || !artifact.path || !artifact.testClass) throw new Error("Java artifact metadata is invalid");
        const workflow = transitionWorkflow(state.workflow, "JAVA_GENERATED");
        const withArtifact = parseWorkflowState({ ...workflow, artifacts: [...workflow.artifacts, { kind: "generated_java", path: artifact.path, testClass: artifact.testClass, candidateId: workflow.candidate!.candidateId, revision: workflow.candidate!.revision, origin: artifact.origin, sha256: artifact.sha256 }] });
        return { workflow: withArtifact, generatedArtifact: artifact, firstGeneratedArtifact: artifact, roleResults: { ...state.roleResults, selenium_implementation: result(startedAt, `${artifact.origin} Java artifact registered: ${artifact.testClass}.`) } };
      } catch (error) {
        const message = summarizeError(error);
        return { workflow: failWorkflow(state.workflow, { category: "JAVA_IMPLEMENTATION_FAILED", message }), terminalError: { category: "JAVA_IMPLEMENTATION_FAILED", message }, roleResults: { ...state.roleResults, selenium_implementation: result(startedAt, message, "FAIL", "JAVA_IMPLEMENTATION_FAILED") } };
      }
    })
    .addNode("validation_repair", async (state) => {
      const startedAt = now();
      try {
        if (!state.workflow.candidate || !state.generatedArtifact) throw new Error("approved candidate/artifact missing");
        const workflow = state.workflow.status === "JAVA_GENERATED" ? transitionWorkflow(state.workflow, "VALIDATING") : state.workflow;
        const validation = parseValidationResult(await services.validate(state.workflow.candidate, state.generatedArtifact, workflow.repairAttempts, workflow));
        if (validation.appId !== workflow.appId || validation.candidateId !== workflow.candidate!.candidateId || validation.candidateRevision !== workflow.candidate!.revision || validation.sourceCommit !== workflow.sourceCommit || validation.sourceVersion !== workflow.sourceVersion) {
          throw new Error("validation result app/candidate/revision/source pin does not match workflow");
        }
        const history = [...(state.validationHistory ?? []), validation];
        return { workflow, validation, validationHistory: history, roleResults: { ...state.roleResults, validation_repair: result(startedAt, `Validation ${validation.invocationId}: ${validation.technicalEligibility}.`) } };
      } catch (error) {
        const message = summarizeError(error);
        const sourceState = state.workflow.status === "JAVA_GENERATED" ? transitionWorkflow(state.workflow, "VALIDATING") : state.workflow;
        return { workflow: failWorkflow(sourceState, { category: "VALIDATION_FAILED", message }), terminalError: { category: "VALIDATION_FAILED", message }, roleResults: { ...state.roleResults, validation_repair: result(startedAt, message, "FAIL", "VALIDATION_FAILED") } };
      }
    })
    .addNode("start_repair", (state) => {
      const workflow = startRepair(state.workflow);
      return { workflow };
    })
    .addNode("repair_artifact", async (state) => {
      const startedAt = now();
      try {
        if (!services.repairJava || !state.workflow.candidate || !state.generatedArtifact || !state.validation) throw new Error("repair provider or prior validation evidence missing");
        const first = state.firstGeneratedArtifact;
        if (!first) throw new Error("first immutable source artifact missing");
        const repaired = await services.repairJava(state.workflow.candidate, first, state.generatedArtifact, state.validation, state.workflow.repairAttempts);
        if (repaired.origin !== "REPAIRED" || repaired.sha256 === first.sha256 || repaired.path === first.path) throw new Error("repair must create a new immutable artifact with a distinct path and hash");
        const workflow = transitionWorkflow(state.workflow, "VALIDATING");
        const registered = parseWorkflowState({ ...workflow, artifacts: [...workflow.artifacts, { kind: "generated_java", path: repaired.path, testClass: repaired.testClass, candidateId: workflow.candidate!.candidateId, revision: workflow.candidate!.revision, origin: "REPAIRED", sha256: repaired.sha256 }] });
        return { workflow: registered, generatedArtifact: repaired, roleResults: { ...state.roleResults, validation_repair: result(startedAt, `Repair attempt ${workflow.repairAttempts} created a new source artifact.`) } };
      } catch (error) {
        const message = summarizeError(error);
        return { workflow: failWorkflow(state.workflow, { category: "REPAIR_FAILED", message }), terminalError: { category: "REPAIR_FAILED", message }, roleResults: { ...state.roleResults, validation_repair: result(startedAt, message, "FAIL", "REPAIR_FAILED") } };
      }
    })
    .addNode("evidence_recording", async (state) => {
      const startedAt = now();
      try {
        if (!state.validation) throw new Error("no validation record to persist");
        const workflow = state.workflow.status === "VALIDATING" ? transitionWorkflow(state.workflow, "EXECUTION_COMPLETED") : state.workflow;
        const evidencePath = await services.recordEvidence({ ...state, workflow });
        const previous = state.roleResults?.validation_repair;
        return { workflow, evidencePath, roleResults: { ...state.roleResults, validation_repair: result(startedAt, `${previous?.summary ?? "Validation completed."} Evidence recorded at ${evidencePath}.`, previous?.outcome ?? "PASS", previous?.errorCategory) } };
      } catch (error) {
        const message = summarizeError(error);
        return { workflow: failWorkflow(state.workflow, { category: "EVIDENCE_RECORDING_FAILED", message }), terminalError: { category: "EVIDENCE_RECORDING_FAILED", message }, roleResults: { ...state.roleResults, validation_repair: result(startedAt, message, "FAIL", "EVIDENCE_RECORDING_FAILED") } };
      }
    })
    .addEdge(START, "coverage_analysis")
    .addConditionalEdges("coverage_analysis", (state) => state.workflow.status === "FAILED" ? END : "gherkin_generation")
    .addConditionalEdges("gherkin_generation", (state) => state.workflow.status === "FAILED" ? END : "prepare_review")
    .addEdge("prepare_review", "human_review")
    .addConditionalEdges("human_review", (state) => {
      switch (state.workflow.status) {
        case "ACCEPTED_FOR_IMPLEMENTATION": return "selenium_implementation";
        case "REVISION_REQUIRED": return "gherkin_generation";
        case "REJECTED": return END;
        default: throw new Error(`unexpected review status ${state.workflow.status}`);
      }
    })
    .addConditionalEdges("selenium_implementation", (state) => state.workflow.status === "FAILED" ? END : "validation_repair")
    .addConditionalEdges("validation_repair", (state) => {
      if (state.workflow.status === "FAILED") return END;
      if (state.validation && isRepairable(state.validation) && state.workflow.repairAttempts < 2 && services.repairJava) return "start_repair";
      return "evidence_recording";
    })
    .addEdge("start_repair", "repair_artifact")
    .addConditionalEdges("repair_artifact", (state) => state.workflow.status === "FAILED" ? END : "validation_repair")
    .addEdge("evidence_recording", END);
  return graph.compile({ checkpointer });
}

export function openSqliteCheckpointer(path: string): SqliteSaver {
  return SqliteSaver.fromConnString(path);
}

export function resumeReview(state: Pick<RuntimeState, "workflow">, threadId: string, checkpointId: string, decision: HumanDecision, rationale: string): LangGraphCommand<unknown, {}, "human_review"> {
  if (!state.workflow.checkpoint) throw new Error("no pending human review checkpoint");
  if (state.workflow.checkpoint.threadId !== threadId || state.workflow.checkpoint.checkpointId !== checkpointId) throw new Error("review resume thread/checkpoint does not match the pending request");
  return new Command({ resume: { decision, rationale } });
}

export function parseRuntimeState(value: RuntimeState): RuntimeState {
  return { ...value, workflow: parseWorkflowState(value.workflow) };
}
