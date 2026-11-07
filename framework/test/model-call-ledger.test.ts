import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readModelRunBudget, recordModelCall, reserveModelCall } from "../src/runtime/model-call-ledger.js";

test("model run reservations enforce request budget across restart and keep failed calls consumed", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-model-ledger-"));
  const evidenceRoot = "docs/tasks/T01-C/evidence";
  const runId = "t01c-ledger-test";
  const runDirectory = join(root, evidenceRoot, runId);
  await mkdir(runDirectory, { recursive: true });
  await writeFile(join(runDirectory, "model-run-budget.json"), JSON.stringify({ apiRequestsAllowed: 2, runCostCeilingUsd: 0.02, perCallCostCeilingUsd: 0.01 }));
  try {
    const first = await reserveModelCall(root, evidenceRoot, runId, "gherkin");
    assert.equal(first.callNumber, 1);
    await recordModelCall(root, evidenceRoot, runId, first.callNumber, "FAIL", { calls: 1 }, new Error("API_KEY_INVALID"));

    // A later process uses only the persisted reservation count; it cannot replay call 1.
    const afterRestart = await readModelRunBudget(root, evidenceRoot, runId);
    assert.equal(afterRestart.apiRequestsAllowed, 2);
    const second = await reserveModelCall(root, evidenceRoot, runId, "java");
    assert.equal(second.callNumber, 2);
    await assert.rejects(reserveModelCall(root, evidenceRoot, runId, "gherkin"), /MODEL_RUN_BUDGET_EXHAUSTED/);

    const reservationFiles = await readdir(join(runDirectory, "model-calls"));
    assert.deepEqual(reservationFiles.filter((name) => name.endsWith("-reserved.json")).sort(), ["call-01-reserved.json", "call-02-reserved.json"]);
    const result = JSON.parse(await readFile(join(runDirectory, "model-calls/call-01-result.json"), "utf8")) as { error?: string };
    assert.equal(result.error, "API_KEY_INVALID");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("model run budget rejects malformed or overcommitted limits", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-model-budget-"));
  const evidenceRoot = "evidence";
  const runDirectory = join(root, evidenceRoot, "bad-budget");
  await mkdir(runDirectory, { recursive: true });
  try {
    await writeFile(join(runDirectory, "model-run-budget.json"), JSON.stringify({ apiRequestsAllowed: 4, runCostCeilingUsd: 0.02, perCallCostCeilingUsd: 0.01 }));
    await assert.rejects(readModelRunBudget(root, evidenceRoot, "bad-budget"), /budget ledger is invalid/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
