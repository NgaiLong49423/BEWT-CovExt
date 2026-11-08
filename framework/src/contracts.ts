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
  runtime: DockerRuntime | SourceBuiltRuntime | ExternalRuntime;
  fixtureReset: {
    experimentKey: string;
    prepareTool: "prepare-fixture";
    cleanupTool: "cleanup-experiment";
    resetStrategy: string;
    destructive: boolean;
  };
  allowedTools: ToolName[];
}

export interface DockerRuntime {
  kind: "docker";
  version: string;
  image: string;
  imageDigest: string;
}

/** Pins a locally built image by its source inputs without mislabeling its image ID as a registry digest. */
export interface SourceBuiltRuntime {
  kind: "source-built";
  version: string;
  image: string;
  sourceCommit: string;
  buildContextPath: string;
  buildContextDigestAlgorithm: "path-nul-sha256-newline-v1";
  buildContextSha256: string;
  dockerfilePath: string;
  dockerfileSha256: string;
  observedImageId: string;
  auxiliaryImages?: Array<{ image: string; observedImageId: string }>;
}

export interface ExternalRuntime {
  kind: "external";
  version: string;
  image?: string;
  imageDigest?: string;
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
  testClass?: string;
  origin?: "GENERATED" | "REUSED" | "REPAIRED";
  sha256?: string;
}

export interface GeneratedJavaArtifact extends WorkflowArtifact {
  kind: "generated_java";
  candidateId: string;
  revision: number;
  testClass: string;
}

