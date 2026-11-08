# Maven Run Metadata — Original T03-A Run A/B

The original Run A/B Maven console logs and sanitized Surefire XML remain in the checkout. No Maven Selenium rerun was performed for these review corrections, and the original JUnit XML files and saved hashes were left unchanged.

| Run | Reproducible command reconstruction | Process exit result | Preserved console output | JUnit evidence |
|---|---|---|---|---|
| A — `t03a-a-20261108-r2` | `mvn.cmd -Dtest=tests.AddNewProject -Dapp.url=http://127.0.0.1:57580 test` | Exit code `0` recorded in [reset-comparison.json](evidence/reset-comparison.json); preserved Maven log ends with `BUILD SUCCESS` | [maven.log](evidence/t03a-a-20261108-r2/maven.log) | [Surefire XML](evidence/t03a-a-20261108-r2/surefire-raw-sanitized.xml), [summary](evidence/t03a-a-20261108-r2/surefire-summary.txt) |
| B — `t03a-b-20261108-r2` | `mvn.cmd -Dtest=tests.AddNewProject -Dapp.url=http://127.0.0.1:62535 test` | Exit code `0` recorded in [reset-comparison.json](evidence/reset-comparison.json); preserved Maven log ends with `BUILD SUCCESS` | [maven.log](evidence/t03a-b-20261108-r2/maven.log) | [Surefire XML](evidence/t03a-b-20261108-r2/surefire-raw-sanitized.xml), [summary](evidence/t03a-b-20261108-r2/surefire-summary.txt) |

The command is a reproducible reconstruction from the retained run URL, the narrow `tests.AddNewProject` selection and the runner's `seleniumTestArguments()` contract. The exact original shell command line and Maven flags were not recorded, so the command above is not claimed as a verbatim command transcript. Each `maven.log` preserves the combined Maven console stream; stdout and stderr were not stored separately. The process exit code comes from the contemporaneous run comparison record, corroborated by the preserved Maven `BUILD SUCCESS` output, not inferred from JUnit XML alone. Surefire XML retains the Selenium CDP warning in its `system-err` section.

The logs are original execution artifacts, not regenerated output. Local checkout paths were sanitized before the initial T03-A commit; pre-sanitization log originals are not available in the checkout.
