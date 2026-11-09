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

## Current cleanup correction — 2026-11-09 (r34)

| Command/check | Result | Evidence |
|---|---|---|
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | PASS, 28 tests, 0 failures, exit 0 | `evidence/offline-verification-20261109-r38/cleanup-fault-tests.log` |
| `node --check` for all six `experiments/claroline/tools/*.mjs` modules | PASS, all exit 0 | `evidence/offline-verification-20261109-r38/syntax-check.log` |
| Diagnostic `t03b2-d-20261109-r1` | BLOCKED: `NetworkSettings.Ports` empty despite requested/HostConfig loopback port; no readiness/Maven/Selenium/business test ran | `evidence/t03b2-d-20261109-r1/diagnostic-assessment-r1.json` |
| Cleanup-only recovery for diagnostic r1 | PASS; independent full-label residual scans zero and exact recorded IDs absent | `evidence/t03b2-d-20261109-r1/cleanup-recovery-r1.json`, `post-cleanup-independent-check.json` |
| Maven `clean test-compile` | NOT_RERUN; Java sources unchanged; previous successful compile evidence remains applicable | `evidence/offline-verification-20261109-r9/maven-test-compile.log` |

## Sprint coordinator continuation — r61 (2026-11-09)

- Branch: `feature/t03b2-claroline-g0`; tested local HEAD `2c6300a1b1185a1c68d7ac96783e90a210aa747c`; `origin/main` after fetch: `ae149842185877bcd4a97cf99ebdb3fc099e040b`.
- PR #12 was independently confirmed open and draft, targeting `main`, with PR head `2c6300a1b1185a1c68d7ac96783e90a210aa747c`.
- Offline verification at the tested HEAD: cleanup fault-injection 34/34 passed (exit 0); five Node syntax checks passed (all exit 0). Raw logs and exit codes: `evidence/offline-verification-20261109-r61/`.
- Docker runtime, HTTP/MySQL, Maven, Selenium, business assertions and database reset: `NOT_RUN`. The current coordinator Docker CLI probe could not connect to `dockerDesktopLinuxEngine`; latest recorded Claroline RAM samples in r60 were 5.174/4.974/4.959 GiB, below the 6 GiB runtime gate. No Docker resources were changed.
- Gemini: `NOT_RUN`. No source/runtime manifest or historical run outcome changed. G0 remains `PARTIAL/BLOCKED`; derivative image approval remains pending Team Lead review.
- Status proposed: `PARTIAL`; review gate remains open. This verification does not establish runtime PASS or G0 acceptance.

## Current continuation — 2026-11-10

| Exact command/check | Exit code | Result | Evidence |
|---|---:|---|---|
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | 0 | PASS; 34 passed, 0 failed | `evidence/offline-verification-20261110-r64/cleanup-fault-tests.log`, `verification-summary.json` |
| `node --check experiments/claroline/tools/claroline-g0.mjs` and the cleanup, diagnostic, G0 runner, and cleanup test modules | 0 each | PASS; five syntax checks | `evidence/offline-verification-20261110-r64/syntax-checks.json` |
| Docker Engine `29.8.0`, `docker info`; `docker ps/network ls/volume ls --filter label=task=t03b2-g0` | 0 each | PASS for read-only availability/inventory; 0 task containers/networks/volumes | `evidence/offline-verification-20261110-r65/runtime-gate-recheck.json` |
| Three host RAM samples | — | BLOCKED; 3.089/3.109/3.110 GiB, below required 6 GiB | `evidence/offline-verification-20261110-r65/runtime-gate-recheck.json` |
| Claroline diagnostic, G0 Run A/B, HTTP/MySQL, Selenium, baseline AddUser, DB reset | — | NOT_RUN because RAM gate failed; no Docker resources changed | `evidence/offline-verification-20261110-r65/runtime-gate-recheck.json`; historical port-forwarding evidence remains under `evidence/t03b2-d-20261109-r3/` |

