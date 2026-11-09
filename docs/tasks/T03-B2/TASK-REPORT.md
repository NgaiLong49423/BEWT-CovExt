# T03-B2 — Claroline 1.11.10 G0 Runtime Verification

- Task scope / acceptance gate: Isolated Claroline G0 feasibility, source/image provenance, baseline compilation and safe runtime harness; no G1–G4.
- Base branch + base SHA: `main` — `464d9e2fb5d1a3705d1d7d6f4dc9a2782bde4a1d`.
- Working branch: `feature/t03b2-claroline-g0`.
- Previous implementation commit: `58618c758f4ed3ef4b1e43493d51a1a61ebb0cf9` (harness, suite, evidence and initial report).
- Historical implementation note: PR #9 was merged by the repository owner at merge commit `ae149842185877bcd4a97cf99ebdb3fc099e040b`; this T03-B2 follow-up originally began at `c68eafcf34b7fc1ee9282661c68e640fc1aa34b5`. The current review follow-up is tracked separately by draft PR #12 on `feature/t03b2-claroline-g0`; its reviewed starting HEAD was `fc9c755b16b1b4f8afce4285c0d99bd2ffa25b1a`.
- PR: [https://github.com/NgaiLong49423/BEWT-CovExt/pull/12](https://github.com/NgaiLong49423/BEWT-CovExt/pull/12) (active draft follow-up; PR #9 is historical and merged).
- PR #9 was merged by the repository owner. Draft follow-up PR #12 is open for review: https://github.com/NgaiLong49423/BEWT-CovExt/pull/12. Runtime A/B remain incomplete and G0 is PARTIAL.
- Runtime/commit/version tested: BEWT suite copied from commit `0501249ff3e9a5ea83a06155cd2971dc36197056`; Claroline 1.11.10 source release verified by historical tag/archive comparison; runtime image base matches source archive with one unattributed code patch; app image digest pinned to `sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af`.
- Current proposed gate: G0 `PARTIAL`; app-only diagnostic `BLOCKED` on Docker runtime port-report mismatch; A/B Selenium and business tests `NOT_RUN`. r5 Docker logs verify SIGTERM-to-force escalation by Docker, while the initiating caller and underlying reason for non-graceful shutdown remain unverified; OOM is not established. The pinned image derivative contains one unattributed patch and remains pending Team Lead decision.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `experiments/claroline/bewt-suite/` | Isolated 75-file baseline suite; only `BaseTest.java` environment adaptation | Retain baseline oracle while supporting remote headless Selenium |
| `experiments/claroline/tools/` | Pinned-run helpers, fail-closed partial-start cleanup, write-once wrapper, runtime harness, explicit signed-tool/path policy | Reproducible, ownership-safe, and avoids PATH search in child processes |
| `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | Cleanup fault injection and Surefire/run identity/sanitization tests | Verify failure paths without touching Docker |
| `experiments/claroline/tools/run-claroline-g0.mjs` | Fixes Maven suite path, validates POM before resource creation, starts app/browser before reading dynamic ports, and records pinned image labels | Prevent wrong-cwd compile and pre-allocation port failures |
| `experiments/claroline/tools/cleanup-claroline-g0.mjs` | Validates exact merged pinned-image and run labels; permits teardown when Docker omits active port reporting only if recorded HostConfig loopback port matches exactly | Recover the exact diagnostic container safely without treating the runtime mismatch as PASS |
| `docs/tasks/T03-B2/evidence/t03b2-a-20261109-r1..r5/` and `t03b2-d-20261109-r1/` | Immutable preflight/runtime/diagnostic attempts and cleanup recovery evidence | Preserve each blocked attempt without changing outcomes |
| `docs/tasks/T03-B2/evidence/offline-verification-20261109-r16/` | Actual 19-test cleanup suite and four syntax checks | Verify the current source changes |
| `docs/tasks/T03-B2/` | Provenance, image risk, preflight, adaptation, cleanup and partial result reports | Preserve auditable current state and limitations |
| `docs/tasks/T03-B2/evidence/preflight-image-20261109/` | Image-only inspection and preflight resource evidence | Preserve actual read-only image inspection and stopped-container cleanup records |
| `.gitignore` | Narrow allow rule for T03-B2 sanitized evidence `.log` files | Allow sanitized future Maven output while retaining general log ignore |

No `config/apps/claroline.json` was added: although the official release source and pinned image base are verified, one later image-only source patch remains unattributed and the app-only diagnostic was blocked before readiness; the G0 business runtime remains incomplete.

## 2. Actual verification

| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| Six Node `--check` commands | 0 | PASS | `docs/tasks/T03-B2/evidence/offline-verification-20261109-r7/node-syntax-check.json` |
| Six Node `--check` commands | 0 | PASS | [syntax checks](evidence/offline-verification-20261109-r8/node-syntax-check.log) |
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | 0 | PASS — 18 passed, 0 failed | [fault tests](evidence/offline-verification-20261109-r8/node-fault-tests.log) |
| `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile` | 0 | PASS — 22 main + 42 test sources using fixed child PATH | [Maven compile log](evidence/offline-verification-20261109-r7/maven-test-compile.log) |
| In-memory `parseApplicationManifest()` with pinned image and `source.commit=NOT_VERIFIED` | 0 | PASS — parser rejected with full 40-character Git SHA requirement | [parser negative check](evidence/offline-verification-20261109-r2/manifest-parser-negative.json); `framework/src/contracts.ts` unchanged |
| Docker image pull/inspect and stopped preflight container inspection | 0 | PASS — image identity and metadata recorded | [image preflight evidence](evidence/preflight-image-20261109/) |
| Read-only Docker CLI/RAM preflight after last check | 1 for Docker daemon query; RAM query 0 | BLOCKED — daemon pipe unavailable; free RAM 3.64 GiB | [preflight result](evidence/offline-verification-20261109-r7/docker-and-memory-preflight.json) |
| Node cleanup/fault suite after current runner/cleanup fixes | 0 | PASS — 19 passed, 0 failed | `evidence/offline-verification-20261109-r16/cleanup-fault-tests.log` |
| Four changed Node modules/tests `--check` | 0 | PASS | `evidence/offline-verification-20261109-r16/syntax-check.log` |
| Run A r4 | 1 | BLOCKED before app/browser start: dynamic ports were queried before start; no Maven/Selenium/business test ran; recovery has a baseline network ID delta | `evidence/t03b2-a-20261109-r4/` |
| Run A r5 | 1 | BLOCKED because Docker did not assign active port mappings; no readiness/Maven/Selenium/business test/reset ran; later exact cleanup recovered | `evidence/t03b2-a-20261109-r5/` |
| App-only diagnostic r1 | 1 | BLOCKED — Docker active port report empty; no readiness or Maven/Selenium tests ran | `evidence/t03b2-d-20261109-r1/diagnostic-assessment-r1.json` |
| r5 Docker stop trace | 0 (source-log inspection) | Force-stop escalation verified; initiating caller and underlying non-graceful shutdown reason unknown; OOM not established | `evidence/offline-verification-20261109-r34/r5-stop-escalation-trace.json` |
| Cleanup recovery r1 + independent postcheck | 0 | PASS — exact recorded resources removed; all full-label residual scans zero | `evidence/t03b2-d-20261109-r1/cleanup-recovery-r1.json`; `post-cleanup-independent-check.json` |
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | 0 | PASS — 28 passed, 0 failed | `evidence/offline-verification-20261109-r37/cleanup-fault-tests.log` |
| Six Claroline tool `node --check` commands | 0 | PASS | `evidence/offline-verification-20261109-r37/syntax-check.log` |
| Independent successful Run A and B | — | NOT_RUN; diagnostic r1 failed, so full runs stopped | [runtime status](G0-RUNTIME-RESULTS.md) |

## 3. Research impact

- Apps affected: Claroline feasibility setup only. The BEWT upstream test source is not an independently verified Claroline release archive.
- Candidate statuses before → proposed after: Claroline remains PARTIAL and provenance-blocked; diagnostic r1 is BLOCKED before readiness, with no candidate or research metric promoted.
- RQ1/RQ2/RQ3/RQ4 measurable changes: none; no business-test observation or coverage metric was collected.
- Gate status before → proposed after: Claroline G0 remains `PARTIAL` and not accepted; the latest app-only diagnostic is `BLOCKED`, while Selenium/business tests are `NOT_RUN`.
- Dataset/metrics artifacts updated: none.
- Denominator and sampling caveats: no successful G0/business-test sample; the app-only startup diagnostic was blocked before readiness and is not a business outcome observation.

## 4. Safety & integrity

- `bewt-original/` touched? NO. Exact BEWT source was fetched to a temporary location and copied into the isolated working copy; original research source remains read-only.
- Docker/project resources touched? Docker Desktop was started; the pinned Selenium image was pulled by digest. Run A r4 and diagnostic r1 created only exact recorded task resources, later absent after recovery. Diagnostic r1 created one app container and one internal network, both removed by exact IDs/ownership. No volume/image was removed and no global prune ran. Existing ExpressCart/Kanboard resources were preserved by cleanup checks. r4 baseline default-network ID delta remains unexplained.
- Final read-only T03-B2 run-label scan: zero containers, networks, or volumes. Baseline preservation is not PASS because network ID `221f...` is absent and `11ce...` is present; see `evidence/t03b2-a-20261109-r4/cleanup-recovery-postcheck.json`.
- Existing unrelated local dirty files preserved? YES; this is a dedicated clean task worktree.
- Secret scan / staged diff review result: pending final review; runner sanitizes local paths, fixture-like secret strings, Surefire properties and console output. No credentials are stored in the evidence.
- Failed/blocked tasks: successful A/B remain `NOT_RUN`; Run A r4 is `BLOCKED` before Selenium/application tests, and teardown evidence is `BLOCKED` on a baseline network identity change. Runtime manifest remains unpromoted pending review of the unattributed image patch.

## 5. Evidence and reproduction

- Source/test paths: `experiments/claroline/bewt-suite/src/test/java/test/Claroline_AddUserTest.java`, `experiments/claroline/tools/`, `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`; [baseline source comparison](evidence/offline-verification-20261109-r3/baseline-source-comparison.json).
- Raw run/log/XML/screenshot paths: no Maven/Selenium/JUnit outcome exists; no such log was fabricated. Sanitized app-only diagnostic create/start/cleanup evidence is linked below; raw Docker inventories and internal-IP app logs remain excluded from Git. Final offline Node logs are under `docs/tasks/T03-B2/evidence/offline-verification-20261109-r8/`; Maven compile and RAM/daemon preflight logs are under `docs/tasks/T03-B2/evidence/offline-verification-20261109-r7/`; image preflight is under `docs/tasks/T03-B2/evidence/preflight-image-20261109/`.
- Fixture/database before/after and cleanup: no app database was started. Preflight-container cleanup evidence is retained with its initial blocked checker record and exact NOT_FOUND follow-up.
- Reproducible commands: `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`; Maven `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile`; runtime requires a fresh never-used `t03b2-<letter>-YYYYMMDD-rN` ID and ≥4 GiB free memory.
- Known limitations: Both official SourceForge archive candidate hashes are recorded; runtime image-to-archive match and upstream Claroline Git commit remain unverified; runtime and DB reset not evaluated; image is legacy and has unknown build provenance.

## Runtime and verifier correction follow-up — 2026-11-09 (r16)

- Run A attempts r1 and r2 were blocked by the runner’s measured free-memory gate before Docker operations. Run A r3 passed memory preflight but was blocked because the pinned Selenium image digest was missing locally; cleanup PASS and before/after counts were unchanged. The exact pinned image was then pulled by digest.
- Run A r4 passed memory preflight, created two not-started containers and an internal network, then failed before container start because dynamic ports were inspected too early. No Maven, HTTP, MySQL, Selenium, AddUser or DB reset check ran.
- Cleanup fixes now validate run labels merged with metadata labels from the exact pinned image and permit an empty dynamic port only for a `created`, non-running container with no initialized endpoint. The runner starts both containers before inspecting assigned ports.
- Current unit/fault tests: 19/19 PASS, exit 0; four Node syntax checks PASS, exit 0. Evidence: `evidence/offline-verification-20261109-r16/`.
- r4 run-owned containers/network are absent after recovery. Cleanup remains `BLOCKED` because global inventory found one pre-existing network ID missing and a replacement ID present. All baseline containers, volumes and images match. No unrelated Docker resource was removed; the default-network identity change’s cause is unknown. Evidence: `evidence/t03b2-a-20261109-r4/cleanup-recovery-postcheck.json`.
- Latest r16 host RAM: 3.06 GiB; fresh r17 RAM: 4.017 GiB of 13.79 GiB with Docker Engine 29.8.0 reachable. The fresh reading was marginal, so no new run was started. Maven `clean test-compile` remains the previously verified r9 PASS; Java source has not changed.
- PR #9 is historical and merged by the repository owner. Draft PR #12 is the active review target; do not merge. The current handoff reports the new pushed commit SHA verified from GitHub.

## 6. Review request

- Team Lead decisions: approve/decline the proposed archive-based source provenance contract separately; review whether to defer runtime until adequate host memory and archive/source provenance are available.
- Suggested next task if accepted: resolve source provenance and rerun the isolated G0 runtime with two independent clean states, then request review; do not infer G0 acceptance from compilation.
- GitHub PR diff URL: [PR #9 diff](https://github.com/NgaiLong49423/BEWT-CovExt/pull/9/files). Main review paths: `experiments/claroline/tools/run-claroline-g0.mjs`, `experiments/claroline/tools/cleanup-claroline-g0.mjs`, `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`, `docs/tasks/T03-B2/CLAROLINE-SOURCE-PROVENANCE.md`, and `docs/tasks/T03-B2/G0-RUNTIME-RESULTS.md`.

## Review follow-up — 2026-11-09

- Narrow SonarCloud security follow-up: removed inherited `TEMP`/`TMP` from the child-process allowlist and shared Docker/Maven environment. The targeted test now asserts both variables are absent in both child environments. This avoids forwarding host-configured shared temporary paths; Windows temp resolution can fall back to `USERPROFILE`.
- Verification: six syntax checks PASS; 18 cleanup/fault-injection tests PASS; Maven `clean test-compile` PASS (22 main and 42 test sources) with `TEMP`/`TMP` omitted. Sanitized logs and SHA-256 metadata: `evidence/offline-verification-20261109-r9/`.
- Historical r9 runtime gate recheck: 2.35 GiB free of 13.79 GiB and Docker daemon query exit 1 because `desktop-linux` pipe was absent. No Docker resources were changed. Runtime A/B remained `NOT_RUN`; source status was later superseded by r13/r14.
- SonarCloud Quality Gate was verified PASS on code HEAD `0e98de03ae44c4e56760fa52cc5cd242b54a44ef`, with 0 new issues and 0 security hotspots. This result applies to that exact code commit.

## Provenance and gate follow-up — 2026-11-09

- Retrieved both official SourceForge archives twice over HTTPS. The byte counts and SHA-256 values matched across each pair; gzip and tar listing checks passed. Only metadata is retained; temporary archive files were removed. Details: `evidence/offline-verification-20261109-r10/source-archive-verification.json`.
- Historical r10 assessment: the archive hashes alone did not identify the image source, no Git commit had been verified, and the parser could not represent archive-only provenance. This was superseded by the verified release tag/package and r14 image-layer comparison; no runtime manifest was promoted.
- Latest read-only runtime preflight: 2.98 GiB free of 13.79 GiB; Docker daemon query exit 1 because the `desktop-linux` named pipe is unavailable. No Docker resources changed. Runs A/B remain `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r10/runtime-preflight.json`.
The GitHub `claroline/Claroline` ref/timeline follow-up found no matching 1.11.10 refs. The examined historical snapshot identifies as the `claroline/core-bundle` component, so it is not claimed as the full application source commit. See `evidence/offline-verification-20261109-r11/github-source-ref-probe.json`.

## Source and runtime gate follow-up — 2026-11-09

- Historical source probe: tag `zefredz/claroline@1.11.10` resolves to `22d852f93081bc36b1d08b93f5e0c14b49a573f6`. All 1,613 files common to the official `claroline-1.11.10.tar.gz` archive and tag tree matched after line-ending/CVS-keyword normalization; 323 binary files matched byte-for-byte. The archive includes 17 extra `module/CLCHAT/` files absent from the Git tree, so full source equivalence is not declared and no Claroline runtime manifest is promoted. See `evidence/offline-verification-20261109-r12/source-git-archive-comparison.json`.
- Runtime gate rechecked: available RAM 3.46 GiB of 13.79 GiB (<4 GiB required); Docker daemon pipe unavailable (`docker version` exit 1). Runtime was not started and no Docker resources were created or changed. See `evidence/offline-verification-20261109-r12/runtime-preflight.json`.

## Composite source and runtime gate follow-up — 2026-11-09

- The 17 `module/CLCHAT/` files found only in the official 1.11.10 application archive match exactly the 17 files in the separately published official CLCHAT companion ZIP (SHA-256 `14f02d486896eb63433c8c6a843f8f6fd06bfd413a3c4e0759aada163a9cda36`). Combined with the r12 core-tag comparison, all 1,630 files in the official application archive are accounted for. Source release provenance is verified; evidence: `evidence/offline-verification-20261109-r13/composite-source-comparison.json`.
- Historical r13 status that the pinned image had not been compared is superseded by the r14 layer analysis. No runtime manifest is promoted; G0 runtime is still `NOT_RUN`.
- Historical r13 host gate: 3.36 GiB free of 13.79 GiB (<4 GiB threshold); superseded by r14. No Docker resources were created or changed. Evidence: `evidence/offline-verification-20261109-r13/runtime-preflight.json`.
- Current r13 offline verification: cleanup/fault suite PASS (18/18), five Node syntax checks PASS, source package comparison PASS; Maven was not rerun because source code was unchanged. Logs and metadata are under `evidence/offline-verification-20261109-r13/`.
## Pinned image source verification — 2026-11-09 (r14)

- Read-only Registry inspection verified all 15 layer digests for the pinned image. Image layer 8 contains exactly the 1,630 files in the official Claroline 1.11.10 source archive, with zero byte mismatches.
- Later image layers add runtime configuration/cache, remove the installer directory, and modify one application file: `claroline/inc/lib/add_course.lib.inc.php` (release SHA-256 `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1`; image SHA-256 `c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8`). The change comments out the 128-attempt course-identifier allocation guard. Its source commit/author is unknown; the immutable image digest pins the bytes. No runtime manifest is promoted pending Team Lead review of this patch and completion of the runtime gate.
- Offline unit/fault tests and five syntax checks PASS (r13). See r14 below for the latest host gate; no Docker resources were created or changed during r14. Evidence is in `evidence/offline-verification-20261109-r14/`.

## Final evidence follow-up — 2026-11-09 (r14)

- Registry layer analysis verified all 15 compressed layer hashes and found the full official release archive byte-for-byte in image layer 8. One later image layer applies an unattributed application-code patch; image/source provenance is PARTIAL, not pristine.
- The actual `parseApplicationManifest()` parser accepted the proposed Claroline manifest object in memory (PASS). No runtime manifest file was promoted. Evidence: `evidence/offline-verification-20261109-r14/manifest-candidate-parser.json`.
- Latest user-authorized preflight: 3.90 GiB free (<4 GiB) and Docker Engine unavailable (exit 1); runtime remains `NOT_RUN`. No Docker resources were changed. Evidence: `evidence/offline-verification-20261109-r14/runtime-preflight.json`.
- Node fault tests remain PASS (18/18) and five syntax checks PASS using execution logs in r13. Maven was not rerun because application/test source code did not change; the earlier verified clean test-compile remains at r9.
- Current status: PARTIAL; no runtime, HTTP, database, Selenium, AddUser, or reset outcome is claimed.

## Post-start runtime gate — 2026-11-09 (r15)

- Docker Desktop was started after the user-authorized recheck. Docker Engine 29.8.0 responds, but host free RAM is 0.95 GiB (<4 GiB); the runtime harness was not invoked.
- Read-only inventory: 32 containers (2 running), 11 networks, 24 volumes; zero containers, networks, or volumes matched both `project=bewt-covext` and `task=t03b2-g0` ownership labels. No individual Docker resources were created or removed in this preflight.
- Runtime A/B remains `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r15/runtime-preflight.json`.

## Final correction verification — r24/r25

- The runner now selects and records two host loopback ephemeral ports before Docker creation, requests explicit bindings, and verifies Docker assigned those exact ports. The port selector availability test passes; this code change has not been exercised in Docker runtime.
- Cleanup now permits no host-port assignment only when Docker reports no external binding, and handles an exited container with a detached incomplete endpoint while preserving strict ID/name/image/label/mount/network checks. The latest combined unit/fault suite passes 23/23; syntax checks for helper, runner and test pass. Evidence: `evidence/offline-verification-20261109-r24/`.
- Run A r5 passed runner RAM preflight but Docker assigned no host ports; the app later exited 137. Runner exit 1; Maven/Selenium/AddUser/reset did not run. Exact cleanup recovery PASS and independent before/after/residual postcheck PASS. Run B remains NOT_RUN. Evidence: `evidence/t03b2-a-20261109-r5/`.
- Historical r25 RAM check: 4.409 GiB. It did not establish an OOM cause for r5's exit 137.
- Maven `clean test-compile` remains the previously verified r9 PASS (22 main + 42 test sources); application/test Java sources are unchanged. No new Maven console evidence is claimed.
- G0 remains PARTIAL / not accepted; the runtime manifest remains withheld pending source-patch provenance and completed A/B runs.

## Runtime blocker and port guard follow-up — r28/r31

- Current read-only gate: free host RAM 4.340, 4.330, and 4.332 GiB across three samples; Docker Engine 29.8.0 reachable; WSL VM process working set 1,696,399,360 bytes; zero task-owned containers/networks/volumes. This is below the preferred ~6 GiB margin, so no Claroline/Selenium diagnostic or full run was started. No T03-B2 resources were created/started/stopped/removed. Evidence: `evidence/offline-verification-20261109-r28/runtime-gate-recheck.json`.
- Corrected Docker events query for both r5 container IDs exited 0 and returned no events. That does not establish exit 137's cause: `ROOT_CAUSE_NOT_VERIFIED`. Run A r5 remains `BLOCKED`; Maven/Selenium/business assertions/reset remain `NOT_RUN`; Run B remains `NOT_RUN`. r4 default-network ID delta remains unexplained.
- Port handling now probes selected ports immediately before creation (socket released; no reservation claim), verifies exact loopback `HostConfig.PortBindings` and `NetworkSettings.Ports`, forbids MySQL 3306 publishing, and classifies port races as `PORT_BIND_CONFLICT`. Latest offline verification: 26/26 tests and 4 syntax checks exit 0 at `evidence/offline-verification-20261109-r31/`. Docker runtime binding remains `PORT_BINDING_RUNTIME_NOT_VERIFIED`.
- PR #9 is historical and merged. Draft PR #12 remains active on `feature/t03b2-claroline-g0`; this follow-up is not merged. The pinned image derivative decision remains pending Team Lead. No runtime manifest was promoted; G0 remains `PARTIAL`.

## Post-review runtime gate — r32

- Three current host RAM samples are 2.959, 2.971, and 2.965 GiB, below the hard 4 GiB runtime gate. Docker Engine 29.8.0 is reachable; Docker VM limit is 7,157,477,376 bytes; WSL VM working set is 655,040,512 bytes; task ownership filters show zero containers/networks/volumes. No diagnostic or G0 run was started and no T03-B2 Docker resource was changed. Evidence: `evidence/offline-verification-20261109-r32/runtime-gate-recheck.json`.
- Run A remains `BLOCKED`, Run B remains `NOT_RUN`, and exit 137 cause remains `ROOT_CAUSE_NOT_VERIFIED`. The user was asked to free additional host memory while leaving Docker Desktop and ExpressCart running before another runtime gate recheck.

- Public evidence sanitization: raw Docker inventories were excluded because they contain unrelated local project resource names. Sanitized r3-r5 inventory summaries retain counts and resource conservation/deltas using SHA-256 fingerprints. Raw files remain local only; no runtime outcome was altered.

## Current diagnostic follow-up — 2026-11-09 (r37 / diagnostic r1)

- New RAM preflight: three samples 6.331, 6.350, and 6.356 GiB free; hard 6 GiB diagnostic gate PASS. Docker Engine was reachable. Evidence: `evidence/t03b2-d-20261109-r1/memory-preflight.json`.
- App-only diagnostic `t03b2-d-20261109-r1`: Docker create/start both exited 0. The request and `HostConfig.PortBindings` recorded `127.0.0.1:52508`, while `NetworkSettings.Ports` returned `{"80/tcp":[]}`. Runner correctly returned `BLOCKED` (`PORT_BINDING_MISMATCH`) before HTTP/MySQL readiness. Snapshot: app `Running=true`, `ExitCode=0`, `OOMKilled=false`. No Selenium, Maven, business test, or database reset ran. See `evidence/t03b2-d-20261109-r1/diagnostic-assessment-r1.json` and immutable `run-failure.txt`.
- Initial cleanup result stays unchanged (`BLOCKED`). A separate cleanup-only recovery using the exact recorded app ID, image, full labels, loopback mapping, network ID, and baseline returned `PASS`; independent exact-label filters found zero container/network/volume residuals, and both recorded IDs returned NOT_FOUND. Existing resources were preserved. Evidence: `evidence/t03b2-d-20261109-r1/cleanup-recovery-r1.json`, `post-cleanup-independent-check.json`.
- Historical r5 Docker Desktop logs show Docker-Client stop requests followed about three seconds later by “using the force” and task-delete records for app and Selenium. This verifies force-stop escalation as the observed termination mechanism, not an OOM diagnosis or the initiating caller. The raw locked host log is not committed; sanitized trace: `evidence/offline-verification-20261109-r34/r5-stop-escalation-trace.json`.
- Updated offline verification: 28/28 cleanup fault-injection tests and six syntax checks PASS, exit 0; evidence: `evidence/offline-verification-20261109-r37/`. Maven was not rerun because Java sources are unchanged.
- Runtime status: diagnostic `BLOCKED`; Run A `BLOCKED`; Run B `NOT_RUN`; G0 remains `PARTIAL`, not accepted. No further runtime will be started after the diagnostic failed.
