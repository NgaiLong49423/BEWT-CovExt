import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AgentWorkflowState, ApplicationManifest, CandidateScenario, GeneratedJavaArtifact } from "../../framework/src/contracts.js";
import { parseApplicationManifest } from "../../framework/src/contracts.js";
import { runFixedMaven, type SeleniumRunOptions } from "../../framework/src/runtime/maven-command.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "../../framework/src/runtime/safe-path.js";
import { verifyRegisteredGeneratedJava } from "../../framework/src/runtime/java-artifact-registry.js";

export interface IsolatedExpressCartWorkspace {
  path: string;
  metadataPath: string;
  runId: string;
  invocationId: string;
  candidateId: string;
  revision: number;
  testClass: string;
  generatedArtifactPath: string;
  generatedArtifactSha256: string;
}

function sha256(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function workspaceRelativePath(runId: string, invocationId: string): string {
  return `.local-state/t01c-maven/${sha256(runId).slice(0, 20)}/${sha256(invocationId).slice(0, 20)}`;
}

/** Stage only the existing POM/BaseTest and the exact registered generated class; historical tests are excluded. */
export async function createIsolatedExpressCartWorkspace(
  repositoryRoot: string,
  manifestInput: ApplicationManifest,
  workflow: AgentWorkflowState,
  candidate: CandidateScenario,
  artifact: GeneratedJavaArtifact,
  invocationId: string,
): Promise<IsolatedExpressCartWorkspace> {
  const manifest = parseApplicationManifest(manifestInput);
  if (manifest.appId !== "expresscart" || workflow.appId !== "expresscart" || candidate.appId !== "expresscart") throw new Error("ExpressCart harness only accepts the ExpressCart manifest and candidate");
  if (!invocationId.trim()) throw new Error("isolated Maven workspace requires a validation invocation ID");
  const registered = await verifyRegisteredGeneratedJava(repositoryRoot, workflow, candidate, artifact);
  const suiteRoot = manifest.baseSuitePath;
  const pom = await readFile(await resolveContainedExistingPath(repositoryRoot, `${suiteRoot}/pom.xml`));
  const baseTest = await readFile(await resolveContainedExistingPath(repositoryRoot, `${suiteRoot}/src/test/java/tests/BaseTest.java`));
  const workspace = workspaceRelativePath(workflow.runId, invocationId);
  const workspaceAbsolute = await ensureContainedDirectory(repositoryRoot, workspace);
  await ensureContainedDirectory(repositoryRoot, `${workspace}/src/test/java/tests`);
  const generatedSource = await readFile(registered.absolutePath);
  const pomPath = await resolveContainedOutputPath(repositoryRoot, `${workspace}/pom.xml`);
  const baseTestPath = await resolveContainedOutputPath(repositoryRoot, `${workspace}/src/test/java/tests/BaseTest.java`);
  const generatedPath = await resolveContainedOutputPath(repositoryRoot, `${workspace}/src/test/java/tests/${artifact.testClass.slice("tests.".length)}.java`);
  await writeFile(pomPath, pom, { flag: "wx" });
  await writeFile(baseTestPath, baseTest, { flag: "wx" });
  await writeFile(generatedPath, generatedSource, { flag: "wx" });
  const metadata = {
    schemaVersion: "1.0.0", appId: "expresscart", sourceCommit: workflow.sourceCommit, sourceVersion: workflow.sourceVersion,
    runId: workflow.runId, invocationId, candidateId: candidate.candidateId, candidateRevision: candidate.revision,
    testClass: registered.registration.testClass, generatedArtifactPath: artifact.path, generatedArtifactSha256: artifact.sha256,
    pomSha256: sha256(pom), baseTestSha256: sha256(baseTest), copiedFiles: ["pom.xml", "src/test/java/tests/BaseTest.java", `src/test/java/tests/${artifact.testClass.slice("tests.".length)}.java`],
    excludedHistoricalTests: true, noApplicationSourceCopied: true,
  };
  const metadataPath = await resolveContainedOutputPath(repositoryRoot, `${workspace}/workspace-owner.json`);
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, { flag: "wx" });
  return { path: workspaceAbsolute, metadataPath: `${workspace}/workspace-owner.json`, runId: workflow.runId, invocationId, candidateId: candidate.candidateId,
    revision: candidate.revision, testClass: registered.registration.testClass, generatedArtifactPath: artifact.path,
    generatedArtifactSha256: registered.registration.sourceSha256 };
}

/** Compile only the isolated workspace, not the historical suite's full test set. */
export async function compileIsolatedExpressCartWorkspace(workspace: IsolatedExpressCartWorkspace) {
  return await runFixedMaven(workspace.path, "compile");
}

/** The Maven selector comes from the verified registry metadata, never from model or CLI text. */
export async function runRegisteredExpressCartSelenium(
  repositoryRoot: string,
  manifestInput: ApplicationManifest,
  workflow: AgentWorkflowState,
  candidate: CandidateScenario,
  artifact: GeneratedJavaArtifact,
  workspace: IsolatedExpressCartWorkspace,
  options: SeleniumRunOptions,
) {
  const manifest = parseApplicationManifest(manifestInput);
  if (manifest.appId !== "expresscart") throw new Error("ExpressCart Selenium runner requires its pinned application manifest");
  if (workspace.runId !== workflow.runId || workspace.candidateId !== candidate.candidateId || workspace.revision !== candidate.revision ||
      workspace.generatedArtifactPath !== artifact.path || workspace.generatedArtifactSha256 !== artifact.sha256) throw new Error("isolated workspace owner metadata does not match the current candidate artifact");
  const expectedWorkspace = await resolveContainedExistingPath(repositoryRoot, workspaceRelativePath(workflow.runId, workspace.invocationId));
  if (resolve(workspace.path) !== resolve(expectedWorkspace) || workspace.metadataPath !== `${workspaceRelativePath(workflow.runId, workspace.invocationId)}/workspace-owner.json`) throw new Error("workspace path is not the deterministic run-scoped location");
  const registered = await verifyRegisteredGeneratedJava(repositoryRoot, workflow, candidate, artifact);
  if (workspace.testClass !== registered.registration.testClass) throw new Error("workspace test selector is not the registered generated class");
  const ownerPath = await resolveContainedExistingPath(repositoryRoot, workspace.metadataPath);
  const owner = JSON.parse(await readFile(ownerPath, "utf8")) as Record<string, unknown>;
  if (owner.runId !== workflow.runId || owner.invocationId !== workspace.invocationId || owner.generatedArtifactSha256 !== artifact.sha256) throw new Error("workspace ownership evidence does not match run and artifact");
  return await runFixedMaven(workspace.path, "test", registered.registration.testClass, options);
}
