/** Shared, app-neutral contracts for BEWT-CovExt. No app-specific paths or secrets. */

export const APP_IDS = ["bludit", "claroline", "expresscart", "joomla", "kanboard", "mantisbt", "mediawiki", "prestashop"] as const;
export type AppId = (typeof APP_IDS)[number];

export const AGENT_ROLES = ["coverage_analysis", "gherkin_generation", "selenium_implementation", "validation_repair"] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];

export const WORKFLOW_STATUSES = [
  "STARTED", "BASELINE_COLLECTED", "CANDIDATES_GENERATED", "AWAITING_HUMAN_REVIEW",
  "ACCEPTED_FOR_IMPLEMENTATION", "REVISION_REQUIRED", "REJECTED", "JAVA_GENERATED",
  "VALIDATING", "REPAIRING", "EXECUTION_COMPLETED", "BLOCKED", "FAILED",
] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
export type ResearchStatus = "NOT_EVALUATED" | "VALIDATED";
export type Outcome = "PASS" | "FAIL" | "BLOCKED" | "NOT_RUN" | "INCONCLUSIVE";

export interface EvidenceReference {
  repositoryCommit: string;
  sourceVersion: string;
  runId: string;
  artifactPath: string;
}

export interface ApplicationManifest {
  schemaVersion: "1.0.0";
  appId: AppId;
  benchmarkBaseVersion: string;
  source: { repository: string; commit: string; packageVersion?: string };
  baseSuitePath: string;
  runtime: { kind: "docker" | "external"; version: string; image?: string; imageDigest?: string };
  fixtureReset: {
    experimentKey: string;
    prepareTool: "prepare-fixture";
    cleanupTool: "cleanup-experiment";
    resetStrategy: string;
    destructive: boolean;
  };
  allowedTools: ToolName[];
}

export interface BaselineCase {
  caseId: string;
  gherkinPath: string;
  scenarioName: string;
  baseTestPaths: string[];
  behaviorTags: string[];
  sourceReferences: EvidenceReference[];
}

export interface BaselineInventory {
  appId: AppId;
  sourceCommit: string;
  sourceVersion: string;
  collectedAt: string;
  cases: BaselineCase[];
  declaredBusinessCaseCount?: number;
  observedScenarioCount: number;
}

export interface CoverageGap {
  gapId: string;
  appId: AppId;
  sourceCommit: string;
  sourceVersion: string;
  behavior: string;
  rationale: string;
  sourceReferences: EvidenceReference[];
}

export type CandidateReviewStatus = "PROPOSED" | "ACCEPTED_FOR_IMPLEMENTATION" | "REVISION_REQUIRED" | "REJECTED";

export interface CandidateScenario {
  candidateId: string;
  appId: AppId;
  sourceCommit: string;
  sourceVersion: string;
  revision: number;
  gherkin: string;
  preconditions: string[];
  oracle: string[];
  noveltyRationale: string;
  sourceReferences: EvidenceReference[];
  reviewStatus: CandidateReviewStatus;
}

export type HumanDecision = "ACCEPT" | "REVISE" | "REJECT";

export interface HumanReviewDecision {
  decisionId: string;
  runId: string;
  threadId: string;
  checkpointId: string;
  candidateId: string;
  candidateRevision: number;
  appId: AppId;
  reviewerId: string;
  decision: HumanDecision;
  decidedAt: string;
  rationale: string;
}

export interface CheckpointReference {
  threadId: string;
  checkpointId: string;
  pausedAt: string;
  resumeStatus: WorkflowStatus;
}

export interface WorkflowArtifact {
  kind: "baseline" | "candidate" | "generated_java" | "validation" | "log";
  path: string;
  candidateId?: string;
  revision?: number;
}

export interface AgentWorkflowState {
  appId: AppId;
  sourceCommit: string;
  sourceVersion: string;
  runId: string;
  currentRole: AgentRole;
  status: WorkflowStatus;
  candidate?: CandidateScenario;
  reviewDecisions: HumanReviewDecision[];
  appliedDecisionIds: string[];
  checkpoint?: CheckpointReference;
  artifacts: WorkflowArtifact[];
  repairAttempts: number;
  lastError?: { category: string; message: string };
}

