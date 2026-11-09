# T03-A1 — Offline G0 implementation for four applications

- Task scope / acceptance gate: Offline G0 code/config/Base-suite readiness for Joomla, MantisBT, MediaWiki, and PrestaShop; this is not G0 runtime acceptance.
- Base branch + base SHA: initial branch base `bd9b3b15fca28419ada9862b8a65bac910edf169`; latest fetched `origin/main` is `0cba0eaf0fa416e90a5ac766bc604ee71d43818e`. It adds five T04-F commits on disjoint paths; this correction does not merge unrelated files into the task branch.
- Working branch: `task/t03-offline-g0-agent1`.
- Head commit: see PR #19's verified HEAD SHA in the final handoff; the report is included in that commit, so a commit cannot embed its own final SHA.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/19 (Draft; base `main`).
- Push status: `PUSHED`; final branch SHA/PR HEAD equality is verified in the final handoff.
- Runtime/commit/version tested: Offline source/test working tree based on the SHA above; four suite baselines correspond to read-only `bewt-original/` commit `0501249ff3e9a5ea83a06155cd2971dc36197056`.
- Code review target proposed by Agent: `CODE_READY_FOR_MERGE` for this offline code correction only. Team Lead review remains required; runtime is `NOT_RUN` and G0 remains `NOT_VERIFIED`.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `experiments/{joomla,mantisbt,mediawiki,prestashop}/bewt-suite/` | Isolated copies of pinned Maven/Page Object/Base test suites; RemoteWebDriver and required process-environment configuration; removed workstation-only paths, private LAN endpoint, benchmark static password, and unsafe generic container instructions | Make existing Base cases reproducible without changing the read-only benchmark source or claiming a runtime |
| `experiments/{joomla,mantisbt,mediawiki,prestashop}/g0-plan.json` | Per-app source version, candidate baseline, network/ownership requirements, image/runtime blockers, explicit pending statuses | Record honest app-specific implementation gaps before any runtime promotion |
| `experiments/g0-safety/offline-runtime-safety.mjs` and `experiments/g0-safety/test/` | Fail-closed Docker inspection and complete port-binding checks; explicit stopped partial-start cleanup path with non-readiness result flags | Address F02 without treating cleanup eligibility as network isolation or port-forwarding evidence |
| `docs/tasks/T03-A1/` | Gap matrix, offline implementation/runtime/test reports, proposed status and write-once verification evidence | Provide reviewable evidence while preserving shared status and historical records |

## 2. Actual verification

| Exact command | Exit code | Result | Evidence path |
|---|---:|---|---|
| Source correction commit tested | `35452b416c86a3688b5cb63f804ea58282cd87c4` | committed before verification | `evidence/offline-verification-20261110-r6/verification-summary.json` |
| Three `node --check` syntax commands | 0 each | PASS | `evidence/offline-verification-20261110-r6/node-check-*.stdout.txt`, `.stderr.txt`, `.exit-code.txt` |
| Safety/adapter Node regression suite | 0 | 9/9 PASS | `evidence/offline-verification-20261110-r6/offline-safety-suite.stdout.txt` |
| Kanboard/Bludit cleanup/fault suites | 0 | 23/23 PASS | `evidence/offline-verification-20261110-r6/existing-cleanup-fault-suite.stdout.txt` |
| Four offline Maven `test-compile` commands | 0 each; stdout says `BUILD SUCCESS` | PASS with `Access is denied.` present in each stderr log (unexplained) | `evidence/offline-compile-20261110-r7/compile-summary.json` and separate stdout/stderr `.txt` files |
| Supplemental Claroline cleanup/fault suite | 1 | BLOCKED before test collection: sandbox could not locate signed Docker CLI at its supported path; no Docker command was executed | This supplementary local attempt is not counted as a PASS and is not substituted for current-code evidence |
| Source/test provenance and staged review | 0 mismatches across 253 blobs; all 27 `.txt` logs are not ignored | PASS | `evidence/offline-verification-20261110-r6/source-test-hashes.json`, `verification-summary.json`, and `review-checks.json` |

