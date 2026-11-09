# T04-A Review-Fix Test Results

All checks are static source, inventory, integrity, or utility tests. No application runtime, Docker, browser, Selenium, Gemini, or T04-B execution was run.

| Check | Result | Evidence |
|---|---|---|
| Generator and test Node syntax | PASS | `generator-syntax-check.txt`, `test-syntax-check.txt` |
| Focused utility/regression suite | PASS, 16/16; 0 failed, 0 skipped | `unit-tests.txt` |
| Source-oracle preservation | PASS for KB-021, KB-022, KB-023, KB-025; Gherkin lines and Java assertions match pinned Git blobs | `oracle-preservation-comparison.json` |
| Dirty tracked input rejection | PASS; altered test fixture remained altered and was not cleaned | `unit-tests.txt` |
| Wrong/missing pin rejection | PASS | `unit-tests.txt` |
| Symlink path rejection | PASS (safeJoin and pinned input) | `unit-tests.txt` |
| Pinned content integrity | PASS, 89 BEWT + 24 upstream inputs; each has Git blob SHA and original-byte SHA-256 | `source-integrity-summary.json`, `source-hash-index.json` |
| Baseline mapping and taxonomy | PASS, 30/30 cases; 6 groups; exact one-to-one class mapping | `dataset-consistency-redaction.json` |
| Candidate invariants | PASS, 10/10 remain PROPOSED; shortlist count 5; decisions pending | `dataset-consistency-redaction.json` |
| Redaction and assertion syntax | PASS; password/email form fixtures use safe placeholders; public oracle text preserved; Java assertion calls retain quotes and invocation structure | `dataset-consistency-redaction.json`, `oracle-preservation-comparison.json` |
| KB-023 / KB-026 interpretation | PASS; raw titles preserved and actual behavior separately described; taxonomy unchanged | `dataset-consistency-redaction.json` |
| Regeneration determinism | PASS; three outputs byte-identical across independent generations | `determinism.txt`, `regeneration-hashes.json` |
| JSON consistency | PASS; inventory, provenance, taxonomy, candidate, shortlist and proposed-status JSON parsed and asserted | `dataset-consistency-redaction.json` |
| UTF-8 / blocker history | PASS; strict UTF-8 and zero replacement characters in review packets and resolved-blocker evidence | `encoding-check.txt` |
| Secret scan and staged diff check | PASS; 35 paths within scope, no credential patterns, `git diff --cached --check` clean | `secret-scan.txt`, `staged-review.txt`, `diff-check.txt` |
| SonarCloud review-fix commit `0940e3c` | Quality Gate PASS, check run `128883189861`; 0 new/accepted issues, 0 hotspots, 0 annotations, 0.0% new-code coverage and 0.0% duplication reported | `sonar-reviewed-findings.json` |

## Final main integration verification

Run-specific logs are in [`evidence/main-integration-20261109-24d6ce3/`](evidence/main-integration-20261109-24d6ce3/). `origin/main` SHA `464d9e2fb5d1a3705d1d7d6f4dc9a2782bde4a1d` is integrated by normal merge commit `24d6ce3a20d0df1eafd3020a6492cd3cb207731a`; no conflicts occurred.

| Check | Result | Evidence |
|---|---|---|
| T04-A coverage inventory focused suite | PASS, 15 passed, 0 failed, 1 skipped; source-to-output comparison is skipped when `BEWT_T04A_SOURCE_ROOT` is absent. Initial sandbox attempt was blocked by Windows symlink/temp Git permissions; elevated rerun passed all runnable cases. | `t04a-coverage-inventory-tests.txt`, `t04a-coverage-inventory-tests-elevated.txt` |
| Kanboard helper and cleanup regressions | PASS, 20/20 | `kanboard-helper-tests.txt` |
| T03-B1 Bludit/cleanup regressions | PASS, 17/17 | `t03b1-bludit-tests.txt` |
| T02 manifest isolation regressions | PASS, 3/3 | `t02-manifest-isolation-tests.txt` |
| Node syntax | PASS, 6 files | `node-syntax.txt` |
| Bludit Maven `test-compile` | PASS, exit 0 | `bludit-maven-test-compile.txt` |
| JSON and dataset consistency | PASS; STATUS, inventory, taxonomy, candidate JSON and Bludit manifest parse; 30 cases, 6 groups, 10 proposals verified | `json-status-consistency.txt` |

The source-comparison test requires a fresh pinned BEWT clone and was not run in this integration workspace; the previously committed 113-file Git-object/hash verification and byte-identical regeneration evidence were preserved without modification. No Docker, Selenium, Gemini, or app runtime was invoked. SonarCloud is checked on the pushed final PR head and linked in the PR check run; this local report does not treat source-level tests as gate acceptance.

The source integrity check reads the pinned blobs from the Git object database and compares the relevant working-tree paths with the pinned commit before generation. It does not modify or clean either source clone. No research gate was advanced.
