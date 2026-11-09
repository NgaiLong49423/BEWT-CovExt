import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { completePendingModelCall, hasReservedModelCall, readModelRunBudget, recordModelCall, reserveModelCall } from "../src/runtime/model-call-ledger.js";

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
    const invalidBudgets = [
      { apiRequestsAllowed: 4, runCostCeilingUsd: 0.02, perCallCostCeilingUsd: 0.01 },
      { apiRequestsAllowed: 1, runCostCeilingUsd: -1, perCallCostCeilingUsd: -2 },
      { apiRequestsAllowed: 1, runCostCeilingUsd: 0, perCallCostCeilingUsd: 0 },
      { apiRequestsAllowed: 1, runCostCeilingUsd: 0.02, perCallCostCeilingUsd: -0.01 },
      { apiRequestsAllowed: 1, runCostCeilingUsd: 0.02, perCallCostCeilingUsd: 0.0001 },
      { apiRequestsAllowed: 1, runCostCeilingUsd: 0.04, perCallCostCeilingUsd: 0.04 },
      { apiRequestsAllowed: 5, runCostCeilingUsd: 0.05, perCallCostCeilingUsd: 0.01 },
      { apiRequestsAllowed: 100, runCostCeilingUsd: 1, perCallCostCeilingUsd: 0.01 },
      { apiRequestsAllowed: 1.5, runCostCeilingUsd: 0.02, perCallCostCeilingUsd: 0.01 },
      { apiRequestsAllowed: 1, runCostCeilingUsd: null, perCallCostCeilingUsd: 0.01 },
    ];
    for (const budget of invalidBudgets) {
      await writeFile(join(runDirectory, "model-run-budget.json"), JSON.stringify(budget));
      await assert.rejects(reserveModelCall(root, evidenceRoot, "bad-budget", "gherkin"), /budget ledger is invalid/);
    }
    await assert.rejects(readdir(join(runDirectory, "model-calls")), { code: "ENOENT" }, "invalid budgets must not create reservations");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a crash after reservation is not replayed, while a persisted response completes its original call", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-model-replay-"));
  const evidenceRoot = "docs/tasks/T01-C/evidence";
  const runId = "t01c-java-replay";
  await mkdir(join(root, evidenceRoot, runId), { recursive: true });
  await writeFile(join(root, evidenceRoot, runId, "model-run-budget.json"), JSON.stringify({ apiRequestsAllowed: 4, runCostCeilingUsd: 0.02, perCallCostCeilingUsd: 0.005 }));
  try {
    const reservation = await reserveModelCall(root, evidenceRoot, runId, "java");
    assert.equal(await hasReservedModelCall(root, evidenceRoot, runId, "java"), true);
    await completePendingModelCall(root, evidenceRoot, runId, "java", { calls: 1, status: "PASS" });
    assert.equal(await readFile(join(root, evidenceRoot, runId, "model-calls/call-01-result.json"), "utf8").then((text) => text.includes('"status": "PASS"')), true);
    assert.equal(reservation.callNumber, 1);
    assert.equal((await readdir(join(root, evidenceRoot, runId, "model-calls"))).filter((name) => name.endsWith("-reserved.json")).length, 1,
      "a replay can detect the consumed Java stage and reuse the persisted response instead of reserving another call");
  } finally { await rm(root, { recursive: true, force: true }); }
});
