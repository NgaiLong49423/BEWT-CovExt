# T04-A Test Results

All checks were static inventory/data checks; no application runtime was executed.

| Check | Result |
|---|---|
| Generator TypeScript/Node syntax | PASS |
| Utility unit tests | PASS, 7/7 |
| Pinned BEWT commit, tree and upstream commit checks | PASS |
| Baseline mapping and suite consistency | PASS, 30/30 |
| T03-A working-copy SHA parity | PASS, 30/30 Java tests and 27/27 Page Objects |
| Dataset JSON parse/schema assertions | PASS |
| Deterministic regeneration | PASS, byte-identical output |
| Secret scan of public T04-A dataset/docs | PASS, no raw fixture passwords/emails |
| `git diff --check` | PASS |
| Docker, Selenium, browser, Gemini | NOT_RUN by scope |
| Runtime oracle/fixture/reset feasibility | NOT_VERIFIED |
| Human novelty and research acceptance | NOT_EVALUATED |

The 7 utility tests cover exact pins/tree, realpath traversal/symlink rejection, claimed SHA rejection, actual repository HEAD checks, 30-case/provenance assertions, candidate uniqueness/required fields/no self-approval, and credential/email redaction.
