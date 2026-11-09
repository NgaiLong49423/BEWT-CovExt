# T03-A1 Offline Verification Results

**Base:** `origin/main` `bd9b3b15fca28419ada9862b8a65bac910edf169`
**Benchmark suite source:** `bewt-original/` Git commit `0501249ff3e9a5ea83a06155cd2971dc36197056` (read-only)
**Runtime:** `NOT_RUN` by design; these results establish offline source/test readiness only.

## Results

| Check | Result | Exit code | Evidence |
|---|---:|---:|---|
| `node --check` safety module and both offline test files | PASS (3 files) | 0 each | `evidence/offline-verification-20261110-r2/node-check-*.log` and `.exit-code.txt` |
| Offline G0 safety and Java-adapter regression tests | 8/8 PASS | 0 | `evidence/offline-verification-20261110-r2/offline-safety-suite.log` |
| Existing Kanboard and Bludit cleanup/fault regression tests | 23/23 PASS | 0 | `evidence/offline-verification-20261110-r2/existing-cleanup-fault-suite.log` |
| Existing Claroline cleanup/fault regression tests | 18/18 PASS | 0 | `evidence/offline-verification-20261110-r2/claroline-cleanup-fault-suite.log` |
| Joomla Maven `test-compile`, offline | PASS | 0 | `evidence/offline-compile-20261110-r3/joomla-maven-offline-test-compile.log` |
| MantisBT Maven `test-compile`, offline | PASS | 0 | `evidence/offline-compile-20261110-r3/mantisbt-maven-offline-test-compile.log` |
| MediaWiki Maven `test-compile`, offline | PASS | 0 | `evidence/offline-compile-20261110-r3/mediawiki-maven-offline-test-compile.log` |
| PrestaShop Maven `test-compile`, offline | PASS | 0 | `evidence/offline-compile-20261110-r3/prestashop-maven-offline-test-compile.log` |
| `git diff --check` | PASS | 0 | Recorded in task report/check log |

The four copied benchmark suites contain respectively 71, 60, 47, and 73 provenance-recorded files. The original suites at the pinned source commit were clean for each suite path. Adapted files are individually listed in `evidence/offline-verification-20261110-r2/baseline-source-provenance.json`; adapters and whitespace normalization are not represented as unchanged upstream source.

## Not tested

No Docker Engine, container, image pull/build, network route, HTTP/MySQL readiness, Selenium browser test, database seed/reset, cleanup execution, or app runtime was invoked. No G0 runtime PASS or acceptance is claimed. The offline `g0-plan.json` profiles explicitly keep runtime pending and image promotion disabled.

Exact commands, exit codes, test totals and log SHA-256 values are in `evidence/offline-verification-20261110-r2/verification-summary.json`; source/test SHA-256 and Git blobs are in `source-test-hashes.json`; Maven commands/results are in `evidence/offline-compile-20261110-r3/compile-summary.json`. Evidence r1 is retained locally and is not used as the result for the normalized tested source.
