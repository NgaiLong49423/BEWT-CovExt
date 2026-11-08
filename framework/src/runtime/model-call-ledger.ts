import { readdir, readFile, writeFile } from "node:fs/promises";
import { ensureContainedDirectory, resolveContainedExistingPath, resolveContainedOutputPath } from "./safe-path.js";
import { sanitizeToolOutput } from "../contracts.js";

export interface ModelRunBudget {
  apiRequestsAllowed: number;
  runCostCeilingUsd: number;
  perCallCostCeilingUsd: number;
}

async function writeUnique(root: string, relativePath: string, content: string): Promise<void> {
  const path = await resolveContainedOutputPath(root, relativePath);
  await writeFile(path, content, { flag: "wx" });
}

export async function readModelRunBudget(root: string, evidenceRoot: string, runId: string): Promise<ModelRunBudget> {
  const path = await resolveContainedExistingPath(root, `${evidenceRoot}/${runId}/model-run-budget.json`);
  const value = JSON.parse(await readFile(path, "utf8")) as Partial<ModelRunBudget>;
  if (!Number.isInteger(value.apiRequestsAllowed) || value.apiRequestsAllowed! < 1 || !Number.isFinite(value.runCostCeilingUsd) ||
      !Number.isFinite(value.perCallCostCeilingUsd) || value.perCallCostCeilingUsd! * value.apiRequestsAllowed! > value.runCostCeilingUsd! + 1e-9) {
    throw new Error("T01-C model run budget ledger is invalid");
  }
  return value as ModelRunBudget;
}

/** Reserve before calling a provider. Exclusive creation keeps retries/restarts fail-closed. */
export async function reserveModelCall(root: string, evidenceRoot: string, runId: string, stage: "gherkin" | "java" | "repair-1" | "repair-2"): Promise<{ callNumber: number; budget: ModelRunBudget }> {
  const budget = await readModelRunBudget(root, evidenceRoot, runId);
  const directory = `${evidenceRoot}/${runId}/model-calls`;
  const absoluteDirectory = await ensureContainedDirectory(root, directory);
  const reservations = (await readdir(absoluteDirectory)).filter((name) => /^call-\d{2}-reserved\.json$/.test(name)).sort();
  if (reservations.length >= budget.apiRequestsAllowed) throw new Error("MODEL_RUN_BUDGET_EXHAUSTED");
  const callNumber = reservations.length + 1;
  await writeUnique(root, `${directory}/call-${String(callNumber).padStart(2, "0")}-reserved.json`, JSON.stringify({ runId, callNumber, stage,
    apiRequestsAllowed: budget.apiRequestsAllowed, runCostCeilingUsd: budget.runCostCeilingUsd,
    reservedMaxCostUsd: budget.perCallCostCeilingUsd, retriesAllowed: 0, reservedAt: new Date().toISOString(),
    note: "Reservation is append-only and fail-closed across process restart; failed reservations are not replayed." }, null, 2));
  return { callNumber, budget };
}

export async function recordModelCall(root: string, evidenceRoot: string, runId: string, callNumber: number, status: string, telemetry: unknown, error?: unknown): Promise<void> {
  const directory = `${evidenceRoot}/${runId}/model-calls`;
  await writeUnique(root, `${directory}/call-${String(callNumber).padStart(2, "0")}-result.json`, JSON.stringify({ runId, callNumber, status, telemetry,
    ...(error === undefined ? {} : { error: sanitizeToolOutput(error instanceof Error ? error.message : String(error)) }), completedAt: new Date().toISOString() }, null, 2));
}

/** Detect a provider call reservation that has no terminal result; replay must fail closed instead of calling twice. */
export async function hasReservedModelCall(root: string, evidenceRoot: string, runId: string, stage: "gherkin" | "java" | "repair-1" | "repair-2"): Promise<boolean> {
  const directory = `${evidenceRoot}/${runId}/model-calls`;
  let absolute: string;
  try { absolute = await resolveContainedExistingPath(root, directory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
  for (const name of (await readdir(absolute)).filter((entry) => /^call-\d{2}-reserved\.json$/.test(entry))) {
    const reservation = JSON.parse(await readFile(await resolveContainedExistingPath(root, `${directory}/${name}`), "utf8")) as { callNumber?: number; stage?: string };
    if (reservation.stage === stage) return true;
  }
  return false;
}

export async function completePendingModelCall(root: string, evidenceRoot: string, runId: string, stage: "gherkin" | "java" | "repair-1" | "repair-2", telemetry: unknown): Promise<void> {
  const directory = `${evidenceRoot}/${runId}/model-calls`;
  let absolute: string;
  try { absolute = await resolveContainedExistingPath(root, directory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("model response exists without a call reservation"); throw error; }
  for (const name of (await readdir(absolute)).filter((entry) => /^call-\d{2}-reserved\.json$/.test(entry)).sort()) {
    const reservationPath = await resolveContainedExistingPath(root, `${directory}/${name}`);
    const reservation = JSON.parse(await readFile(reservationPath, "utf8")) as { callNumber?: number; stage?: string };
    if (reservation.stage !== stage || !Number.isInteger(reservation.callNumber)) continue;
    const resultPath = `${directory}/call-${String(reservation.callNumber).padStart(2, "0")}-result.json`;
    try { await resolveContainedExistingPath(root, resultPath); continue; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    await recordModelCall(root, evidenceRoot, runId, reservation.callNumber!, "PASS", telemetry);
    return;
  }
}
