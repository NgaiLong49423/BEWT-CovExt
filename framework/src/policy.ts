import {
  APP_IDS,
  AGENT_ROLES,
  ContractError,
  WORKFLOW_STATUSES,
  parseApplicationManifest,
  parseBaselineInventory,
  parseCandidateScenario,
  parseHumanReviewDecision,
  parseToolRequest,
  parseWorkflowState,
  type AgentWorkflowState,
  type ApplicationManifest,
  type CandidateScenario,
  type HumanReviewDecision,
  type ToolRequest,
  type WorkflowStatus,
} from "./contracts.js";

const transitions: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  STARTED: ["BASELINE_COLLECTED", "BLOCKED", "FAILED"],
  BASELINE_COLLECTED: ["CANDIDATES_GENERATED", "BLOCKED", "FAILED"],
  CANDIDATES_GENERATED: ["AWAITING_HUMAN_REVIEW", "FAILED"],
  AWAITING_HUMAN_REVIEW: ["ACCEPTED_FOR_IMPLEMENTATION", "REVISION_REQUIRED", "REJECTED", "BLOCKED"],
  ACCEPTED_FOR_IMPLEMENTATION: ["JAVA_GENERATED", "BLOCKED", "FAILED"],
  REVISION_REQUIRED: ["CANDIDATES_GENERATED", "BLOCKED", "FAILED"],
  REJECTED: [],
  JAVA_GENERATED: ["VALIDATING", "BLOCKED", "FAILED"],
  VALIDATING: ["REPAIRING", "EXECUTION_COMPLETED", "BLOCKED", "FAILED"],
  REPAIRING: ["VALIDATING", "BLOCKED", "FAILED"],
  EXECUTION_COMPLETED: [],
  BLOCKED: ["STARTED", "BASELINE_COLLECTED", "CANDIDATES_GENERATED", "AWAITING_HUMAN_REVIEW", "ACCEPTED_FOR_IMPLEMENTATION", "REVISION_REQUIRED", "JAVA_GENERATED", "VALIDATING", "REPAIRING"],
  FAILED: [],
};

function transitionWorkflowInternal(stateInput: AgentWorkflowState, next: WorkflowStatus, allowRepairStart: boolean, allowReviewDecision: boolean): AgentWorkflowState {
  const state = parseWorkflowState(stateInput);
  if (!(WORKFLOW_STATUSES as readonly string[]).includes(next)) throw new ContractError("unsupported workflow status; research statuses are not workflow statuses");
  if (next === "BLOCKED") throw new ContractError("use blockWorkflow to attach a resumable checkpoint and failure context");
  if (next === "FAILED") throw new ContractError("use failWorkflow to preserve failure context");
  if (state.status === "VALIDATING" && next === "REPAIRING" && !allowRepairStart) throw new ContractError("use startRepair to enforce the two-repair limit");
  if (state.status === "AWAITING_HUMAN_REVIEW" && ["ACCEPTED_FOR_IMPLEMENTATION", "REVISION_REQUIRED", "REJECTED"].includes(next) && !allowReviewDecision) throw new ContractError("review decisions must be submitted through submitReviewDecision");
  if (state.status === "BLOCKED") {
    if (!state.checkpoint || state.checkpoint.resumeStatus !== next) throw new ContractError("blocked workflow can resume only at its recorded checkpoint status");
  } else if (!transitions[state.status].includes(next)) {
    throw new ContractError(`invalid workflow transition ${state.status} -> ${next}`);
  }
  const currentRole = roleForStatus(next);
  return parseWorkflowState({ ...state, status: next, currentRole, ...(state.status === "BLOCKED" ? { checkpoint: undefined } : {}) });
}

export function transitionWorkflow(stateInput: AgentWorkflowState, next: WorkflowStatus): AgentWorkflowState {
  return transitionWorkflowInternal(stateInput, next, false, false);
}

