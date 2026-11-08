# Test Results

| Verification | Result | Evidence |
|---|---|---|
| `mvn -B -f experiments/bludit/bewt-suite/pom.xml clean test-compile` | PASS, exit 0; compiled 17 production and 26 test source files | [Maven output](evidence/verification/maven-clean-test-compile.log) |
| Bludit manifest/parser and helper/fault-injection tests | PASS, 8 tests | [Node output](evidence/verification/node-bludit-and-cleanup-tests.txt) |
| Active T02 runtime/draft isolation tests | PASS, 3 tests; multiple runtime manifests accepted, draft and duplicate app IDs rejected | [Node output](evidence/verification/active-t02-isolation-tests.txt) |
| Node syntax checks | PASS for Bludit, cleanup, and CLI helper modules | [Summary](evidence/verification/node-verification-summary.json) |
| Run A Installer + business test | PASS, each one test; Maven exit 0 for both | [Run A XML and logs](evidence/t03b1-a-20261108-r4/) |
| Run B Installer + business test | PASS, each one test; Maven exit 0 for both | [Run B XML and logs](evidence/t03b1-b-20261108-r1/) |

The suite only selected the original `tests.Installer` and `tests.AddContentTest`. No AI-generated tests or G1–G4 work was performed. See [manifest](../../../config/apps/bludit.json) and [runtime results](G0-RUNTIME-RESULTS.md).



## Final review correction verification

| Check | Result | Evidence |
|---|---|---|
| Bludit cleanup and manifest suite, including network/app/Selenium partial-startup fault injection | PASS, 17/17, exit 0 | [Node output](evidence/final-review-fixes-20261109/node-tests-final-after-fixture-fix.txt) |
| Active T02 isolation | PASS, 3/3, exit 0 | [Node output](evidence/final-review-fixes-20261109/active-t02-isolation-after-corrections.txt) |
| Maven clean test-compile | PASS, exit 0 | [Maven output](evidence/final-review-fixes-20261109/maven-clean-test-compile-final.log) |
| Current runner Run C r3 | PASS, runner exit 0; both classes each 1/1; boolean sentinel false→true; cleanup PASS | [Run C verification](evidence/t03b1-c-20261109-r3/run-c-verification.json) |
| Initial Run C r1 attempt | BLOCKED in XML hash/sanitization; Installer itself 1/1 PASS and cleanup PASS | [Failure analysis](evidence/final-review-fixes-20261109/run-c-r1-failure-analysis.json) |

Run A/B historical JUnit, Maven and reset evidence was preserved.