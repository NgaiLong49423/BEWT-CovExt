# T04-E — Test results

| Command/check | Exit | Outcome |
|---|---:|---|
| `node docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs` | 0 | PASS — the corrected CLI loads and validates the seven bundles; prints a PASS marker |
| `node --test docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs` | 0 | PASS — 12 tests, 0 failed, including subprocess checks that valid fixture data prints PASS and invalid fixture data exits nonzero |
| Exact pinned GitHub source API verification | 0 | PASS — 7/7 commit-to-tree relations and 36/36 file blob IDs/permalinks matched `source-reference-index.json` |
| `git diff --check` | 0 | PASS — correction diff whitespace check |
| T04-D read-only cross-check | 0 | PASS — six JSON inputs/app parsed; counts match `COVERAGE-GAPS-AND-PRIORITY.md` and count matrix |
| Pinned source retrieval | N/A | PASS — source commit metadata, tree SHA and cited Git blob SHAs retrieved at exact refs |
| Secret/scope scan | 1 (rg no matches) | PASS — no known token/access-key patterns; changed paths limited to new T04-E docs and seven app data files | `evidence/verification/scope-and-secret-review.txt`
| App runtime/E2E | N/A | NOT_RUN — T04-E static scope |

The validator checks Git object ID format and index-to-candidate consistency; it does not access GitHub or independently recompute upstream object hashes. The separate pinned GitHub API check retrieved the exact seven source commits/trees and all 36 indexed source file refs; the returned tree IDs, blob IDs and immutable URLs matched. These Git blob SHA-1 object IDs are not locally recomputed SHA-256 checksums. Claroline archive SHA-256 is referenced from T03-B2 and was not recomputed here. No Docker, Gemini, Selenium, reset or live app test ran. The previous 8-test PASS belongs to the initial PR head; it is superseded by the current 12-test run.

Exact Node/Windows versions, command output, exit codes, source API comparison methodology and hashes for the test/evidence files are in `evidence/verification/correction-run.md`.

T04-D read-only counts: Bludit 23/23/0/23/23; Claroline 40/40/40/40/40; ExpressCart 31/31/31/31/31; Joomla 35/35/35/35/35; MantisBT 37/38/38/37/37; MediaWiki 27/27/27/27/27; PrestaShop 35/33/33/35/33 (proposal labels/features/scenarios/TestSuite entries/structural matches).