export const TOOL_NAMES = [
  "read-baseline-inventory", "validate-gherkin", "read-approved-manifest", "generate-source-artifact",
  "compile-maven-project", "run-selenium-test", "prepare-fixture", "collect-test-evidence", "cleanup-experiment",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export type ToolRequest =
  | { tool: "read-baseline-inventory"; appId: AppId; sourceCommit: string; inventoryPath: string }
  | { tool: "validate-gherkin"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; artifactPath: string }
  | { tool: "read-approved-manifest"; appId: AppId; sourceCommit: string; manifestPath: string }
  | { tool: "generate-source-artifact"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; outputPath: string }
  | { tool: "compile-maven-project"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; projectPath: string }
  | { tool: "run-selenium-test"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; projectPath: string; testClass: string }
  | { tool: "prepare-fixture"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; experimentKey: string }
  | { tool: "collect-test-evidence"; appId: AppId; sourceCommit: string; runId: string; artifactPath: string }
  | { tool: "cleanup-experiment"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; experimentKey: string };

export interface ToolResult {
  tool: ToolName;
  outcome: Outcome;
  exitCode?: number;
  stdout: string;
  stderr: string;
  evidence: EvidenceReference[];
}

/** App-specific effects live behind this shared contract, never in graph policy. */
export interface ApplicationAdapter {
  readonly manifest: ApplicationManifest;
  readBaseline(): Promise<BaselineInventory>;
  prepareFixture(candidate: CandidateScenario, experimentKey: string): Promise<ToolResult>;
  compile(candidate: CandidateScenario): Promise<ToolResult>;
  runSelenium(candidate: CandidateScenario, testClass: string): Promise<ToolResult>;
  collectEvidence(runId: string): Promise<EvidenceReference[]>;
  cleanup(candidate: CandidateScenario, experimentKey: string): Promise<ToolResult>;
}

export interface ValidationResult {
  appId: AppId;
  candidateId: string;
  candidateRevision: number;
  sourceCommit: string;
  sourceVersion: string;
  compile: Outcome;
  fixture: Outcome;
  e2e: Outcome;
  oracle: Outcome;
  cleanup: Outcome;
  repeats: Outcome[];
  repairAttempts: number;
  noveltyAndOracleApproved: boolean;
  evidence: EvidenceReference[];
  researchStatus: ResearchStatus;
}

export class ContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractError";
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new ContractError(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function assertKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extra.length > 0) throw new ContractError(`${label} contains unsupported fields: ${extra.join(", ")}`);
}

function text(value: unknown, label: string, max = 2_000): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) throw new ContractError(`${label} must be a non-empty string (max ${max})`);
  return value.trim();
}

function list<T>(value: unknown, label: string, parse: (item: unknown, index: number) => T, min = 0, max = 1_000): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new ContractError(`${label} must contain ${min}..${max} items`);
  return value.map(parse);
}

function member<const T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) throw new ContractError(`${label} is not supported`);
  return value as T[number];
}

function sha(value: unknown, label: string): string {
  const parsed = text(value, label, 40);
  if (!/^[a-f0-9]{40}$/i.test(parsed)) throw new ContractError(`${label} must be a full 40-character Git commit SHA`);
  return parsed.toLowerCase();
}

function isoDate(value: unknown, label: string): string {
  const parsed = text(value, label, 40);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(parsed) || Number.isNaN(Date.parse(parsed))) {
    throw new ContractError(`${label} must be an ISO-8601 timestamp with timezone`);
  }
  return parsed;
}

export function assertSafeRelativePath(value: unknown, label = "path"): string {
  const parsed = text(value, label, 500);
  if (parsed.startsWith("/") || parsed.includes("\\") || /^[a-z]:/i.test(parsed) || parsed.split("/").some((part) => part === ".." || part === "." || part === "")) {
    throw new ContractError(`${label} must be a normalized repository-relative POSIX path`);
  }
  return parsed;
}

