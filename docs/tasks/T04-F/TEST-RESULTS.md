# T04-F — Verification results

| Exact command/check | Exit code | Result | Scope / evidence |
|---|---:|---|---|
| `node docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs` | 0 | PASS | Seven proposal bundles, source refs/ranges, oracle links, counts, duplicates, novelty state and shortlist invariants; `evidence/verification/t04f-g1-20261110-r4/t04e-validator.log` |
| `node --test docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs` | 0 | PASS, 14/14 tests | `evidence/verification/t04f-g1-20261110-r4/t04e-tests.log` |
| `node docs/tasks/T04-D/tools/verify-inventory.mjs` | 0 | PASS | Seven-app baseline counts: 227 features, 204 Scenario headers, 228 suite entries, 226 structural mappings; 1 feature-only, 2 suite-only. `evidence/verification/t04f-g1-20261110-r4/t04d-inventory.log` |
| `node docs/tasks/T04-F/tools/verify-review-package.mjs` | 0 | PASS | Seven packets, 20 exact shortlist candidates, source/baseline links, draft Gherkin/oracles and no preselected human decisions; `evidence/verification/t04f-g1-20261110-r4/t04f-packet-integrity.log` |
| `node --check docs/tasks/T04-F/tools/verify-review-package.mjs` | 0 | PASS | `evidence/verification/t04f-g1-20261110-r4/t04f-syntax.log` |
| `git diff --cached --check` | 0 | PASS | Whitespace check after staging only `docs/tasks/T04-F/` |
| Secret pattern scan, T04-F only | 0 (no matches; `rg` no-match exit 1 normalized to PASS) | PASS | `evidence/verification/t04f-g1-20261110-r4/secret-scan.txt` |

All T04-F documents and helper are new in a dirty worktree based on `bd9b3b15fca28419ada9862b8a65bac910edf169`. Existing T04-D/T04-E source data and helper/test files were read from that base. This is offline/static evidence; it establishes neither live app behavior nor human acceptance. Existing T04-E evidence records its separate pinned-source API verification (7/7 commit/tree and 36/36 file blob/permalink checks); this task did not repeat those network retrievals.
