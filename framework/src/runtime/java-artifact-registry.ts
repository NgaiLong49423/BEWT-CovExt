import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentWorkflowState, CandidateScenario, GeneratedJavaArtifact } from "../contracts.js";
import { assertCanGenerateJava, assertCanRepairJava, assertHumanApprovedCandidate } from "../policy.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "./safe-path.js";
import { assertExecutableAssertionsPreserved, validateGeneratedJavaContract, type GeneratedJavaOutput } from "./model-provider.js";
import { candidateDirectoryId, expectedGeneratedTestClass, getAppTestPackage } from "./java-class.js";
export { candidateDirectoryId, expectedGeneratedTestClass, getAppTestPackage } from "./java-class.js";

export interface GeneratedJavaRegistration {
  schemaVersion: "1.0.0";
  appId: string;
  candidateId: string;
  revision: number;
  sourceCommit: string;
  sourceVersion: string;
  gherkinSha256: string;
  testClass: string;
  artifactPath: string;
  sourceSha256: string;
  origin: "GENERATED" | "REPAIRED";
  repairAttempt?: number;
  parentArtifactPath?: string;
  parentSourceSha256?: string;
  firstGeneratedArtifactPath?: string;
  firstGeneratedSourceSha256?: string;
}

function sha256(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
async function writeImmutable(root: string, path: string, content: string): Promise<void> {
  const expected = Buffer.from(content);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const existingPath = await resolveContainedExistingPath(root, path);
      if (!Buffer.from(await readFile(existingPath)).equals(expected)) throw new Error(`immutable artifact already exists with different content: ${path}`);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const outputPath = await resolveContainedOutputPath(root, path);
    try { await writeFile(outputPath, content, { flag: "wx" }); return; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST" || attempt === 1) throw error; }
  }
}
function registrationDirectory(candidate: CandidateScenario): string {
  return `extension/${candidate.appId}/selenium/${candidateDirectoryId(candidate.candidateId)}/revision-${candidate.revision}`;
}

function parseRegistration(input: unknown): GeneratedJavaRegistration {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("generated Java registry entry must be an object");
  const value = input as Record<string, unknown>;
  const common = ["schemaVersion", "appId", "candidateId", "revision", "sourceCommit", "sourceVersion", "gherkinSha256", "testClass", "artifactPath", "sourceSha256", "origin"];
  const repair = ["repairAttempt", "parentArtifactPath", "parentSourceSha256", "firstGeneratedArtifactPath", "firstGeneratedSourceSha256"];
  if (Object.keys(value).some((key) => ![...common, ...repair].includes(key)) || common.some((key) => !(key in value)) ||
      (value.origin === "GENERATED" && repair.some((key) => key in value)) || (value.origin === "REPAIRED" && repair.some((key) => !(key in value)))) throw new Error("generated Java registry entry has unknown or missing fields");
  if (value.schemaVersion !== "1.0.0" || !["GENERATED", "REPAIRED"].includes(String(value.origin)) || typeof value.appId !== "string" || typeof value.candidateId !== "string" ||
      typeof value.revision !== "number" || !Number.isInteger(value.revision) || value.revision < 1 || typeof value.sourceCommit !== "string" ||
      typeof value.sourceVersion !== "string" || typeof value.testClass !== "string" || typeof value.artifactPath !== "string" ||
      !/^[a-f0-9]{64}$/.test(String(value.gherkinSha256)) || !/^[a-f0-9]{64}$/.test(String(value.sourceSha256))) {
    throw new Error("generated Java registry entry is malformed");
  }
  if (value.origin === "REPAIRED" && (!Number.isInteger(value.repairAttempt) || (value.repairAttempt as number) < 1 || (value.repairAttempt as number) > 2 ||
      typeof value.parentArtifactPath !== "string" || typeof value.firstGeneratedArtifactPath !== "string" ||
      !/^[a-f0-9]{64}$/.test(String(value.parentSourceSha256)) || !/^[a-f0-9]{64}$/.test(String(value.firstGeneratedSourceSha256)))) throw new Error("repaired Java registry entry is malformed");
  return value as unknown as GeneratedJavaRegistration;
}

/** Write a new immutable Java artifact only for the exact current human-accepted revision. */
export async function registerGeneratedJava(
  repositoryRoot: string,
  workflow: AgentWorkflowState,
  candidate: CandidateScenario,
  output: GeneratedJavaOutput,
): Promise<{ artifact: GeneratedJavaArtifact; registration: GeneratedJavaRegistration }> {
  assertCanGenerateJava(workflow, candidate);
  const expectedClass = expectedGeneratedTestClass(candidate);
  const requiresResetPageObject = candidate.sourceReferences.some((reference) => reference.artifactPath === "experiments/expresscart/source/routes/customer.js");
  validateGeneratedJavaContract(output, expectedClass, requiresResetPageObject ? "CustomerPasswordResetPage" : undefined);

  const directory = registrationDirectory(candidate);
  await ensureContainedDirectory(repositoryRoot, directory);
  const artifactPath = `${directory}/${expectedClass}.java`;
  const sourceSha256 = sha256(output.javaSource);
  const pkg = getAppTestPackage(candidate.appId);
  const registration: GeneratedJavaRegistration = {
    schemaVersion: "1.0.0", appId: candidate.appId, candidateId: candidate.candidateId, revision: candidate.revision,
    sourceCommit: candidate.sourceCommit, sourceVersion: candidate.sourceVersion, gherkinSha256: sha256(candidate.gherkin),
    testClass: `${pkg}.${expectedClass}`, artifactPath, sourceSha256, origin: "GENERATED",
  };
  await writeImmutable(repositoryRoot, artifactPath, output.javaSource);
  await writeImmutable(repositoryRoot, `${directory}/registration.json`, `${JSON.stringify(registration, null, 2)}\n`);
  return {
    artifact: { kind: "generated_java", path: artifactPath, candidateId: candidate.candidateId, revision: candidate.revision,
      testClass: registration.testClass, origin: "GENERATED", sha256: sourceSha256 },
    registration,
  };
}

/** Resolve a selector only from the exact accepted candidate/revision registry entry and re-hash its bytes. */
export async function verifyRegisteredGeneratedJava(
  repositoryRoot: string,
  workflow: AgentWorkflowState,
  candidate: CandidateScenario,
  artifact: GeneratedJavaArtifact,
): Promise<{ absolutePath: string; registration: GeneratedJavaRegistration }> {
  assertHumanApprovedCandidate(workflow, candidate);
  const pkg = getAppTestPackage(candidate.appId);
  const simpleClass = expectedGeneratedTestClass(candidate);
  const expectedClass = `${pkg}.${simpleClass}`;
  const expectedDirectory = registrationDirectory(candidate);
  const expectedPath = `${expectedDirectory}/${simpleClass}.java`;
  if (artifact.kind !== "generated_java" || !["GENERATED", "REPAIRED"].includes(String(artifact.origin)) || artifact.testClass !== expectedClass ||
      artifact.candidateId !== candidate.candidateId || artifact.revision !== candidate.revision || !artifact.sha256) {
    throw new Error("generated Java artifact is not registered for the exact approved candidate revision");
  }
  const isGenerated = artifact.origin === "GENERATED";
  const match = isGenerated ? artifact.path === expectedPath : new RegExp(`^${expectedDirectory}/repair-[12]/${simpleClass}\\.java$`).test(artifact.path);
  if (!match) throw new Error("generated Java artifact path does not match its registered origin and repair slot");
  const registrationDirectoryPath = isGenerated ? expectedDirectory : artifact.path.slice(0, artifact.path.lastIndexOf("/"));
  const registrationPath = await resolveContainedExistingPath(repositoryRoot, `${registrationDirectoryPath}/registration.json`);
  const registration = parseRegistration(JSON.parse(await readFile(registrationPath, "utf8")) as unknown);
  if (registration.appId !== candidate.appId || registration.candidateId !== candidate.candidateId || registration.revision !== candidate.revision ||
      registration.sourceCommit !== candidate.sourceCommit || registration.sourceVersion !== candidate.sourceVersion || registration.gherkinSha256 !== sha256(candidate.gherkin) ||
      registration.artifactPath !== artifact.path || registration.testClass !== expectedClass || registration.sourceSha256 !== artifact.sha256 || registration.origin !== artifact.origin) {
    throw new Error("generated Java registration does not match candidate, source, Gherkin or artifact pins");
  }
  const absolutePath = await resolveContainedExistingPath(repositoryRoot, artifact.path);
  if (sha256(await readFile(absolutePath)) !== registration.sourceSha256) throw new Error("registered Java artifact hash mismatch");
  if (!isGenerated) {
    const attempt = registration.repairAttempt!;
    const pkg = getAppTestPackage(candidate.appId);
    const expectedParentPath = attempt === 1 ? expectedPath : `${expectedDirectory}/repair-1/${simpleClass}.java`;
    const parent = workflow.artifacts.find((item) => item.kind === "generated_java" && item.path === registration.parentArtifactPath) as GeneratedJavaArtifact | undefined;
    if (registration.artifactPath !== `${expectedDirectory}/repair-${attempt}/${simpleClass}.java` ||
        registration.parentArtifactPath !== expectedParentPath || !parent || parent.sha256 !== registration.parentSourceSha256 || parent.candidateId !== candidate.candidateId || parent.revision !== candidate.revision) {
      throw new Error("repaired Java parent chain does not match the workflow artifact history");
    }
    const first = workflow.artifacts.find((item) => item.kind === "generated_java" && item.origin === "GENERATED" && item.candidateId === candidate.candidateId && item.revision === candidate.revision);
    if (!first || registration.firstGeneratedArtifactPath !== first.path || registration.firstGeneratedSourceSha256 !== first.sha256) throw new Error("repaired Java entry does not preserve the first-generated artifact pin");
    const parentArtifact: GeneratedJavaArtifact = { kind: "generated_java", path: parent.path, testClass: parent.testClass!, sha256: parent.sha256!, origin: parent.origin!, candidateId: candidate.candidateId, revision: candidate.revision };
    await verifyRegisteredGeneratedJava(repositoryRoot, workflow, candidate, parentArtifact);
  }
  return { absolutePath, registration };
}

/** Register a repair as a new immutable artifact chained to the currently validated artifact. */
export async function registerRepairedJava(
  repositoryRoot: string,
  workflow: AgentWorkflowState,
  candidate: CandidateScenario,
  firstArtifact: GeneratedJavaArtifact,
  currentArtifact: GeneratedJavaArtifact,
  attempt: number,
  output: GeneratedJavaOutput,
): Promise<{ artifact: GeneratedJavaArtifact; registration: GeneratedJavaRegistration }> {
  assertCanRepairJava(workflow, candidate);
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 2 || currentArtifact.origin !== (attempt === 1 ? "GENERATED" : "REPAIRED")) throw new Error("repair attempt does not match the artifact chain");
  await verifyRegisteredGeneratedJava(repositoryRoot, workflow, candidate, currentArtifact);
  await verifyRegisteredGeneratedJava(repositoryRoot, workflow, candidate, firstArtifact);
  const expectedClass = expectedGeneratedTestClass(candidate);
  const requiresResetPageObject = candidate.sourceReferences.some((reference) => reference.artifactPath === "experiments/expresscart/source/routes/customer.js");
  validateGeneratedJavaContract(output, expectedClass, requiresResetPageObject ? "CustomerPasswordResetPage" : undefined);
  const firstSource = await readFile(await resolveContainedExistingPath(repositoryRoot, firstArtifact.path), "utf8");
  assertExecutableAssertionsPreserved(firstSource, output.javaSource);
  const directory = `${registrationDirectory(candidate)}/repair-${attempt}`;
  await ensureContainedDirectory(repositoryRoot, directory);
  const artifactPath = `${directory}/${expectedClass}.java`;
  const sourceSha256 = sha256(output.javaSource);
  if (artifactPath === firstArtifact.path || sourceSha256 === firstArtifact.sha256 || sourceSha256 === currentArtifact.sha256) throw new Error("repair must produce new immutable source bytes and a distinct artifact path");
  const pkg = getAppTestPackage(candidate.appId);
  const registration: GeneratedJavaRegistration = {
    schemaVersion: "1.0.0", appId: candidate.appId, candidateId: candidate.candidateId, revision: candidate.revision,
    sourceCommit: candidate.sourceCommit, sourceVersion: candidate.sourceVersion, gherkinSha256: sha256(candidate.gherkin),
    testClass: `${pkg}.${expectedClass}`, artifactPath, sourceSha256, origin: "REPAIRED", repairAttempt: attempt,
    parentArtifactPath: currentArtifact.path, parentSourceSha256: currentArtifact.sha256!,
    firstGeneratedArtifactPath: firstArtifact.path, firstGeneratedSourceSha256: firstArtifact.sha256!,
  };
  await writeImmutable(repositoryRoot, artifactPath, output.javaSource);
  await writeImmutable(repositoryRoot, `${directory}/registration.json`, `${JSON.stringify(registration, null, 2)}\n`);
  return { artifact: { kind: "generated_java", path: artifactPath, candidateId: candidate.candidateId, revision: candidate.revision,
    testClass: registration.testClass, origin: "REPAIRED", sha256: sourceSha256 }, registration };
}

