import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { reserveValidationInvocation } from "../src/runtime/validation-invocation.js";

test("independent validation attempts reserve distinct immutable evidence directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01c-validation-attempts-"));
  try {
    const first = await reserveValidationInvocation(root, "docs/tasks/T01-C/evidence", "t01c-two-attempts");
    const second = await reserveValidationInvocation(root, "docs/tasks/T01-C/evidence", "t01c-two-attempts");
    assert.notEqual(first.invocationId, second.invocationId);
    assert.notEqual(first.evidenceDirectory, second.evidenceDirectory);
    for (const [attempt, record] of [first, second].entries()) {
      const path = join(root, record.evidenceDirectory, "validation-result.json");
      await writeFile(path, JSON.stringify({ invocationId: record.invocationId, attempt }), { flag: "wx" });
      assert.deepEqual(JSON.parse(await readFile(path, "utf8")), { invocationId: record.invocationId, attempt });
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
