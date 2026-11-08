import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { ensureContainedDirectory, resolveContainedOutputPath } from "./safe-path.js";

/** Reserve an immutable evidence directory for one compile/fixture/E2E/cleanup attempt. */
export async function reserveValidationInvocation(root: string, evidenceRoot: string, workflowRunId: string): Promise<{ invocationId: string; evidenceDirectory: string }> {
  const parent = `${evidenceRoot}/${workflowRunId}/invocations`;
  await ensureContainedDirectory(root, parent);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const invocationId = `inv-${randomUUID()}`;
    const evidenceDirectory = `${parent}/${invocationId}`;
    try {
      await mkdir(await resolveContainedOutputPath(root, evidenceDirectory));
      return { invocationId, evidenceDirectory };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  throw new Error("could not reserve a unique validation invocation directory");
}
