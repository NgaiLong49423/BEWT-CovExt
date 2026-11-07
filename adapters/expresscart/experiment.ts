import { createHash, randomUUID } from "node:crypto";
import { lstat, readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir, userInfo } from "node:os";
import { parseApplicationManifest, parseBaselineInventory, parseCandidateScenario, parseToolResult, parseValidationResult, type AgentWorkflowState, type ApplicationManifest, type ApplicationAdapter, type BaselineInventory, type CandidateScenario, type EvidenceReference, type GeneratedJavaArtifact, type ToolName, type ToolResult, type ValidationResult } from "../../framework/src/contracts.js";
import { assertBaselineMatchesManifest } from "../../framework/src/policy.js";
import { canonicalGherkin, parseGherkin } from "../../framework/src/runtime/gherkin.js";
import { FixedToolDispatcher, type FixedToolImplementations } from "../../framework/src/runtime/tool-dispatcher.js";
import { runFixedMaven } from "../../framework/src/runtime/maven-command.js";
import { runFixedProcess } from "../../framework/src/runtime/process.js";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "../../framework/src/runtime/safe-path.js";
import { sanitizeToolOutput } from "../../framework/src/contracts.js";
import { verifyExpressCartSourceInputs, verifyObservedImageIds } from "./source-identity.js";

const SOURCE_COMMIT = "b31302f4e99c3293bd742c6d076a721e168118b0";
const SOURCE_VERSION = "1.1.19";
const HISTORICAL_BASELINE = "docs/research-results/sprint-01/runs/2026-11-02T07-06-24-329Z-b9a90ab1/baseline-sanitized.json";
const CANDIDATE_FEATURE = "docs/research-results/sprint-02/revised/EC-C04-forgotten-password.feature";
const CANDIDATE_CLASS = "experiments/expresscart/bewt-suite/src/test/java/tests/ForgottenPasswordTest.java";
const CLASS_BY_CANDIDATE: Readonly<Record<string, string>> = { "EC-C04": "tests.ForgottenPasswordTest" };
const STAGE_NAMES = ["compile", "fixture", "e2e", "cleanup"] as const;

type Stage = (typeof STAGE_NAMES)[number];
interface ActiveRun { workflowRunId: string; invocationId: string; project: string; composePath: string; composeSha256?: string; baseUrl?: string; fixtureEmail?: string; evidence: string[]; }
function invocationId(state: AgentWorkflowState): string { return state.validationInvocationId ?? state.runId; }
function evidenceDirectory(state: AgentWorkflowState): string { return `docs/tasks/T01-B/evidence/${state.runId}/invocations/${invocationId(state)}`; }

function sha256(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function uuid(): string { return randomUUID(); }
function outcomeResult(tool: ToolName, outcome: ToolResult["outcome"], stdout = "", stderr = "", exitCode?: number, evidence: EvidenceReference[] = []): ToolResult {
  return parseToolResult({ tool, outcome, stdout, stderr, ...(exitCode === undefined ? {} : { exitCode }), evidence });
}
function isBlocked(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /permission denied|cannot connect to the docker api|docker desktop.*not running|connect.*pipe|timed out|not found|could not resolve|ENOTFOUND|image inspection unavailable|No such image/i.test(message);
}
function isBrowserSetupFailure(value: string): boolean {
  return /SessionNotCreatedException|session not created|only supports Chrome version|Could not start a new session|DevToolsActivePort|cannot find Chrome binary|chrome not reachable/i.test(value);
}
function sanitizeJUnitEvidence(value: string): string {
  const cleaned = sanitizeToolOutput(value);
  return cleaned.replace(/(<property\s+name="([^"]+)"\s+value=")[^"]*("\s*\/>)/gi, (whole, prefix: string, name: string, suffix: string) =>
    /(?:\.path$|^user\.|^env\.(?:path|userprofile|localappdata|computername)$|^java\.(?:class|library)\.path$)/i.test(name)
      ? `${prefix}[REDACTED]${suffix}` : whole);
}
function safeProjectName(runId: string): string {
  const suffix = sha256(runId).slice(0, 20);
  return `bewt-t01b-${suffix}`;
}

export class ExpressCartExperimentAdapter implements ApplicationAdapter {
  readonly manifest: ApplicationManifest;
  private readonly runs = new Map<string, ActiveRun>();
  private readonly processRunner: typeof runFixedProcess;

  constructor(readonly repositoryRoot: string, manifestInput: unknown, options: { processRunner?: typeof runFixedProcess } = {}) {
    this.manifest = parseApplicationManifest(manifestInput);
    this.processRunner = options.processRunner ?? runFixedProcess;
    if (this.manifest.appId !== "expresscart" || this.manifest.source.commit !== SOURCE_COMMIT || this.manifest.source.packageVersion !== SOURCE_VERSION) throw new Error("ExpressCart adapter received an unexpected source pin");
  }

