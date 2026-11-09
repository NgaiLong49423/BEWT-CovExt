# Test results

| Command/check | Result |
|---|---|
| Six `node --check` commands, including native-command policy | PASS, all exit 0; log in `evidence/offline-verification-20261109-r8/node-syntax-check.log` |
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | PASS, 18 tests, 0 failures; log at `evidence/offline-verification-20261109-r8/node-fault-tests.log` |
| `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile` with fixed child PATH | PASS, exit 0; compiled 22 main and 42 test sources; log at `evidence/offline-verification-20261109-r7/maven-test-compile.log` |
| In-memory `parseApplicationManifest()` negative check | PASS expected rejection; `NOT_VERIFIED` fails the full 40-character Git SHA rule; no runtime manifest exists | `evidence/offline-verification-20261109-r2/manifest-parser-negative.json` |
| Runtime HTTP/MySQL/Selenium and Maven test | NOT_RUN; fresh RAM 3.64 GiB < 4 GiB and Docker daemon pipe unavailable; read-only details at `evidence/offline-verification-20261109-r7/docker-and-memory-preflight.json` |

The first log-capture Maven invocation ran from the repository root without a POM and exited 1. It is retained and classified as an invocation error under `evidence/offline-verification-20261109/`; it is not counted as a build result. The corrected command above is the compile verification.

The Java command compiles source only. The G0 runtime and parser-valid runtime manifest are not passed. Historical evidence from T02, T03-A or T03-B1 was not modified.

## Review follow-up verification — 2026-11-09 (r9)

| Command/check | Result | Evidence |
|---|---|---|
| Six `node --check` commands, including updated child-process policy | PASS, exit 0 | `evidence/offline-verification-20261109-r9/node-syntax-check.log` |
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | PASS, 18 passed, 0 failed; exit 0 | `evidence/offline-verification-20261109-r9/node-fault-tests.log` |
| `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile` with `TEMP`/`TMP` omitted | PASS, exit 0; 22 main + 42 test sources | `evidence/offline-verification-20261109-r9/maven-test-compile.log` |
| Read-only RAM/Docker preflight | BLOCKED; 2.35 GiB free (<4 GiB), Docker daemon pipe unavailable, no resources changed | `evidence/offline-verification-20261109-r9/runtime-preflight.json` |

The policy now omits `TEMP` and `TMP` from Docker/Maven child environments; unit coverage asserts both keys are absent. Windows `GetTempPath` can fall back to the user profile. This offline change does not establish Docker runtime readiness. Historical evidence directories were not modified.
