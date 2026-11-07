import { spawn } from "node:child_process";

export interface ProcessResult { exitCode: number; stdout: string; stderr: string; durationMs: number; }

export async function runFixedProcess(
  executable: string,
  args: readonly string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; maxOutputBytes?: number },
): Promise<ProcessResult> {
  const started = Date.now();
  const maxOutputBytes = options.maxOutputBytes ?? 8 * 1024 * 1024;
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], {
      cwd: options.cwd,
      env: options.env ?? process.env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let captured = 0;
    let settled = false;
    const timer = setTimeout(() => {
      child.kill();
      finishError(new Error(`fixed process timed out after ${options.timeoutMs ?? 120_000}ms`));
    }, options.timeoutMs ?? 120_000);
    function finishError(error: Error): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    }
    function capture(target: Buffer[], chunk: Buffer): void {
      captured += chunk.length;
      if (captured > maxOutputBytes) {
        child.kill();
        finishError(new Error(`fixed process output exceeded ${maxOutputBytes} bytes`));
        return;
      }
      target.push(chunk);
    }
    child.stdout.on("data", (chunk: Buffer) => capture(stdout, chunk));
    child.stderr.on("data", (chunk: Buffer) => capture(stderr, chunk));
    child.once("error", finishError);
    child.once("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: code ?? 1, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8"), durationMs: Date.now() - started });
    });
  });
}