export function startRepair(stateInput: AgentWorkflowState): AgentWorkflowState {
  const state = parseWorkflowState(stateInput);
  if (state.status !== "VALIDATING") throw new ContractError("repair may start only from VALIDATING");
  if (state.repairAttempts >= 2) throw new ContractError("maximum of two repair attempts has been reached");
  const repairing = transitionWorkflowInternal(state, "REPAIRING", true, false);
  return parseWorkflowState({ ...repairing, repairAttempts: state.repairAttempts + 1 });
}

export function blockWorkflow(stateInput: AgentWorkflowState, error: { category: string; message: string }, checkpoint: { threadId: string; checkpointId: string; pausedAt: string }): AgentWorkflowState {
  const state = parseWorkflowState(stateInput);
  if (["REJECTED", "EXECUTION_COMPLETED", "FAILED"].includes(state.status)) throw new ContractError(`${state.status} workflow cannot be blocked or resumed`);
  const parsedMessage = error.message;
  if (typeof parsedMessage !== "string" || parsedMessage.trim().length === 0) throw new ContractError("blocked workflow requires an error message");
  return parseWorkflowState({
    ...state,
    status: "BLOCKED",
    lastError: { category: error.category, message: parsedMessage },
    checkpoint: { ...checkpoint, resumeStatus: state.status },
  });
}

export function failWorkflow(stateInput: AgentWorkflowState, error: { category: string; message: string }): AgentWorkflowState {
  const state = parseWorkflowState(stateInput);
  if (!transitions[state.status].includes("FAILED")) throw new ContractError(`${state.status} workflow cannot transition to FAILED`);
  if (!error.category.trim() || !error.message.trim()) throw new ContractError("failed workflow requires an error category and message");
  return parseWorkflowState({ ...state, status: "FAILED", lastError: error, currentRole: state.currentRole });
}

export function reviseCandidate(stateInput: AgentWorkflowState, candidateInput: CandidateScenario): AgentWorkflowState {
  const state = parseWorkflowState(stateInput);
  const candidate = parseCandidateScenario(candidateInput);
  if (state.status !== "REVISION_REQUIRED" || !state.candidate) throw new ContractError("candidate can only be revised after a reviewer requested revision");
  if (candidate.appId !== state.appId || candidate.sourceCommit !== state.sourceCommit || candidate.sourceVersion !== state.sourceVersion) throw new ContractError("revised candidate source/app pin does not match workflow");
  if (candidate.candidateId !== state.candidate.candidateId || candidate.revision !== state.candidate.revision + 1 || candidate.reviewStatus !== "PROPOSED") throw new ContractError("revised candidate must preserve ID and increment revision exactly once");
  const regenerated = transitionWorkflow(state, "CANDIDATES_GENERATED");
  return parseWorkflowState({ ...regenerated, candidate, reviewDecisions: [], appliedDecisionIds: [] });
}

export function pauseAtHumanReview(stateInput: AgentWorkflowState, checkpoint: { threadId: string; checkpointId: string; pausedAt: string }): AgentWorkflowState {
  const state = parseWorkflowState(stateInput);
  if (state.status !== "AWAITING_HUMAN_REVIEW") throw new ContractError("human checkpoint can only be recorded while awaiting review");
  if (state.checkpoint) throw new ContractError("workflow is already paused at a checkpoint");
  return parseWorkflowState({ ...state, checkpoint: { ...checkpoint, resumeStatus: "AWAITING_HUMAN_REVIEW" } });
}

export function submitReviewDecision(stateInput: AgentWorkflowState, decisionInput: HumanReviewDecision): AgentWorkflowState {
  const state = parseWorkflowState(stateInput);
  const decision = parseHumanReviewDecision(decisionInput);
  const candidate = state.candidate;
  if (state.status !== "AWAITING_HUMAN_REVIEW" || !state.checkpoint) throw new ContractError("review submission requires a paused human-review checkpoint");
  if (!candidate) throw new ContractError("review submission requires an active candidate");
  if (decision.runId !== state.runId || decision.threadId !== state.checkpoint.threadId || decision.checkpointId !== state.checkpoint.checkpointId) {
    throw new ContractError("review decision run/thread/checkpoint does not match the paused workflow");
  }
  if (decision.appId !== state.appId || decision.candidateId !== candidate.candidateId || decision.candidateRevision !== candidate.revision) {
    throw new ContractError("review decision does not match this app, candidate, and revision");
  }
  if (state.appliedDecisionIds.includes(decision.decisionId) || state.reviewDecisions.some((item) => item.decisionId === decision.decisionId)) {
    throw new ContractError("review decision has already been applied");
  }
  const reviewStatus = decision.decision === "ACCEPT" ? "ACCEPTED_FOR_IMPLEMENTATION" : decision.decision === "REVISE" ? "REVISION_REQUIRED" : "REJECTED";
  return transitionWorkflowInternal({
    ...state,
    candidate: { ...candidate, reviewStatus },
    reviewDecisions: [...state.reviewDecisions, decision],
    appliedDecisionIds: [...state.appliedDecisionIds, decision.decisionId],
  }, reviewStatus, false, true);
}

