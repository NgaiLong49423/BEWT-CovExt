import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { APP_IDS, parseApplicationManifest, type AppId } from "../../src/contracts.js";

const root = resolve(import.meta.dirname, "../../..");
const configAppsDir = join(root, "config/apps");

test("all 8 application manifests exist in config/apps and parse with schema 1.0.0", async () => {
  const files = (await readdir(configAppsDir)).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 8, `Expected exactly 8 manifest files, found ${files.length}: ${files.join(", ")}`);

  const observedAppIds: AppId[] = [];
  for (const file of files.sort()) {
    const raw = JSON.parse(await readFile(join(configAppsDir, file), "utf8"));
    assert.equal(Object.hasOwn(raw, "manifestType"), false, `${file} must be production runtime manifest, not draft`);
    const manifest = parseApplicationManifest(raw);
    assert.equal(manifest.schemaVersion, "1.0.0");
    assert.equal(`${manifest.appId}.json`, file, `File name ${file} must match appId ${manifest.appId}`);
    assert.ok(manifest.benchmarkBaseVersion.length > 0);
    assert.ok(manifest.source.repository.startsWith("https://github.com/"));
    assert.match(manifest.source.commit, /^[a-f0-9]{40}$/);
    assert.ok(manifest.baseSuitePath.startsWith("experiments/"));
    assert.ok(manifest.allowedTools.length >= 7);
    observedAppIds.push(manifest.appId);
  }

  assert.deepEqual(observedAppIds.sort(), [...APP_IDS].sort(), "All 8 defined AppIds must have corresponding manifests");
});