The r6 verification has 32/32 Node regression tests (9 safety/adapter plus 23 cleanup/fault); the three syntax checks are separate. Four Maven compiles exited 0. Provenance records 253 Java/MJS SHA-256 and Git blob IDs, all matching tested source commit `35452b416c86a3688b5cb63f804ea58282cd87c4`. The source tree was clean at test start; the full worktree was dirty only because prior untracked evidence directories were preserved.

## 3. Research impact

- Apps affected and source pins: Joomla 3.10.11 (`01deee0a7b8cf91fc503b2cc13359c6e43aac47f`); MantisBT 1.2.0 (`d06bf60f5ed9f96029bb830a005d4819a4f87b45`); MediaWiki 1.40.0 (`468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4`); PrestaShop 1.6.1.23 (`475d65fbda93403cd1afde0db09764c5295e952c`). Benchmark test source commit: `0501249ff3e9a5ea83a06155cd2971dc36197056`.
- Candidate IDs and status: no proposal/candidate IDs changed; runtime images are not promoted.
- RQ1/RQ2/RQ3/RQ4 measurable changes: none. Offline code/test readiness is not measured coverage or effectiveness evidence.
- Gate status before → proposed after: implementation gaps for these four app Base suites → offline implementation and compile verified; runtime remains `RUNTIME_PENDING`; G0 remains `NOT_VERIFIED`.
- Dataset/metrics artifacts: none changed; denominator/sampling unchanged.

## 4. Safety & integrity

- `bewt-original/` touched: NO; used as read-only source. Targeted baseline suite paths were clean at the recorded source commit.
- Docker/project resources touched: NONE. No Docker command, external request, Selenium, DB, or runtime cleanup was run.
- Existing unrelated local dirty files preserved: YES; the original checkout's untracked `experiments/expresscart/bewt-suite/` was preserved and excluded by using a separate task worktree.
- Secret scan / staged diff review: no credentials or private runtime data; benchmark static password/private LAN address/local browser path are absent from copied suites. No `bewt-original/`, `docs/program/STATUS.json`, Claroline source, project resource, or build output is in scope for commit. The Claroline line in the gap matrix was corrected per F03; PR #12 was read-only and remains OPEN/DRAFT.
- Failed/blocked tasks: supplemental Claroline cleanup/fault test could not load because the sandbox did not expose Docker's supported install path to its import-time signature verifier; no Docker command was run. Image digest/provenance, runtime orchestration/readiness, test seed/reset executor, browser invocation and exact resource cleanup executor remain incomplete. Runtime intentionally `NOT_RUN`.

## 5. Evidence and reproduction

- Source/test paths: `experiments/{joomla,mantisbt,mediawiki,prestashop}/bewt-suite/`, `experiments/g0-safety/`.
- Logs/compile records: `evidence/offline-verification-20261110-r6/`, `evidence/offline-compile-20261110-r7/`.
- Input fixtures/runtime cleanup: none; no runtime data was created.
- Exact reproducible commands are listed in `G0-OFFLINE-IMPLEMENTATION.md` and `TEST-RESULTS.md`; all Maven commands use `-o`.
- Known limitations: profiles are not runnable Compose configurations; application/database/Selenium digest pins and app-specific startup, readiness, install finalization, reset, runtime evidence capture and cleanup execution remain pending. MantisBT bundled DB provenance and MediaWiki DB version need resolution.

## 6. Review request

- Team Lead decision: approve a separate future runtime task only after immutable image provenance/digests, at least 6 GiB free RAM, actual Docker ownership/resource checks, and deny-by-default network isolation are independently established. No privileged action is requested by this offline PR.
- Suggested next task: review/merge this offline correction if accepted. Treat the four apps' G0 runtime as pending; resolve image provenance and implement/run app-specific isolated runtime harnesses only under a separately authorized task.
- PR diff URL: https://github.com/NgaiLong49423/BEWT-CovExt/pull/19/files. Inspect `experiments/*/g0-plan.json`, the adapter/safety code and `docs/tasks/T03-A1/` evidence.

