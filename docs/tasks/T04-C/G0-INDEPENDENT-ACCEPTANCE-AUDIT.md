# G0 Independent Acceptance Audit — Kanboard

## Decision posture

This audit is an evidence review, not gate acceptance. Current recommendation: **`BLOCKED_EVIDENCE` / defer acceptance**. The runtime artifacts report successful execution, but the integrity chain for the original Surefire XML is contradictory for both runs, and the Maven command is reconstructed rather than captured verbatim.

## Pinned inputs

The Run A and Run B provenance records agree on BEWT commit `0501249ff3e9a5ea83a06155cd2971dc36197056`, upstream Kanboard commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`, source-tree SHA-256 `1e1c125802be4b36366efa1589827ad53a2efc0b13dd14b803966ef57817196f`, image tag `kanboard/kanboard:v1.2.15`, registry digest and local image ID `sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e`. `config/apps/kanboard.json` and `evidence/kanboard-runtime-manifest.json` agree with those pins. Each run provenance binds its own run ID.

## Base test and oracle

The checked-in T03-A baseline class `experiments/kanboard/bewt-suite/src/test/java/tests/AddNewProject.java` logs in, creates `Test 2`, and asserts `project.getTitle()` equals `Test 2` and `project.getStatus()` equals `This project is open`. `ProjectSummaryPage.getTitle()` and `getStatus()` read the corresponding displayed elements. This is a real behavioral assertion, not a test-count-only claim.

Both sanitized Surefire XML files name `tests.AddNewProject` and report one test with zero failures, errors, or skips; both Maven logs report `BUILD SUCCESS`; contemporaneous reset comparison records exit code 0. But the hash files disagree with the corresponding XML bytes:

| Run | Recorded original XML hash | SHA-256 of saved XML after LF normalization | Finding |
|---|---|---|---|
| A | `63d0f79609d222c9708e4cf224ae2770fbc5339bbab41fdb49d72bc9638db527` | `17fa89bd0c3f5207077a3cbe534a740a7f437811a6e619c18787bb8d6fa1ef16` | `BLOCKED_EVIDENCE` |
| B | `cd0c77ab86d97ca5a29c92f4aa7cbc8fd861a749868684d9cdfccb1013af99a1` | `035f275f14d85368777abcc025a5b6253773874853ef04f4554bb5daf5f75fab` | `BLOCKED_EVIDENCE` |

The current checkout's CRLF hashes differ too; line-ending conversion does not reconcile either pair. The preserved files were not changed. `MAVEN-RUN-METADATA.md` explicitly says the command line and flags were not recorded and supplies a reconstruction based on URL, selected test and runner argument contract. Thus exit code/test outcome have corroborating records, but the primary test artifact's hash linkage is unresolved.

## Runtime isolation and reset

For both runs, `runtime.json` records HTTP 200 and the login form. Host ports bind only to `127.0.0.1`; resource limits are 805306368 bytes, 256 PIDs, and CPU 1.5. `owned-resources.json` carries matching `owner`, `project`, `managed-by`, `app`, `task`, and exact `runId` labels. Run A and B use different container IDs, network IDs and three-volume sets. Run A cleanup was recorded before Run B; Run B's clean pre-test database contains zero `Test 2` rows, so the sentinel did not carry across. Each sentinel record then reports one row after the test.

Cleanup evidence records exact T03-A resource removal and post-teardown inventory. Counts remain 32 containers (2 running), 11 networks, 24 volumes and 19 images. Protected Docker signatures are unchanged across before/after inventories. Run B has a second cleanup record with no actions and `cleanupWasAlreadyComplete: true`; Run A has no repeated-cleanup artifact, so its idempotent repeat is `NOT_EVIDENCED`.

The runtime executions predate a later fail-closed cleanup correction. Current T03-A offline fault-injection evidence supports the corrected implementation's behavior, but cannot be retroactively attributed to these run executions. This is a provenance limitation, not evidence that a foreign resource was changed.

## Selenium/CDP warning

Both preserved XML/logs contain `Unable to find CDP implementation matching 156` for Chrome `156.0.8078.80` with Selenium 4.35.0. The inspected test uses ordinary WebDriver page operations and assertions, not DevTools APIs; Maven still reports success and the assertions passed. Classify the warning as **non-fatal for these recorded executions**. The ChromeDriver binary/version digest is not in the records, so exact browser-driver reproduction remains unverified.

## Overall criterion assessment

The evidence supports source/image pinning, isolation, readiness, a meaningful assertion result, and independent reset/cleanup outcomes. The mismatch between each recorded original hash and preserved XML prevents accepting test-result provenance as fully verified. Under the acceptance matrix, missing or contradictory commit/version-bound evidence remains `NOT_VERIFIED`; therefore the combined G0 decision is **`BLOCKED_EVIDENCE`** and must remain a Team Lead decision. No new Docker run is inherently required if contemporaneous original XML bytes/hash can be supplied and independently verified. If they cannot, the Team Lead must decide whether a new authorized run is required; this task did not run one.
