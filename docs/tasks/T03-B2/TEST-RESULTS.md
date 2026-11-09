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

## Composite source and current offline verification — 2026-11-09 (r13)

| Command/check | Result | Evidence |
|---|---|---|
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | PASS, 18 passed, 0 failed; exit 0 | `evidence/offline-verification-20261109-r13/node-fault-tests.log` |
| Node syntax checks for all five `experiments/claroline/tools/*.mjs` files | PASS, all exit 0 | `evidence/offline-verification-20261109-r13/node-syntax-check.log` |
| Official application archive + Git-tag + CLCHAT package comparison | PASS for source package composition; all 1,630 release files accounted for | `evidence/offline-verification-20261109-r13/composite-source-comparison.json` |
| `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile` | NOT_RERUN; source code unchanged in this documentation/evidence follow-up. Previous PASS remains at r9. | `evidence/offline-verification-20261109-r9/maven-test-compile.log` |
| Docker/image inspection and Selenium runtime | NOT_RUN; Docker daemon unavailable and RAM is below the 4 GiB gate | `evidence/offline-verification-20261109-r13/runtime-preflight.json` |

The T03-B2 application source release is now accounted for as the historical 1.11.10 Git tag plus its separately published CLCHAT companion package. The runtime image-to-release mapping and G0 remain unverified.
## Current follow-up — r14

| Command/check | Result | Evidence |
|---|---|---|
| `parseApplicationManifest()` for proposed Claroline manifest object | PASS in memory; source commit and pinned image digest accepted; no manifest file promoted | `evidence/offline-verification-20261109-r14/manifest-candidate-parser.json` |
| Docker/RAM runtime gate | BLOCKED; 3.90 GiB free (<4 GiB) and Docker Engine pipe unavailable; no Docker resource changes | `evidence/offline-verification-20261109-r14/runtime-preflight.json` |
| Runtime A/B, Selenium, AddUser and DB reset | NOT_RUN | G0-RUNTIME-RESULTS.md |

The parser result validates a candidate object only. It does not establish runtime readiness or G0 acceptance. The last executed Node unit/fault suite remains r13 (18/18 PASS); the last Maven clean test-compile remains r9 (PASS). Neither historical result was rewritten or rerun for this documentation/evidence-only follow-up.

## Post-start runtime gate — r15

| Check | Result | Evidence |
|---|---|---|
| Docker Engine | PASS; version 29.8.0 responds | `evidence/offline-verification-20261109-r15/runtime-preflight.json` |
| Host free memory | BLOCKED; 0.95 GiB, below the required 4 GiB; runner not invoked | `evidence/offline-verification-20261109-r15/runtime-preflight.json` |
| Docker inventory | 32 containers (2 running), 11 networks, 24 volumes; zero resources with both T03-B2 ownership labels | `evidence/offline-verification-20261109-r15/runtime-preflight.json` |

No Claroline/Selenium runtime was started and no individual Docker resource was created or removed in this preflight.

## Current verifier correction — r16

| Command/check | Result | Evidence |
|---|---|---|
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | PASS, 19 passed, 0 failed; exit 0 | `evidence/offline-verification-20261109-r16/cleanup-fault-tests.log` |
| Four changed JavaScript modules/tests `node --check` | PASS, all exit 0 | `evidence/offline-verification-20261109-r16/syntax-check.log` |
| Maven `clean test-compile` | NOT_RERUN in r16; last verified PASS remains r9 (22 main + 42 test sources); Java suite unchanged | `evidence/offline-verification-20261109-r9/maven-test-compile.log` |
| Run A r1/r2 | BLOCKED by exact runner memory gate before Docker operations | `evidence/t03b2-a-20261109-r1/`, `evidence/t03b2-a-20261109-r2/` |
| Run A r3 | BLOCKED: pinned browser image missing locally; cleanup PASS | `evidence/t03b2-a-20261109-r3/` |
| Run A r4 | BLOCKED before app/browser start due dynamic port inspection ordering; no Maven/Selenium/business tests ran | `evidence/t03b2-a-20261109-r4/` |
| r4 recovery | Run-owned containers/network absent; cleanup overall BLOCKED by pre-existing network ID delta | `evidence/t03b2-a-20261109-r4/cleanup-recovery-postcheck.json` |
| Fresh RAM/Docker check | 4.013 GiB free, Engine 29.8.0 reachable; no fresh run started at marginal threshold | `evidence/offline-verification-20261109-r17/runtime-preflight.json` |

A/B successful Selenium runs remain NOT_RUN. Historical verification results and run records are immutable.

## r5 current correction status — 2026-11-09

| Check | Result | Evidence |
|---|---|---|
| Cleanup ownership fault suite | PASS, 23 passed, 0 failed, exit 0 | `evidence/offline-verification-20261109-r24/cleanup-fault-tests.log` |
| Cleanup module and test syntax | PASS, exit 0 | `evidence/offline-verification-20261109-r24/syntax-check.log` |
| Run A r5 runner | BLOCKED, exit 1; host-port assignment missing; no Maven/Selenium/business tests ran; app exited 137 | `evidence/t03b2-a-20261109-r5/` |
| r5 cleanup-only recovery | PASS, exit 0; exact recorded resources removed | `evidence/t03b2-a-20261109-r5/cleanup-recovery-r21.json` |
| Independent r5 postcheck | PASS; zero run residuals; zero missing baseline IDs | `evidence/t03b2-a-20261109-r5/cleanup-recovery-postcheck-r21.json` |
| Run B | NOT_RUN | `G0-RUNTIME-RESULTS.md` |
| Maven clean test-compile | Last verified PASS remains r9; not rerun; no Java changes | `evidence/offline-verification-20261109-r9/maven-test-compile.log` |
| Latest RAM check | r32: 2.959, 2.971, 2.965 GiB; `HOST_MEMORY_BLOCKED` below hard 4 GiB gate; r5 exit 137 cause `ROOT_CAUSE_NOT_VERIFIED` | `evidence/offline-verification-20261109-r32/runtime-gate-recheck.json` |

## Current port and runtime verification — r28/r31

| Check | Result | Evidence |
|---|---|---|
| Docker Engine and read-only resource filters | PASS; Engine 29.8.0; zero T03-B2-owned containers/networks/volumes | `evidence/offline-verification-20261109-r28/runtime-gate-recheck.json` |
| r5 exact-container Docker events | No events returned; both queries exit 0; cause remains `ROOT_CAUSE_NOT_VERIFIED` | `evidence/offline-verification-20261109-r28/r5-docker-events-query.json` |
| Port probe, exact HostConfig/NetworkSettings helper, port-conflict classifier | PASS, 26/26 tests; 4 syntax checks exit 0; offline only | `evidence/offline-verification-20261109-r31/` |
| Docker runtime port binding | `PORT_BINDING_RUNTIME_NOT_VERIFIED`; no container started | `G0-RUNTIME-RESULTS.md` |
| Claroline/Selenium diagnostic and G0 A/B | `HOST_MEMORY_BLOCKED`; business tests remain `NOT_RUN` | `evidence/offline-verification-20261109-r28/runtime-gate-recheck.json` |
