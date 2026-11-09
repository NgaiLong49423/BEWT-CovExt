# T03-B2 — Claroline 1.11.10 G0 Runtime Verification

- Task scope / acceptance gate: Isolated Claroline G0 feasibility, source/image provenance, baseline compilation and safe runtime harness; no G1–G4.
- Base branch + base SHA: `main` — `464d9e2fb5d1a3705d1d7d6f4dc9a2782bde4a1d`.
- Working branch: `feature/t03b2-claroline-g0`.
- Previous implementation commit: `58618c758f4ed3ef4b1e43493d51a1a61ebb0cf9` (harness, suite, evidence and initial report).
- Current reviewed/pushed HEAD before this evidence follow-up: `a34e14c586e9a2d38d7c9839387adf2ec92224d0`; this follow-up requires a new commit and final remote verification.
- PR: [https://github.com/NgaiLong49423/BEWT-CovExt/pull/9](https://github.com/NgaiLong49423/BEWT-CovExt/pull/9).
- Push status: `PUSHED`; final branch, remote ref, and PR head are verified together after this report update.
- Runtime/commit/version tested: BEWT suite copied from commit `0501249ff3e9a5ea83a06155cd2971dc36197056`; Claroline 1.11.10 source release verified by historical tag/archive comparison; runtime image base matches source archive with one unattributed code patch; app image digest pinned to `sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af`.
- Status proposed by Agent: `PARTIAL` / provenance `PARTIAL` (base verified; one image-only patch unattributed); runtime `NOT_RUN` because the latest user-authorized RAM check measured 3.90 GiB free (<4 GiB preflight requirement) and the Docker Desktop engine pipe was unavailable.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `experiments/claroline/bewt-suite/` | Isolated 75-file baseline suite; only `BaseTest.java` environment adaptation | Retain baseline oracle while supporting remote headless Selenium |
| `experiments/claroline/tools/` | Pinned-run helpers, fail-closed partial-start cleanup, write-once wrapper, runtime harness, explicit signed-tool/path policy | Reproducible, ownership-safe, and avoids PATH search in child processes |
| `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | Cleanup fault injection and Surefire/run identity/sanitization tests | Verify failure paths without touching Docker |
| `docs/tasks/T03-B2/` | Provenance, image risk, preflight, adaptation, cleanup and partial result reports | Preserve auditable current state and limitations |
| `docs/tasks/T03-B2/evidence/preflight-image-20261109/` | Image-only inspection and preflight resource evidence | Preserve actual read-only image inspection and stopped-container cleanup records |
| `.gitignore` | Narrow allow rule for T03-B2 sanitized evidence `.log` files | Allow sanitized future Maven output while retaining general log ignore |

No `config/apps/claroline.json` was added: although the official release source and pinned image base are verified, one later image-only source patch remains unattributed and runtime is still `NOT_RUN`.

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
| Runtime A/B and Selenium | — | NOT_RUN — latest free RAM 3.90 GiB (<4 GiB) and daemon pipe unavailable | [runtime status](G0-RUNTIME-RESULTS.md) |

## 3. Research impact

- Apps affected: Claroline feasibility setup only. The BEWT upstream test source is not an independently verified Claroline release archive.
- Candidate statuses before → proposed after: Claroline remains draft/provenance-blocked; no candidate or research metric is promoted.
- RQ1/RQ2/RQ3/RQ4 measurable changes: none; no runtime test data collected.
- Gate status before → proposed after: no acceptance change; proposed Claroline status is `PARTIAL`, runtime `NOT_RUN`.
- Dataset/metrics artifacts updated: none.
- Denominator and sampling caveats: no runtime sample; compilation and fault-injection tests are not application outcome observations.

## 4. Safety & integrity

- `bewt-original/` touched? NO. Exact BEWT source was fetched to a temporary location and copied into the isolated working copy; original research source remains read-only.
- Docker/project resources touched? One preflight-only Claroline container was created stopped with unique task labels and no mounts/network, inspected, removed, and confirmed absent by exact NOT_FOUND follow-up. App/Selenium service containers were NOT started. No other Docker resources were removed.
- Final read-only T03-B2 ownership scan: zero containers, networks, or volumes; evidence is `docs/tasks/T03-B2/evidence/preflight-image-20261109/final-resource-scan.json`.
- Existing unrelated local dirty files preserved? YES; this is a dedicated clean task worktree.
- Secret scan / staged diff review result: pending final review; runner sanitizes local paths, fixture-like secret strings, Surefire properties and console output. No credentials are stored in the evidence.
- Failed/blocked tasks: runtime A/B is BLOCKED by the measured RAM gate; runtime manifest is withheld pending image-to-release source comparison.

## 5. Evidence and reproduction

- Source/test paths: `experiments/claroline/bewt-suite/src/test/java/test/Claroline_AddUserTest.java`, `experiments/claroline/tools/`, `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`; [baseline source comparison](evidence/offline-verification-20261109-r3/baseline-source-comparison.json).
- Raw run/log/XML/screenshot paths: none for runtime; no Maven/Selenium outcome log was fabricated. Final offline Node logs are under `docs/tasks/T03-B2/evidence/offline-verification-20261109-r8/`; Maven compile and RAM/daemon preflight logs are under `docs/tasks/T03-B2/evidence/offline-verification-20261109-r7/`; image preflight is under `docs/tasks/T03-B2/evidence/preflight-image-20261109/`.
- Fixture/database before/after and cleanup: no app database was started. Preflight-container cleanup evidence is retained with its initial blocked checker record and exact NOT_FOUND follow-up.
- Reproducible commands: `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`; Maven `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile`; runtime requires a fresh never-used `t03b2-<letter>-YYYYMMDD-rN` ID and ≥4 GiB free memory.
- Known limitations: Both official SourceForge archive candidate hashes are recorded; runtime image-to-archive match and upstream Claroline Git commit remain unverified; runtime and DB reset not evaluated; image is legacy and has unknown build provenance.

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
