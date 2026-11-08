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


