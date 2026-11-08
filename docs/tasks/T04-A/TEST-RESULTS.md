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
| Secret scan and diff check | See `secret-scan.txt` and `diff-check.txt` after staged review | `secret-scan.txt`, `diff-check.txt` |
| SonarCloud on pushed review-fix commit | Pending until GitHub analyzes the new PR head; prior reviewed head `6e8033c` failed as detailed in `sonar-reviewed-findings.json` | `sonar-reviewed-findings.json`, updated after push |

The source integrity check reads the pinned blobs from the Git object database and compares the relevant working-tree paths with the pinned commit before generation. It does not modify or clean either source clone. No research gate was advanced.
