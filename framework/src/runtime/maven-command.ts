import { access, readdir } from "node:fs/promises";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import { runFixedProcess, type ProcessResult } from "./process.js";

const QUALIFIED_JAVA_CLASS = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/;
export interface SeleniumRunOptions { baseUrl: string; evidenceDirectory: string; mavenBuildDirectory: string; unregisteredEmail: string; chromeDriverPath: string; chromeBinaryPath: string; }

/** Build only the two supported Maven invocations; caller input cannot add arguments. */
export function fixedMavenArguments(suitePomAbsolutePath: string, action: "compile" | "test", approvedTestClass?: string, runOptions?: SeleniumRunOptions): string[] {
  if (action === "compile") {
    if (approvedTestClass !== undefined || runOptions !== undefined) throw new Error("compile action does not accept test-only inputs");
    return ["-f", suitePomAbsolutePath, "-Dstyle.color=never", "test-compile"];
  }
  if (!approvedTestClass || !QUALIFIED_JAVA_CLASS.test(approvedTestClass)) throw new Error("test class must be a fully qualified Java class name");
  if (!runOptions || !isLoopbackBaseUrl(runOptions.baseUrl) || !isAbsolute(runOptions.evidenceDirectory) || !isAbsolute(runOptions.mavenBuildDirectory) || !isAbsolute(runOptions.chromeDriverPath) || !isAbsolute(runOptions.chromeBinaryPath) || !/^[a-f0-9-]{36}@example\.invalid$/.test(runOptions.unregisteredEmail)) {
    throw new Error("Selenium execution requires a loopback URL, run-scoped Maven output directory, pinned driver path and generated example.invalid fixture email");
  }
  return ["-f", suitePomAbsolutePath, "-Dstyle.color=never", `-Dtest=${approvedTestClass}`, `-Dproject.build.directory=${runOptions.mavenBuildDirectory}`, `-Dexpresscart.baseUrl=${runOptions.baseUrl}`, `-Dexperiment.evidence.dir=${runOptions.evidenceDirectory}`, "test"];
}

function isLoopbackBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && url.hostname === "127.0.0.1" && !url.username && !url.password && !url.search && !url.hash && /^\d+$/.test(url.port);
  } catch { return false; }
}

async function locateMavenHome(): Promise<string> {
  const configured = process.env.MAVEN_HOME ?? process.env.M2_HOME;
  const candidates = configured ? [configured] : (process.env.PATH ?? "").split(delimiter).map((entry) => resolve(entry, ".."));
  for (const candidate of candidates) {
    try {
      const bootFiles = await readdir(join(candidate, "boot"));
      if (!bootFiles.some((name) => /^plexus-classworlds-[\w.-]+\.jar$/.test(name))) continue;
      const home = candidate;
      await access(join(home, "bin", "m2.conf"));
      return resolve(home);
    } catch { /* inspect the next trusted PATH/MAVEN_HOME candidate */ }
  }
  throw new Error("Maven 3.9.16 launcher was not found via MAVEN_HOME/M2_HOME/PATH");
}

export async function runFixedMaven(suiteRoot: string, action: "compile" | "test", approvedTestClass?: string, runOptions?: SeleniumRunOptions): Promise<ProcessResult> {
  const suite = resolve(suiteRoot);
  const home = await locateMavenHome();
  const launcher = join(home, "boot", (await readdir(join(home, "boot"))).find((name) => /^plexus-classworlds-[\w.-]+\.jar$/.test(name))!);
  const config = join(home, "bin", "m2.conf");
  await access(launcher);
  await access(config);
  const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java") : "java";
  const env = Object.fromEntries(["PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "USERPROFILE", "HOME", "LOCALAPPDATA", "APPDATA", "JAVA_HOME", "MAVEN_HOME", "M2_HOME"]
    .flatMap((key) => process.env[key] === undefined ? [] : [[key, process.env[key]!]]));
  if (action === "test" && runOptions) {
    env.TEST_UNREGISTERED_EMAIL = runOptions.unregisteredEmail;
    env.JAVA_TOOL_OPTIONS = `-Dwebdriver.chrome.driver=${runOptions.chromeDriverPath}`;
    env.SE_BROWSER_PATH = runOptions.chromeBinaryPath;
  }
  const args = [
    "-classpath", launcher,
    `-Dclassworlds.conf=${config}`,
    `-Dmaven.home=${home}`,
    `-Dmaven.multiModuleProjectDirectory=${suite}`,
    "org.codehaus.plexus.classworlds.launcher.Launcher",
    ...fixedMavenArguments(join(suite, "pom.xml"), action, approvedTestClass, runOptions),
  ];
  return await runFixedProcess(java, args, { cwd: suite, env, timeoutMs: action === "test" ? 180_000 : 120_000 });
}
