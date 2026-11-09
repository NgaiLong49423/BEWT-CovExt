# T04-C Test Results

## Fresh offline verification

| Check | Result | Evidence |
|---|---:|---|
| T04-C evidence/run/index and decision-integrity tests | 8 passed, 0 failed, 0 skipped | `evidence/verification/t04c-g0-audit-tests.txt` |
| T04-B candidate/decision regression suite | 12 passed, 0 failed, 0 skipped | `evidence/verification/t04b-review-regression-tests.txt` |
| T04-A source/oracle regression | 15 passed, 0 failed, 1 skipped | `evidence/verification/t04a-source-oracle-regression-tests.txt` |
| T03-A cleanup fault-injection regression | 9 passed, 0 failed, 0 skipped | vidence/verification/t03a-cleanup-fault-injection-tests.txt |
| Node syntax check for T04-C test | PASS | `evidence/verification/node-syntax-check.txt` |
| T04-C JSON parse | PASS | `evidence/verification/json-parse.txt` |
| T04-B input and empty-ledger post-check | PASS | `evidence/verification/t04b-inputs-postcheck.txt` |

The skipped T04-A source-to-output comparison requires `BEWT_T04A_SOURCE_ROOT` to point to a fresh pinned source clone. No clone was created and no source experiment was run for this task.

## T04-B regeneration observation

The full existing T04-B test command was run and reported **12/12 PASS**. Its last test invokes the dataset builder. In this Windows CRLF checkout, the builder rewrote two source-pin hashes in `t04b-review-dataset.json` using worktree bytes, and marked the five review packets as working-tree changes. This surfaced a line-ending-sensitive regeneration behavior. I restored only those generated T04-B working-tree changes to the exact pre-test committed files; the post-check confirms the dataset LF-normalized SHA is back to `f43b1f72378e41b8622304be927e5088e3b01359b24676a4331e72e99c1b3b37`, the decision ledger remains zero bytes, and T04-B files have no diff. Details are in `evidence/verification/t04b-regeneration-side-effect.json`.

The saved T04-B verification log is the full 12/12 pass. No synthetic decision was appended to the official ledger. The T04-B builder was not changed in this task; future deterministic-regeneration verification should use a consistent Git-blob/line-ending source representation.

## Boundaries

All verification is offline and reads preserved files or uses test-only temp fixtures. No Docker, Maven, Selenium, Gemini, browser or application runtime was run. The mismatch between historic Surefire recorded hashes and saved XML is intentionally asserted as `BLOCKED_EVIDENCE`; it is not converted to PASS by the tests.
