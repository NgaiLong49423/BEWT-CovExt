import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseApplicationManifest } from "../../src/contracts.js";
import { computeBuildContextSha256, verifyExpressCartSourceInputs, verifyObservedImageIds } from "../../../adapters/expresscart/source-identity.js";

const repositoryRoot = resolve("..");

test("ExpressCart local image identity is tied to measured source, package and Dockerfile inputs", async () => {
  const manifest = parseApplicationManifest(JSON.parse(await readFile(resolve(repositoryRoot, "config/apps/expresscart.json"), "utf8")));
  const identity = await verifyExpressCartSourceInputs(repositoryRoot, manifest);
  assert.equal(identity.sourceCommit, "b31302f4e99c3293bd742c6d076a721e168118b0");
  assert.equal(identity.packageVersion, "1.1.19");
  assert.equal(identity.packageJsonGitBlob, "ecdb41069f18e077c1f5aefe20e7182e79e5d236");
  assert.equal(identity.packageLockGitBlob, "04a21b2e5843f2e4d3bff4b303a0fb9909529c8e");
  assert.equal(identity.fileCount, 197);
  assert.equal(identity.buildContextSha256, manifest.runtime.kind === "source-built" ? manifest.runtime.buildContextSha256 : "");
  assert.equal(identity.dockerfileSha256, manifest.runtime.kind === "source-built" ? manifest.runtime.dockerfileSha256 : "");
});

test("source-built image IDs must match host-observed IDs and are not registry digests", async () => {
  const manifest = parseApplicationManifest(JSON.parse(await readFile(resolve(repositoryRoot, "config/apps/expresscart.json"), "utf8")));
  assert.equal(manifest.runtime.kind, "source-built");
  const observed = await verifyObservedImageIds(manifest, async (image) => image === manifest.runtime.image
    ? manifest.runtime.kind === "source-built" ? manifest.runtime.observedImageId : ""
    : manifest.runtime.kind === "source-built" ? manifest.runtime.auxiliaryImages?.find((item) => item.image === image)?.observedImageId ?? "" : "");
  assert.equal(observed.length, 2);
  await assert.rejects(verifyObservedImageIds(manifest, async () => `sha256:${"0".repeat(64)}`), /image ID mismatch/);
});

test("build-context hashing rejects symlinks and is stable for sorted repository-relative inputs", async () => {
  const actual = await computeBuildContextSha256(resolve(repositoryRoot, "experiments/expresscart/source"));
  assert.equal(actual.fileCount, 197);
  assert.equal(actual.sha256, "3fb02b3a0a0a0bc5f7c507dad4076961d9e1bbc139485e3cc122daa8a135f01a");
});
