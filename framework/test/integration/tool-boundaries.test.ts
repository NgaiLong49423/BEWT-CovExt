import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixedMavenArguments } from "../../src/runtime/maven-command.js";
import { resolveContainedExistingPath, resolveContainedOutputPath } from "../../src/runtime/safe-path.js";

test("Maven argument builder exposes only fixed compile and approved-test forms", () => {
  assert.deepEqual(fixedMavenArguments("C:/suite/pom.xml", "compile"), ["-f", "C:/suite/pom.xml", "-Dstyle.color=never", "test-compile"]);
  const runOptions = { baseUrl: "http://127.0.0.1:31999", evidenceDirectory: "C:/evidence/run-1", mavenBuildDirectory: "C:/evidence/run-1/maven-target", unregisteredEmail: "123e4567-e89b-42d3-a456-426614174000@example.invalid", chromeDriverPath: "C:/selenium/chromedriver.exe", chromeBinaryPath: "C:/selenium/chrome.exe" };
  assert.deepEqual(fixedMavenArguments("C:/suite/pom.xml", "test", "tests.ForgottenPasswordTest", runOptions), ["-f", "C:/suite/pom.xml", "-Dstyle.color=never", "-Dtest=tests.ForgottenPasswordTest", "-Dproject.build.directory=C:/evidence/run-1/maven-target", "-Dexpresscart.baseUrl=http://127.0.0.1:31999", "-Dexperiment.evidence.dir=C:/evidence/run-1", "test"]);
  for (const invalid of ["Foo", "tests.Foo -DskipTests", "tests.Foo;whoami", "tests.Foo/../../Evil"]) {
    assert.throws(() => fixedMavenArguments("C:/suite/pom.xml", "test", invalid), /fully qualified Java class/);
  }
  assert.throws(() => fixedMavenArguments("C:/suite/pom.xml", "compile", "tests.Foo"), /does not accept test-only inputs/);
  assert.throws(() => fixedMavenArguments("C:/suite/pom.xml", "test", "tests.Foo", { ...runOptions, baseUrl: "http://evil.example" }), /loopback URL/);
  assert.throws(() => fixedMavenArguments("C:/suite/pom.xml", "test", "tests.Foo", { ...runOptions, unregisteredEmail: "victim@example.com" }), /example.invalid/);
  assert.throws(() => fixedMavenArguments("C:/suite/pom.xml", "test", "tests.Foo", { ...runOptions, chromeBinaryPath: "relative/chrome.exe" }), /loopback URL/);

  // Generalized multi-app support:
  assert.deepEqual(fixedMavenArguments("C:/suite/pom.xml", "test", "tests.AddNewProject"), [
    "-f", "C:/suite/pom.xml", "-Dstyle.color=never", "-Dtest=tests.AddNewProject", "test",
  ]);
  assert.deepEqual(
    fixedMavenArguments("C:/suite/pom.xml", "test", "tests.AddNewProject", {
      baseUrl: "http://127.0.0.1:8080",
      webdriverRemoteUrl: "http://127.0.0.1:4444/wd/hub",
    }),
    [
      "-f", "C:/suite/pom.xml", "-Dstyle.color=never", "-Dtest=tests.AddNewProject",
      "-Dapp.url=http://127.0.0.1:8080", "-Dwebdriver.remote.url=http://127.0.0.1:4444/wd/hub", "test",
    ]
  );
  assert.deepEqual(
    fixedMavenArguments("C:/suite/pom.xml", "test", "test.Claroline_AddUserTest", {
      baseUrl: "http://claroline11110/claroline/index.php",
      webdriverRemoteUrl: "http://127.0.0.1:4444/wd/hub",
    }),
    [
      "-f", "C:/suite/pom.xml", "-Dstyle.color=never", "-Dtest=test.Claroline_AddUserTest",
      "-Dapp.url=http://claroline11110/claroline/index.php", "-Dwebdriver.remote.url=http://127.0.0.1:4444/wd/hub", "test",
    ]
  );
});

test("real-path resolver rejects traversal and junction/symlink components", async () => {
  const root = await mkdtemp(join(tmpdir(), "bewt-t01b-path-"));
  const outside = await mkdtemp(join(tmpdir(), "bewt-t01b-outside-"));
  try {
    await mkdir(join(root, "safe"));
    await writeFile(join(root, "safe", "input.txt"), "ok");
    await writeFile(join(outside, "secret.txt"), "outside");
    assert.equal((await resolveContainedExistingPath(root, "safe/input.txt")).toLowerCase(), join(root, "safe", "input.txt").toLowerCase());
    assert.equal((await resolveContainedOutputPath(root, "safe/output.txt")).toLowerCase(), join(root, "safe", "output.txt").toLowerCase());
    await assert.rejects(resolveContainedExistingPath(root, "../outside/secret.txt"));
    await symlink(outside, join(root, "linked"), "junction");
    await assert.rejects(resolveContainedExistingPath(root, "linked/secret.txt"), /symlink/);
    await assert.rejects(resolveContainedOutputPath(root, "linked/new.txt"), /symlink/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
