import test from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { ExpressCartExperimentAdapter, parseExpressCartManifest } from "../../../adapters/expresscart/experiment.js";
import type { AgentWorkflowState, CandidateScenario } from "../../src/contracts.js";
import { runFixedProcess } from "../../src/runtime/process.js";

const root = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const crashChild = fileURLToPath(new URL("../fixtures/expresscart-crash-replay-child.ts", import.meta.url));
const commit = "b31302f4e99c3293bd742c6d076a721e168118b0";
const enabled = process.env.BEWT_RUN_CRASH_RECOVERY === "1";

function filterDockerRows(output: string, projectNames: string[]): string {
  const lines = output.trim().split(/\r?\n/);
  const header = lines[0] ?? "";
  const selected = lines.slice(1).filter((line) => projectNames.some((project) => line.includes(project)));
  return [header, ...selected, `Omitted ${Math.max(0, lines.length - 1 - selected.length)} unrelated Docker row(s).`].join("\n");
}

function launch(mode: "crash" | "resume", dbPath: string, runId: string, markerPath: string) {
  const child = spawn(process.execPath, ["--import", "tsx", crashChild, mode, dbPath, runId, markerPath], { cwd: join(root, "framework"), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
  return { child, output: () => ({ stdout, stderr }) };
}

async function waitForMarker(child: ChildProcess, markerPath: string, timeoutMs: number, output: () => { stdout: string; stderr: string }): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { await readFile(markerPath); return; } catch { /* child has not reached post-fixture checkpoint */ }
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`crash child exited before fixture marker: ${child.exitCode}/${child.signalCode}; stdout=${output().stdout}; stderr=${output().stderr}`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`timed out waiting ${timeoutMs}ms for the post-fixture crash marker`);
}

