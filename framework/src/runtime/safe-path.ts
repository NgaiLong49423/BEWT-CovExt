import { lstat, mkdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { assertSafeRelativePath } from "../contracts.js";

/** Resolve an existing repo-relative file while rejecting every symlink component. */
export async function resolveContainedExistingPath(rootInput: string, relativeInput: string): Promise<string> {
  const relativePath = assertSafeRelativePath(relativeInput);
  const root = await realpath(rootInput);
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = resolve(current, segment);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`symlink path component is not permitted: ${relativePath}`);
  }
  const resolved = await realpath(current);
  const fromRoot = relative(root, resolved);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) throw new Error("resolved path escapes approved root");
  return resolved;
}

/** Resolve a new output under an existing, symlink-free parent directory. */
export async function resolveContainedOutputPath(rootInput: string, relativeInput: string): Promise<string> {
  const relativePath = assertSafeRelativePath(relativeInput);
  const root = await realpath(rootInput);
  const parentRelative = dirname(relativePath).replaceAll("\\", "/");
  const parent = parentRelative === "." ? root : await resolveContainedExistingPath(root, parentRelative);
  const output = resolve(parent, relativePath.split("/").at(-1)!);
  try {
    await lstat(output);
    throw new Error(`output already exists and will not be overwritten: ${relativePath}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("output already exists")) throw error;
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const fromRoot = relative(root, output);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) throw new Error("output path escapes approved root");
  return output;
}

export async function ensureContainedDirectory(rootInput: string, relativeInput: string): Promise<string> {
  const relativePath = assertSafeRelativePath(relativeInput);
  const root = await realpath(rootInput);
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = resolve(current, segment);
    try {
      await mkdir(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const info = await lstat(current);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`output directory contains a non-directory or symlink: ${relativePath}`);
    const real = await realpath(current);
    const fromRoot = relative(root, real);
    if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) throw new Error("output directory escapes approved root");
  }
  return current;
}
