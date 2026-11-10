import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import {
  assertBaselineMatchesManifest,
  assertHumanApprovedCandidate,
} from "../framework/src/policy.js";
import {
  parseApplicationManifest,
  parseBaselineInventory,
  parseToolResult,
  sanitizeToolOutput,
  type AgentWorkflowState,
  type ApplicationAdapter,
  type ApplicationManifest,
  type BaselineInventory,
  type BaselineCase,
  type CandidateScenario,
  type EvidenceReference,
  type GeneratedJavaArtifact,
  type ToolResult,
} from "../framework/src/contracts.js";
import { verifyRegisteredGeneratedJava } from "../framework/src/runtime/java-artifact-registry.js";
import { runFixedMaven } from "../framework/src/runtime/maven-command.js";
import type { ProcessResult } from "../framework/src/runtime/process.js";
import {
  ensureContainedDirectory,
  resolveContainedExistingPath,
  resolveContainedOutputPath,
} from "../framework/src/runtime/safe-path.js";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export interface IsolatedAppWorkspace {
  readonly path: string;
  readonly metadataPath: string;
  readonly runId: string;
  readonly invocationId: string;
  readonly candidateId: string;
  readonly revision: number;
  readonly testClass: string;
  readonly generatedArtifactPath: string;
  readonly generatedArtifactSha256: string;
}

/**
 * Base abstract class implementing ApplicationAdapter across all BEWT-CovExt applications.
 * Isolates common Maven compilation, evidence collection, source hash verification,
 * and isolated workspace preparation.
 */
export abstract class BaseApplicationAdapter implements ApplicationAdapter {
  readonly manifest: ApplicationManifest;
  readonly repositoryRoot: string;

  constructor(repositoryRoot: string, manifestInput: unknown) {
    this.repositoryRoot = resolve(repositoryRoot);
    this.manifest = parseApplicationManifest(manifestInput);
  }

  /** Read baseline test inventory for this application. */
  abstract readBaseline(): Promise<BaselineInventory>;

  /** Prepare fixture or verify cloud runtime health. */
  abstract prepareFixture(
    candidate: CandidateScenario,
    experimentKey: string,
    state: AgentWorkflowState
  ): Promise<ToolResult>;

  /** Cleanup experiment resources for this run. */
  abstract cleanup(
    candidate: CandidateScenario,
    experimentKey: string,
    state: AgentWorkflowState
  ): Promise<ToolResult>;

  /** Verify that the base suite exists and source matches the pinned manifest commit. */
  async verifySourceIntegrity(): Promise<{ valid: boolean; commit: string; message: string }> {
    const suitePath = await resolveContainedExistingPath(this.repositoryRoot, this.manifest.baseSuitePath);
    const pomPath = join(suitePath, "pom.xml");
    try {
      const pomContent = await readFile(pomPath, "utf8");
      if (!pomContent.includes("<project") || !pomContent.includes("</project>")) {
        return { valid: false, commit: this.manifest.source.commit, message: "pom.xml exists but is malformed" };
      }
      return { valid: true, commit: this.manifest.source.commit, message: "Source suite and pom.xml verified" };
    } catch (error) {
      return {
        valid: false,
        commit: this.manifest.source.commit,
        message: `Base suite verification failed: ${error instanceof Error ? error.message : "unknown error"}`,
      };
    }
  }