test("SqliteSaver replay after OS process termination reconciles fixture and runs a fresh actual E2E", { skip: !enabled }, async () => {
  const runId = process.env.BEWT_CRASH_RUN_ID ?? `t01b-crash-${randomUUID()}`;
  const evidenceDirectory = `docs/tasks/T01-B/evidence/${runId}`;
  const evidenceAbsolute = resolve(root, evidenceDirectory);
  const markerPath = join(evidenceAbsolute, "crash-marker.json");
  const scratch = await mkdtemp(join(tmpdir(), "bewt-crash-replay-"));
  const dbPath = join(scratch, "checkpoints.sqlite");
  const beforeCompose = await runFixedProcess("docker", ["compose", "ls", "--all"], { cwd: root, timeoutMs: 20_000 });
  const beforeContainers = await runFixedProcess("docker", ["ps", "--format", "{{.Names}} {{.Label \"com.docker.compose.project\"}}"], { cwd: root, timeoutMs: 20_000 });
  assert.equal(beforeCompose.exitCode, 0, beforeCompose.stderr);
  assert.equal(beforeContainers.exitCode, 0, beforeContainers.stderr);
  assert.match(beforeCompose.stdout, /bewt-covext-expresscart-b31302f\s+running\(2\)/, "the known pre-existing ExpressCart Compose project must be present before the smoke");
  await mkdir(evidenceAbsolute, { recursive: true });
  await writeFile(join(evidenceAbsolute, "docker-before-state.log"), `docker compose ls --all (filtered)\n${filterDockerRows(beforeCompose.stdout, ["bewt-covext-expresscart-b31302f"])}\ndocker ps with project labels (filtered)\n${filterDockerRows(beforeContainers.stdout, ["bewt-covext-expresscart-b31302f"])}`);

  let first = launch("crash", dbPath, runId, markerPath);
  let resumed: ReturnType<typeof launch> | undefined;
  let crashMarker: { invocationId: string } | undefined;
  const ownedProjects: string[] = [];
  try {
    await waitForMarker(first.child, markerPath, 180_000, first.output);
    crashMarker = JSON.parse(await readFile(markerPath, "utf8")) as { invocationId: string };
    const terminated = first.child.kill("SIGKILL");
    assert.equal(terminated, true, "test watchdog must terminate only the owned Node child after the fixture marker");
    const [crashExit] = await once(first.child, "close") as [number | null, NodeJS.Signals | null];
    assert.notEqual(crashExit, 0, "the first process is intentionally terminated before Selenium");
    await writeFile(join(evidenceAbsolute, "process-termination.json"), JSON.stringify({ runId, invocationId: crashMarker.invocationId, processTerminated: true, terminationScope: "dedicated adapter/checkpointer Node child after PASS fixture preflight", timestamp: new Date().toISOString() }, null, 2));

    resumed = launch("resume", dbPath, runId, markerPath);
    const [resumeExit] = await once(resumed.child, "close") as [number | null, NodeJS.Signals | null];
    const output = resumed.output();
    assert.equal(resumeExit, 0, output.stderr || output.stdout);
    const result = JSON.parse(output.stdout.trim().split(/\r?\n/).at(-1)!) as { workflowStatus: string; previousInvocation: string; validation: { invocationId: string; compile: { outcome: string; evidence: Array<{ artifactPath: string }> }; fixture: { outcome: string; evidence: Array<{ artifactPath: string }> }; e2e: { outcome: string; evidence: Array<{ artifactPath: string }> }; cleanup: { outcome: string; evidence: Array<{ artifactPath: string }> } }; evidencePath: string };
    assert.equal(result.workflowStatus, "EXECUTION_COMPLETED");
    assert.equal(result.previousInvocation, crashMarker.invocationId);
    assert.notEqual(result.validation.invocationId, crashMarker.invocationId, "replayed work must use a fresh invocation identity");
    assert.deepEqual([result.validation.compile.outcome, result.validation.fixture.outcome, result.validation.e2e.outcome, result.validation.cleanup.outcome], ["PASS", "PASS", "PASS", "PASS"]);
    const currentInvocation = result.validation.invocationId;
    const invocationRoot = join(evidenceAbsolute, "invocations", currentInvocation);
    const junit = await readFile(join(invocationRoot, "junit", "TEST-tests.ForgottenPasswordTest.xml"), "utf8");
    assert.match(junit, /tests="1"/);
    assert.match(junit, /failures="0"/);
    assert.match(junit, /errors="0"/);
    const classification = JSON.parse(await readFile(join(invocationRoot, "selenium-classification.json"), "utf8")) as { outcome: string; classification: string };
    assert.deepEqual(classification, { ...classification, outcome: "PASS", classification: "E2E_PASS" });
    const cleanup = JSON.parse(await readFile(join(invocationRoot, "cleanup.json"), "utf8")) as { outcome: string; invocationId: string };
    assert.equal(cleanup.outcome, "PASS");
    assert.equal(cleanup.invocationId, currentInvocation);
    const oldCleanup = JSON.parse(await readFile(join(evidenceAbsolute, "invocations", crashMarker.invocationId, "cleanup.json"), "utf8")) as { outcome: string; invocationId: string };
    assert.equal(oldCleanup.outcome, "PASS", "the abandoned invocation must be reconciled before the new one starts");
    assert.equal(oldCleanup.invocationId, crashMarker.invocationId);
    await writeFile(join(evidenceAbsolute, "replay-summary.json"), JSON.stringify({ runId, crashInvocationId: crashMarker.invocationId, completedInvocationId: currentInvocation, sourceCommit: commit, artifactOrigin: "REUSED", workflowStatus: result.workflowStatus, outcomes: { compile: "PASS", fixture: "PASS", e2e: "PASS", cleanup: "PASS" }, junit: `${evidenceDirectory}/invocations/${currentInvocation}/junit/TEST-tests.ForgottenPasswordTest.xml`, terminalEvidence: result.evidencePath, model: { provider: "Gemini", status: "NOT_RUN", calls: 0 } }, null, 2));
  } finally {
    if (first.child.exitCode === null && first.child.signalCode === null) { first.child.kill("SIGKILL"); await once(first.child, "close"); }
    if (resumed && resumed.child.exitCode === null && resumed.child.signalCode === null) { resumed.child.kill("SIGKILL"); await once(resumed.child, "close"); }
    if (crashMarker) {
      const manifest = parseExpressCartManifest(await readFile(resolve(root, "config/apps/expresscart.json"), "utf8"));
      const adapter = new ExpressCartExperimentAdapter(root, manifest);
      const feature = await readFile(resolve(root, "docs/research-results/sprint-02/revised/EC-C04-forgotten-password.feature"), "utf8");
      const candidate: CandidateScenario = { candidateId: "EC-C04", appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", revision: 1, gherkin: feature,
        preconditions: ["fresh isolated unregistered email"], oracle: ["generic response"], noveltyRationale: "test cleanup only", sourceReferences: [], reviewStatus: "ACCEPTED_FOR_IMPLEMENTATION" };
      const directory = join(evidenceAbsolute, "invocations");
      for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        try {
          const owner = JSON.parse(await readFile(join(directory, entry.name, "owner.json"), "utf8")) as { project?: string };
          if (owner.project) ownedProjects.push(owner.project);
        } catch { /* missing or invalid ownership remains fail-closed in cleanup */ }
        const state: AgentWorkflowState = { appId: "expresscart", sourceCommit: commit, sourceVersion: "1.1.19", runId, validationInvocationId: entry.name, currentRole: "validation_repair", status: "VALIDATING", candidate,
          reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
        await adapter.cleanup(candidate, manifest.fixtureReset.experimentKey, state);
      }
    }
    await rm(scratch, { recursive: true, force: true });
  }
  const afterCompose = await runFixedProcess("docker", ["compose", "ls", "--all"], { cwd: root, timeoutMs: 20_000 });
  const afterContainers = await runFixedProcess("docker", ["ps", "--format", "{{.Names}} {{.Label \"com.docker.compose.project\"}}"], { cwd: root, timeoutMs: 20_000 });
  assert.equal(afterCompose.exitCode, 0, afterCompose.stderr);
  assert.equal(afterContainers.exitCode, 0, afterContainers.stderr);
  assert.match(afterCompose.stdout, /bewt-covext-expresscart-b31302f\s+running\(2\)/);
  for (const project of ownedProjects) {
    const projectRegex = new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    assert.doesNotMatch(afterCompose.stdout, projectRegex, `owned Compose project ${project} must be absent after recovery`);
    assert.doesNotMatch(afterContainers.stdout, projectRegex, `owned Docker labels ${project} must be absent after recovery`);
  }
  const relevantProjects = ["bewt-covext-expresscart-b31302f", ...ownedProjects];
  await writeFile(join(evidenceAbsolute, "docker-after-state.log"), `docker compose ls --all (filtered)\n${filterDockerRows(afterCompose.stdout, relevantProjects)}\ndocker ps with project labels (filtered)\n${filterDockerRows(afterContainers.stdout, relevantProjects)}`);
});
