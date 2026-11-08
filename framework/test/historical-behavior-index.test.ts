import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { readHistoricalBehaviorIndex, parseHistoricalBehaviorIndex } from "../../adapters/expresscart/historical-behavior-index.js";

const indexPath = "data/coverage/expresscart/historical-candidate-behavior-index.json";

test("historical behavior index maps all Sprint 01–05 candidate topics to existing source records", async () => {
  const repositoryRoot = resolve(process.cwd(), "..");
  const dataIndex = JSON.parse(await readFile(resolve(repositoryRoot, "data/coverage/expresscart/index.json"), "utf8")) as { datasets?: Array<{ path: string }> };
  assert.ok(dataIndex.datasets?.some((dataset) => dataset.path === indexPath));
  const index = await readHistoricalBehaviorIndex(repositoryRoot, indexPath);
  assert.deepEqual(index.candidates.map((candidate) => candidate.candidateId).sort(), ["EC-C01", "EC-C02", "EC-C03", "EC-C04", "EC-C05"]);
  for (const candidate of index.candidates) {
    assert.ok(candidate.behaviorId.length > 0);
    assert.ok(candidate.sources.some((source) => source.includes("sprint-02/revised/")));
    for (const source of candidate.sources) {
      await assert.doesNotReject(import("node:fs/promises").then(({ access }) => access(resolve(repositoryRoot, source))), `${candidate.candidateId}: ${source}`);
    }
  }
});

test("historical behavior index rejects duplicate IDs and source paths outside the historical sprints", async () => {
  const index = await readHistoricalBehaviorIndex(resolve(process.cwd(), ".."), indexPath);
  const duplicate = structuredClone(index);
  duplicate.candidates[1]!.behaviorId = duplicate.candidates[0]!.behaviorId;
  assert.throws(() => parseHistoricalBehaviorIndex(duplicate), /duplicate historical behavior ID/);

  const unrelatedSource = structuredClone(index);
  unrelatedSource.candidates[0]!.sources[0] = "docs/tasks/T01-C/fake-history.feature";
  assert.throws(() => parseHistoricalBehaviorIndex(unrelatedSource), /Sprint 01–05/);
});