  async readBaseline(): Promise<BaselineInventory> {
    const path = await resolveContainedExistingPath(this.repositoryRoot, HISTORICAL_BASELINE);
    const raw = JSON.parse(await readFile(path, "utf8")) as { features?: Array<{ file: string; scenarios?: string[]; stepKeywords?: string[] }>; tests?: Array<{ file: string }> };
    if (!Array.isArray(raw.features) || !Array.isArray(raw.tests)) throw new Error("historical sanitized baseline has an unsupported shape");
    const runId = "sprint01-b9a90ab1";
    const ref: EvidenceReference = { repositoryCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, runId, artifactPath: HISTORICAL_BASELINE };
    const testPaths = new Map(raw.tests.map((test) => [test.file.replace(/\.java$/i, ""), `experiments/expresscart/bewt-suite/src/test/java/${test.file}`]));
    const cases = raw.features.flatMap((feature) => (feature.scenarios ?? []).map((scenario, index) => {
      const normalized = feature.file.replace(/^\d+_/, "").replace(/\.feature$/i, "");
      const testPath = testPaths.get(`tests/${normalized}`);
      const routeTags = [...new Set((feature.stepKeywords ?? []).flatMap((step) => [...step.matchAll(/\/[a-z][a-z0-9_/-]*/gi)].map((match) => match[0]!)))];
      return {
        caseId: normalized.replace(/\.feature$/i, "") + (index ? `-${index + 1}` : ""),
        gherkinPath: `bewt-original/expresscart/gherkin/${feature.file}`,
        scenarioName: scenario,
        baseTestPaths: testPath ? [testPath] : [],
        behaviorTags: routeTags.length ? routeTags : ["ui-workflow"],
        sourceReferences: [ref],
      };
    }));
    const inventory = parseBaselineInventory({ appId: "expresscart", sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, collectedAt: "2026-11-02T07:06:24.329Z", cases, declaredBusinessCaseCount: 31, observedScenarioCount: cases.length });
    assertBaselineMatchesManifest(this.manifest, inventory);
    return inventory;
  }

  async prepareJava(candidateInput: CandidateScenario, state: AgentWorkflowState): Promise<{ path: string; testClass: string; sha256: string; origin: "REUSED" }> {
    const candidate = parseCandidateScenario(candidateInput);
    const testClass = CLASS_BY_CANDIDATE[candidate.candidateId];
    if (!testClass || state.status !== "ACCEPTED_FOR_IMPLEMENTATION" || state.candidate?.candidateId !== candidate.candidateId || state.candidate.revision !== candidate.revision) throw new Error("no approved ExpressCart candidate/class binding exists");
    if (candidate.candidateId === "EC-C04") {
      const approvedFeature = await readFile(await resolveContainedExistingPath(this.repositoryRoot, CANDIDATE_FEATURE), "utf8");
      if (canonicalGherkin(candidate.gherkin) !== canonicalGherkin(approvedFeature)) throw new Error("EC-C04 Gherkin differs from the reviewed implementation source; a new Java artifact is required");
    }
    const artifactPath = await resolveContainedExistingPath(this.repositoryRoot, CANDIDATE_CLASS);
    const source = await readFile(artifactPath);
    const text = source.toString("utf8");
    if (!text.includes(`class ${testClass.split(".").at(-1)}`) || !text.includes("extends BaseTest")) throw new Error("reused Java class does not match its approved package/class contract");
    return { path: CANDIDATE_CLASS, testClass, sha256: sha256(source), origin: "REUSED" };
  }