export function assertCanGenerateJava(stateInput: AgentWorkflowState, candidateInput: CandidateScenario): void {
  const state = parseWorkflowState(stateInput);
  const candidate = parseCandidateScenario(candidateInput);
  if (state.status !== "ACCEPTED_FOR_IMPLEMENTATION") throw new ContractError("Java generation requires ACCEPTED_FOR_IMPLEMENTATION workflow state");
  assertHumanApprovedCandidate(state, candidate);
}

export function assertHumanApprovedCandidate(stateInput: AgentWorkflowState, candidateInput: CandidateScenario): void {
  const state = parseWorkflowState(stateInput);
  const candidate = parseCandidateScenario(candidateInput);
  if (candidate.appId !== state.appId || candidate.sourceCommit !== state.sourceCommit || candidate.sourceVersion !== state.sourceVersion) throw new ContractError("candidate source/app pin does not match workflow");
  if (candidate.candidateId !== state.candidate?.candidateId || candidate.revision !== state.candidate?.revision || candidate.reviewStatus !== "ACCEPTED_FOR_IMPLEMENTATION") throw new ContractError("only the exact human-approved candidate revision may be used");
  const acceptedDecision = state.reviewDecisions.find((decision) => decision.decision === "ACCEPT" && decision.runId === state.runId && decision.candidateId === candidate.candidateId && decision.candidateRevision === candidate.revision && state.appliedDecisionIds.includes(decision.decisionId));
  if (!acceptedDecision) throw new ContractError("human approval record is missing or not applied");
}

export interface ToolPolicyContext {
  manifest: ApplicationManifest;
  state: AgentWorkflowState;
  candidate?: CandidateScenario;
  allowedRoots: string[];
}

export function assertBaselineMatchesManifest(manifestInput: ApplicationManifest, inventoryInput: unknown): void {
  const manifest = parseApplicationManifest(manifestInput);
  const inventory = parseBaselineInventory(inventoryInput);
  const expectedSourceVersion = manifest.source.packageVersion ?? manifest.benchmarkBaseVersion;
  if (inventory.appId !== manifest.appId) throw new ContractError("baseline inventory app ID does not match its adapter manifest");
  if (inventory.sourceCommit !== manifest.source.commit || inventory.sourceVersion !== expectedSourceVersion) {
    throw new ContractError("baseline inventory source pin does not match its adapter manifest");
  }
}

