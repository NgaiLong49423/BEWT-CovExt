import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { TOOL_NAMES, parseApplicationManifest, type AgentWorkflowState, type ToolRequest, type ToolName } from "../../src/contracts.js";
import { FixedToolDispatcher, type FixedToolImplementations } from "../../src/runtime/tool-dispatcher.js";

const repositoryRoot = resolve(process.cwd(), "..");
const manifest = parseApplicationManifest(JSON.parse(await readFile(join(repositoryRoot, "config/apps/expresscart.json"), "utf8")));

function workflow(): AgentWorkflowState {
  return { appId: "expresscart", sourceCommit: manifest.source.commit, sourceVersion: manifest.source.packageVersion!, runId: "dispatcher-test", currentRole: "coverage_analysis", status: "STARTED", reviewDecisions: [], appliedDecisionIds: [], artifacts: [], repairAttempts: 0 };
}

function implementations(calls: string[]): FixedToolImplementations {
  return Object.fromEntries(TOOL_NAMES.map((tool) => [tool, async (request: ToolRequest) => {
    calls.push(tool);
    return { tool: request.tool, outcome: "PASS", stdout: "fixed handler", stderr: "", evidence: [] };
  }])) as unknown as FixedToolImplementations;
}

test("dispatcher schema-validates, policy-checks and resolves symlink-free paths before fixed handler calls", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01b-dispatcher-"));
  const outside = await mkdtemp(join(tmpdir(), "bewt-t01b-dispatcher-outside-"));
  const calls: string[] = [];
  try {
    await mkdir(join(root, "config"));
    await writeFile(join(root, "config", "manifest.json"), JSON.stringify(manifest));
    await writeFile(join(outside, "manifest.json"), JSON.stringify(manifest));
    const dispatcher = new FixedToolDispatcher({ repositoryRoot: root, manifest, workflow: workflow(), allowedRoots: ["config"] }, implementations(calls));
    const valid = { tool: "read-approved-manifest", appId: "expresscart", sourceCommit: manifest.source.commit, manifestPath: "config/manifest.json" } as const;
    const result = await dispatcher.dispatch(valid);
    assert.equal(result.outcome, "PASS");
    assert.deepEqual(calls, ["read-approved-manifest"]);
    await assert.rejects(dispatcher.dispatch({ ...valid, manifestPath: "config/../escape.json" }), /path/);
    assert.equal(calls.length, 1, "invalid schema must be rejected before dispatch");

    await rm(join(root, "config"), { recursive: true });
    await symlink(outside, join(root, "config"), "junction");
    await assert.rejects(dispatcher.dispatch(valid), /symlink/);
    assert.equal(calls.length, 1, "symlink escape must be rejected before dispatch");
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("dispatcher requires a fixed implementation for every declared tool", () => {
  const calls: string[] = [];
  const all = implementations(calls);
  delete (all as Partial<Record<ToolName, unknown>>)["cleanup-experiment"];
  assert.throws(() => new FixedToolDispatcher({ repositoryRoot, manifest, workflow: workflow(), allowedRoots: ["config"] }, all), /every allowlisted tool/);
});
