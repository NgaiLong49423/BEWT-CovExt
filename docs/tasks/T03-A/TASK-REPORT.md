# T03-A Task Report — Kanboard G0

## Scope and disposition

The Kanboard G0 evidence remains **proposed `G0_READY_FOR_REVIEW`**. This does not self-accept G0, mark it `VALIDATED`, or change shared program status. Team Lead review is required. T03-B has not started.

Task branch: `feature/t03a-kanboard-g0`, based on `d7693ea291b8b88a7f999a131daba3522fcf505d` (main after T02/PR #5).

Commit provenance:

- Previous T03-A implementation commit: `c549e07780ee87b3e5abcb538a15af29b39d5440`.
- HEAD reviewed before these corrections: `1f953702064e3f56de759cf3a02a3ed2b5dc60f5`.
- This follow-up revision on the same PR is limited to the three requested review findings.

## Work performed

- Copied the pinned Kanboard baseline into `experiments/kanboard/bewt-suite` from a Git archive; `bewt-original/` was not modified.
- Made the test URL configurable through `-Dapp.url`, moved the baseline test password to the ephemeral `KANBOARD_TEST_PASSWORD` runtime environment, and removed the stale hard-coded Chrome browser version so Selenium Manager can select a compatible installed browser.
- Added `experiments/kanboard/tools/kanboard-g0.mjs` for manifest promotion, strict run identity/label checks, loopback-only dynamic port binding, narrow test selection and evidence classification.
- Added focused Node tests for manifest validation, ownership checks, cleanup planning and JUnit result interpretation.
- Captured sanitized host, toolchain and registry-manifest preflight evidence under `evidence/preflight/`.
- Pulled the Kanboard image by immutable Linux/amd64 digest and verified `v1.2.15` from the running image.
- Ran the original `tests.AddNewProject` twice under real Chrome/Selenium against independent, loopback-only Docker instances; both final-source HTTP readiness and JUnit outcomes passed. The runtime password value was excluded from committed source and evidence.
- Verified `Test 2` absent before each test, present after each test, and absent in Run B's fresh database after Run A storage was removed.
- Added ownership-validated, fail-closed, idempotent Docker cleanup with independent residual checks and fault-injection tests.
- Promoted the verified Kanboard runtime manifest to `config/apps/kanboard.json` and updated active T02 isolation validation to accept multiple parser-valid runtime manifests while rejecting drafts.

## Verification status

| Check | Result | Evidence |
|---|---|---|
| Kanboard helper tests | PASS, 11 tests | [TEST-RESULTS.md](TEST-RESULTS.md) |
| Runtime manifest validation | PASS; pinned Kanboard source and image digest retained | [config/apps/kanboard.json](../../../config/apps/kanboard.json) |
| Cleanup fault-injection tests | PASS, 9 tests | [cleanup test source](../../../experiments/kanboard/tools/test/cleanup-kanboard-g0.test.mjs) |
| T02 runtime manifest isolation | PASS, multiple valid manifests; drafts rejected | [T02 isolation test](../../T02/evidence/review-fixes/verify-config-apps.test.mjs), [run evidence](evidence/review-corrections/t02-runtime-isolation.json) |
| Maven Java test compilation | PASS | [TEST-RESULTS.md](TEST-RESULTS.md) |
| Two independent Selenium clean starts | PASS; original run logs retained | [G0-RUNTIME-RESULTS.md](G0-RUNTIME-RESULTS.md), [Maven run metadata](MAVEN-RUN-METADATA.md) |
| Teardown and no-residual evidence | Historical run evidence retained; current cleanup logic fault-tested | [RESET-AND-CLEANUP-RESULTS.md](RESET-AND-CLEANUP-RESULTS.md) |
| G0 acceptance | `G0_READY_FOR_REVIEW` proposed; not accepted | [PROPOSED-STATUS-UPDATE.json](PROPOSED-STATUS-UPDATE.json) |

## Handoff

The complete per-run logs, original sanitized Surefire XML and hashes, Docker inventories, runtime manifests, source hashes and teardown records are under `evidence/`. No original JUnit XML or hashes were changed. `docs/program/STATUS.json`, `IMPLEMENTATION-ROADMAP.md`, `framework/`, `adapters/expresscart/` and `bewt-original/` were not modified.

PR [#6](https://github.com/NgaiLong49423/BEWT-CovExt/pull/6) remains the review gate; no merge or T03-B work is included.