/** Return the previously registered first generation after a graph replay, never making a second model request. */
export async function loadRegisteredGeneratedJava(repositoryRoot: string, workflow: AgentWorkflowState, candidate: CandidateScenario): Promise<GeneratedJavaArtifact | undefined> {
  return loadRegisteredJava(repositoryRoot, workflow, candidate, "GENERATED");
}

export async function loadRegisteredRepairedJava(repositoryRoot: string, workflow: AgentWorkflowState, candidate: CandidateScenario, attempt: number): Promise<GeneratedJavaArtifact | undefined> {
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 2) throw new Error("repair attempt must be 1 or 2");
  return loadRegisteredJava(repositoryRoot, workflow, candidate, "REPAIRED", attempt);
}

async function loadRegisteredJava(repositoryRoot: string, workflow: AgentWorkflowState, candidate: CandidateScenario,
  origin: "GENERATED" | "REPAIRED", attempt?: number): Promise<GeneratedJavaArtifact | undefined> {
  if (origin === "REPAIRED" && attempt === undefined) throw new Error("repair attempt is required to load a repaired artifact");
  const directory = origin === "GENERATED" ? registrationDirectory(candidate) : `${registrationDirectory(candidate)}/repair-${attempt}`;
  const artifactPath = origin === "GENERATED" ? generatedJavaExtensionPath(candidate) : `${directory}/${expectedGeneratedTestClass(candidate)}.java`;
  const artifactAbsolute = await optionalExisting(repositoryRoot, artifactPath);
  const registrationAbsolute = await optionalExisting(repositoryRoot, `${directory}/registration.json`);
  if (!artifactAbsolute && !registrationAbsolute) return undefined;
  if (!artifactAbsolute || !registrationAbsolute) throw new Error(origin === "GENERATED"
    ? "incomplete immutable Java registration found after workflow replay; refusing another model generation"
    : "incomplete immutable repair registration found after workflow replay; refusing another model repair");
  const registration = parseRegistration(JSON.parse(await readFile(registrationAbsolute, "utf8")) as unknown);
  const artifact: GeneratedJavaArtifact = { kind: "generated_java", path: artifactPath, testClass: registration.testClass,
    candidateId: candidate.candidateId, revision: candidate.revision, origin, sha256: registration.sourceSha256 };
  await verifyRegisteredGeneratedJava(repositoryRoot, workflow, candidate, artifact);
  return artifact;
}

async function optionalExisting(root: string, path: string): Promise<string | undefined> {
  try { return await resolveContainedExistingPath(root, path); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}

/** Stable path helper for audits; path IDs do not expose arbitrary candidate text to the filesystem. */
export function generatedJavaExtensionPath(candidate: CandidateScenario): string { return join(registrationDirectory(candidate), `${expectedGeneratedTestClass(candidate)}.java`).replaceAll("\\", "/"); }
