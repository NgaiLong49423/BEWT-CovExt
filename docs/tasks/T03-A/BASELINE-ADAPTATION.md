# Baseline Adaptation

The BEWT baseline is retained as a working copy under `experiments/kanboard/bewt-suite`. `bewt-original/` remains an untouched, read-only source.

The tree comparison covered all 69 original and working-copy files, excluding generated `target/` files. Exactly one source file differs: `src/test/java/tests/BaseTest.java`, with three environment-only changes:

- Base URL reads the `app.url` JVM property, defaulting to the original `http://localhost:8080`.
- Test password is read from `KANBOARD_TEST_PASSWORD` at runtime and causes an explicit setup error if absent; no password literal is retained in the working copy.
- Removed fixed Chrome browser version `127`, allowing Selenium Manager to resolve the installed Chrome/driver pair.

`AddNewProject.java`, its expected title/status assertions, `TestSuite.java`, Page Objects and `pom.xml` are unchanged. The saved source-tree comparison and adaptation diff are in `evidence/source/`; working-copy tree and per-file SHA-256 values are recorded there and in each run's `provenance.json`.

Maven clean compile/test-compile passed, and the original Base test passed under real Selenium twice using the runtime environment value from the pinned baseline. No test oracle or application behavior was changed.
