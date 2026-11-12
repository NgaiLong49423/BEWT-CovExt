# Test and Audit Execution Summary

## Commands executed in this audit

| Command/action | Result | Interpretation |
|---|---|---|
| `git fetch origin main` | Exit 0 | Fetched current main ref; at fetch time it matched local baseline SHA. |
| `node docs/research-results/v2/replication/recompute-metrics.mjs` (baseline version) | Exit 0 | Demonstrated the then-current false 40/40 approval, 180/11 fallback, and unconditional RQ4 PASS claims. |
| `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` | 15/15 PASS | Parser, approval, semantic/runtime evidence, hash-mismatch, and determinism controls pass. |
| `node --check docs/research-results/v2/replication/recompute-metrics.mjs` | Exit 0 | Updated metrics engine syntax check. |
| `node docs/research-results/v2/replication/recompute-metrics.mjs` (after correction) | Exit 0 | Generates JSON/CSV with RQ1 BLOCKED, RQ2/RQ3 NOT_EVALUATED, and RQ4 PARTIALLY_VERIFIED; no false PASS. |
| Read-only review of 40 registration records and R2 classes | Completed | 40 IDs inspected; 0 semantic matches. Detailed paths, line ranges, hashes, and mismatch summary in `40-CASE-TRACEABILITY.json`. |
| Read-only review of review ledgers | Completed | 40 records; 0 signed human oracle/novelty approvals. |
| Read-only artifact inventory | Completed | 31 G0 run records, 84 G3 run records, 85 G3 JUnit XML files; one false cleanup verification. |
| Read-only nested BEWT status | Completed | Baseline SHA recorded; pre-existing build artifacts/dirty files observed and preserved. |
| Security-only R3 validation | 10/10 registration hashes match; no literal credentials remain in login calls | Five Claroline and five Kanboard classes now read required runtime config; Maven compile/runtime checks remain NOT_RUN. |

No Maven, browser, Docker, Cloud, or live model operation was run in this audit. No raw test was reclassified as a behaviorally valid pass.
