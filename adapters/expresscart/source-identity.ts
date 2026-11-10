import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { ApplicationManifest, SourceBuiltRuntime } from "../../framework/src/contracts.js";
import { resolveContainedExistingPath } from "../../framework/src/runtime/safe-path.js";

export interface SourceIdentityEvidence {
  sourceCommit: string;
  packageVersion: string;
  packageJsonGitBlob: string;
  packageLockGitBlob: string;
  buildContextSha256: string;
  dockerfileSha256: string;
  fileCount: number;
}

function hexSha256(data: Buffer | string): string { return createHash("sha256").update(data).digest("hex"); }
function gitBlobHash(data: Buffer): string {
  // Git's core.autocrlf clean filter normalizes this text input to LF before hashing.
  const cleaned = Buffer.from(data.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  return createHash("sha1").update(`blob ${cleaned.length}\0`).update(cleaned).digest("hex");
}

const IGNORED_DIRECTORY_NAMES = new Set([".git", ".svn", ".hg", ".bzr", "CVS"]);

async function filesUnder(root: string): Promise<Array<{ relativePath: string; path: string }>> {
  const found: Array<{ relativePath: string; path: string }> = [];
  async function visit(current: string): Promise<void> {
    for (const item of await readdir(current, { withFileTypes: true })) {
      if (IGNORED_DIRECTORY_NAMES.has(item.name)) continue;
      const fullPath = join(current, item.name);
      const stat = await lstat(fullPath);
      if (stat.isSymbolicLink()) throw new Error(`source build context contains a symlink: ${relative(root, fullPath)}`);
      if (stat.isDirectory()) await visit(fullPath);
      else if (stat.isFile()) found.push({ relativePath: relative(root, fullPath).split(sep).join("/"), path: fullPath });
      else throw new Error(`source build context contains a non-file entry: ${relative(root, fullPath)}`);
    }
  }
  await visit(root);
  return found.sort((left, right) => left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0);
}

export async function computeBuildContextSha256(contextRoot: string): Promise<{ sha256: string; fileCount: number }> {
  const root = await realpath(contextRoot);
  const files = await filesUnder(root);
  const digest = createHash("sha256");
  for (const file of files) {
    const content = await readFile(file.path);
    digest.update(file.relativePath);
    digest.update("\0");
    digest.update(hexSha256(content));
    digest.update("\n");
  }
  return { sha256: digest.digest("hex"), fileCount: files.length };
}

export async function verifyExpressCartSourceInputs(repositoryRoot: string, manifestInput: ApplicationManifest): Promise<SourceIdentityEvidence> {
  const manifest = manifestInput;
  if (manifest.appId !== "expresscart" || manifest.runtime.kind !== "source-built") throw new Error("ExpressCart source identity requires its reviewed source-built manifest");
  const runtime: SourceBuiltRuntime = manifest.runtime;
  const contextPath = await resolveContainedExistingPath(repositoryRoot, runtime.buildContextPath);
  const { sha256: buildContextSha256, fileCount } = await computeBuildContextSha256(contextPath);
  if (buildContextSha256 !== runtime.buildContextSha256) throw new Error(`build context SHA-256 mismatch: expected ${runtime.buildContextSha256}, observed ${buildContextSha256}`);

  const dockerfilePath = await resolveContainedExistingPath(repositoryRoot, runtime.dockerfilePath);
  const dockerfileSha256 = hexSha256(await readFile(dockerfilePath));
  if (dockerfileSha256 !== runtime.dockerfileSha256) throw new Error(`Dockerfile SHA-256 mismatch: expected ${runtime.dockerfileSha256}, observed ${dockerfileSha256}`);

  const sourceLockPath = await resolveContainedExistingPath(repositoryRoot, "experiments/expresscart/SOURCE-LOCK.json");
  const sourceLock = JSON.parse(await readFile(sourceLockPath, "utf8")) as Record<string, unknown>;
  const packagePath = await resolveContainedExistingPath(repositoryRoot, "experiments/expresscart/source/package.json");
  const packageLockPath = await resolveContainedExistingPath(repositoryRoot, "experiments/expresscart/source/package-lock.json");
  const packageData = await readFile(packagePath);
  const packageJson = JSON.parse(packageData.toString("utf8")) as Record<string, unknown>;
  const packageLockData = await readFile(packageLockPath);
  const packageJsonGitBlob = gitBlobHash(packageData);
  const packageLockGitBlob = gitBlobHash(packageLockData);
  if (sourceLock.commit !== manifest.source.commit || sourceLock.packageVersion !== manifest.source.packageVersion || packageJson.version !== manifest.source.packageVersion) {
    throw new Error("ExpressCart source commit/package version does not match the manifest and source lock");
  }
  if (sourceLock.packageJsonBlob !== packageJsonGitBlob || sourceLock.packageLockBlob !== packageLockGitBlob) {
    throw new Error("ExpressCart package inputs do not match the historical source-lock Git blob pins");
  }
  return { sourceCommit: manifest.source.commit, packageVersion: String(packageJson.version), packageJsonGitBlob, packageLockGitBlob, buildContextSha256, dockerfileSha256, fileCount };
}

export async function verifyObservedImageIds(
  manifest: ApplicationManifest,
  inspectImageId: (image: string) => Promise<string>,
): Promise<Array<{ image: string; imageId: string }>> {
  if (manifest.runtime.kind !== "source-built") throw new Error("ExpressCart pilot image pin requires source-built runtime metadata");
  const runtime = manifest.runtime;
  const expected = [{ image: runtime.image, imageId: runtime.observedImageId }, ...(runtime.auxiliaryImages ?? []).map((item) => ({ image: item.image, imageId: item.observedImageId }))];
  const observed = [];
  for (const item of expected) {
    const imageId = await inspectImageId(item.image);
    if (imageId !== item.imageId) throw new Error(`local Docker image ID mismatch for ${item.image}`);
    observed.push({ image: item.image, imageId });
  }
  return observed;
}
