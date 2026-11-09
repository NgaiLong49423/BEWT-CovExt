# T04-F Independent Review Correction — Test Results

## Tested content commit

- Branch: `feature/t04f-seven-app-novelty-oracle-review`
- Code/data/validator commit under test: `b14a1ac8ae340f23aed636b95d4e2ea94407c79e`
- Base: `bd9b3b15fca28419ada9862b8a65bac910edf169`
- Runtime: Windows PowerShell; Python `3.12.10`; standard library only.
- At test time, existing PR #17 was OPEN and its prior head was `1cabaa145393370509a9d9f0bc5899dbf4257946`; correction commit `b14a1ac...` was then published to that PR branch. Final live PR head is verified after push and reported in the final handoff. This log-only follow-up does not modify the tested packet, evidence-index, or validator files.

## Commands and outcomes

| Command | Exit code | Result |
|---|---:|---|
| `python --version` | 0 | `Python 3.12.10` |
| `python docs/tasks/T04-F/tools/validate_t04f.py` | 0 | PASS: 27 records; 20 shortlisted; 46 candidate-baseline links; 35 distinct baseline cases; 19 separately screened nearby-case links. 14/14 negative tests passed. Secret scan PASS with 0 findings. Scope check PASS against merge-base `bd9b3b15fca28419ada9862b8a65bac910edf169`; 9 changed paths, 0 out of scope. |
| `git diff --check` | 0 | PASS; stdout/stderr empty. |

Validator stdout (stderr empty):

```text
records=27; shortlist=20; baseline_links=46; distinct_cases=35; screened_nearby_links=19
negative_tests=14; passed=14; failed=0
secret_scan=PASS; findings=0
scope_merge_base=bd9b3b15fca28419ada9862b8a65bac910edf169; changed_paths=9; out_of_scope=0
pinned content verification: claroline-08-addcourseexercisetest, claroline-10-addcourseexercisequestionstest, expresscart-15-usediscountcodeamounttest, expresscart-16-usediscountcodepercenttest; other indexed line contents remain NOT_VERIFIED by this validator
PASS
```

Negative mutation cases: candidate ID, original status, missing candidate-baseline link, incorrect candidate-baseline link, baseline pin, baseline blob SHA, source pin/blob SHA, incorrect source pin, permalink/line anchor, human status escalation, shortlist membership, shortlist priority, generic reviewer questions, and nearby evidence link. Each mutation was required to produce a validation error; all 14 did.

## Evidence limits

The four listed Gherkin/Java cases were fetched and read at the pinned baseline commit; safe paraphrases and inspected lines are recorded in `SOURCE-AND-BASELINE-EVIDENCE-INDEX.json`. The validator verifies all indexed paths, blob SHAs, pins, line references and permalink structure against T04-D/T04-E pinned indexes. It does not refetch remote file bodies; line content for other indexed cases is explicitly `NOT_VERIFIED` by this validator. Runtime, Docker, Selenium/E2E, Gemini and RQ2 were not run.

This results file is a report-only follow-up to the tested code/data commit. The final PR head after the report-only push is verified in the task handoff; no tested data or validator changes are included in this follow-up.
