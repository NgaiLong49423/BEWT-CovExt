# Baseline adaptation

The isolated Java suite was copied from BEWT commit `0501249ff3e9a5ea83a06155cd2971dc36197056`, subtree `claroline/baseline/claroline-1.11.10` (75 files). The working copy is `experiments/claroline/bewt-suite`.

Only `src/test/java/test/BaseTest.java` was adapted for the external environment: it reads `app.url` and `webdriver.remote.url` from required JVM properties, creates a RemoteWebDriver, and configures headless Chrome without the original machine-specific Chrome path/version. Its adapted SHA-256 is `5C3C0BF63A5C94B364F99D93CBCF1FEC727BD2BA5BA116A64FEAB60DE9D5EE80`; the comparison recorded during source extraction was original `2587E17339CC6276FA5ECCAE427663D02879DDB0D9F6B97CBC046D8F39763D41`. No business test, Page Object, or oracle was changed.

Smoke target is the original package/class `test.Claroline_AddUserTest`. Its original assertion text remains `The new user has been sucessfully created`. Fixture credentials in that upstream baseline are test-only and must not appear in public logs; the runner sanitizes fixture values, local paths, Maven logs, and Surefire XML properties/console output.

`mvn -B clean test-compile` completed with exit code 0 (22 main and 42 test sources compiled). Runtime Selenium execution has not occurred; compile success is not a runtime test result.
