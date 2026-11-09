# T03-A1 — Offline G0 implementation for four applications

- Task scope / acceptance gate: Offline G0 code/config/Base-suite readiness for Joomla, MantisBT, MediaWiki, and PrestaShop; this is not G0 runtime acceptance.
- Base branch + base SHA: `origin/main` / `bd9b3b15fca28419ada9862b8a65bac910edf169` (fetched 2026-11-10).
- Working branch: `task/t03-offline-g0-agent1`.
- Head commit: see PR #19's verified HEAD SHA in the final handoff; the report is included in that commit, so a commit cannot embed its own final SHA.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/19 (Draft; base `main`).
- Push status: `PUSHED`; final branch SHA/PR HEAD equality is verified in the final handoff.
- Runtime/commit/version tested: Offline source/test working tree based on the SHA above; four suite baselines correspond to read-only `bewt-original/` commit `0501249ff3e9a5ea83a06155cd2971dc36197056`.
- Status proposed by Agent: `PARTIAL` — offline implementation slice ready for review; runtime pending; G0 not verified.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `experiments/{joomla,mantisbt,mediawiki,prestashop}/bewt-suite/` | Isolated copies of pinned Maven/Page Object/Base test suites; RemoteWebDriver and required process-environment configuration; removed workstation-only paths, private LAN endpoint, benchmark static password, and unsafe generic container instructions | Make existing Base cases reproducible without changing the read-only benchmark source or claiming a runtime |
| `experiments/{joomla,mantisbt,mediawiki,prestashop}/g0-plan.json` | Per-app source version, candidate baseline, network/ownership requirements, image/runtime blockers, explicit pending statuses | Record honest app-specific implementation gaps before any runtime promotion |
| `experiments/g0-safety/offline-runtime-safety.mjs` and `experiments/g0-safety/test/` | Pure offline pre-start/ownership/cleanup planning guards plus regression tests | Ensure only exact run-owned, isolated, loopback-published resource inventories could later produce cleanup arguments; no Docker calls are made |
| `docs/tasks/T03-A1/` | Gap matrix, offline implementation/runtime/test reports, proposed status and write-once verification evidence | Provide reviewable evidence while preserving shared status and historical records |

## 2. Actual verification

| Exact command | Exit code | Result | Evidence path |
|---|---:|---|---|
| `node --check` on the safety source and both test files (3 commands) | 0 each | PASS | `evidence/offline-verification-20261110-r2/node-check-*.exit-code.txt` |
| `node --test experiments/g0-safety/test/offline-runtime-safety.test.mjs experiments/g0-safety/test/baseline-adapter.test.mjs` | 0 | 8/8 PASS | `evidence/offline-verification-20261110-r2/offline-safety-suite.log` |
| `node --test experiments/kanboard/tools/test/cleanup-kanboard-g0.test.mjs experiments/bludit/tools/test/cleanup-bludit-g0.test.mjs` | 0 | 23/23 PASS | `evidence/offline-verification-20261110-r2/existing-cleanup-fault-suite.log` |
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | 0 | 18/18 PASS | `evidence/offline-verification-20261110-r2/claroline-cleanup-fault-suite.log` |
| `mvn -B -o -f experiments/<app>/bewt-suite/pom.xml test-compile` for four apps | 0 each | PASS | `evidence/offline-compile-20261110-r3/compile-summary.json` and per-app logs |
| `git diff --cached --check` and scoped secret/protected-path review | 0 | PASS | `evidence/offline-verification-20261110-r2/review-checks.json` |

The three Node suites total 49/49 tests. Provenance has SHA-256 and Git blob IDs for 253 Java/MJS source/test files in `evidence/offline-verification-20261110-r2/source-test-hashes.json`; source HEAD and dirty-at-test state are recorded in `verification-summary.json`. The offline test commands ran on the working tree based on base SHA `bd9b3b15fca28419ada9862b8a65bac910edf169`; hashes/blobs identify the exact tested files, which are checked against the staged/committed source before publication.

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
- Secret scan / staged diff review: no credential values or private runtime data are intended; removed the benchmark static password/private LAN address/local workstation browser path from the isolated copies. Offline test has an explicit forbidden-string regression assertion. No `bewt-original/`, `docs/program/STATUS.json`, Claroline, project resource, or build output is in scope for commit.
- Failed/blocked tasks: image digest/provenance, runtime orchestration/readiness, test seed/reset executor, browser invocation and exact resource cleanup executor remain incomplete. Runtime intentionally `NOT_RUN`.

## 5. Evidence and reproduction

- Source/test paths: `experiments/{joomla,mantisbt,mediawiki,prestashop}/bewt-suite/`, `experiments/g0-safety/`.
- Logs/compile records: `evidence/offline-verification-20261110-r2/`, `evidence/offline-compile-20261110-r3/`.
- Input fixtures/runtime cleanup: none; no runtime data was created.
- Exact reproducible commands are listed in `G0-OFFLINE-IMPLEMENTATION.md` and `TEST-RESULTS.md`; all Maven commands use `-o`.
- Known limitations: profiles are not runnable Compose configurations; application/database/Selenium digest pins and app-specific startup, readiness, install finalization, reset, runtime evidence capture and cleanup execution remain pending. MantisBT bundled DB provenance and MediaWiki DB version need resolution.

## 6. Review request

- Team Lead decision: approve a separate future runtime task only after immutable image provenance/digests, at least 6 GiB free RAM, actual Docker ownership/resource checks, and deny-by-default network isolation are independently established. No privileged action is requested by this offline PR.
- Suggested next task: resolve image provenance and implement/run app-specific isolated G0 runtime harnesses under a separately authorized task; keep each app's runtime evidence independent.
- PR diff URL: https://github.com/NgaiLong49423/BEWT-CovExt/pull/19/files. Inspect `experiments/*/g0-plan.json`, the adapter/safety code and `docs/tasks/T03-A1/` evidence.

`docs/program/STATUS.json` is intentionally unchanged per task instruction. This report does not mark any G0 gate accepted.
