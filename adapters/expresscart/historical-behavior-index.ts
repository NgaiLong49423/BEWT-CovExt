import { readFile } from "node:fs/promises";
import { resolveContainedExistingPath } from "../../framework/src/runtime/safe-path.js";

export interface HistoricalBehaviorIndex {
  schemaVersion: "1.0.0";
  appId: "expresscart";
  sourceCommit: string;
  sourceVersion: string;
  candidates: Array<{ candidateId: string; behaviorId: string; behavior: string; sources: string[] }>;
}

export function parseHistoricalBehaviorIndex(input: unknown): HistoricalBehaviorIndex {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("historical behavior index must be an object");
  const value = input as Record<string, unknown>;
  const fields = ["schemaVersion", "appId", "sourceCommit", "sourceVersion", "candidates"];
  if (Object.keys(value).some((field) => !fields.includes(field)) || fields.some((field) => !(field in value))) throw new Error("historical behavior index has unknown or missing fields");
  if (value.schemaVersion !== "1.0.0" || value.appId !== "expresscart" || typeof value.sourceCommit !== "string" || !/^[a-f0-9]{40}$/.test(value.sourceCommit) ||
      typeof value.sourceVersion !== "string" || !value.sourceVersion.trim() || !Array.isArray(value.candidates) || value.candidates.length !== 5) {
    throw new Error("historical behavior index metadata or candidate count is invalid");
  }
  const ids = new Set<string>();
  const behaviors = new Set<string>();
  const expected = new Set(["EC-C01", "EC-C02", "EC-C03", "EC-C04", "EC-C05"]);
  const candidates = value.candidates.map((item, position) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`historical candidate ${position} must be an object`);
    const candidate = item as Record<string, unknown>;
    const candidateFields = ["candidateId", "behaviorId", "behavior", "sources"];
    if (Object.keys(candidate).some((field) => !candidateFields.includes(field)) || candidateFields.some((field) => !(field in candidate)) ||
        typeof candidate.candidateId !== "string" || !expected.has(candidate.candidateId) || typeof candidate.behaviorId !== "string" || !candidate.behaviorId.trim() ||
        typeof candidate.behavior !== "string" || !candidate.behavior.trim() || !Array.isArray(candidate.sources) || !candidate.sources.length ||
        candidate.sources.some((source) => typeof source !== "string" || !/^docs\/research-results\/sprint-0[1-5]\//.test(source))) {
      throw new Error(`historical candidate ${position} is malformed or references sources outside Sprint 01–05`);
    }
    if (ids.has(candidate.candidateId)) throw new Error(`duplicate historical candidate ID: ${candidate.candidateId}`);
    if (behaviors.has(candidate.behaviorId)) throw new Error(`duplicate historical behavior ID: ${candidate.behaviorId}`);
    ids.add(candidate.candidateId);
    behaviors.add(candidate.behaviorId);
    return { candidateId: candidate.candidateId, behaviorId: candidate.behaviorId, behavior: candidate.behavior, sources: candidate.sources as string[] };
  });
  if ([...expected].some((candidateId) => !ids.has(candidateId))) throw new Error("historical behavior index is missing a Sprint 02 candidate ID");
  return { schemaVersion: "1.0.0", appId: "expresscart", sourceCommit: value.sourceCommit, sourceVersion: value.sourceVersion, candidates };
}

export async function readHistoricalBehaviorIndex(repositoryRoot: string, path: string): Promise<HistoricalBehaviorIndex> {
  const absolutePath = await resolveContainedExistingPath(repositoryRoot, path);
  return parseHistoricalBehaviorIndex(JSON.parse(await readFile(absolutePath, "utf8")) as unknown);
}