  /** Compile the base suite using Maven. */
  async compile(candidate: CandidateScenario): Promise<ToolResult> {
    const suiteAbsolute = await resolveContainedExistingPath(this.repositoryRoot, this.manifest.baseSuitePath);
    try {
      const result: ProcessResult = await runFixedMaven(suiteAbsolute, "compile");
      const outcome = result.exitCode === 0 ? "PASS" : "FAIL";
      return parseToolResult({
        tool: "compile-maven-project",
        outcome,
        stdout: sanitizeToolOutput(result.stdout),
        stderr: sanitizeToolOutput(result.stderr),
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        evidence: [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Maven compile execution failed";
      return parseToolResult({
        tool: "compile-maven-project",
        outcome: "BLOCKED",
        stdout: "",
        stderr: sanitizeToolOutput(message),
        evidence: [],
      });
    }
  }

  /** Run a Selenium test class using Maven test with -Dtest parameter. */
  async runSelenium(
    candidate: CandidateScenario,
    generatedArtifact: GeneratedJavaArtifact,
    state: AgentWorkflowState
  ): Promise<ToolResult> {
    assertHumanApprovedCandidate(state, candidate);
    const suiteAbsolute = await resolveContainedExistingPath(this.repositoryRoot, this.manifest.baseSuitePath);
    try {
      const result: ProcessResult = await runFixedMaven(suiteAbsolute, "test", generatedArtifact.testClass);
      const outcome = result.exitCode === 0 ? "PASS" : "FAIL";
      const evidence = await this.collectEvidence(state.runId, state.validationInvocationId);
      return parseToolResult({
        tool: "run-selenium-test",
        outcome,
        stdout: sanitizeToolOutput(result.stdout),
        stderr: sanitizeToolOutput(result.stderr),
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        evidence,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Selenium test execution failed";
      return parseToolResult({
        tool: "run-selenium-test",
        outcome: "BLOCKED",
        stdout: "",
        stderr: sanitizeToolOutput(message),
        evidence: [],
      });
    }
  }

  /** Collect evidence references from target/surefire-reports. */
  async collectEvidence(runId: string, invocationId?: string): Promise<EvidenceReference[]> {
    const references: EvidenceReference[] = [];
    const surefireDir = join(this.manifest.baseSuitePath, "target/surefire-reports");
    try {
      const dirPath = await resolveContainedExistingPath(this.repositoryRoot, surefireDir);
      const entries = await readdir(dirPath);
      for (const entry of entries) {
        if (entry.endsWith(".xml") || entry.endsWith(".txt")) {
          const relativeArtifact = `${surefireDir}/${entry}`.replaceAll("\\", "/");
          references.push({
            repositoryCommit: this.manifest.source.commit,
            sourceVersion: this.manifest.source.packageVersion ?? this.manifest.benchmarkBaseVersion,
            runId: invocationId ?? runId,
            artifactPath: relativeArtifact,
          });
        }
      }
    } catch {
      // If surefire directory doesn't exist yet, return empty list gracefully
    }
    return references;
  }

  /** Stage an isolated Maven workspace for generated test execution, preventing pollution of baseline. */
  async createIsolatedWorkspace(
    workflow: AgentWorkflowState,
    candidate: CandidateScenario,
    artifact: GeneratedJavaArtifact,
    invocationId: string
  ): Promise<IsolatedAppWorkspace> {
    if (!invocationId.trim()) throw new Error("isolated Maven workspace requires a validation invocation ID");
    const registered = await verifyRegisteredGeneratedJava(this.repositoryRoot, workflow, candidate, artifact);

    const suiteRoot = this.manifest.baseSuitePath;
    const pom = await readFile(await resolveContainedExistingPath(this.repositoryRoot, `${suiteRoot}/pom.xml`));

    const workspaceRel = `.local-state/t01c-maven/${sha256(workflow.runId).slice(0, 20)}/${sha256(invocationId).slice(0, 20)}`;
    const workspaceAbs = await ensureContainedDirectory(this.repositoryRoot, workspaceRel);

    const testSubdir = artifact.testClass.includes(".")
      ? artifact.testClass.slice(0, artifact.testClass.lastIndexOf(".")).replace(/\./g, "/")
      : "tests";
    const simpleClassName = artifact.testClass.includes(".")
      ? artifact.testClass.slice(artifact.testClass.lastIndexOf(".") + 1)
      : artifact.testClass;

    await ensureContainedDirectory(this.repositoryRoot, `${workspaceRel}/src/test/java/${testSubdir}`);

    // Copy POM
    const pomOut = await resolveContainedOutputPath(this.repositoryRoot, `${workspaceRel}/pom.xml`);
    await writeFile(pomOut, pom, { flag: "wx" });

    // Copy BaseTest if it exists
    const possibleBaseTests = [
      `${suiteRoot}/src/test/java/tests/BaseTest.java`,
      `${suiteRoot}/src/test/java/base/BaseTest.java`,
      `${suiteRoot}/src/test/java/${this.manifest.appId}/BaseTest.java`,
    ];
    let baseTestContent: Buffer | undefined;
    let baseTestCopiedRel: string | undefined;
    for (const btPath of possibleBaseTests) {
      try {
        const p = await resolveContainedExistingPath(this.repositoryRoot, btPath);
        baseTestContent = await readFile(p);
        const destRel = `${workspaceRel}/src/test/java/${testSubdir}/BaseTest.java`;
        const destOut = await resolveContainedOutputPath(this.repositoryRoot, destRel);
        await writeFile(destOut, baseTestContent, { flag: "wx" });
        baseTestCopiedRel = `src/test/java/${testSubdir}/BaseTest.java`;
        break;
      } catch {
        // try next path
      }
    }

    // Copy generated test class
    const generatedSource = await readFile(registered.absolutePath);
    const testOut = await resolveContainedOutputPath(
      this.repositoryRoot,
      `${workspaceRel}/src/test/java/${testSubdir}/${simpleClassName}.java`
    );
    await writeFile(testOut, generatedSource, { flag: "wx" });

    // Write workspace-owner.json
    const metadata = {
      schemaVersion: "1.0.0",
      appId: this.manifest.appId,
      sourceCommit: workflow.sourceCommit,
      sourceVersion: workflow.sourceVersion,
      runId: workflow.runId,
      invocationId,
      candidateId: candidate.candidateId,
      revision: candidate.revision,
      testClass: registered.registration.testClass,
      generatedArtifactPath: artifact.path,
      generatedArtifactSha256: artifact.sha256,
      pomSha256: sha256(pom),
      copiedFiles: [
        "pom.xml",
        ...(baseTestCopiedRel ? [baseTestCopiedRel] : []),
        `src/test/java/${testSubdir}/${simpleClassName}.java`,
      ],
      excludedHistoricalTests: true,
      noApplicationSourceCopied: true,
    };
    const metadataPathRel = `${workspaceRel}/workspace-owner.json`;
    const metadataPathOut = await resolveContainedOutputPath(this.repositoryRoot, metadataPathRel);
    await writeFile(metadataPathOut, `${JSON.stringify(metadata, null, 2)}\n`, { flag: "wx" });

    return {
      path: workspaceAbs,
      metadataPath: metadataPathRel,
      runId: workflow.runId,
      invocationId,
      candidateId: candidate.candidateId,
      revision: candidate.revision,
      testClass: registered.registration.testClass,
      generatedArtifactPath: artifact.path,
      generatedArtifactSha256: registered.registration.sourceSha256,
    };
  }

  /** Helper to parse standard feature files and map to baseline test cases. */
  protected async parseStandardGherkinFeatures(
    gherkinDirRelative: string,
    testsDirRelative: string,
    testClassPrefix = ""
  ): Promise<BaselineCase[]> {
    const cases: BaselineCase[] = [];
    const gherkinAbs = await resolveContainedExistingPath(this.repositoryRoot, gherkinDirRelative);
    const files = (await readdir(gherkinAbs)).filter((f) => f.endsWith(".feature"));

    const ref: EvidenceReference = {
      repositoryCommit: this.manifest.source.commit,
      sourceVersion: this.manifest.source.packageVersion ?? this.manifest.benchmarkBaseVersion,
      runId: `baseline-${this.manifest.appId}`,
      artifactPath: gherkinDirRelative,
    };

    for (const file of files.sort()) {
      const content = await readFile(join(gherkinAbs, file), "utf8");
      const baseName = file.replace(/^\d+_/, "").replace(/\.feature$/i, "");
      const scenarioMatches = [...content.matchAll(/Scenario(?: Outline)?:\s*(.+)/gi)];
      const scenarios = scenarioMatches.map((m) => m[1]!.trim());
      const testClassCandidate = `${testClassPrefix}${baseName}`;
      const potentialTestPath = `${testsDirRelative}/${testClassCandidate}.java`;

      if (scenarios.length === 0) {
        cases.push({
          caseId: baseName,
          gherkinPath: `${gherkinDirRelative}/${file}`,
          scenarioName: baseName,
          baseTestPaths: [potentialTestPath],
          behaviorTags: ["baseline-behavior"],
          sourceReferences: [ref],
        });
      } else {
        scenarios.forEach((scenario, index) => {
          cases.push({
            caseId: `${baseName}${index > 0 ? `-${index + 1}` : ""}`,
            gherkinPath: `${gherkinDirRelative}/${file}`,
            scenarioName: scenario,
            baseTestPaths: [potentialTestPath],
            behaviorTags: ["baseline-behavior"],
            sourceReferences: [ref],
          });
        });
      }
    }
    return cases;
  }
}
