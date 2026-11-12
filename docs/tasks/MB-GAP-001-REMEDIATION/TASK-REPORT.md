# MB-GAP-001 — Monitor/unmonitor semantic correction

- Task scope / acceptance gate: Implement the existing MB-GAP-001 monitoring scenario as an immutable revision, compile it, and leave runtime/acceptance gates unchanged.
- Base branch + base SHA: `origin/task/final-remediation-audit` at `8c1abafb5254af73bdc43ef9d2f5849bd5c64b00`.
- Working branch: `task/mantis-mb-gap001-fix`.
- Report-introducing commit (full SHA): `5118a8bd9a070d3d611d2b88a607f947d8a77aa4`; the final branch head is recorded in the handoff.
- PR: [#36](https://github.com/NgaiLong49423/BEWT-CovExt/pull/36) — OPEN DRAFT, stacked on the existing audit branch.
- Push status: `PUSHED`; the report-introducing commit was verified against the remote task branch.
- Runtime/version tested: Source implementation and Maven compile only; source pin `d06bf60f5ed9f96029bb830a005d4819a4f87b45`, claimed version `1.2.0`. App-image digest is still null in the G0 plan.
- Status proposed by Agent: `PARTIAL`.

## 1. What changed

Revision 3 preserves R1/R2 and the approved Gherkin. It logs out of the suite's admin account, logs into the test-only `dev_dave` account, opens issue #201, checks the initial absence and `Monitor` action, verifies the added monitor entry and `End Monitoring` toggle, then removes it and compares the remaining monitor links with their original set. A `finally` cleanup attempts to stop monitoring if an assertion fails after the first toggle.

| File path (repo-relative) | Change | Why |
|---|---|---|
| `extension/mantisbt/selenium/1406ecc3352e264ca199a0cf7476c671/revision-3/T01C_1406ecc3352e264ca199a0cf7476c671_R3.java` | Immutable R3 artifact | Perform the behavior described by the existing Gherkin and assert its observable state transitions. |
| `extension/mantisbt/selenium/1406ecc3352e264ca199a0cf7476c671/revision-3/registration.json` | Register R3 source/gherkin hashes and version pin | Bind the artifact to its declared app source and preserve traceability. |
| `experiments/mantisbt/bewt-suite/src/test/java/base/T01C_1406ecc3352e264ca199a0cf7476c671_R3.java` | Active suite mapping byte-matches the R3 artifact | Make the corrected candidate available to the pinned Maven suite. |
| `experiments/mantisbt/bewt-suite/src/test/java/base/ExperimentConfig.java` | Add runtime-only `MANTISBT_TEST_USERNAME` and `MANTISBT_TEST_PASSWORD` accessors | Use the specified test identity without embedding credentials. |
| `experiments/tools/unified-g0-runner.mjs` | Require MantisBT admin credentials from the VM runtime environment instead of fixed source defaults | Ensure the already-approved VM injection supplies the actual G0/Maven credentials. |
| `experiments/g0-safety/test/multi-app-harness.test.mjs` | Add MantisBT credential-source regression assertions | Prevent reintroducing source literals or silently running without required variables. |
| `docs/program/STATUS.json` | Add this report to MantisBT evidence paths; gates remain unchanged | Keep the program status linked to task evidence without promoting acceptance. |

## 2. Actual verification

| Exact command / operation | Result | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---|---|---|
| `mvn -B -ntp -DskipTests test` in `experiments/mantisbt/bewt-suite` | Maven output `BUILD SUCCESS`; 46 test source files compiled; Surefire skipped tests | PASS (compile only) | `experiments/mantisbt/bewt-suite/target/test-classes/base/T01C_1406ecc3352e264ca199a0cf7476c671_R3.class` |
| `node --check experiments/tools/unified-g0-runner.mjs` and `node --check experiments/g0-safety/test/multi-app-harness.test.mjs` | Exit 0 | PASS | Runner and focused harness test |
| `node --test experiments/g0-safety/test/multi-app-harness.test.mjs` | 5 passed, 0 failed, 0 skipped | PASS | Test output from the focused harness test |
| SHA-256 comparison of extension R3, active suite mapping, and `registration.json` | All equal `318b5d1328a1830ab20b1aa42e09f7eb3425707530d5a8bf9c6463fc2eb87b64`; R2 still matches its declared hash | PASS | Registration file and source paths above |
| Parse R3 registration JSON | PASS | PASS | `extension/mantisbt/selenium/1406ecc3352e264ca199a0cf7476c671/revision-3/registration.json` |
| Docker, Selenium G3, clean-state reruns, cleanup audit | Not run; G0/runtime orchestration and exact image provenance are incomplete, and user has not sent the VM-ready signal | NOT_RUN | None |

## 3. Research impact

- App/version: MantisBT `1.2.0`, source commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45`.
- Candidate: R2 remains immutable and historically `WRONG_BEHAVIOR`. R3 statically implements the monitor/unmonitor flow and is proposed `PARTIALLY_IMPLEMENTED`; G3 and human review remain pending.
- Pinned source supports the current-user path: blank username resolves to the authenticated user in `bug_monitor_add.php`; `bug_monitor_delete.php` uses the authenticated user when no user ID is supplied; the monitor list renders the current monitors. R3 uses only the UI and does not query the database directly.
- Current app image `olianasd/mantisbt-strongpsw:1.2.0` has no digest in `experiments/mantisbt/g0-plan.json`; issue #201, `dev_dave` account, monitor-list visibility, and app-image source identity remain unverified in the runtime.
- No RQ values, candidate counts, gate values, human-review decisions, or `VALIDATED` status were changed.
- Mantis G0 admin login now reads `BEWT_ADMIN_USERNAME` and `BEWT_ADMIN_PASSWORD` from the injected VM environment. Additional test-only VM variable names are required for this candidate: `MANTISBT_TEST_USERNAME` (must equal `dev_dave`) and `MANTISBT_TEST_PASSWORD`. Values were not requested in chat or written to files/logs.

## 4. Safety & integrity

- `bewt-original/` touched: NO.
- Docker/Cloud resources touched: NONE.
- Existing unrelated local dirty files preserved: YES; root attempt archives and strict G3 evidence directories remain untracked and untouched.
- Credentials in source, logs, or Git: NONE.
- Candidate fixture rows are not created or deleted by the test; the test's `finally` attempts to clear the test user's monitor toggle. G3 still requires a disposable runtime and residual-state evidence.

## 5. Evidence and reproduction

- Candidate source and active mapping: paths in section 1.
- Source references at commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45`:
  - `https://github.com/mantisbt/mantisbt/blob/d06bf60f5ed9f96029bb830a005d4819a4f87b45/bug_monitor_add.php` (blob `6bcc02763e4639108dd10dd9f92d150ed209c196`)
  - `https://github.com/mantisbt/mantisbt/blob/d06bf60f5ed9f96029bb830a005d4819a4f87b45/bug_monitor_delete.php` (blob `4915fdde314993bc8f563986f136bb534082e509`)
  - `https://github.com/mantisbt/mantisbt/blob/d06bf60f5ed9f96029bb830a005d4819a4f87b45/bug_monitor_list_view_inc.php` (blob `9a539f50540da1cb33a0bf2313a7339a8615f756`)
  - `https://github.com/mantisbt/mantisbt/blob/d06bf60f5ed9f96029bb830a005d4819a4f87b45/core/bug_api.php` (blob `7d6e030f27c90a8dcf927918d3ed10ed381c55ea`)
- Reproduce compile: `mvn -B -ntp -DskipTests test` from `experiments/mantisbt/bewt-suite`.
- Runtime limitations: digest/provenance, seeded issue/account, and display selectors require verification before G3.

## 6. Review request

- Team Lead review: Confirm that the source-correct UI interpretation preserves the approved oracle, especially that the visible monitor list identifies `dev_dave` as expected. Do not mark accepted or validated based on compile evidence.
- Next action: Team Lead reviews R3 semantics; then wait for the authorized VM-ready signal and verify fixture/account/image provenance before G3.
