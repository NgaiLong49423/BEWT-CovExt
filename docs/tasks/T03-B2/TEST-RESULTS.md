# Test results

| Command/check | Result |
|---|---|
| Five `node --check` commands for runner/helpers/cleanup/tests | PASS, all exit 0; logs in `evidence/offline-verification-20261109-r4/node-syntax-check.log` |
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | PASS, 17 tests, 0 failures; log at `evidence/offline-verification-20261109-r4/node-fault-tests.log` |
| `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile` | PASS, exit 0; compiled 22 main and 42 test sources; log at `evidence/offline-verification-20261109-r3/maven-test-compile.log` |
| In-memory `parseApplicationManifest()` negative check | PASS expected rejection; `NOT_VERIFIED` fails the full 40-character Git SHA rule; no runtime manifest exists | `evidence/offline-verification-20261109-r2/manifest-parser-negative.json` |
| Runtime HTTP/MySQL/Selenium and Maven test | NOT_RUN; user-approved fresh preflight RAM 1.64 GiB < 4 GiB |

The first log-capture Maven invocation ran from the repository root without a POM and exited 1. It is retained and classified as an invocation error under `evidence/offline-verification-20261109/`; it is not counted as a build result. The corrected command above is the compile verification.

The Java command compiles source only. The G0 runtime and parser-valid runtime manifest are not passed. Historical evidence from T02, T03-A or T03-B1 was not modified.