The unit/fault suite is offline-only and does not establish runtime egress isolation, port forwarding, readiness, reset, Selenium, or G0 PASS. Maven was not rerun because Java sources did not change. Historical evidence remains immutable.

## Offline correction regression — 2026-11-10 (r66)

- Four changed JavaScript modules passed `node --check`; all exit codes are 0.
- `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **35 passed, 0 failed**, exit 0.
- Coverage added for exact per-run/per-container one-use interactive approval and refusal/forgery/mismatch cases, `docker port` loopback output, omitted endpoint Gateway with exact NetworkID, wrong NetworkID/Gateway, and fixed IPv4/IPv6 TCP probe arguments.
- Evidence: `evidence/offline-verification-20261110-r66/`.
- Docker/runtime behavior, actual external IPv4/IPv6 probes, Selenium, Maven, business test, DB reset, and runtime cleanup: `NOT_RUN`; RAM gate is below 6 GiB. Offline tests do not establish runtime network isolation or port forwarding.

## Independent reviewer correction round 2 — offline verification r67 (2026-11-10)

- Source commit at test time: `2625bc618c1cbaabf7267f9d7594cedd71c0426e`.
- Source/test worktree dirty: **false**. Seven source/test `.mjs` files were hashed before and after; each normalized working-tree Git blob ID matched `HEAD:<path>`. Raw file SHA-256 values are recorded in `verification-summary.json`.
- Syntax: seven exact `node --check <path>` commands, **7/7 exit 0**.
- Cleanup/fault suite: `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`, **36/36 pass, 0 fail**, exit 0.
- Regression cases: independent authorization unavailable/fail-closed (missing, forged, mismatched run/container/command/scope/rollback, expired/replay candidate); no container start before authorization block; host IPv6 unavailable distinct from container endpoint unreachable; TCP timeout, connection refusal/reachability, probe process failure and inconclusive output never count as blocked PASS.
- Evidence: `evidence/offline-verification-20261110-r67/` contains exact commands, per-command output logs, exit codes, log SHA-256, source/test SHA-256, Git blob IDs, tested HEAD and test counts.
- Runtime egress probes were not run. Building a probe command is not runtime evidence. Docker diagnostic, full G0, Selenium Base, DB reset and runtime cleanup remain `NOT_RUN` under the unchanged 6 GiB gate and independent authorization blocker.

## Independent reviewer correction round 3 — offline verification r68 (2026-11-10)

- Tested source HEAD: `992db57c3320320d68b69a64547a6784c89c237f`; source/test tree clean at test time and Git blob IDs matched HEAD.
- Seven Node syntax checks: **7/7 PASS**, all exit 0.
- `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **36 passed, 0 failed**, exit 0.
- Required result cases exercised through both `classifyTcpProbe()` and `classifyEgressProbe()` where applicable: exit 0 plus unreachable text, exit 127 plus unreachable text, null-status spawn error, successful connection, connection refused, marked genuine network-unreachable, timeout, contradictory status/output, and empty/incomplete results.
- Probe wrapper now emits a structured inner exit marker and returns that status. The classifier only treats network-unreachable as valid when the marker exists, outer and inner statuses agree, and no success/contradictory evidence exists. Docker process startup errors cannot be mistaken for socket errors from a container.
- Evidence: `evidence/offline-verification-20261110-r68/verification-summary.json` plus seven syntax logs and the test log, exact commands, exit codes, SHA-256 logs/source and Git blob IDs.
- Docker, live TCP, Selenium Base, DB reset, Maven/business runtime and cleanup: `NOT_RUN`; no privileged execution. The unchanged 6 GiB gate is below the last recorded RAM samples.

## Targeted correction round 4 — offline verification r69 (2026-11-10)