export function parseEvidenceReference(input: unknown): EvidenceReference {
  const value = record(input, "EvidenceReference");
  return {
    repositoryCommit: sha(value.repositoryCommit, "EvidenceReference.repositoryCommit"),
    sourceVersion: text(value.sourceVersion, "EvidenceReference.sourceVersion", 120),
    runId: text(value.runId, "EvidenceReference.runId", 120),
    artifactPath: assertSafeRelativePath(value.artifactPath, "EvidenceReference.artifactPath"),
  };
}

export function parseApplicationManifest(input: unknown): ApplicationManifest {
  const value = record(input, "ApplicationManifest");
  assertKeys(value, ["schemaVersion", "appId", "benchmarkBaseVersion", "source", "baseSuitePath", "runtime", "fixtureReset", "allowedTools"], "ApplicationManifest");
  const source = record(value.source, "ApplicationManifest.source");
  const runtime = record(value.runtime, "ApplicationManifest.runtime");
  const fixture = record(value.fixtureReset, "ApplicationManifest.fixtureReset");
  assertKeys(source, ["repository", "commit", "packageVersion"], "source");
  assertKeys(runtime, ["kind", "version", "image", "imageDigest"], "runtime");
  assertKeys(fixture, ["experimentKey", "prepareTool", "cleanupTool", "resetStrategy", "destructive"], "fixtureReset");
  const kind = member(runtime.kind, ["docker", "external"] as const, "runtime.kind");
  const manifest: ApplicationManifest = {
    schemaVersion: member(value.schemaVersion, ["1.0.0"] as const, "schemaVersion"),
    appId: member(value.appId, APP_IDS, "appId"),
    benchmarkBaseVersion: text(value.benchmarkBaseVersion, "benchmarkBaseVersion", 120),
    source: {
      repository: text(source.repository, "source.repository", 500),
      commit: sha(source.commit, "source.commit"),
      ...(source.packageVersion === undefined ? {} : { packageVersion: text(source.packageVersion, "source.packageVersion", 120) }),
    },
    baseSuitePath: assertSafeRelativePath(value.baseSuitePath, "baseSuitePath"),
    runtime: {
      kind,
      version: text(runtime.version, "runtime.version", 120),
      ...(runtime.image === undefined ? {} : { image: text(runtime.image, "runtime.image", 300) }),
      ...(runtime.imageDigest === undefined ? {} : { imageDigest: text(runtime.imageDigest, "runtime.imageDigest", 300) }),
    },
    fixtureReset: {
      experimentKey: text(fixture.experimentKey, "fixtureReset.experimentKey", 100),
      prepareTool: member(fixture.prepareTool, ["prepare-fixture"] as const, "fixtureReset.prepareTool"),
      cleanupTool: member(fixture.cleanupTool, ["cleanup-experiment"] as const, "fixtureReset.cleanupTool"),
      resetStrategy: text(fixture.resetStrategy, "fixtureReset.resetStrategy", 500),
      destructive: fixture.destructive === true ? true : fixture.destructive === false ? false : (() => { throw new ContractError("fixtureReset.destructive must be boolean"); })(),
    },
    allowedTools: list(value.allowedTools, "allowedTools", (tool) => member(tool, TOOL_NAMES, "allowedTools item"), 1, TOOL_NAMES.length),
  };
  if (new Set(manifest.allowedTools).size !== manifest.allowedTools.length) throw new ContractError("allowedTools must not contain duplicates");
  if (kind === "docker" && (!manifest.runtime.image || !manifest.runtime.imageDigest || !/^sha256:[a-f0-9]{64}$/i.test(manifest.runtime.imageDigest))) {
    throw new ContractError("Docker runtime requires an image and a pinned sha256 digest");
  }
  if (!manifest.allowedTools.includes(manifest.fixtureReset.prepareTool) || !manifest.allowedTools.includes(manifest.fixtureReset.cleanupTool)) {
    throw new ContractError("fixture prepare/cleanup tools must be in the app allowlist");
  }
  return manifest;
}

