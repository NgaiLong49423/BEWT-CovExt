# T04-B Test Results

## Focused deterministic review dataset

Command: `node docs/tasks/T04-B/tools/build-review-dataset.mjs` followed by `node --test docs/tasks/T04-B/test/review-dataset.test.mjs`.

The builder reads accepted T04-A data and emits five shortlisted candidates with all 150 candidate/baseline pairs. The test validates exact shortlist membership, pair uniqueness/cardinality, source commit/path/hash/permalink consistency, candidate hashes, all rubric and review fields, risk/oracle/fixture data, pending human decisions, all named qualification stages, PROPOSED state, G1 not verified, KB-004 boundary wording, and accepted KB-023/026 observed interpretations. Result: **6 passed, 0 failed, 0 skipped**. Dataset regeneration is byte-identical; see `evidence/verification/review-dataset-determinism.txt`.

An earlier test iteration had a shortlist field-name assumption; it was corrected to use the accepted schema's `candidateId` before final verification. A later compile-time schema parse issue was also fixed before final JSON and test verification. Superseded iteration output is not treated as final evidence.

## Provenance checks

T04-A generator was run against detached clones at the pinned BEWT and Kanboard commits. All three generated outputs matched accepted inventory/provenance/mapping byte-for-byte. The T04-A source-integrity tests passed 16/16 against the pinned source clone, including dirty tracked source, wrong pin/hash, symlink, and oracle-preservation cases. See `evidence/provenance/`.

No Gemini, Docker, Selenium, browser, or application experiment was run. G0/G1 and live fixture/oracle behavior are not established by these checks.