export function authorizeToolRequest(requestInput: ToolRequest, contextInput: ToolPolicyContext): ToolRequest {
  const request = parseToolRequest(requestInput);
  const manifest = parseApplicationManifest(contextInput.manifest);
  const state = parseWorkflowState(contextInput.state);
  const allowedRoots = contextInput.allowedRoots.map((path) => normalizeRoot(path));
  if (manifest.appId !== state.appId || request.appId !== manifest.appId) throw new ContractError("tool app ID does not match approved manifest and workflow");
  if (manifest.source.commit !== request.sourceCommit || state.sourceCommit !== request.sourceCommit) throw new ContractError("tool source commit does not match manifest/workflow pin");
  if (!manifest.allowedTools.includes(request.tool)) throw new ContractError(`tool ${request.tool} is not allowlisted for this app`);
  const paths = requestPaths(request);
  for (const path of paths) {
    if (!allowedRoots.some((root) => path === root || path.startsWith(`${root}/`))) throw new ContractError(`tool path is outside approved roots: ${path}`);
  }
  if (isCandidateTool(request)) {
    const candidate = contextInput.candidate;
    if (!candidate || request.candidateId !== candidate.candidateId || request.revision !== candidate.revision) throw new ContractError("tool request candidate/revision does not match approved candidate");
    const expectedSourceVersion = manifest.source.packageVersion ?? manifest.benchmarkBaseVersion;
    if (candidate.appId !== request.appId || candidate.sourceCommit !== request.sourceCommit || candidate.sourceVersion !== expectedSourceVersion) {
      throw new ContractError("candidate app/source version does not match manifest");
    }
    if (request.tool === "validate-gherkin" && !["CANDIDATES_GENERATED", "AWAITING_HUMAN_REVIEW"].includes(state.status)) throw new ContractError("Gherkin validation requires generated candidates");
    if (request.tool === "generate-source-artifact") assertCanGenerateJava(state, candidate);
    if (["compile-maven-project", "run-selenium-test", "prepare-fixture", "cleanup-experiment"].includes(request.tool)) {
      assertHumanApprovedCandidate(state, candidate);
      const allowedStatuses: Record<"compile-maven-project" | "run-selenium-test" | "prepare-fixture" | "cleanup-experiment", WorkflowStatus[]> = {
        "compile-maven-project": ["JAVA_GENERATED", "VALIDATING", "REPAIRING"],
        "run-selenium-test": ["VALIDATING"],
        "prepare-fixture": ["VALIDATING"],
        "cleanup-experiment": ["JAVA_GENERATED", "VALIDATING", "REPAIRING", "EXECUTION_COMPLETED", "BLOCKED", "FAILED"],
      };
      if (!allowedStatuses[request.tool as keyof typeof allowedStatuses].includes(state.status)) throw new ContractError(`${request.tool} is not allowed while workflow is ${state.status}`);
    }
    if ((request.tool === "prepare-fixture" || request.tool === "cleanup-experiment") && request.experimentKey !== manifest.fixtureReset.experimentKey) throw new ContractError("fixture operation experiment key does not match manifest ownership");
  }
  if (request.tool === "collect-test-evidence" && request.runId !== state.runId) throw new ContractError("evidence request run ID does not match workflow");
  return request;
}

function requestPaths(request: ToolRequest): string[] {
  if ("inventoryPath" in request) return [request.inventoryPath];
  if ("manifestPath" in request) return [request.manifestPath];
  if ("artifactPath" in request) return [request.artifactPath];
  if ("outputPath" in request) return [request.outputPath];
  if ("projectPath" in request) return [request.projectPath];
  return [];
}

function isCandidateTool(request: ToolRequest): request is Exclude<ToolRequest, { tool: "read-baseline-inventory" | "read-approved-manifest" | "collect-test-evidence" }> {
  return "candidateId" in request;
}

function normalizeRoot(path: string): string {
  if (!path || path.includes("\\") || path.startsWith("/") || path.split("/").some((segment) => !segment || segment === "." || segment === "..")) throw new ContractError("allowed root must be a normalized relative path");
  return path.replace(/\/$/, "");
}

function roleForStatus(status: WorkflowStatus): AgentWorkflowState["currentRole"] {
  if (["STARTED", "BASELINE_COLLECTED", "BLOCKED"].includes(status)) return AGENT_ROLES[0];
  if (["CANDIDATES_GENERATED", "AWAITING_HUMAN_REVIEW", "REVISION_REQUIRED", "REJECTED"].includes(status)) return AGENT_ROLES[1];
  if (["ACCEPTED_FOR_IMPLEMENTATION", "JAVA_GENERATED"].includes(status)) return AGENT_ROLES[2];
  if (["VALIDATING", "REPAIRING", "EXECUTION_COMPLETED", "FAILED"].includes(status)) return AGENT_ROLES[3];
  throw new ContractError(`no role mapping for status ${status}`);
}

export const WORKFLOW_STATUS_VALUES = WORKFLOW_STATUSES;
export const SUPPORTED_APP_IDS = APP_IDS;