export function parseBaselineInventory(input: unknown): BaselineInventory {
  const value = record(input, "BaselineInventory");
  assertKeys(value, ["appId", "sourceCommit", "sourceVersion", "collectedAt", "cases", "declaredBusinessCaseCount", "observedScenarioCount"], "BaselineInventory");
  const appId = member(value.appId, APP_IDS, "appId");
  const sourceCommit = sha(value.sourceCommit, "sourceCommit");
  const sourceVersion = text(value.sourceVersion, "sourceVersion", 120);
  const cases = list(value.cases, "cases", (item, index) => {
    const current = record(item, `cases[${index}]`);
    assertKeys(current, ["caseId", "gherkinPath", "scenarioName", "baseTestPaths", "behaviorTags", "sourceReferences"], `cases[${index}]`);
    const refs = list(current.sourceReferences, `cases[${index}].sourceReferences`, (ref) => parseEvidenceReference(ref), 1, 100);
    if (refs.some((ref) => ref.repositoryCommit !== sourceCommit || ref.sourceVersion !== sourceVersion)) throw new ContractError(`cases[${index}] evidence does not match inventory source pin`);
    return {
      caseId: text(current.caseId, `cases[${index}].caseId`, 120),
      gherkinPath: assertSafeRelativePath(current.gherkinPath, `cases[${index}].gherkinPath`),
      scenarioName: text(current.scenarioName, `cases[${index}].scenarioName`, 300),
      baseTestPaths: list(current.baseTestPaths, `cases[${index}].baseTestPaths`, (path) => assertSafeRelativePath(path), 0, 100),
      behaviorTags: list(current.behaviorTags, `cases[${index}].behaviorTags`, (tag) => text(tag, "behaviorTag", 100), 0, 100),
      sourceReferences: refs,
    };
  }, 0, 100_000);
  const observed = value.observedScenarioCount;
  if (!Number.isInteger(observed) || (observed as number) !== cases.length) throw new ContractError("observedScenarioCount must equal the measured cases length");
  const declared = value.declaredBusinessCaseCount;
  if (declared !== undefined && (!Number.isInteger(declared) || (declared as number) < 0)) throw new ContractError("declaredBusinessCaseCount must be a non-negative integer");
  return {
    appId, sourceCommit, sourceVersion, collectedAt: isoDate(value.collectedAt, "collectedAt"), cases,
    observedScenarioCount: observed as number,
    ...(declared === undefined ? {} : { declaredBusinessCaseCount: declared as number }),
  };
}

export function parseCoverageGap(input: unknown): CoverageGap {
  const value = record(input, "CoverageGap");
  assertKeys(value, ["gapId", "appId", "sourceCommit", "sourceVersion", "behavior", "rationale", "sourceReferences"], "CoverageGap");
  const appId = member(value.appId, APP_IDS, "appId");
  const sourceCommit = sha(value.sourceCommit, "sourceCommit");
  const sourceVersion = text(value.sourceVersion, "sourceVersion", 120);
  const sourceReferences = list(value.sourceReferences, "sourceReferences", parseEvidenceReference, 1, 100);
  if (sourceReferences.some((reference) => reference.repositoryCommit !== sourceCommit || reference.sourceVersion !== sourceVersion)) throw new ContractError("coverage-gap evidence does not match its source pin");
  return {
    gapId: text(value.gapId, "gapId", 120), appId, sourceCommit, sourceVersion,
    behavior: text(value.behavior, "behavior", 500), rationale: text(value.rationale, "rationale", 1_000), sourceReferences,
  };
}

