import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentWorkflowState, CandidateScenario, GeneratedJavaArtifact } from "../contracts.js";
import { assertCanGenerateJava, assertHumanApprovedCandidate } from "../policy.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "./safe-path.js";
import { validateGeneratedJavaContract, type GeneratedJavaOutput } from "./model-provider.js";
import { candidateDirectoryId, expectedGeneratedTestClass } from "./java-class.js";
export { candidateDirectoryId, expectedGeneratedTestClass } from "./java-class.js";

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
  origin: "GENERATED";
}

function sha256(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function registrationDirectory(candidate: CandidateScenario): string {
  return `extension/${candidate.appId}/selenium/${candidateDirectoryId(candidate.candidateId)}/revision-${candidate.revision}`;
}

function parseRegistration(input: unknown): GeneratedJavaRegistration {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("generated Java registry entry must be an object");
  const value = input as Record<string, unknown>;
  const keys = ["schemaVersion", "appId", "candidateId", "revision", "sourceCommit", "sourceVersion", "gherkinSha256", "testClass", "artifactPath", "sourceSha256", "origin"];
  if (Object.keys(value).some((key) => !keys.includes(key)) || keys.some((key) => !(key in value))) throw new Error("generated Java registry entry has unknown or missing fields");
  if (value.schemaVersion !== "1.0.0" || value.origin !== "GENERATED" || typeof value.appId !== "string" || typeof value.candidateId !== "string" ||
      typeof value.revision !== "number" || !Number.isInteger(value.revision) || value.revision < 1 || typeof value.sourceCommit !== "string" ||
      typeof value.sourceVersion !== "string" || typeof value.testClass !== "string" || typeof value.artifactPath !== "string" ||
      !/^[a-f0-9]{64}$/.test(String(value.gherkinSha256)) || !/^[a-f0-9]{64}$/.test(String(value.sourceSha256))) {
    throw new Error("generated Java registry entry is malformed");
  }
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
  const registrationPath = `${directory}/registration.json`;
  const artifactAbsolute = await resolveContainedOutputPath(repositoryRoot, artifactPath);
  const registrationAbsolute = await resolveContainedOutputPath(repositoryRoot, registrationPath);
  const sourceSha256 = sha256(output.javaSource);
  const registration: GeneratedJavaRegistration = {
    schemaVersion: "1.0.0", appId: candidate.appId, candidateId: candidate.candidateId, revision: candidate.revision,
    sourceCommit: candidate.sourceCommit, sourceVersion: candidate.sourceVersion, gherkinSha256: sha256(candidate.gherkin),
    testClass: `tests.${expectedClass}`, artifactPath, sourceSha256, origin: "GENERATED",
  };
  await writeFile(artifactAbsolute, output.javaSource, { flag: "wx" });
  await writeFile(registrationAbsolute, `${JSON.stringify(registration, null, 2)}\n`, { flag: "wx" });
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
  const expectedClass = `tests.${expectedGeneratedTestClass(candidate)}`;
  const expectedDirectory = registrationDirectory(candidate);
  const expectedPath = `${expectedDirectory}/${expectedClass.slice("tests.".length)}.java`;
  if (artifact.kind !== "generated_java" || artifact.origin !== "GENERATED" || artifact.path !== expectedPath || artifact.testClass !== expectedClass ||
      artifact.candidateId !== candidate.candidateId || artifact.revision !== candidate.revision || !artifact.sha256) {
    throw new Error("generated Java artifact is not registered for the exact approved candidate revision");
  }
  const registrationPath = await resolveContainedExistingPath(repositoryRoot, `${expectedDirectory}/registration.json`);
  const registration = parseRegistration(JSON.parse(await readFile(registrationPath, "utf8")) as unknown);
  if (registration.appId !== candidate.appId || registration.candidateId !== candidate.candidateId || registration.revision !== candidate.revision ||
      registration.sourceCommit !== candidate.sourceCommit || registration.sourceVersion !== candidate.sourceVersion || registration.gherkinSha256 !== sha256(candidate.gherkin) ||
      registration.artifactPath !== expectedPath || registration.testClass !== expectedClass || registration.sourceSha256 !== artifact.sha256) {
    throw new Error("generated Java registration does not match candidate, source, Gherkin or artifact pins");
  }
  const absolutePath = await resolveContainedExistingPath(repositoryRoot, expectedPath);
  if (sha256(await readFile(absolutePath)) !== registration.sourceSha256) throw new Error("registered Java artifact hash mismatch");
  return { absolutePath, registration };
}

/** Stable path helper for audits; path IDs do not expose arbitrary candidate text to the filesystem. */
export function generatedJavaExtensionPath(candidate: CandidateScenario): string { return join(registrationDirectory(candidate), `${expectedGeneratedTestClass(candidate)}.java`).replaceAll("\\", "/"); }
