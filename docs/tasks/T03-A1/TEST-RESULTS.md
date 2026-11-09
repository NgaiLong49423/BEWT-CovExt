# T03-A1 Offline Verification Results

**Code tested:** commit `35452b416c86a3688b5cb63f804ea58282cd87c4`

**Branch base:** `bd9b3b15fca28419ada9862b8a65bac910edf169`; latest fetched `origin/main` is `0cba0eaf0fa416e90a5ac766bc604ee71d43818e` (5 commits ahead on disjoint T04-F paths)
**Benchmark suite source:** `bewt-original/` Git commit `0501249ff3e9a5ea83a06155cd2971dc36197056` (read-only)
**Runtime:** `NOT_RUN` by design; these results establish offline source/test readiness only.

## Results

| Check | Result | Exit code | Evidence |
|---|---:|---:|---|
| `node --check` safety module and both offline test files | PASS (3 files) | 0 each | `evidence/offline-verification-20261110-r6/node-check-*.stdout.txt`, `.stderr.txt`, and `.exit-code.txt` |
| Offline G0 safety and Java-adapter regression tests | 9/9 PASS | 0 | `evidence/offline-verification-20261110-r6/offline-safety-suite.stdout.txt` |
| Existing Kanboard and Bludit cleanup/fault regression tests | 23/23 PASS | 0 | `evidence/offline-verification-20261110-r6/existing-cleanup-fault-suite.stdout.txt` |
| Combined Node regression total | 32/32 PASS | 0 | `evidence/offline-verification-20261110-r6/verification-summary.json` |
| Joomla Maven `test-compile`, offline | BUILD SUCCESS | 0 | `evidence/offline-compile-20261110-r7/joomla.stdout.txt` and `joomla.stderr.txt` |
| MantisBT Maven `test-compile`, offline | BUILD SUCCESS | 0 | `evidence/offline-compile-20261110-r7/mantisbt.stdout.txt` and `mantisbt.stderr.txt` |
| MediaWiki Maven `test-compile`, offline | BUILD SUCCESS | 0 | `evidence/offline-compile-20261110-r7/mediawiki.stdout.txt` and `mediawiki.stderr.txt` |
| PrestaShop Maven `test-compile`, offline | BUILD SUCCESS | 0 | `evidence/offline-compile-20261110-r7/prestashop.stdout.txt` and `prestashop.stderr.txt` |
| Supplemental Claroline cleanup/fault suite | BLOCKED during module load; Node exit 1, 0 test cases executed | 1 | `Docker CLI was not found in a supported Docker Desktop installation path`; sandbox LOCALAPPDATA did not expose its supported install path. No Docker command was invoked. This supplemental suite is not counted as PASS. |
| `git diff --check`, staged-path/secret review, `.txt` log ignore check | PASS | 0 | `evidence/offline-verification-20261110-r6/review-checks.json` |

The four copied benchmark suites contain respectively 71, 60, 47, and 73 provenance-recorded files. The original suites at the pinned source commit were clean for each suite path. Adapted files are individually listed in `evidence/offline-verification-20261110-r2/baseline-source-provenance.json`; adapters and whitespace normalization are not represented as unchanged upstream source. Maven stdout reports `BUILD SUCCESS` for all four; each stderr log also contains `Access is denied.` despite exit code 0. This stderr message remains disclosed and unexplained.

The r6 summary records `sourceTreeCleanAtStart: true`, `worktreeCleanAtStart: false` because earlier untracked evidence directories were preserved, and source/test hashes plus Git blob IDs for 253 files. All 253 blobs match the tested source commit. The r6/r7 logs use `.txt` extensions; all 27 `.txt` artifacts passed `git check-ignore` as non-ignored and are included in this PR. Their SHA-256 manifests record both the raw stream hash and committed hash; only trailing horizontal whitespace was removed from committed copies.

## F02 regression coverage

- Missing `network.Containers` blocks both the pre-start isolation check and cleanup inventory inspection.
- Full container validation requires the exact expected `PortBindings` key set, required binding values, and explicit null entries for unbound ports. Missing, null, extra, or mismatched required bindings block.
- Partial-start cleanup is an explicit opt-in for exact run-owned stopped containers; it tolerates omitted runtime port mappings only for cleanup. The plan labels cleanup eligibility separately and always reports `networkIsolationVerified: false` and `portForwardingVerified: false`.

## Not tested

No Docker Engine, container, image pull/build, network route, HTTP/MySQL readiness, Selenium browser test, database seed/reset, cleanup execution, or app runtime was invoked. The supplemental Claroline cleanup suite could not load in this sandbox because its module import requires locating a signature-verified Docker CLI; this was a path-resolution block before any Docker command. No G0 runtime PASS or acceptance is claimed. The offline `g0-plan.json` profiles explicitly keep runtime pending and image promotion disabled.

Exact commands, separate stdout/stderr paths, exit codes, test totals, raw/sanitized log SHA-256 values are in `evidence/offline-verification-20261110-r6/verification-summary.json`; source/test SHA-256 and commit blob IDs are in `source-test-hashes.json`; Maven command/results are in `evidence/offline-compile-20261110-r7/compile-summary.json`. Earlier r1-r3 evidence has not been rewritten.
