# Baseline Audit

## Baseline

- Fetched `origin/main`; at fetch time remote main and local main both resolved to `da6399536ff75a1edf4417819eb4d166cc1d781c`.
- The checkout was clean before this audit. Work is isolated on `task/final-remediation-audit`; existing worktrees and branches were left untouched.
- Read the v2.0 proposal, program contract, acceptance matrix, roadmap, status snapshot, and task handoff template in the required order.
- The ignored read-only BEWT source checkout is at `0501249ff3e9a5ea83a06155cd2971dc36197056`. Its working tree contains pre-existing Gradle/build artifacts and was not modified.
- The tracked extension has 40 registered Revision 2 Java artifacts, five per application. There are no `.feature` files under `extension/`; each candidate's Gherkin is embedded in a Java comment and duplicated in the dataset.

## Reconciled primary counts

| Evidence | Observed | Limitation |
|---|---:|---|
| Candidate registry | 40 unique IDs | Dataset claims are not proof of approval or correctness. |
| Revision 2 Java files | 40 | Every mapping fails semantic comparison; see traceability JSON. |
| Primary human-review records | 40 | All 40 have no assigned reviewer/signature and `PENDING_HUMAN_SIGNATURE`. |
| G3 run-record files | 84 | Per-run source commit, test hash, image digest, and runtime identity are absent. |
| G3 JUnit XML files | 85 | A file count does not prove correct oracle or identify tested source. |
| G3 cleanup records with `zeroResidualVerified=false` | 1 | Contradicts the blanket zero-residual statement for all runs. |
| Java source hashes matching dataset declaration | 39/40 | JO-GAP-004's declared hash differs from both the file and its registration record. |
| Semantic mappings matching Gherkin | 0/40 | 22 wrong behavior, 14 partial implementation, 4 weak oracle. |
| Cases eligible for `VALIDATED` | 0/40 | Human approval and semantic alignment are mandatory and missing. |

## Material source/status conflicts

- `docs/program/STATUS.json` and the v2 research report describe all four gates and D1–D8 as accepted. The primary review records, Java mappings, runtime manifests, and metric implementation do not meet those gates.
- `docs/program/STATUS.json` reports zero residual resources across 79 runs, but the raw BL-GAP-001 rerun-1 cleanup record says `zeroResidualVerified: false` (`docs/tasks/g3-evidence/bludit/BL-GAP-001/g3-blgap001-r1-20261110190053/cleanup-result.json:14`).
- The 12 November baseline snapshot found 79 invocations, 84 run-record files, and 85 JUnit XML files. The 13 November follow-up reconciles the current inventory to 87 records and 87 XML files while retaining 79 as the canonical sample; attempts 6–8 are described below.
- Follow-up inventory on 2026-11-13 added three supplementary preliminary Joomla attempts: current physical counts are 87 run records and 87 JUnit XML files, while the canonical consolidated sample remains 79 run IDs. Attempts 6–7 were blocked during fixture setup and fixture absence is not independently verified; attempt 8 setup failed after exact admin-table absence verification. All three stopped before the candidate oracle. See `docs/final-acceptance/G3-RAW-RUN-ACCOUNTING.md` for the reconciled classification.
- The status says JO-GAP-003 was flaky at 67%; the consolidated candidate record reports two passes in four attempts, a 50% failure rate.
- The T01-C usage record documents five failed `gemini-3.1-flash-lite` attempts, no response usage metadata, no generated candidate, and unknown actual cost. Status and metrics instead claim Gemini 3.8 generation and positive operational economics.
- Run manifests exist for G0 and G3, but run records do not bind the execution to the source commit, test-source SHA-256, image digest, and runtime manifest. ExpressCart's app config also lacks an `imageDigest` field.

## GitHub/worktree baseline

The checkout has numerous active task worktrees and branches. They were not edited. Relevant GitHub checks found T03 PRs #12, #19, and #26 merged, and T04 inventory/review preparation PRs #14, #16, #17, #18, #20, and #21 merged. PR #15 (T05-B) is open and draft; its source/evidence is not integrated into this baseline. No branch was pushed and no PR was opened during baseline collection.

## Reproduction

From repository root, inspect `docs/program/STATUS.json`, `docs/tasks/g0-evidence/all-apps-g0-summary.json`, `docs/tasks/g3-evidence/all-40-candidates-g3-consolidated-summary.json`, all `run-record.json` files below `docs/tasks/g3-evidence/`, all review JSONL files, and `docs/research-results/v2/replication/recompute-metrics.mjs`. The exact per-candidate paths and current hashes are in `40-CASE-TRACEABILITY.json`.
