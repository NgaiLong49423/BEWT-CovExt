# Test and Audit Execution Summary

## Commands executed in this audit

| Command/action | Result | Interpretation |
|---|---|---|
| `git fetch origin main` | Exit 0 | Fetched current main ref; at fetch time it matched local baseline SHA. |
| `node docs/research-results/v2/replication/recompute-metrics.mjs` (baseline version) | Exit 0 | Demonstrated the then-current false 40/40 approval, 180/11 fallback, and unconditional RQ4 PASS claims. |
| `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` | 17/17 PASS | Parser, approval, semantic/runtime evidence, hash-mismatch, determinism, and detached/linked Git metadata controls pass. |
| `node --check docs/research-results/v2/replication/recompute-metrics.mjs` | Exit 0 | Updated metrics engine syntax check. |
| `node --test docs/research-results/v2/replication/test/audit-g3-run-accounting.test.mjs` | 3/3 PASS | Confirms the 79/84/85 run relationship, supplementary IDs, JO-GAP-003 denominators, and the limits of Bludit/Kanboard cleanup attribution. |
| `node docs/research-results/v2/replication/audit-g3-run-accounting.mjs` | Exit 0 | Reproduces run membership and artifact counts from the consolidated summary and raw G3 tree. |
| `node docs/research-results/v2/replication/recompute-metrics.mjs` (after correction) | Exit 0 | Generates JSON/CSV with RQ1 BLOCKED, RQ2/RQ3 NOT_EVALUATED, and RQ4 PARTIALLY_VERIFIED; no false PASS. |
| `mvn -B -ntp -DskipTests test` in each active Claroline and Kanboard Maven suite (isolated worktree) | Exit 0 for both | Compiled the active R3 copies and suite sources; Surefire executions were skipped. This does not establish browser or candidate E2E behavior. |
| GitHub Secret Scanning metadata and local secret-safe lexical scan | Enabled/no alerts; 4,049 tracked files scanned | No token-pattern matches; 61 credential-shaped login lines and one test-only private-key-header match require contextual review. Values were not emitted. Local dedicated scanners were unavailable. |
| Read-only review of 40 registration records and R2 classes | Completed | 40 IDs inspected; 0 semantic matches. Detailed paths, line ranges, hashes, and mismatch summary in `40-CASE-TRACEABILITY.json`. |
| Read-only review of review ledgers | Completed | 40 records; 0 signed human oracle/novelty approvals. |
| Read-only artifact inventory | Completed | 31 G0 run records, 84 G3 run records, 85 G3 JUnit XML files; one false cleanup verification. |
| Read-only nested BEWT status | Completed | Baseline SHA recorded; pre-existing build artifacts/dirty files observed and preserved. |
| Security-only R3 validation | 10/10 registration hashes match; no literal credentials remain in login calls | Five Claroline and five Kanboard classes now read required runtime config; Maven compile/runtime checks remain NOT_RUN. |

No browser, Docker, Cloud, or live model operation was run in this continuation. No raw test was reclassified as a behaviorally valid pass.

## Subsequent authorized runtime work (2026-11-12)

The statements above describe the original audit continuation. After that snapshot, the Team Lead authorized restarting the existing Cloud VM. Fresh G0 base smoke tests passed for all eight applications; details and provenance gaps are recorded in `docs/tasks/G0-CLOUD-20261112/TASK-REPORT.md` and its evidence.

A separate Kanboard `KB-GAP-001` remediation then ran R5–R8 on the same VM. R5, R6, and R7 had observed UI/fixture/search failures. R8 passed once plus three valid clean-state reruns (1/1 test each, no JUnit failures/errors/skips); each run's cleanup verified zero residual resources. Three intermediate attempts are classified `BLOCKED_FIXTURE` because the execution command omitted `KANBOARD_TEST_USERNAME`; they are retained and excluded from the valid rerun count. See `docs/tasks/KB-GAP-001-R5/TASK-REPORT.md` and `docs/tasks/KB-GAP-001-R5/evidence/`.

These ten candidate attempts are separate from the historical 79/84/85 accounting above. They do not establish human oracle/novelty approval or research `VALIDATED` status.
