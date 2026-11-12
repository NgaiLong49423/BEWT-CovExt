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