- Tested source HEAD: `0bcd4bffdd0deaa60d03f2f8b4ba03049f05a674`; source/test tree clean and Git blob IDs matched HEAD.
- Seven Node syntax checks: **7/7 PASS**, all exit 0.
- Claroline cleanup/fault suite: **37 passed, 0 failed**, exit 0.
- Regression cases added: matching process/probe exit 124 plus unreachable stderr is non-PASS in both classifiers; combined timeout and unreachable text is non-PASS in both classifiers; fake Node socket timeout retains `source: node-socket` and maps to `HOST_CONTROL_TIMEOUT_INCONCLUSIVE`.
- The fake socket is injected into `probeTcpTarget`; no external/local network request was made.
- Provenance: `evidence/offline-verification-20261110-r69/verification-summary.json` includes exact commands, exit codes, counts, source/test SHA-256 and Git blob IDs, and log hashes.
- Runtime/Docker/TCP diagnostic: `NOT_RUN`; RAM and authorization gates remain unmet.

## Cross-platform Cloud Runner verification & runtime diagnostics — 2026-11-10 (`r72`, `r73`, `d-r4`, `d-r5`, `a-r6`)

### 1. Post-commit offline verification (`r72` Windows & `r73` Ubuntu 24.04 Cloud VM)

- **Tested source HEAD**: `183668bc18e89b4e04212be510b971a9f79c7f65` (`sourceMatchesHeadAtTest: true`, `sourceTestDirtyBefore: false`, `sourceTestDirtyAfter: false` on both platforms).
- **Node syntax checks (9 modules)**: `child-process-policy.mjs`, `cleanup-claroline-g0.mjs`, `run-claroline-diagnostic.mjs`, `run-claroline-g0.mjs`, `record-offline-verification.mjs`, `verify-claroline-image-provenance.mjs`, `cloud-controller.mjs`, `validate-evidence.mjs`, and `test/cleanup-claroline-g0.test.mjs` — **9/9 PASS (exit 0)** on both Windows (`r72`) and Ubuntu 24.04 Linux (`r73`).
- **Unit, fault-injection, and cross-platform test suite**: `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` — **41/41 PASS, 0 FAIL (exit 0)** on both Windows (`r72`) and Ubuntu 24.04 Linux (`r73`).
- **New test coverage (tests 38–41)**:
  - Linux `/proc/meminfo` `MemAvailable` parsing and `/proc/net/route` + `ip -4 route show` IPv4 route collision avoidance (`parseLinuxMeminfoBytes`, `parseLinuxIpv4Routes`, `selectNonOverlappingSubnetCidr`).
  - Pre-start (`State.Status === "created"`) route-isolated container cleanup when `endpoint.NetworkID === ""` before `docker start` vs running container cleanup rejecting missing `endpoint.NetworkID`.
  - Cloud controller termination schedule verification (`maxRunDuration=21600s`, `instanceTerminationAction=STOP`, active `terminationTimestamp`) and path/secret scrubbing (`scrubCloudText`).
  - Deterministic evidence validator (`validate-evidence.mjs`) positive and negative validation, including SHA-256 manifest tampering detection.
- **Cloud VM Maven compile check**: `mvn test-compile -DskipTests` in `experiments/claroline` on `bewt-covext-runner` — **PASS (exit 0)**, compiled 22 main source files and 42 test source files in `11.352 s`.
- **Evidence**:
  - Windows: `evidence/offline-verification-20261110-r72/` (`sha256-manifest.json` verified, 11 files).
  - Ubuntu 24.04 Cloud VM: `evidence/offline-verification-20261110-r73/` (`sha256-manifest.json` verified, 12 files including `cloud-preflight.json`).

### 2. Cloud VM Docker runtime execution summary (`t03b2-d-20261110-r4`, `t03b2-d-20261110-r5`, `t03b2-a-20261110-r6`)