export function parseCandidateScenario(input: unknown): CandidateScenario {
  const value = record(input, "CandidateScenario");
  assertKeys(value, ["candidateId", "appId", "sourceCommit", "sourceVersion", "revision", "gherkin", "preconditions", "oracle", "noveltyRationale", "sourceReferences", "reviewStatus"], "CandidateScenario");
  const appId = member(value.appId, APP_IDS, "appId");
  const revision = value.revision;
  if (!Number.isInteger(revision) || (revision as number) < 1) throw new ContractError("revision must be a positive integer");
  const status = member(value.reviewStatus, ["PROPOSED", "ACCEPTED_FOR_IMPLEMENTATION", "REVISION_REQUIRED", "REJECTED"] as const, "reviewStatus");
  const candidate: CandidateScenario = {
    candidateId: text(value.candidateId, "candidateId", 120), appId, sourceCommit: sha(value.sourceCommit, "sourceCommit"),
    sourceVersion: text(value.sourceVersion, "sourceVersion", 120), revision: revision as number,
    gherkin: text(value.gherkin, "gherkin", 20_000),
    preconditions: list(value.preconditions, "preconditions", (entry) => text(entry, "precondition", 1_000), 1, 100),
    oracle: list(value.oracle, "oracle", (entry) => text(entry, "oracle", 1_000), 1, 100),
    noveltyRationale: text(value.noveltyRationale, "noveltyRationale", 2_000),
    sourceReferences: list(value.sourceReferences, "sourceReferences", parseEvidenceReference, 1, 100),
    reviewStatus: status,
  };
  if (candidate.sourceReferences.some((ref) => ref.repositoryCommit !== candidate.sourceCommit || ref.sourceVersion !== candidate.sourceVersion)) throw new ContractError("candidate evidence does not match candidate source pin");
  return candidate;
}

export function parseHumanReviewDecision(input: unknown): HumanReviewDecision {
  const value = record(input, "HumanReviewDecision");
  assertKeys(value, ["decisionId", "runId", "threadId", "checkpointId", "candidateId", "candidateRevision", "appId", "reviewerId", "decision", "decidedAt", "rationale"], "HumanReviewDecision");
  const revision = value.candidateRevision;
  if (!Number.isInteger(revision) || (revision as number) < 1) throw new ContractError("candidateRevision must be a positive integer");
  return {
    decisionId: text(value.decisionId, "decisionId", 120), runId: text(value.runId, "runId", 120),
    threadId: text(value.threadId, "threadId", 200), checkpointId: text(value.checkpointId, "checkpointId", 200),
    candidateId: text(value.candidateId, "candidateId", 120),
    candidateRevision: revision as number, appId: member(value.appId, APP_IDS, "appId"),
    reviewerId: text(value.reviewerId, "reviewerId", 120), decision: member(value.decision, ["ACCEPT", "REVISE", "REJECT"] as const, "decision"),
    decidedAt: isoDate(value.decidedAt, "decidedAt"), rationale: text(value.rationale, "rationale", 2_000),
  };
}

