# Test Results

## Helper tests

Command: `node --experimental-strip-types --test experiments/kanboard/tools/test/kanboard-g0.test.mjs`

Result: **PASS**, 10 tests, 0 failed, exit code 0. These tests use local fixtures for manifest parsing/promotion, Docker identity/ownership decisions, port mapping, URL and test selection, JUnit classification, reset checks and cleanup protection. They do not simulate Docker runtime as a PASS.

`node --check` for `kanboard-g0.mjs`, `docker-inventory.mjs` and `cleanup-kanboard-g0.mjs`: **PASS**.

## Maven compilation

Command (run from `experiments/kanboard/bewt-suite`): `mvn.cmd -B clean test-compile`

Result: **PASS**, 27 main sources and 32 test sources compiled, exit code 0. Full output is saved at `evidence/verification/maven-full-test-compile.txt`.

## Live browser tests

The final adapted source ran `tests.AddNewProject` in both `t03a-a-20261108-r2` and `t03a-b-20261108-r2` against independent fresh Docker instances. Maven exited 0 for each; Surefire reports exactly 1 test, 0 failures, 0 errors and 0 skipped. The runner received the pinned baseline password through the ephemeral `KANBOARD_TEST_PASSWORD` process environment; the value is excluded from source and evidence. Original business steps and assertions remain unchanged.

Sanitized JUnit XML, Maven logs, and original XML hashes are stored under each run's evidence directory. Selenium emitted a warning that Selenium 4.35 has no CDP implementation matching Chrome 156. The test does not use DevTools, and the browser-driven test passed both times. No failure screenshot was needed.
