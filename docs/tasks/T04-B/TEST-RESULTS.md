# T04-B Test Results

## Focused deterministic review dataset

Command: `node docs/tasks/T04-B/tools/build-review-dataset.mjs` followed by `node --test docs/tasks/T04-B/test/review-dataset.test.mjs`.

The builder reads accepted T04-A data and emits five shortlisted candidates with all 150 candidate/baseline pairs. Rule-based screening flags eight pairs; the other 142 are labeled `NO_DIRECT_OVERLAP_FLAGGED` and remain pending independent semantic review. Tests validate counts/labels, evidence on all flagged pairs, no novelty inference for unflagged pairs, exact shortlist membership, source pins/hash/links, reviewer-decision schema behavior, candidate hash mismatch rejection, append-only history and stale-version detection. The official decision ledger remains empty across regeneration. Latest focused test count is recorded in `evidence/verification/review-dataset-tests.txt`.

The human-decision contract is enforced by `docs/tasks/T04-B/tools/human-review-decisions.mjs` and tested with test-only payloads in temporary files; no synthetic test payload is written into the official ledger. The runtime validator checks candidate/dataset hashes, full-format commit reference, evidence links, sequence and hash chain. It does not independently prove commit existence/content; the full SHA and content hashes are recorded for manual Git-history verification. Latest focused tests: **12 passed, 0 failed, 0 skipped**; T04-A source/oracle regressions: **16 passed, 0 failed, 0 skipped**. Fresh command output is stored under `evidence/review-fixes/`.

## Provenance checks

T04-A generator was run against detached clones at the pinned BEWT and Kanboard commits. All three generated outputs matched accepted inventory/provenance/mapping byte-for-byte. The T04-A source-integrity tests passed 16/16 against the pinned source clone, including dirty tracked source, wrong pin/hash, symlink, and oracle-preservation cases. See `evidence/provenance/`.

No Gemini, Docker, Selenium, browser, or application experiment was run. G0/G1 and live fixture/oracle behavior are not established by these checks.
