# Test Results — T03-A Corrections

## Node unit and fault-injection tests

Command: `node --experimental-strip-types --test experiments/kanboard/tools/test/cleanup-kanboard-g0.test.mjs experiments/kanboard/tools/test/kanboard-g0.test.mjs docs/tasks/T02/evidence/review-fixes/verify-config-apps.test.mjs`

Result: **PASS**, 23 tests, 0 failed, exit code 0. Coverage includes exact Docker NOT_FOUND classification; daemon, permission, transport and unknown inspect errors; idempotent cleanup; partial teardown failure and retry; stale container/network IDs; BLOCKED-to-nonzero-exit mapping; residual container/network/volume detection; Kanboard runtime manifest parsing; multiple runtime manifests; and draft/duplicate rejection.

`node --check` for the cleanup helper, both T03-A test files, and the active T02 verifier/test: **PASS**. Captured test output: [node-tests.txt](evidence/review-corrections/node-tests.txt). Active T02 verification: [t02-runtime-isolation.json](evidence/review-corrections/t02-runtime-isolation.json). Historical TAP/JSON hashes are unchanged, recorded in [before](evidence/review-corrections/t02-historical-evidence-hashes-before.txt) and [after](evidence/review-corrections/t02-historical-evidence-hashes-after.txt) inventories.

## Maven compilation

Command (from `experiments/kanboard/bewt-suite`): `mvn.cmd -B clean test-compile`

Result for this correction pass: **PASS**, exit code 0; 27 main and 32 test sources compiled. Captured output and exit metadata: [maven-test-compile.log](evidence/review-corrections/maven-test-compile.log), [maven-test-compile-result.json](evidence/review-corrections/maven-test-compile-result.json).

## Prior live browser runs

Run A and Run B remain the two previously completed real Selenium executions. Their original combined Maven console logs, sanitized Surefire XML and XML hashes are retained and linked in [MAVEN-RUN-METADATA.md](MAVEN-RUN-METADATA.md). These review corrections did not rerun Maven Selenium tests. The evidence metadata distinguishes the command reconstruction from the unpreserved original shell line; recorded process exit codes are supported by the contemporaneous reset comparison and the Maven logs' `BUILD SUCCESS`, not inferred from JUnit XML alone.