`docs/program/STATUS.json` is intentionally unchanged per task instruction. This report does not mark any G0 gate accepted.

## Independent review corrections — Mount inspection and source write boundary

- At reviewed PR HEAD `39f0f4e0b741be0bdc782c958354be42f24df0c0`, a container with no `Mounts` field and an expected empty volume inventory passed `assertOwnedContainer`; the same shared check feeds partial-start cleanup. Missing, null or non-array mount inspection now blocks before a cleanup plan is emitted. A valid empty array still passes. Regression tests cover full and partial cleanup paths with synthetic objects; no Docker command or resource mutation occurs.
- The provenance recorder previously accepted a new output path inside its designated read-only BEWT source root. It now resolves the source root and output parent and refuses containment before invoking Git or writing. A temporary synthetic source test checks direct and nested output paths; existing output paths still use write-once `wx`. This protects the designated source root, not arbitrary other paths selected by a caller.
- The implementation gap matrix now distinguishes the merged states of PR #11/#12 from G0 acceptance and records the unresolved Kanboard T04-C checksum/command blocker. Historical artifacts and `docs/program/STATUS.json` remain untouched.
- `node --test experiments/g0-safety/test/offline-runtime-safety.test.mjs experiments/g0-safety/test/baseline-adapter.test.mjs experiments/g0-safety/test/provenance-output-safety.test.mjs experiments/kanboard/tools/test/cleanup-kanboard-g0.test.mjs experiments/bludit/tools/test/cleanup-bludit-g0.test.mjs`: exit 0, 33 PASS, 0 FAIL, 0 skipped. `node --check docs/tasks/T03-A1/tools/record-baseline-provenance.mjs`: exit 0. Evidence: `evidence/offline-verification-20261110-r9/`. Earlier intermediate 32/32 verification after the mount fix is retained at `evidence/offline-verification-20261110-r8/`.
- Runtime remains `NOT_RUN`, G0 `NOT_VERIFIED`, and no novelty/oracle/acceptance decision was made. Eight pre-existing untracked evidence directories remain untouched. Exact final commit and PR HEAD will be supplied in handoff after push.

## SonarCloud correction after HEAD 04e0049

GitHub check `129504117186` failed with SonarCloud reliability D and security B. The public issue API identified six `javascript:S2871` comparator findings and six `javascript:S4036` PATH-based executable findings. Container/port keys and IDs are now sorted with explicit `localeCompare` comparators on both sides of each equality check. The provenance recorder invokes a fixed absolute Git executable path (`C:\Program Files\Git\cmd\git.exe` on Windows, `/usr/bin/git` elsewhere) instead of resolving `git` through PATH. If Git is not installed there, it fails rather than falling back to PATH; portability to alternative installation paths is not verified. The recorder remains a trusted-operator tool, not a sandbox for hostile filesystem changes.

Offline regression after this correction: 34 PASS, 0 FAIL, 0 skipped, exit 0; provenance syntax check exit 0. A new test clears PATH and verifies the fixed Git executable reaches the expected non-repository error without writing output. Evidence: `evidence/offline-verification-20261110-r10/`. This is a local result; SonarCloud status for the subsequent commit must be checked separately and is not assumed PASS. No Docker, Cloud, Maven, Gemini or runtime work occurred.

## Independent fresh compile and source screen

R7 Maven stdout says `Nothing to compile` in all four modules; its exit 0 is not fresh-compilation proof. An r11 offline compile of four new clean temporary copies at `59df094130eadc9d6634d04b70e3b4906bb55bd0` produced 4/4 exit 0 and BUILD SUCCESS, with actual javac counts and empty stderr. All 255 copied tracked inputs matched tested Git blobs after LF normalization. A reproduction isolates the current sandbox `Access is denied.` to the Maven launcher `cd ..` base-directory search, while not establishing the exact historical cause. Original 251 files were screened for assertion-expression changes; none detected by the documented heuristic. These are compilation/static results, not E2E or oracle acceptance. See `evidence/offline-compile-20261110-r11/INDEPENDENT-AUDIT.md` and per-command logs.