| Run ID | Runner | Host Free RAM (GiB) | Docker Resources Created | Stop Point | Teardown / Cleanup Result | Evidence Validator |
| --- | --- | --- | --- | --- | --- | --- |
| `t03b2-d-20261110-r4` | `run-claroline-diagnostic.mjs` | `60.522 / 60.522 / 60.522` (`PASS`) | Bridge `692707f3...` (`172.26.254.0/24`), dormant app `1051585e...` (`127.0.0.1:33863->80/tcp`) | `BLOCKED_APPROVAL_REQUIRED` before `docker start` | Initial `finally` exposed pre-start empty `NetworkID`; after fix (`183668bc`), `cleanup-recovery-r1.json` & `post-cleanup-independent-check.json` **PASS** (0 residuals) | `valid: true` (21 files) |
| `t03b2-d-20261110-r5` | `run-claroline-diagnostic.mjs` | `60.537 / 60.541 / 60.541` (`PASS`) | Bridge `a8be33f2...` (`172.26.254.0/24`), dormant app `dca3595a...` (`127.0.0.1:46033->80/tcp`) | `BLOCKED_APPROVAL_REQUIRED` before `docker start` | Automatic `finally` `cleanup-result.json` **PASS** on first pass (0 residuals, `countsEqual: true`, `fingerprintsEqual: true`) | `valid: true` (19 files) |
| `t03b2-a-20261110-r6` | `run-claroline-g0.mjs` | `60.540 / 60.541 / 60.541` (`PASS`) | Bridge `2ed133a9...` (`172.26.254.0/24`), dormant app `f6681250...` (`127.0.0.1:44465->80/tcp`), dormant browser `2824b38e...` (`127.0.0.1:34105->4444/tcp`) | `BLOCKED_APPROVAL_REQUIRED` before `docker start` | Automatic `finally` `cleanup-result.json` **PASS** on first pass (both containers + network removed, 0 residuals) | `valid: true` (16 files) |

- **Business / Selenium / DB reset status**: `NOT_RUN` (blocked fail-closed at `requestRouteIsolationApproval()` before `docker start`).

### 3. Post-SonarCloud security hardening & host-firewall spec verification (`r74` Windows & `r75` Ubuntu 24.04 Cloud VM — `2e31e1a0a2aa6681047817bcee17e25405d5ba84`)

- **Tested source HEAD**: `2e31e1a0a2aa6681047817bcee17e25405d5ba84` (`sourceMatchesHeadAtTest: true`, `sourceWorkingTreeDirtyAtTest: false` on both platforms).
- **Node syntax checks (9 modules)**: **9/9 PASS (exit 0)** on both Windows (`r74`) and Ubuntu 24.04 Cloud VM (`r75`).
- **Unit, fault-injection, and cross-platform test suite**: `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` — **44/44 PASS, 0 FAIL (exit 0)** on both Windows (`r74`) and Ubuntu 24.04 Cloud VM (`r75`).
- **New test coverage (tests 42–44)**:
  - Protected `GIT_CLI_PATH` and `NODE_CLI_PATH` resolution and `validateEvidenceId` / `resolveEvidenceDirectoryById` rejection of path-traversal payloads (`../`, relative/absolute paths, non-existent IDs).
  - Dynamic VM `natIP` lookup (`resolveVmExternalIp`) and fail-closed rejection when `natIP` is missing.
  - Ubuntu host bridge firewall (`DOCKER-USER` iptables `REJECT --reject-with icmp-net-unreachable`) specification, active rule verification, negative fault cases, and zero-residual rollback verification.
- **SonarCloud Quality Gate**: **`OK` (`PASSED`)** on PR #12 (`new_security_rating = 1 / A`, `new_reliability_rating = 1 / A`, `new_maintainability_rating = 1 / A`, `0` vulnerabilities).
- **Evidence**:
  - Windows: `evidence/offline-verification-20261110-r74/` (`sha256-manifest.json` verified, 11 files).
  - Ubuntu 24.04 Cloud VM: `evidence/offline-verification-20261110-r75/` (`sha256-manifest.json` verified, 12 files including `cloud-preflight.json`).
- **Runtime note**: `44/44` unit tests and `validate-evidence.mjs` `VALID` do **not** establish G0 runtime `PASS`; `Claroline_AddUserTest` and DB reset remain `NOT_RUN`.