export interface AgentWorkflowState {
  appId: AppId;
  sourceCommit: string;
  sourceVersion: string;
  runId: string;
  validationInvocationId?: string;
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
  | { tool: "run-selenium-test"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; projectPath: string; generatedArtifactPath: string; testClass: string }
  | { tool: "prepare-fixture"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; experimentKey: string }
  | { tool: "collect-test-evidence"; appId: AppId; sourceCommit: string; runId: string; artifactPath: string }
  | { tool: "cleanup-experiment"; appId: AppId; sourceCommit: string; candidateId: string; revision: number; experimentKey: string };

export interface ToolResult {
  tool: ToolName;
  outcome: Outcome;
  failureClassification?: ExecutionReference["failureClassification"];
  exitCode?: number;
  stdout: string;
  stderr: string;
  evidence: EvidenceReference[];
}

/** App-specific effects live behind this shared contract, never in graph policy. */
export interface ApplicationAdapter {
  readonly manifest: ApplicationManifest;
  readBaseline(): Promise<BaselineInventory>;
  prepareFixture(candidate: CandidateScenario, experimentKey: string, state: AgentWorkflowState): Promise<ToolResult>;
  compile(candidate: CandidateScenario): Promise<ToolResult>;
  runSelenium(candidate: CandidateScenario, generatedArtifact: GeneratedJavaArtifact, state: AgentWorkflowState): Promise<ToolResult>;
  collectEvidence(runId: string, invocationId?: string): Promise<EvidenceReference[]>;
  cleanup(candidate: CandidateScenario, experimentKey: string, state: AgentWorkflowState): Promise<ToolResult>;
}

export interface ExecutionReference {
  invocationId: string;
  stageRunId?: string;
  outcome: Outcome;
  failureClassification?: "GENERATED_TEST_DEFECT" | "APPLICATION_BEHAVIOR" | "ENVIRONMENT_OR_HARNESS" | "UNCLASSIFIED";
  sourceCommit: string;
  sourceVersion: string;
  evidence: EvidenceReference[];
}

export interface RepeatValidationRecord {
  invocationId: string;
  sourceCommit: string;
  sourceVersion: string;
  compile: ExecutionReference;
  fixture: ExecutionReference;
  e2e: ExecutionReference;
  cleanup: ExecutionReference;
}

export interface RecordedDecision {
  decisionId: string;
  appId: AppId;
  candidateId: string;
  candidateRevision: number;
  decision: "APPROVED" | "REJECTED" | "UNVERIFIED";
  reviewerId: string;
  decidedAt: string;
  rationale: string;
  evidence: EvidenceReference[];
}

export interface ResearchAcceptance {
  status: "NOT_REVIEWED" | "ACCEPTED" | "REJECTED" | "UNVERIFIED";
  decision?: RecordedDecision;
}

export type TechnicalEligibility = "ELIGIBLE" | "INELIGIBLE" | "UNVERIFIED";

export interface ValidationResult {
  appId: AppId;
  candidateId: string;
  candidateRevision: number;
  invocationId: string;
  artifact: { path: string; sha256: string; origin: "GENERATED" | "REUSED" | "REPAIRED" };
  sourceCommit: string;
  sourceVersion: string;
  compile: ExecutionReference;
  fixture: ExecutionReference;
  e2e: ExecutionReference;
  cleanup: ExecutionReference;
  oracleDecision: RecordedDecision;
  noveltyDecision: RecordedDecision;
  repeats: RepeatValidationRecord[];
  repairAttempts: number;
  evidence: EvidenceReference[];
  technicalEligibility: TechnicalEligibility;
  researchAcceptance: ResearchAcceptance;
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

function sha256(value: unknown, label: string): string {
  const parsed = text(value, label, 64);
  if (!/^[a-f0-9]{64}$/i.test(parsed)) throw new ContractError(`${label} must be a full 64-character SHA-256 hex digest`);
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
  assertKeys(fixture, ["experimentKey", "prepareTool", "cleanupTool", "resetStrategy", "destructive"], "fixtureReset");
  const kind = member(runtime.kind, ["docker", "source-built", "external"] as const, "runtime.kind");
  assertKeys(runtime, kind === "source-built"
    ? ["kind", "version", "image", "sourceCommit", "buildContextPath", "buildContextDigestAlgorithm", "buildContextSha256", "dockerfilePath", "dockerfileSha256", "observedImageId", "auxiliaryImages"]
    : ["kind", "version", "image", "imageDigest"], "runtime");
  const parsedRuntime: ApplicationManifest["runtime"] = kind === "source-built" ? {
    kind,
    version: text(runtime.version, "runtime.version", 120),
    image: text(runtime.image, "runtime.image", 300),
    sourceCommit: sha(runtime.sourceCommit, "runtime.sourceCommit"),
    buildContextPath: assertSafeRelativePath(runtime.buildContextPath, "runtime.buildContextPath"),
    buildContextDigestAlgorithm: member(runtime.buildContextDigestAlgorithm, ["path-nul-sha256-newline-v1"] as const, "runtime.buildContextDigestAlgorithm"),
    buildContextSha256: sha256(runtime.buildContextSha256, "runtime.buildContextSha256"),
    dockerfilePath: assertSafeRelativePath(runtime.dockerfilePath, "runtime.dockerfilePath"),
    dockerfileSha256: sha256(runtime.dockerfileSha256, "runtime.dockerfileSha256"),
    observedImageId: `sha256:${sha256(typeof runtime.observedImageId === "string" ? runtime.observedImageId.replace(/^sha256:/, "") : runtime.observedImageId, "runtime.observedImageId")}`,
    ...(runtime.auxiliaryImages === undefined ? {} : { auxiliaryImages: list(runtime.auxiliaryImages, "runtime.auxiliaryImages", (item, index) => {
      const image = record(item, `runtime.auxiliaryImages[${index}]`);
      assertKeys(image, ["image", "observedImageId"], `runtime.auxiliaryImages[${index}]`);
      const rawImageId = typeof image.observedImageId === "string" ? image.observedImageId.replace(/^sha256:/, "") : image.observedImageId;
      return { image: text(image.image, `runtime.auxiliaryImages[${index}].image`, 300), observedImageId: `sha256:${sha256(rawImageId, `runtime.auxiliaryImages[${index}].observedImageId`)}` };
    }, 0, 20) }),
  } : kind === "docker" ? {
    kind,
    version: text(runtime.version, "runtime.version", 120),
    image: text(runtime.image, "runtime.image", 300),
    imageDigest: typeof runtime.imageDigest === "string" && /^sha256:[a-f0-9]{64}$/i.test(runtime.imageDigest)
      ? runtime.imageDigest
      : (() => { throw new ContractError("Docker runtime requires an image and a pinned sha256 digest"); })(),
  } : {
    kind,
    version: text(runtime.version, "runtime.version", 120),
    ...(runtime.image === undefined ? {} : { image: text(runtime.image, "runtime.image", 300) }),
    ...(runtime.imageDigest === undefined ? {} : { imageDigest: text(runtime.imageDigest, "runtime.imageDigest", 300) }),
  };
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
    runtime: parsedRuntime,
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
  if (manifest.runtime.kind === "docker" && (!manifest.runtime.image || !manifest.runtime.imageDigest || !/^sha256:[a-f0-9]{64}$/i.test(manifest.runtime.imageDigest))) {
    throw new ContractError("Docker runtime requires an image and a pinned sha256 digest");
  }
  if (manifest.runtime.kind === "source-built" && manifest.runtime.sourceCommit !== manifest.source.commit) {
    throw new ContractError("source-built runtime commit must match the application source pin");
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
  assertKeys(value, ["appId", "sourceCommit", "sourceVersion", "runId", "validationInvocationId", "currentRole", "status", "candidate", "reviewDecisions", "appliedDecisionIds", "checkpoint", "artifacts", "repairAttempts", "lastError"], "AgentWorkflowState");
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
    ...(value.validationInvocationId === undefined ? {} : { validationInvocationId: text(value.validationInvocationId, "validationInvocationId", 120) }),
    currentRole: member(value.currentRole, AGENT_ROLES, "currentRole"), status: member(value.status, WORKFLOW_STATUSES, "status"),
    ...(candidate ? { candidate } : {}),
    reviewDecisions: list(value.reviewDecisions, "reviewDecisions", (decision) => parseHumanReviewDecision(decision), 0, 100),
    appliedDecisionIds: list(value.appliedDecisionIds, "appliedDecisionIds", (id) => text(id, "appliedDecisionId", 120), 0, 100),
    ...(checkpoint ? { checkpoint } : {}),
    artifacts: list(value.artifacts, "artifacts", (item) => {
      const artifact = record(item, "artifact");
      assertKeys(artifact, ["kind", "path", "candidateId", "revision", "testClass", "origin", "sha256"], "artifact");
      const revision = artifact.revision;
      if (revision !== undefined && (!Number.isInteger(revision) || (revision as number) < 1)) throw new ContractError("artifact revision must be a positive integer");
      const kind = member(artifact.kind, ["baseline", "candidate", "generated_java", "validation", "log"] as const, "artifact.kind");
      const candidateId = artifact.candidateId === undefined ? undefined : text(artifact.candidateId, "artifact.candidateId", 120);
      const testClass = artifact.testClass === undefined ? undefined : javaClassName(artifact.testClass, "artifact.testClass");
      const origin = artifact.origin === undefined ? undefined : member(artifact.origin, ["GENERATED", "REUSED", "REPAIRED"] as const, "artifact.origin");
      const artifactSha = artifact.sha256 === undefined ? undefined : sha256(artifact.sha256, "artifact.sha256");
      if (kind === "generated_java" && (!candidateId || revision === undefined || !testClass)) throw new ContractError("generated Java artifact requires candidate ID, revision, and test class binding");
      if (kind !== "generated_java" && testClass !== undefined) throw new ContractError("testClass is only valid for generated Java artifacts");
      if (kind !== "generated_java" && (origin !== undefined || artifactSha !== undefined)) throw new ContractError("artifact origin and SHA-256 are only valid for generated Java artifacts");
      return {
        kind,
        path: assertSafeRelativePath(artifact.path),
        ...(candidateId === undefined ? {} : { candidateId }),
        ...(revision === undefined ? {} : { revision: revision as number }),
        ...(testClass === undefined ? {} : { testClass }),
        ...(origin === undefined ? {} : { origin }),
        ...(artifactSha === undefined ? {} : { sha256: artifactSha }),
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
  if (new Set(state.reviewDecisions.map((decision) => decision.candidateRevision)).size !== state.reviewDecisions.length) throw new ContractError("each candidate revision may have only one review decision");
  if (state.appliedDecisionIds.some((id) => !state.reviewDecisions.some((decision) => decision.decisionId === id))) throw new ContractError("applied decisions must exist in the review decision ledger");
  if (state.candidate && (state.candidate.appId !== state.appId || state.candidate.sourceCommit !== state.sourceCommit || state.candidate.sourceVersion !== state.sourceVersion)) {
    throw new ContractError("workflow candidate app/source pin does not match workflow state");
  }
  if (state.reviewDecisions.some((decision) => decision.appId !== state.appId || decision.runId !== state.runId || decision.candidateId !== state.candidate?.candidateId || decision.candidateRevision > (state.candidate?.revision ?? 0))) {
    throw new ContractError("workflow review history must refer to this run, app, candidate, and an existing revision");
  }
  if (state.status === "BLOCKED" && !state.checkpoint) throw new ContractError("BLOCKED workflow requires a resumable checkpoint reference");
  if (state.status === "BLOCKED" && !state.lastError) throw new ContractError("BLOCKED workflow requires a recorded error context");
  if (state.status === "FAILED" && !state.lastError) throw new ContractError("FAILED workflow requires a recorded error context");
  if (["AWAITING_HUMAN_REVIEW", "ACCEPTED_FOR_IMPLEMENTATION", "REVISION_REQUIRED", "REJECTED"].includes(state.status) && !state.candidate) {
    throw new ContractError(`${state.status} requires an active candidate`);
  }
  if (state.status === "AWAITING_HUMAN_REVIEW" && state.checkpoint && state.reviewDecisions.some((decision) => decision.checkpointId === state.checkpoint?.checkpointId)) {
    throw new ContractError("active human-review checkpoint must be unused by prior decisions");
  }
  if (["ACCEPTED_FOR_IMPLEMENTATION", "JAVA_GENERATED", "VALIDATING", "REPAIRING", "EXECUTION_COMPLETED"].includes(state.status)) {
    const approved = state.candidate?.reviewStatus === "ACCEPTED_FOR_IMPLEMENTATION" && state.reviewDecisions.some((decision) => decision.decision === "ACCEPT" && decision.runId === state.runId && decision.candidateId === state.candidate?.candidateId && decision.candidateRevision === state.candidate.revision && state.appliedDecisionIds.includes(decision.decisionId));
    if (!approved) throw new ContractError(`${state.status} requires an applied human approval for the active candidate revision`);
  }
  if (state.status === "REJECTED" && (state.candidate?.reviewStatus !== "REJECTED" || !state.reviewDecisions.some((decision) => decision.decision === "REJECT" && decision.candidateRevision === state.candidate?.revision && state.appliedDecisionIds.includes(decision.decisionId)))) {
    throw new ContractError("REJECTED workflow requires an applied reject decision for the active revision");
  }
  if (state.status === "REVISION_REQUIRED" && (state.candidate?.reviewStatus !== "REVISION_REQUIRED" || !state.reviewDecisions.some((decision) => decision.decision === "REVISE" && decision.candidateRevision === state.candidate?.revision && state.appliedDecisionIds.includes(decision.decisionId)))) {
    throw new ContractError("REVISION_REQUIRED workflow requires an applied revise decision for the active revision");
  }
  return state;
}

export function sanitizeToolOutput(output: string): string {
  return output
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b(?:AIza[\w-]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/g, "[REDACTED_TOKEN]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[REDACTED]")
    .replace(/Host info:\s*host:\s*'[^']*',\s*ip:\s*'[^']*'/gi, "Host info: host: '[REDACTED_HOST]', ip: '[REDACTED_IP]'")
    .replace(/\b(?:DESKTOP|LAPTOP)-[A-Z0-9-]+\b/gi, "[REDACTED_HOST]")
    .replace(/\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b/g, "[REDACTED_PRIVATE_IP]")
    .replace(/\/?[A-Z]:\/Users\/[^:\r\n]+(?=:)/gi, "[REDACTED_USER_PATH]")
    .replace(/[A-Z]:\\Users\\[^\\\s"'<>]+(?:\\[^\\\s"'<>]+)*/gi, "[REDACTED_USER_PATH]")
    .replace(/\/?[A-Z]:\/Users\/[^/\s"'<>]+(?:\/[^/\s"'<>]+)*/gi, "[REDACTED_USER_PATH]")
    .replace(/\/?[A-Z]:[\\/][^:\r\n]+(?=:)/gi, "[REDACTED_ABSOLUTE_PATH]")
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
    "run-selenium-test": ["tool", "appId", "sourceCommit", "candidateId", "revision", "projectPath", "generatedArtifactPath", "testClass"],
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
      generatedArtifactPath: assertSafeRelativePath(value.generatedArtifactPath, "generatedArtifactPath"),
      testClass: javaClassName(value.testClass, "testClass"),
    };
    case "prepare-fixture": return { tool, appId, sourceCommit, ...candidate(), experimentKey: text(value.experimentKey, "experimentKey", 100) };
    case "collect-test-evidence": return { tool, appId, sourceCommit, runId: text(value.runId, "runId", 120), artifactPath: assertSafeRelativePath(value.artifactPath, "artifactPath") };
    case "cleanup-experiment": return { tool, appId, sourceCommit, ...candidate(), experimentKey: text(value.experimentKey, "experimentKey", 100) };
  }
}

export function parseToolResult(input: unknown): ToolResult {
  const value = record(input, "ToolResult");
  assertKeys(value, ["tool", "outcome", "failureClassification", "exitCode", "stdout", "stderr", "evidence"], "ToolResult");
  const exitCode = value.exitCode;
  if (exitCode !== undefined && (!Number.isInteger(exitCode) || (exitCode as number) < 0)) throw new ContractError("exitCode must be a non-negative integer");
  const outcome = member(value.outcome, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, "outcome");
  const failureClassification = value.failureClassification === undefined ? undefined : member(value.failureClassification, ["GENERATED_TEST_DEFECT", "APPLICATION_BEHAVIOR", "ENVIRONMENT_OR_HARNESS", "UNCLASSIFIED"] as const, "failureClassification");
  if (failureClassification !== undefined && outcome !== "FAIL") throw new ContractError("failureClassification is only valid for a FAIL tool outcome");
  return {
    tool: member(value.tool, TOOL_NAMES, "tool"), outcome,
    ...(failureClassification === undefined ? {} : { failureClassification }),
    ...(exitCode === undefined ? {} : { exitCode: exitCode as number }),
    stdout: sanitizeToolOutput(outputText(value.stdout ?? "", "stdout")),
    stderr: sanitizeToolOutput(outputText(value.stderr ?? "", "stderr")),
    evidence: list(value.evidence ?? [], "evidence", parseEvidenceReference, 0, 1_000),
  };
}

export function parseValidationResult(input: unknown): ValidationResult {
  const value = record(input, "ValidationResult");
  assertKeys(value, ["appId", "candidateId", "candidateRevision", "invocationId", "artifact", "sourceCommit", "sourceVersion", "compile", "fixture", "e2e", "cleanup", "oracleDecision", "noveltyDecision", "repeats", "repairAttempts", "evidence", "technicalEligibility", "researchAcceptance"], "ValidationResult");
  const declaredEligibility = value.technicalEligibility === undefined ? undefined : member(value.technicalEligibility, ["ELIGIBLE", "INELIGIBLE", "UNVERIFIED"] as const, "technicalEligibility");
  const appId = member(value.appId, APP_IDS, "appId");
  const candidateId = text(value.candidateId, "candidateId", 120);
  const candidateRevision = positiveInteger(value.candidateRevision, "candidateRevision");
  const invocationId = text(value.invocationId, "invocationId", 120);
  const artifactInput = record(value.artifact, "artifact");
  assertKeys(artifactInput, ["path", "sha256", "origin"], "ValidationResult.artifact");
  const artifact = { path: assertSafeRelativePath(artifactInput.path, "ValidationResult.artifact.path"),
    sha256: sha256(artifactInput.sha256, "ValidationResult.artifact.sha256"),
    origin: member(artifactInput.origin, ["GENERATED", "REUSED", "REPAIRED"] as const, "ValidationResult.artifact.origin") };
  const sourceCommit = sha(value.sourceCommit, "sourceCommit");
  const sourceVersion = text(value.sourceVersion, "sourceVersion", 120);
  const compile = parseExecutionReference(value.compile, "compile");
  const fixture = parseExecutionReference(value.fixture, "fixture");
  const e2e = parseExecutionReference(value.e2e, "e2e");
  const cleanup = parseExecutionReference(value.cleanup, "cleanup");
  const oracleDecision = parseRecordedDecision(value.oracleDecision, "oracleDecision");
  const noveltyDecision = parseRecordedDecision(value.noveltyDecision, "noveltyDecision");
  for (const decision of [oracleDecision, noveltyDecision]) assertDecisionTarget(decision, appId, candidateId, candidateRevision, "validation decision");
  const repeats = list(value.repeats, "repeats", (item, index) => {
    const repeat = record(item, `repeats[${index}]`);
    assertKeys(repeat, ["invocationId", "sourceCommit", "sourceVersion", "compile", "fixture", "e2e", "cleanup"], `repeats[${index}]`);
    return {
      invocationId: text(repeat.invocationId, `repeats[${index}].invocationId`, 120),
      sourceCommit: sha(repeat.sourceCommit, `repeats[${index}].sourceCommit`),
      sourceVersion: text(repeat.sourceVersion, `repeats[${index}].sourceVersion`, 120),
      compile: parseExecutionReference(repeat.compile, `repeats[${index}].compile`),
      fixture: parseExecutionReference(repeat.fixture, `repeats[${index}].fixture`),
      e2e: parseExecutionReference(repeat.e2e, `repeats[${index}].e2e`),
      cleanup: parseExecutionReference(repeat.cleanup, `repeats[${index}].cleanup`),
    };
  }, 0, 3);
  const attempts = value.repairAttempts;
  if (!Number.isInteger(attempts) || (attempts as number) < 0 || (attempts as number) > 2) throw new ContractError("repairAttempts must be an integer from 0 to 2");
  const evidence = list(value.evidence, "evidence", parseEvidenceReference, 0, 1_000);
  const acceptanceInput = record(value.researchAcceptance, "researchAcceptance");
  assertKeys(acceptanceInput, ["status", "decision"], "researchAcceptance");
  const acceptanceStatus = member(acceptanceInput.status, ["NOT_REVIEWED", "ACCEPTED", "REJECTED", "UNVERIFIED"] as const, "researchAcceptance.status");
  const acceptance: ResearchAcceptance = {
    status: acceptanceStatus,
    ...(acceptanceInput.decision === undefined ? {} : { decision: parseRecordedDecision(acceptanceInput.decision, "researchAcceptance.decision") }),
  };
  if (acceptance.decision) assertDecisionTarget(acceptance.decision, appId, candidateId, candidateRevision, "research acceptance decision");
  const resultBase = { appId, candidateId, candidateRevision, invocationId, artifact, sourceCommit, sourceVersion, compile, fixture, e2e, cleanup, oracleDecision, noveltyDecision, repeats, repairAttempts: attempts as number, evidence, researchAcceptance: acceptance };
  for (const [stage, reference] of [["compile", compile], ["fixture", fixture], ["e2e", e2e], ["cleanup", cleanup]] as const) {
    assertExecutionPin(reference, invocationId, sourceCommit, sourceVersion, stage);
  }
  const invocationIds = [invocationId, ...repeats.map((repeat) => repeat.invocationId)];
  if (new Set(invocationIds).size !== invocationIds.length) throw new ContractError("validation and repeat invocation IDs must be distinct");
  for (const [index, repeat] of repeats.entries()) {
    if (repeat.sourceCommit !== sourceCommit || repeat.sourceVersion !== sourceVersion) throw new ContractError(`repeats[${index}] source pin does not match validation result`);
    for (const stage of ["compile", "fixture", "e2e", "cleanup"] as const) {
      const reference = repeat[stage];
      assertExecutionPin(reference, repeat.invocationId, sourceCommit, sourceVersion, `repeats[${index}].${stage}`);
    }
  }
  const allReferences = [compile, fixture, e2e, cleanup, ...repeats.flatMap((repeat) => [repeat.compile, repeat.fixture, repeat.e2e, repeat.cleanup])];
  const decisionIds = [oracleDecision.decisionId, noveltyDecision.decisionId, ...(acceptance.decision ? [acceptance.decision.decisionId] : [])];
  if (new Set(decisionIds).size !== decisionIds.length) throw new ContractError("validation decision IDs must be distinct");
  const allEvidence = [...evidence, ...allReferences.flatMap((reference) => reference.evidence), ...oracleDecision.evidence, ...noveltyDecision.evidence, ...(acceptance.decision?.evidence ?? [])];
  const evidenceKeys = allEvidence.map((item) => `${item.runId}:${item.artifactPath}`);
  if (new Set(evidenceKeys).size !== evidenceKeys.length) throw new ContractError("validation evidence references must not be duplicated");
  for (const reference of allEvidence) {
    if (reference.repositoryCommit !== sourceCommit || reference.sourceVersion !== sourceVersion) throw new ContractError("validation evidence source pin does not match result");
  }
  const executionOutcomes = allReferences.map((reference) => reference.outcome);
  const technicalEligibility: TechnicalEligibility = executionOutcomes.some((outcome) => outcome === "FAIL")
    ? "INELIGIBLE"
    : executionOutcomes.every((outcome) => outcome === "PASS") && repeats.length === 3
      ? "ELIGIBLE"
      : "UNVERIFIED";
  if (declaredEligibility !== undefined && declaredEligibility !== technicalEligibility) throw new ContractError("declared technicalEligibility does not match the execution records");
  if (acceptance.status === "ACCEPTED") {
    if (!acceptance.decision || acceptance.decision.decision !== "APPROVED" || acceptance.decision.evidence.length === 0) throw new ContractError("ACCEPTED research status requires a recorded approval decision and evidence");
    if (technicalEligibility !== "ELIGIBLE" || oracleDecision.decision !== "APPROVED" || noveltyDecision.decision !== "APPROVED") throw new ContractError("research acceptance requires technical eligibility and approved oracle/novelty decisions");
  } else if (acceptance.status === "REJECTED") {
    if (acceptance.decision?.decision !== "REJECTED") throw new ContractError("REJECTED research status requires a recorded rejection decision");
  } else if (acceptance.decision?.decision === "APPROVED" || acceptance.decision?.decision === "REJECTED") {
    throw new ContractError("acceptance decision and researchAcceptance status must agree");
  }
  const result: ValidationResult = { ...resultBase, technicalEligibility };
  return result;
}

function parseExecutionReference(input: unknown, label: string): ExecutionReference {
  const value = record(input, label);
  assertKeys(value, ["invocationId", "stageRunId", "outcome", "failureClassification", "sourceCommit", "sourceVersion", "evidence"], label);
  const outcome = member(value.outcome, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "INCONCLUSIVE"] as const, `${label}.outcome`);
  const failureClassification = value.failureClassification === undefined ? undefined : member(value.failureClassification, ["GENERATED_TEST_DEFECT", "APPLICATION_BEHAVIOR", "ENVIRONMENT_OR_HARNESS", "UNCLASSIFIED"] as const, `${label}.failureClassification`);
  if (failureClassification !== undefined && outcome !== "FAIL") throw new ContractError(`${label} failure classification is only valid for FAIL outcomes`);
  const stageRunId = value.stageRunId === undefined ? undefined : text(value.stageRunId, `${label}.stageRunId`, 120);
  const evidence = list(value.evidence, `${label}.evidence`, parseEvidenceReference, 0, 1_000);
  if (outcome === "NOT_RUN" && (stageRunId !== undefined || evidence.length > 0)) throw new ContractError(`${label} NOT_RUN stage must not invent a stage run or evidence`);
  if (outcome === "BLOCKED" && stageRunId === undefined && evidence.length > 0) throw new ContractError(`${label} blocked stage without a run cannot reference execution evidence`);
  if (outcome !== "NOT_RUN" && outcome !== "BLOCKED" && (stageRunId === undefined || evidence.length === 0)) {
    throw new ContractError(`${label} ${outcome} stage requires a stage run ID and evidence`);
  }
  if (stageRunId !== undefined && evidence.length === 0) throw new ContractError(`${label} stage run ID requires evidence`);
  return {
    invocationId: text(value.invocationId, `${label}.invocationId`, 120),
    ...(stageRunId === undefined ? {} : { stageRunId }),
    outcome,
    ...(failureClassification === undefined ? {} : { failureClassification }),
    sourceCommit: sha(value.sourceCommit, `${label}.sourceCommit`),
    sourceVersion: text(value.sourceVersion, `${label}.sourceVersion`, 120),
    evidence,
  };
}

function parseRecordedDecision(input: unknown, label: string): RecordedDecision {
  const value = record(input, label);
  assertKeys(value, ["decisionId", "appId", "candidateId", "candidateRevision", "decision", "reviewerId", "decidedAt", "rationale", "evidence"], label);
  return {
    decisionId: text(value.decisionId, `${label}.decisionId`, 120),
    appId: member(value.appId, APP_IDS, `${label}.appId`),
    candidateId: text(value.candidateId, `${label}.candidateId`, 120),
    candidateRevision: positiveInteger(value.candidateRevision, `${label}.candidateRevision`),
    decision: member(value.decision, ["APPROVED", "REJECTED", "UNVERIFIED"] as const, `${label}.decision`),
    reviewerId: text(value.reviewerId, `${label}.reviewerId`, 120),
    decidedAt: isoDate(value.decidedAt, `${label}.decidedAt`),
    rationale: text(value.rationale, `${label}.rationale`, 2_000),
    evidence: list(value.evidence, `${label}.evidence`, parseEvidenceReference, value.decision === "UNVERIFIED" ? 0 : 1, 1_000),
  };
}

function assertDecisionTarget(decision: RecordedDecision, appId: AppId, candidateId: string, revision: number, label: string): void {
  if (decision.appId !== appId || decision.candidateId !== candidateId || decision.candidateRevision !== revision) {
    throw new ContractError(`${label} must reference the validation app, candidate, and revision`);
  }
}

function assertExecutionPin(reference: ExecutionReference, invocationId: string, sourceCommit: string, sourceVersion: string, label: string): void {
  if (reference.invocationId !== invocationId) throw new ContractError(`${label} stage invocation ID does not match its validation invocation`);
  if (reference.sourceCommit !== sourceCommit || reference.sourceVersion !== sourceVersion) throw new ContractError(`${label} source pin does not match validation result`);
  if (reference.evidence.some((item) => item.runId !== reference.stageRunId || item.repositoryCommit !== sourceCommit || item.sourceVersion !== sourceVersion)) {
    throw new ContractError(`${label} evidence does not match its stage run and source pin`);
  }
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) throw new ContractError(`${label} must be a positive integer`);
  return value as number;
}

function outputText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length > 100_000) throw new ContractError(`${label} must be a string no longer than 100000 characters`);
  return value;
}

function javaClassName(value: unknown, label: string): string {
  const parsed = text(value, label, 200);
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)+$/.test(parsed)) {
    throw new ContractError(`${label} must be a fully qualified Java class name`);
  }
  return parsed;
}
