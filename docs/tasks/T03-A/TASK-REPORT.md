# T03-A Task Report — Kanboard G0

## Scope and disposition

The Kanboard G0 evidence is complete and **proposed `G0_READY_FOR_REVIEW`**. This does not self-accept G0, mark it `VALIDATED`, or change the shared program status. Team Lead review is required. T03-B has not started.

Task branch: `feature/t03a-kanboard-g0`, based on `d7693ea291b8b88a7f999a131daba3522fcf505d` (main after T02/PR #5).

## Work performed

- Copied the pinned Kanboard baseline into `experiments/kanboard/bewt-suite` from a Git archive; `bewt-original/` was not modified.
- Made the test URL configurable through `-Dapp.url`, moved the baseline test password to the ephemeral `KANBOARD_TEST_PASSWORD` runtime environment, and removed the stale hard-coded Chrome browser version so Selenium Manager can select a compatible installed browser.
- Added `experiments/kanboard/tools/kanboard-g0.mjs` for manifest promotion, strict run identity/label checks, loopback-only dynamic port binding, narrow test selection and evidence classification.
- Added focused Node tests for manifest validation, ownership checks, cleanup planning and JUnit result interpretation.
- Captured sanitized host, toolchain and registry-manifest preflight evidence under `evidence/preflight/`.
- Pulled the Kanboard image by immutable Linux/amd64 digest and verified `v1.2.15` from the running image.
- Ran the original `tests.AddNewProject` twice under real Chrome/Selenium against independent, loopback-only Docker instances; both final-source HTTP readiness and JUnit outcomes passed. The runtime password value was excluded from committed source and evidence.
- Verified `Test 2` absent before each test, present after each test, and absent in Run B's fresh database after Run A storage was removed.
- Removed only recorded T03-A container/network/volumes after checking IDs, image, labels, mounts and attachments; post-teardown fingerprints show protected resources unchanged.
- Added fixed-command Docker inventory and ownership-validated, idempotent cleanup tools.

## Verification status

| Check | Result | Evidence |
|---|---|---|
| G0 helper unit tests | PASS, 10 tests | [TEST-RESULTS.md](TEST-RESULTS.md) |
| Maven Java test compilation | PASS | [TEST-RESULTS.md](TEST-RESULTS.md) |
| Docker inventory and image pull | PASS | [ENVIRONMENT-PREFLIGHT.md](ENVIRONMENT-PREFLIGHT.md) |
| Two independent Selenium clean starts | PASS | [G0-RUNTIME-RESULTS.md](G0-RUNTIME-RESULTS.md) |
| Teardown and no-residual verification | PASS | [RESET-AND-CLEANUP-RESULTS.md](RESET-AND-CLEANUP-RESULTS.md) |
| G0 acceptance | `G0_READY_FOR_REVIEW` proposed; not accepted | [PROPOSED-STATUS-UPDATE.json](PROPOSED-STATUS-UPDATE.json) |

## Handoff

The complete per-run logs, sanitized Surefire XML, Docker inventories, runtime manifests, source hashes and teardown records are under `evidence/`. `docs/program/STATUS.json`, `IMPLEMENTATION-ROADMAP.md`, `framework/`, `adapters/expresscart/` and `bewt-original/` were not modified. Branch commit, push and the review PR are authorized handoff steps; the PR will remain unmerged for Team Lead review.

