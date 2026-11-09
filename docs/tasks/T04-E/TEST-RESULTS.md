# T04-E — Test results

| Command/check | Exit | Outcome |
|---|---:|---|
| `node docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs` | 0 | PASS — seven bundles, source pins/references, required candidate fields, duplicate IDs/titles, novelty and shortlist consistency |
| `node --test docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs` | 0 | PASS — 8 tests, 0 failed: valid data and negative cases for mixed pins, duplicate IDs, invalid source hash/reference, false novelty, missing fields and shortlist over 5 |
| T04-D read-only cross-check | 0 | PASS — six JSON inputs/app parsed; counts match `COVERAGE-GAPS-AND-PRIORITY.md` and count matrix |
| Pinned source retrieval | N/A | PASS — source commit metadata, tree SHA and cited Git blob SHAs retrieved at exact refs |
| Secret/scope scan | 1 (rg no matches) | PASS — no known token/access-key patterns; changed paths limited to new T04-E docs and seven app data files | `evidence/verification/scope-and-secret-review.txt`
| App runtime/E2E | N/A | NOT_RUN — T04-E static scope |

The validator checks hash format and index-to-candidate consistency; it does not independently download and recompute source file hashes. Source checksums are Git blob SHA identifiers from the pinned tree. Claroline archive SHA-256 is referenced from T03-B2 and was not recomputed here. No Docker, Gemini, Selenium, reset or live app test ran.

T04-D read-only counts: Bludit 23/23/0/23/23; Claroline 40/40/40/40/40; ExpressCart 31/31/31/31/31; Joomla 35/35/35/35/35; MantisBT 37/38/38/37/37; MediaWiki 27/27/27/27/27; PrestaShop 35/33/33/35/33 (proposal labels/features/scenarios/TestSuite entries/structural matches).