export function parseWorkflowState(input: unknown): AgentWorkflowState {
  const value = record(input, "AgentWorkflowState");
  assertKeys(value, ["appId", "sourceCommit", "sourceVersion", "runId", "currentRole", "status", "candidate", "reviewDecisions", "appliedDecisionIds", "checkpoint", "artifacts", "repairAttempts", "lastError"], "AgentWorkflowState");
  const candidate = value.candidate === undefined ? undefined : parseCandidateScenario(value.candidate);
  const checkpointValue = value.checkpoint === undefined ? undefined : record(value.checkpoint, "checkpoint");
  if (checkpointValue) assertKeys(checkpointValue, ["threadId", "checkpointId", "pausedAt", "resumeStatus"], "checkpoint");
  const checkpoint: CheckpointReference | undefined = checkpointValue ? {
    threadId: text(checkpointValue.threadId, "checkpoint.threadId", 200),
    checkpointId: text(checkpointValue.checkpointId, "checkpoint.checkpointId", 200),
    pausedAt: isoDate(checkpointValue.pausedAt, "checkpoint.pausedAt"),
    resumeStatus: member(checkpointValue.resumeStatus, WORKFLOW_STATUSES, "checkpoint.resumeStatus"),
  } : undefined;
  const state: AgentWorkflowState = {
    appId: member(value.appId, APP_IDS, "appId"), sourceCommit: sha(value.sourceCommit, "sourceCommit"),
    sourceVersion: text(value.sourceVersion, "sourceVersion", 120), runId: text(value.runId, "runId", 120),
    currentRole: member(value.currentRole, AGENT_ROLES, "currentRole"), status: member(value.status, WORKFLOW_STATUSES, "status"),
    ...(candidate ? { candidate } : {}),
    reviewDecisions: list(value.reviewDecisions, "reviewDecisions", (decision) => parseHumanReviewDecision(decision), 0, 100),
    appliedDecisionIds: list(value.appliedDecisionIds, "appliedDecisionIds", (id) => text(id, "appliedDecisionId", 120), 0, 100),
    ...(checkpoint ? { checkpoint } : {}),
    artifacts: list(value.artifacts, "artifacts", (item) => {
      const artifact = record(item, "artifact");
      assertKeys(artifact, ["kind", "path", "candidateId", "revision"], "artifact");
      const revision = artifact.revision;
      if (revision !== undefined && (!Number.isInteger(revision) || (revision as number) < 1)) throw new ContractError("artifact revision must be a positive integer");
      return {
        kind: member(artifact.kind, ["baseline", "candidate", "generated_java", "validation", "log"] as const, "artifact.kind"),
        path: assertSafeRelativePath(artifact.path),
        ...(artifact.candidateId === undefined ? {} : { candidateId: text(artifact.candidateId, "artifact.candidateId", 120) }),
        ...(revision === undefined ? {} : { revision: revision as number }),
      };
    }, 0, 1_000),
    repairAttempts: value.repairAttempts as number,
    ...(value.lastError === undefined ? {} : { lastError: (() => {
      const error = record(value.lastError, "lastError");
      assertKeys(error, ["category", "message"], "lastError");
      return { category: text(error.category, "lastError.category", 120), message: sanitizeToolOutput(text(error.message, "lastError.message", 2_000)) };
    })() }),
  };
  if (!Number.isInteger(state.repairAttempts) || state.repairAttempts < 0 || state.repairAttempts > 2) throw new ContractError("repairAttempts must be an integer from 0 to 2");
  if (new Set(state.appliedDecisionIds).size !== state.appliedDecisionIds.length) throw new ContractError("appliedDecisionIds must be unique");
  if (new Set(state.reviewDecisions.map((decision) => decision.decisionId)).size !== state.reviewDecisions.length) throw new ContractError("review decision IDs must be unique");
  if (state.appliedDecisionIds.some((id) => !state.reviewDecisions.some((decision) => decision.decisionId === id))) throw new ContractError("applied decisions must exist in the review decision ledger");
  if (state.candidate && (state.candidate.appId !== state.appId || state.candidate.sourceCommit !== state.sourceCommit || state.candidate.sourceVersion !== state.sourceVersion)) {
    throw new ContractError("workflow candidate app/source pin does not match workflow state");
  }
  if (state.reviewDecisions.some((decision) => decision.appId !== state.appId || decision.candidateId !== state.candidate?.candidateId || decision.candidateRevision !== state.candidate.revision)) {
    throw new ContractError("workflow review decisions must refer to the active app, candidate, and revision");
  }
  if (state.status === "BLOCKED" && !state.checkpoint) throw new ContractError("BLOCKED workflow requires a resumable checkpoint reference");
  if (state.status === "BLOCKED" && !state.lastError) throw new ContractError("BLOCKED workflow requires a recorded error context");
  if (state.status === "FAILED" && !state.lastError) throw new ContractError("FAILED workflow requires a recorded error context");
  if (["AWAITING_HUMAN_REVIEW", "ACCEPTED_FOR_IMPLEMENTATION", "REVISION_REQUIRED", "REJECTED"].includes(state.status) && !state.candidate) {
    throw new ContractError(`${state.status} requires an active candidate`);
  }
  if (["ACCEPTED_FOR_IMPLEMENTATION", "JAVA_GENERATED", "VALIDATING", "REPAIRING", "EXECUTION_COMPLETED"].includes(state.status)) {
    const approved = state.candidate?.reviewStatus === "ACCEPTED_FOR_IMPLEMENTATION" && state.reviewDecisions.some((decision) => decision.decision === "ACCEPT" && decision.runId === state.runId && decision.candidateId === state.candidate?.candidateId && decision.candidateRevision === state.candidate.revision && state.appliedDecisionIds.includes(decision.decisionId));
    if (!approved) throw new ContractError(`${state.status} requires an applied human approval for the active candidate revision`);
  }
  if (state.status === "REJECTED" && state.candidate?.reviewStatus !== "REJECTED") throw new ContractError("REJECTED workflow requires a rejected candidate decision");
  if (state.status === "REVISION_REQUIRED" && state.candidate?.reviewStatus !== "REVISION_REQUIRED") throw new ContractError("REVISION_REQUIRED workflow requires a revision decision");
  return state;
}