  async compile(candidate: CandidateScenario): Promise<ToolResult> {
    try {
      const result = await runFixedMaven(resolve(this.repositoryRoot, this.manifest.baseSuitePath), "compile");
      const outcome = result.exitCode === 0 ? "PASS" : "FAIL";
      return outcomeResult("compile-maven-project", outcome, sanitizeToolOutput(result.stdout), sanitizeToolOutput(result.stderr), result.exitCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Maven compilation could not start";
      return outcomeResult("compile-maven-project", isBlocked(error) ? "BLOCKED" : "FAIL", "", sanitizeToolOutput(message));
    }
  }

  async prepareFixture(candidate: CandidateScenario, experimentKey: string, state: AgentWorkflowState): Promise<ToolResult> {
    if (experimentKey !== this.manifest.fixtureReset.experimentKey) throw new Error("experiment ownership key mismatch");
    if (candidate.candidateId !== "EC-C04") throw new Error("this ExpressCart fixture adapter only implements the reviewed EC-C04 precondition");
    const invocation = invocationId(state);
    const run = await this.getOrCreateRun(state.runId, invocation);
    try {
      await this.writeRunEvidence(state, "source-identity.json", JSON.stringify(await verifyExpressCartSourceInputs(this.repositoryRoot, this.manifest), null, 2));
      await verifyObservedImageIds(this.manifest, async (image) => {
        const inspected = await runFixedProcess("docker", ["image", "inspect", "--format", "{{.Id}}", image], { cwd: this.repositoryRoot, timeoutMs: 20_000 });
        if (inspected.exitCode !== 0) throw new Error(`Docker image inspection unavailable: ${sanitizeToolOutput(inspected.stderr).slice(-500)}`);
        return inspected.stdout.trim();
      });
      const runDir = evidenceDirectory(state);
      const composeRelative = `${runDir}/compose.json`;
      const composePath = await resolveContainedOutputPath(this.repositoryRoot, composeRelative);
      const compose = this.composeDefinition();
      await writeFile(composePath, JSON.stringify(compose, null, 2), { flag: "wx" });
      run.composePath = composePath;
      run.composeSha256 = sha256(await readFile(composePath));
      await this.writeRunEvidence(state, "owner.json", JSON.stringify({ workflowRunId: state.runId, invocationId: invocation, project: run.project, composeFile: composeRelative, composeSha256: run.composeSha256, sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, candidateId: candidate.candidateId, candidateRevision: candidate.revision, ownedResourcesOnly: true }, null, 2));
      const config = await this.compose(run, ["config", "--format", "json"]);
      if (config.exitCode !== 0 || !this.validateComposeConfig(config.stdout, run.project)) throw new Error("isolated Compose configuration did not match the run project and service set");
      const started = await this.compose(run, ["up", "-d", "--pull", "never", "--no-build"]);
      if (started.exitCode !== 0) throw new Error(`isolated Compose startup failed: ${sanitizeToolOutput(started.stderr).slice(-1_000)}`);
      const portResult = await this.compose(run, ["port", "app", "1111"]);
      const port = Number(portResult.stdout.trim().split(":").at(-1));
      if (portResult.exitCode !== 0 || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Compose did not publish the app on an ephemeral loopback port");
      run.baseUrl = `http://127.0.0.1:${port}`;
      await this.waitUntilReady(run.baseUrl);
      const email = `${uuid()}@example.invalid`;
      const query = `print(db.getSiblingDB('expresscart_experiment').customers.countDocuments({email:${JSON.stringify(email)}}))`;
      const preflight = await this.compose(run, ["exec", "-T", "mongo", "mongo", "--quiet", "--eval", query]);
      if (preflight.exitCode !== 0 || preflight.stdout.trim().split(/\s+/).at(-1) !== "0") throw new Error("fresh EC-C04 fixture address absence could not be verified in the run-scoped Mongo database");
      run.fixtureEmail = email;
      const fixture = { runId: state.runId, project: run.project, appUrl: run.baseUrl, mongoCustomerMatchCountBefore: 0, emailSha256: sha256(email), sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, emailStored: false };
      const evidence = await this.writeRunEvidence(state, "fixture-preflight.json", JSON.stringify({ ...fixture, invocationId: invocation }, null, 2));
      return outcomeResult("prepare-fixture", "PASS", "App readiness and exact email-absence preflight passed.", "", 0, [this.evidenceRef(invocation, evidence)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "fixture setup failed";
      const evidence = await this.writeRunEvidence(state, "fixture-blocked.json", JSON.stringify({ runId: state.runId, invocationId: invocation, project: run.project, outcome: isBlocked(error) ? "BLOCKED" : "FAIL", error: sanitizeToolOutput(message), sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION }, null, 2));
      return outcomeResult("prepare-fixture", isBlocked(error) ? "BLOCKED" : "FAIL", "", sanitizeToolOutput(message), undefined, [this.evidenceRef(invocation, evidence)]);
    }
  }

  async runSelenium(candidate: CandidateScenario, artifact: GeneratedJavaArtifact, state: AgentWorkflowState): Promise<ToolResult> {
    const invocation = invocationId(state);
    const run = this.runs.get(invocation);
    if (!run?.baseUrl || !run.fixtureEmail) return outcomeResult("run-selenium-test", "BLOCKED", "", "EC-C04 app/fixture preflight has not passed.");
    if (candidate.candidateId !== artifact.candidateId || candidate.revision !== artifact.revision || CLASS_BY_CANDIDATE[candidate.candidateId] !== artifact.testClass) return outcomeResult("run-selenium-test", "FAIL", "", "test class is not bound to the approved candidate revision");
    try {
      const directory = await ensureContainedDirectory(this.repositoryRoot, `${evidenceDirectory(state)}/selenium`);
      const junitDirectory = await ensureContainedDirectory(this.repositoryRoot, `${evidenceDirectory(state)}/junit`);
      const mavenBuildDirectory = await ensureContainedDirectory(this.repositoryRoot, `.local-state/t01b-maven/${state.runId}/${invocation}`);
      const driver = await this.findCompatibleChromeDriver();
      const driverEvidence = await this.writeRunEvidence(state, "webdriver-pin.json", JSON.stringify({ browserVersion: driver.version, driverVersion: driver.version, driverSha256: driver.sha256, browserPathSha256: sha256(driver.browserPath), origin: "existing installed Chrome and cached ChromeDriver", driverPathPersisted: false }, null, 2));
      const reportDirectories = [
        `.local-state/t01b-maven/${state.runId}/${invocation}/surefire-reports`,
        "experiments/expresscart/bewt-suite/target/surefire-reports",
      ];
      const startedAt = Date.now();
      const result = await runFixedMaven(resolve(this.repositoryRoot, this.manifest.baseSuitePath), "test", artifact.testClass, {
        baseUrl: run.baseUrl, evidenceDirectory: directory, mavenBuildDirectory, unregisteredEmail: run.fixtureEmail, chromeDriverPath: driver.path, chromeBinaryPath: driver.browserPath,
      });
      const logsRelative = await this.writeRunEvidence(state, "selenium-console.log", sanitizeToolOutput(`${result.stdout}\n${result.stderr}`));
      const junitFiles: string[] = [];
      for (const relativeReportDir of reportDirectories) {
        let reportsPath: string;
        try { reportsPath = await resolveContainedExistingPath(this.repositoryRoot, relativeReportDir); }
        catch { continue; }
        for (const name of (await readdir(reportsPath)).filter((item) => /^TEST-.*\.xml$/.test(item) || /^tests\..*\.txt$/.test(item))) {
          const source = join(reportsPath, name);
          if ((await stat(source)).mtimeMs < startedAt - 2_000) continue;
          if (junitFiles.includes(name)) continue;
          const destination = join(junitDirectory, name);
          const sanitized = sanitizeJUnitEvidence(await readFile(source, "utf8"));
          await writeFile(destination, sanitized, { flag: "wx" });
          junitFiles.push(name);
        }
      }
      const junitRefs: EvidenceReference[] = [];
      for (const name of junitFiles) {
        junitRefs.push(this.evidenceRef(`${invocation}-e2e`, `${evidenceDirectory(state)}/junit/${name}`));
      }
      const logsRef = this.evidenceRef(`${state.runId}-e2e`, logsRelative);
      const reportXml = junitFiles.find((name) => name === `TEST-${artifact.testClass}.xml`);
      const reportText = reportXml ? await readFile(join(junitDirectory, reportXml), "utf8") : "";
      const outcome = result.exitCode === 0 && reportXml && /failures="0"/.test(reportText) && /errors="0"/.test(reportText)
        ? "PASS"
        : result.exitCode !== 0 && isBrowserSetupFailure(`${result.stdout}\n${result.stderr}\n${reportText}`) ? "BLOCKED"
          : reportXml ? "FAIL" : "INCONCLUSIVE";
      const classification = outcome === "PASS" ? "E2E_PASS"
        : outcome === "BLOCKED" ? "BROWSER_SESSION_SETUP_BLOCKED"
          : outcome === "FAIL" ? "SELENIUM_ASSERTION_OR_TEST_FAILURE" : "JUNIT_REPORT_MISSING";
      const classificationPath = await this.writeRunEvidence(state, "selenium-classification.json", JSON.stringify({ outcome, classification, mavenExitCode: result.exitCode, junitReport: reportXml ?? null, browserVersion: driver.version, driverVersion: driver.version }, null, 2));
      const additionalRefs = [this.evidenceRef(`${invocation}-e2e`, driverEvidence), this.evidenceRef(`${invocation}-e2e`, classificationPath)];
      return outcomeResult("run-selenium-test", outcome, sanitizeToolOutput(result.stdout), sanitizeToolOutput(result.stderr), result.exitCode, [logsRef, ...junitRefs, ...additionalRefs]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Selenium execution failed";
      const relativeEvidence = await this.writeRunEvidence(state, "selenium-error.json", JSON.stringify({ outcome: isBlocked(error) ? "BLOCKED" : "FAIL", error: sanitizeToolOutput(message), sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION }, null, 2));
      return outcomeResult("run-selenium-test", isBlocked(error) ? "BLOCKED" : "FAIL", "", sanitizeToolOutput(message), undefined, [this.evidenceRef(`${invocation}-e2e`, relativeEvidence)]);
    }
  }

  async cleanup(candidate: CandidateScenario, experimentKey: string, state: AgentWorkflowState): Promise<ToolResult> {
    if (experimentKey !== this.manifest.fixtureReset.experimentKey) throw new Error("cleanup ownership key mismatch");
    const invocation = invocationId(state);
    let run = this.runs.get(invocation);
    if (!run) run = await this.recoverRun(state, invocation);
    if (!run) {
      const base = evidenceDirectory(state);
      let ownerExists = false;
      try { await resolveContainedExistingPath(this.repositoryRoot, `${base}/owner.json`); ownerExists = true; } catch { /* no owner record */ }
      if (!ownerExists) return outcomeResult("cleanup-experiment", "NOT_RUN", "No invocation ownership record exists; no Compose cleanup was attempted.");
      const message = "persisted owner metadata failed invocation, source, candidate, or Compose integrity checks; cleanup was refused";
      try {
        const evidence = await this.writeRunEvidence(state, `cleanup-blocked-${uuid()}.json`, JSON.stringify({ runId: state.runId, invocationId: invocation, outcome: "CLEANUP_BLOCKED", error: message, noGlobalCleanup: true, recovery: "Inspect owner.json and Compose labels manually; do not remove resources until ownership is independently established." }, null, 2));
        return outcomeResult("cleanup-experiment", "BLOCKED", "Persisted ownership could not be verified; cleanup refused.", message, undefined, [this.evidenceRef(`${invocation}-cleanup`, evidence)]);
      } catch { return outcomeResult("cleanup-experiment", "BLOCKED", "Persisted ownership could not be verified; cleanup refused and blocked evidence could not be written.", message); }
    }
    try {
      try {
        await resolveContainedExistingPath(this.repositoryRoot, `${evidenceDirectory(state)}/cleanup.json`);
        return outcomeResult("cleanup-experiment", "NOT_RUN", "This invocation already has immutable cleanup evidence; replay cleanup was refused.");
      } catch { /* first cleanup attempt for this invocation */ }
      if (!run.composePath) return outcomeResult("cleanup-experiment", "NOT_RUN", "Source/image preflight stopped before an owned Compose project was created.");
      const owner = JSON.parse(await readFile(await resolveContainedExistingPath(this.repositoryRoot, `${evidenceDirectory(state)}/owner.json`), "utf8")) as { workflowRunId?: string; invocationId?: string; project?: string; composeFile?: string; composeSha256?: string; sourceCommit?: string; candidateId?: string; candidateRevision?: number };
      if (owner.workflowRunId !== state.runId || owner.invocationId !== invocation || owner.project !== run.project || owner.project !== safeProjectName(`${state.runId}-${invocation}`) || owner.composeFile !== `${evidenceDirectory(state)}/compose.json` || owner.sourceCommit !== SOURCE_COMMIT || owner.candidateId !== candidate.candidateId || owner.candidateRevision !== candidate.revision || !owner.composeSha256 || owner.composeSha256 !== sha256(await readFile(run.composePath))) throw new Error("invocation ownership or Compose integrity mismatch; cleanup is refused");
      await this.assertOwnedResources(run);
      const down = await this.compose(run, ["down", "--volumes", "--remove-orphans"]);
      if (down.exitCode !== 0) throw new Error("run-scoped Compose cleanup returned a non-zero exit code");
      await this.assertNoOwnedResources(run);
      const evidence = await this.writeRunEvidence(state, "cleanup.json", JSON.stringify({ runId: state.runId, invocationId: invocation, project: run.project, outcome: "PASS", volumesRemoved: true, scope: "only resources carrying the exact Compose project label" }, null, 2));
      return outcomeResult("cleanup-experiment", "PASS", "Invocation-scoped Compose resources removed after ownership verification.", "", 0, [this.evidenceRef(`${invocation}-cleanup`, evidence)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "cleanup failed";
      const evidence = await this.writeRunEvidence(state, `cleanup-blocked-${uuid()}.json`, JSON.stringify({ runId: state.runId, invocationId: invocation, project: run.project, outcome: "CLEANUP_BLOCKED", error: sanitizeToolOutput(message), noGlobalCleanup: true, recovery: "Verify owner.json and Compose labels manually; remove only the exact invocation project after ownership is established." }, null, 2));
      return outcomeResult("cleanup-experiment", "BLOCKED", "Cleanup ownership or execution could not be verified; manual scoped recovery is required.", sanitizeToolOutput(message), undefined, [this.evidenceRef(`${invocation}-cleanup`, evidence)]);
    }
  }

  async collectEvidence(runId: string): Promise<EvidenceReference[]> {
    const directory = await resolveContainedExistingPath(this.repositoryRoot, `docs/tasks/T01-B/evidence/${runId}`);
    const files = await readdir(directory, { withFileTypes: true });
    return files.filter((entry) => entry.isFile() && /\.(json|log)$/.test(entry.name))
      .map((entry) => this.evidenceRef(runId, `docs/tasks/T01-B/evidence/${runId}/${entry.name}`));
  }

  createDispatcher(state: AgentWorkflowState): FixedToolDispatcher {
    const implementations = this.toolImplementations(state);
    return new FixedToolDispatcher({ repositoryRoot: this.repositoryRoot, manifest: this.manifest, workflow: state, ...(state.candidate ? { candidate: state.candidate } : {}), allowedRoots: ["config", "docs", "experiments"] }, implementations);
  }

  private toolImplementations(state: AgentWorkflowState): FixedToolImplementations {
    return {
      "read-baseline-inventory": async () => ({ tool: "read-baseline-inventory", outcome: "PASS", stdout: JSON.stringify(await this.readBaseline()), stderr: "", evidence: [] }),
      "validate-gherkin": async (request, paths) => {
        if (request.tool !== "validate-gherkin") throw new Error("fixed Gherkin tool received the wrong request variant");
        const content = await readFile(paths.artifactPath!, "utf8");
        parseGherkin(content);
        return outcomeResult(request.tool, "PASS", "Gherkin syntax parsed and feature contains scenarios.");
      },
      "read-approved-manifest": async (_request, paths) => ({ tool: "read-approved-manifest", outcome: "PASS", stdout: JSON.stringify(parseApplicationManifest(JSON.parse(await readFile(paths.manifestPath!, "utf8")))), stderr: "", evidence: [] }),
      "generate-source-artifact": async () => outcomeResult("generate-source-artifact", "BLOCKED", "", "No model generation is authorized for this T01-B run; only a separately reviewed reused artifact is available."),
      "compile-maven-project": async (request) => this.compile(state.candidate ?? (() => { throw new Error("approved candidate is missing"); })()),
      "run-selenium-test": async (request) => {
        if (request.tool !== "run-selenium-test") throw new Error("fixed Selenium tool received the wrong request variant");
        const candidate = state.candidate;
        const artifact = state.artifacts.find((item) => item.kind === "generated_java" && item.path === request.generatedArtifactPath) as GeneratedJavaArtifact | undefined;
        if (!candidate || !artifact) return outcomeResult(request.tool, "FAIL", "", "approved candidate/artifact binding is missing");
        return this.runSelenium(candidate, artifact, state);
      },
      "prepare-fixture": async (request) => {
        if (request.tool !== "prepare-fixture") throw new Error("fixed fixture tool received the wrong request variant");
        return state.candidate ? this.prepareFixture(state.candidate, request.experimentKey, state) : outcomeResult(request.tool, "FAIL", "", "candidate is missing");
      },
      "collect-test-evidence": async (_request, paths) => {
        const data = await readFile(paths.artifactPath!, "utf8");
        return outcomeResult("collect-test-evidence", "PASS", data.slice(0, 100_000));
      },
      "cleanup-experiment": async (request) => {
        if (request.tool !== "cleanup-experiment") throw new Error("fixed cleanup tool received the wrong request variant");
        return state.candidate ? this.cleanup(state.candidate, request.experimentKey, state) : outcomeResult(request.tool, "FAIL", "", "candidate is missing");
      },
    };
  }

  async validate(candidate: CandidateScenario, artifact: GeneratedJavaArtifact, repairAttempts: number, state: AgentWorkflowState): Promise<ValidationResult> {
    const invocationId = `inv-${sha256(`${state.runId}:${repairAttempts}:${artifact.sha256}`).slice(0, 24)}`;
    const invocationState = { ...state, validationInvocationId: invocationId };
    const dispatcher = this.createDispatcher(invocationState);
    const refs = new Map<Stage, ValidationResult[Stage]>();
    const record = async (stage: Stage, tool: ToolName, request: Record<string, unknown>): Promise<ToolResult> => {
      const stageRunId = `${invocationId}-${stage}`;
      let result: ToolResult;
      try { result = await dispatcher.dispatch(request); }
      catch (error) { result = outcomeResult(tool, tool === "cleanup-experiment" ? "BLOCKED" : "FAIL", "", sanitizeToolOutput(error instanceof Error ? error.message : "tool dispatch failed")); }
      let logPath: string | undefined;
      try { if (result.outcome !== "NOT_RUN") logPath = await this.writeRunEvidence(invocationState, `${stage}.log`, sanitizeToolOutput(`${result.stdout}\n${result.stderr}`)); }
      catch (error) { result = outcomeResult(tool, tool === "cleanup-experiment" ? "BLOCKED" : "FAIL", result.stdout, sanitizeToolOutput(`stage evidence write failed: ${error instanceof Error ? error.message : "unknown error"}`), result.exitCode, result.evidence); }
      const evidence = result.outcome === "NOT_RUN" ? [] : result.evidence.length
        ? result.evidence.map((reference) => ({ ...reference, runId: stageRunId }))
        : logPath ? [this.evidenceRef(stageRunId, logPath)] : result.evidence;
      refs.set(stage, {
        invocationId,
        ...(result.outcome === "NOT_RUN" ? {} : { stageRunId }),
        outcome: result.outcome,
        sourceCommit: SOURCE_COMMIT,
        sourceVersion: SOURCE_VERSION,
        evidence,
      });
      return result;
    };
    const common = { appId: "expresscart", sourceCommit: SOURCE_COMMIT, candidateId: candidate.candidateId, revision: candidate.revision };
    const compile = await record("compile", "compile-maven-project", { tool: "compile-maven-project", ...common, projectPath: this.manifest.baseSuitePath });
    let fixture: ToolResult = outcomeResult("prepare-fixture", "NOT_RUN");
    let e2e: ToolResult = outcomeResult("run-selenium-test", "NOT_RUN");
    if (compile.outcome === "PASS") {
      fixture = await record("fixture", "prepare-fixture", { tool: "prepare-fixture", ...common, experimentKey: this.manifest.fixtureReset.experimentKey });
      if (fixture.outcome === "PASS") {
        e2e = await record("e2e", "run-selenium-test", { tool: "run-selenium-test", ...common, projectPath: this.manifest.baseSuitePath, generatedArtifactPath: artifact.path, testClass: artifact.testClass });
      }
    }
    let cleanup: ToolResult = outcomeResult("cleanup-experiment", "NOT_RUN");
    if (fixture.outcome !== "NOT_RUN" || this.runs.has(invocationId)) cleanup = await record("cleanup", "cleanup-experiment", { tool: "cleanup-experiment", ...common, experimentKey: this.manifest.fixtureReset.experimentKey });
    for (const stage of STAGE_NAMES) if (!refs.has(stage)) refs.set(stage, { invocationId, outcome: "NOT_RUN", sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, evidence: [] });
    const decision = (kind: "oracle" | "novelty") => ({ decisionId: `${invocationId}-${kind}`, appId: "expresscart" as const, candidateId: candidate.candidateId, candidateRevision: candidate.revision, decision: "UNVERIFIED" as const, reviewerId: trustedReviewerId(), decidedAt: new Date().toISOString(), rationale: `T01-B ${kind} review remains independent and was not recorded by the implementation approval.`, evidence: [] });
    return parseValidationResult({ appId: "expresscart", candidateId: candidate.candidateId, candidateRevision: candidate.revision, invocationId, sourceCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, compile: refs.get("compile"), fixture: refs.get("fixture"), e2e: refs.get("e2e"), cleanup: refs.get("cleanup"), oracleDecision: decision("oracle"), noveltyDecision: decision("novelty"), repeats: [], repairAttempts, evidence: [], researchAcceptance: { status: "NOT_REVIEWED" } });
  }

  private async getOrCreateRun(workflowRunId: string, invocation: string): Promise<ActiveRun> {
    const existing = this.runs.get(invocation);
    if (existing) return existing;
    const project = safeProjectName(`${workflowRunId}-${invocation}`);
    const run = { workflowRunId, invocationId: invocation, project, composePath: "", evidence: [] };
    await ensureContainedDirectory(this.repositoryRoot, `docs/tasks/T01-B/evidence/${workflowRunId}/invocations/${invocation}`);
    this.runs.set(invocation, run);
    return run;
  }

  private async recoverRun(state: AgentWorkflowState, invocation: string): Promise<ActiveRun | undefined> {
    const base = evidenceDirectory(state);
    try {
      const owner = JSON.parse(await readFile(await resolveContainedExistingPath(this.repositoryRoot, `${base}/owner.json`), "utf8")) as { workflowRunId?: string; invocationId?: string; project?: string; composeFile?: string; composeSha256?: string; sourceCommit?: string; candidateId?: string; candidateRevision?: number };
      if (owner.workflowRunId !== state.runId || owner.invocationId !== invocation || owner.project !== safeProjectName(`${state.runId}-${invocation}`) || owner.composeFile !== `${base}/compose.json` || owner.sourceCommit !== SOURCE_COMMIT || owner.candidateId !== state.candidate?.candidateId || owner.candidateRevision !== state.candidate?.revision || !owner.composeSha256) return undefined;
      const composePath = await resolveContainedExistingPath(this.repositoryRoot, owner.composeFile);
      if (sha256(await readFile(composePath)) !== owner.composeSha256) return undefined;
      const run: ActiveRun = { workflowRunId: state.runId, invocationId: invocation, project: owner.project, composePath, composeSha256: owner.composeSha256, evidence: [] };
      this.runs.set(invocation, run);
      return run;
    } catch { return undefined; }
  }

  private composeDefinition(): Record<string, unknown> {
    if (this.manifest.runtime.kind !== "source-built") throw new Error("ExpressCart runtime is not source-built");
    const runtime = this.manifest.runtime;
    const mongo = runtime.auxiliaryImages?.find((image) => image.image.startsWith("mongo:"));
    if (!mongo) throw new Error("pinned Mongo auxiliary image is missing");
    return {
      services: {
        app: { image: runtime.image, environment: { NODE_ENV: "production", PORT: "1111", NODE_PATH: "/var/expressCart", databaseConnectionString: "mongodb://mongo:27017/expresscart_experiment" }, ports: ["127.0.0.1::1111"], depends_on: { mongo: { condition: "service_healthy" } }, restart: "no" },
        mongo: { image: mongo.image, command: ["mongod", "--bind_ip_all"], healthcheck: { test: ["CMD", "mongo", "--quiet", "--eval", "db.adminCommand('ping').ok"], interval: "5s", timeout: "3s", retries: 20 }, restart: "no" },
      },
    };
  }

  private validateComposeConfig(raw: string, project: string): boolean {
    try {
      const config = JSON.parse(raw) as { services?: Record<string, unknown>; name?: string };
      return config.name === project && Object.keys(config.services ?? {}).sort().join(",") === "app,mongo";
    } catch { return false; }
  }

  private async compose(run: ActiveRun, args: string[]) {
    return await this.processRunner("docker", ["compose", "-p", run.project, "-f", run.composePath, ...args], { cwd: this.repositoryRoot, timeoutMs: 90_000 });
  }

  private async waitUntilReady(baseUrl: string): Promise<void> {
    const deadline = Date.now() + 90_000;
    let lastError = "no response";
    while (Date.now() < deadline) {
      try {
        const response = await fetch(baseUrl, { signal: AbortSignal.timeout(3_000) });
        if (response.status >= 200 && response.status < 500) return;
        lastError = `HTTP ${response.status}`;
      } catch (error) { lastError = error instanceof Error ? error.message : "connection failed"; }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000));
    }
    throw new Error(`ExpressCart readiness timed out: ${lastError}`);
  }

  private async findCompatibleChromeDriver(): Promise<{ path: string; browserPath: string; version: string; sha256: string }> {
    const cacheRoot = join(homedir(), ".cache", "selenium");
    const driverRoot = join(cacheRoot, "chromedriver", "win64");
    const installRoots = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA]
      .filter((value): value is string => Boolean(value))
      .map((root) => join(root, "Google", "Chrome", "Application"));
    for (const installRoot of installRoots) {
      const browserPath = join(installRoot, "chrome.exe");
      try {
        const browserInfo = await lstat(browserPath);
        if (browserInfo.isSymbolicLink() || !browserInfo.isFile()) continue;
        const versions = (await readdir(installRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+\.\d+$/.test(entry.name)).map((entry) => entry.name).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
        for (const version of versions) {
          const manifestPath = join(installRoot, version, `${version}.manifest`);
          const driverPath = join(driverRoot, version, "chromedriver.exe");
          const manifestInfo = await lstat(manifestPath).catch(() => undefined);
          const driverInfo = await lstat(driverPath).catch(() => undefined);
          if (!manifestInfo || manifestInfo.isSymbolicLink() || !manifestInfo.isFile() || !driverInfo || driverInfo.isSymbolicLink() || !driverInfo.isFile()) continue;
          const browserManifest = await readFile(manifestPath, "utf8");
          if (!browserManifest.includes(`name='${version}'`) || !browserManifest.includes(`version='${version}'`)) continue;
          const driverCheck = await runFixedProcess(driverPath, ["--version"], { cwd: this.repositoryRoot, timeoutMs: 10_000, maxOutputBytes: 20_000 });
          if (driverCheck.exitCode !== 0 || !driverCheck.stdout.includes(version)) continue;
          return { path: resolve(driverPath), browserPath: resolve(browserPath), version, sha256: sha256(await readFile(driverPath)) };
        }
      } catch { /* only an exactly matching preinstalled browser/driver pair may be selected */ }
    }
    throw new Error("no exact installed Chrome/ChromeDriver version pair is available in the existing Selenium cache; no driver download was attempted");
  }

  private async assertOwnedResources(run: ActiveRun): Promise<void> {
    const containers = await this.compose(run, ["ps", "-aq"]);
    if (containers.exitCode !== 0) throw new Error("could not list resources for the owned Compose project");
    const ids = containers.stdout.split(/\s+/).filter(Boolean);
    if (ids.length) {
      const inspect = await runFixedProcess("docker", ["inspect", "--format", "{{ index .Config.Labels \"com.docker.compose.project\" }}", ...ids], { cwd: this.repositoryRoot, timeoutMs: 30_000 });
      if (inspect.exitCode !== 0 || inspect.stdout.trim().split(/\s+/).some((label) => label !== run.project)) throw new Error("container labels do not prove exclusive run ownership; cleanup refused");
    }
    for (const [kind, listArgs, inspectArgs, format] of [
      ["volume", ["volume", "ls", "-q", "--filter", `label=com.docker.compose.project=${run.project}`], ["volume", "inspect", "--format"], "{{ index .Labels \"com.docker.compose.project\" }}"],
      ["network", ["network", "ls", "-q", "--filter", `label=com.docker.compose.project=${run.project}`], ["network", "inspect", "--format"], "{{ index .Labels \"com.docker.compose.project\" }}"],
    ] as const) {
      const list = await runFixedProcess("docker", listArgs, { cwd: this.repositoryRoot, timeoutMs: 20_000 });
      if (list.exitCode !== 0) throw new Error(`could not list run-owned Docker ${kind}s`);
      const resourceIds = list.stdout.split(/\s+/).filter(Boolean);
      if (!resourceIds.length) continue;
      const inspected = await runFixedProcess("docker", [...inspectArgs, format, ...resourceIds], { cwd: this.repositoryRoot, timeoutMs: 30_000 });
      if (inspected.exitCode !== 0 || inspected.stdout.trim().split(/\s+/).some((label) => label !== run.project)) throw new Error(`${kind} labels do not prove exclusive run ownership; cleanup refused`);
    }
  }

  private async assertNoOwnedResources(run: ActiveRun): Promise<void> {
    const containers = await this.compose(run, ["ps", "-aq"]);
    if (containers.exitCode !== 0 || containers.stdout.split(/\s+/).some(Boolean)) throw new Error("run-scoped containers remain after Compose cleanup");
    for (const kind of ["volume", "network"] as const) {
      const result = await runFixedProcess("docker", [kind, "ls", "-q", "--filter", `label=com.docker.compose.project=${run.project}`], { cwd: this.repositoryRoot, timeoutMs: 20_000 });
      if (result.exitCode !== 0 || result.stdout.split(/\s+/).some(Boolean)) throw new Error(`run-scoped Docker ${kind}s remain or could not be verified after cleanup`);
    }
  }

  private async writeRunEvidence(state: AgentWorkflowState, name: string, content: string): Promise<string> {
    const relativePath = `${evidenceDirectory(state)}/${name}`;
    await ensureContainedDirectory(this.repositoryRoot, evidenceDirectory(state));
    const path = await resolveContainedOutputPath(this.repositoryRoot, relativePath);
    await writeFile(path, content, { flag: "wx" });
    return relativePath;
  }

  private evidenceRef(runId: string, artifactPath: string): EvidenceReference {
    return { repositoryCommit: SOURCE_COMMIT, sourceVersion: SOURCE_VERSION, runId, artifactPath };
  }
}

export function trustedReviewerId(): string {
  const principal = userInfo().username;
  if (!principal) throw new Error("OS user principal is unavailable; trusted reviewer identity cannot be established");
  return `os-sha256:${sha256(principal.toLowerCase())}`;
}

export function parseExpressCartManifest(text: string): ApplicationManifest {
  return parseApplicationManifest(JSON.parse(text));
}
