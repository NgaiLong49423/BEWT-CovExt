# T04-B Test Results

## Focused deterministic review dataset

Command: `node docs/tasks/T04-B/tools/build-review-dataset.mjs` followed by `node --test docs/tasks/T04-B/test/review-dataset.test.mjs`.

The builder reads accepted T04-A data and emits five shortlisted candidates with all 150 candidate/baseline pairs. The test validates candidate selection, pair uniqueness/cardinality, source pin and hash shape, pending human decisions, PROPOSED state, G1 not verified, KB-004 boundary wording, and accepted KB-023/026 observed interpretations.

Initial run: 4/5 passed; one test expectation used incorrect wording. Corrected the expectation to assert the contract value `INSUFFICIENT_EVIDENCE`. Final result and regeneration checks are stored in `evidence/verification/`.

## Provenance checks

T04-A generator was run against detached clones at the pinned BEWT and Kanboard commits. All three generated outputs matched accepted inventory/provenance/mapping byte-for-byte. The T04-A source-integrity tests passed 16/16 against the pinned source clone, including dirty tracked source, wrong pin/hash, symlink, and oracle-preservation cases. See `evidence/provenance/`.

No Gemini, Docker, Selenium, browser, or application experiment was run. G0/G1 and live fixture/oracle behavior are not established by these checks.