export function sanitizeToolOutput(output: string): string {
  return output
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b(?:AIza[\w-]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/g, "[REDACTED_TOKEN]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[REDACTED]")
    .replace(/\b(password|passwd|token|secret|api[_-]?key)\b(?:\s*[:=]\s*|\s+(?:is\s+)?)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1=[REDACTED]");
}

export function parseToolRequest(input: unknown): ToolRequest {
  const value = record(input, "ToolRequest");
  const tool = member(value.tool, TOOL_NAMES, "tool");
  const allowedKeys: Record<ToolName, string[]> = {
    "read-baseline-inventory": ["tool", "appId", "sourceCommit", "inventoryPath"],
    "validate-gherkin": ["tool", "appId", "sourceCommit", "candidateId", "revision", "artifactPath"],
    "read-approved-manifest": ["tool", "appId", "sourceCommit", "manifestPath"],
    "generate-source-artifact": ["tool", "appId", "sourceCommit", "candidateId", "revision", "outputPath"],
    "compile-maven-project": ["tool", "appId", "sourceCommit", "candidateId", "revision", "projectPath"],
    "run-selenium-test": ["tool", "appId", "sourceCommit", "candidateId", "revision", "projectPath", "testClass"],
    "prepare-fixture": ["tool", "appId", "sourceCommit", "candidateId", "revision", "experimentKey"],
    "collect-test-evidence": ["tool", "appId", "sourceCommit", "runId", "artifactPath"],
    "cleanup-experiment": ["tool", "appId", "sourceCommit", "candidateId", "revision", "experimentKey"],
  };
  assertKeys(value, allowedKeys[tool], "ToolRequest");
  const appId = member(value.appId, APP_IDS, "appId");
  const sourceCommit = sha(value.sourceCommit, "sourceCommit");
  const candidate = () => ({ candidateId: text(value.candidateId, "candidateId", 120), revision: positiveInteger(value.revision, "revision") });
  switch (tool) {
    case "read-baseline-inventory": return { tool, appId, sourceCommit, inventoryPath: assertSafeRelativePath(value.inventoryPath, "inventoryPath") };
    case "validate-gherkin": return { tool, appId, sourceCommit, ...candidate(), artifactPath: assertSafeRelativePath(value.artifactPath, "artifactPath") };
    case "read-approved-manifest": return { tool, appId, sourceCommit, manifestPath: assertSafeRelativePath(value.manifestPath, "manifestPath") };
    case "generate-source-artifact": return { tool, appId, sourceCommit, ...candidate(), outputPath: assertSafeRelativePath(value.outputPath, "outputPath") };
    case "compile-maven-project": return { tool, appId, sourceCommit, ...candidate(), projectPath: assertSafeRelativePath(value.projectPath, "projectPath") };
    case "run-selenium-test": return {
      tool, appId, sourceCommit, ...candidate(), projectPath: assertSafeRelativePath(value.projectPath, "projectPath"),
      testClass: text(value.testClass, "testClass", 200),
    };
    case "prepare-fixture": return { tool, appId, sourceCommit, ...candidate(), experimentKey: text(value.experimentKey, "experimentKey", 100) };
    case "collect-test-evidence": return { tool, appId, sourceCommit, runId: text(value.runId, "runId", 120), artifactPath: assertSafeRelativePath(value.artifactPath, "artifactPath") };
    case "cleanup-experiment": return { tool, appId, sourceCommit, ...candidate(), experimentKey: text(value.experimentKey, "experimentKey", 100) };
  }
}

export function parseToolResult(input: unknown): ToolResult {
  const value = record(input, "ToolResult");
  assertKeys(value, ["tool", "outcome", "exitCode", "stdout", "stderr", "evidence"], "ToolResult");
  const exitCode = value.exitCode;
  if (exitCode !== undefined && (!Number.isInteger(exitCode) || (exitCode as number) < 0)) throw new ContractError("exitCode must be a non-negative integer");
  return {
    tool: member(value.tool, TOOL_NAMES, "tool"), outcome: member(value.outcome, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "outcome"),
    ...(exitCode === undefined ? {} : { exitCode: exitCode as number }),
    stdout: sanitizeToolOutput(outputText(value.stdout ?? "", "stdout")),
    stderr: sanitizeToolOutput(outputText(value.stderr ?? "", "stderr")),
    evidence: list(value.evidence ?? [], "evidence", parseEvidenceReference, 0, 1_000),
  };
}

export function parseValidationResult(input: unknown): ValidationResult {
  const value = record(input, "ValidationResult");
  assertKeys(value, ["appId", "candidateId", "candidateRevision", "sourceCommit", "sourceVersion", "compile", "fixture", "e2e", "oracle", "cleanup", "repeats", "repairAttempts", "noveltyAndOracleApproved", "evidence", "researchStatus"], "ValidationResult");
  const repeats = list(value.repeats, "repeats", (outcome) => member(outcome, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "repeat outcome"), 0, 3);
  const attempts = value.repairAttempts;
  if (!Number.isInteger(attempts) || (attempts as number) < 0 || (attempts as number) > 2) throw new ContractError("repairAttempts must be an integer from 0 to 2");
  if (typeof value.noveltyAndOracleApproved !== "boolean") throw new ContractError("noveltyAndOracleApproved must be boolean");
  const evidence = list(value.evidence, "evidence", parseEvidenceReference, 0, 1_000);
  const result: ValidationResult = {
    appId: member(value.appId, APP_IDS, "appId"), candidateId: text(value.candidateId, "candidateId", 120),
    candidateRevision: positiveInteger(value.candidateRevision, "candidateRevision"), sourceCommit: sha(value.sourceCommit, "sourceCommit"),
    sourceVersion: text(value.sourceVersion, "sourceVersion", 120),
    compile: member(value.compile, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "compile"),
    fixture: member(value.fixture, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "fixture"),
    e2e: member(value.e2e, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "e2e"),
    oracle: member(value.oracle, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "oracle"),
    cleanup: member(value.cleanup, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "cleanup"),
    repeats, repairAttempts: attempts as number, noveltyAndOracleApproved: value.noveltyAndOracleApproved,
    evidence, researchStatus: member(value.researchStatus, ["NOT_EVALUATED", "VALIDATED"] as const, "researchStatus"),
  };
  const canValidate = result.noveltyAndOracleApproved && result.compile === "PASS" && result.fixture === "PASS" && result.e2e === "PASS" && result.oracle === "PASS" && result.cleanup === "PASS" && result.repeats.length === 3 && result.repeats.every((outcome) => outcome === "PASS") && result.evidence.length > 0 && result.evidence.every((ref) => ref.repositoryCommit === result.sourceCommit && ref.sourceVersion === result.sourceVersion);
  if (result.researchStatus === "VALIDATED" && !canValidate) throw new ContractError("VALIDATED requires approved novelty/oracle, passing compile/fixture/E2E/oracle/cleanup, 3/3 repeats, and pinned evidence");
  if (canValidate && result.researchStatus !== "VALIDATED") throw new ContractError("Complete validation evidence must be classified VALIDATED");
  return result;
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) throw new ContractError(`${label} must be a positive integer`);
  return value as number;
}

function outputText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length > 100_000) throw new ContractError(`${label} must be a string no longer than 100000 characters`);
  return value;
}
