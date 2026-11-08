# Installation Results

The original `tests.Installer` was run against the task-pinned Bludit image in both independent runs. It completed one JUnit test per run with Maven exit code 0, zero failures, zero errors, and zero skipped tests. The Installer has no business assertion; G0 relies on the separate `AddContentTest` result for proof that administrator login and content creation work.

| Run | Installer result | Evidence |
|---|---|---|
| A — `t03b1-a-20261108-r4` | PASS, exit 0, 1/0/0/0 | [Maven log](evidence/t03b1-a-20261108-r4/maven-installer.log), [sanitized XML](evidence/t03b1-a-20261108-r4/surefire-raw/TEST-tests.Installer.sanitized.xml), [command/exit metadata](evidence/t03b1-a-20261108-r4/maven-command-results.json) |
| B — `t03b1-b-20261108-r1` | PASS, exit 0, 1/0/0/0 | [Maven log](evidence/t03b1-b-20261108-r1/maven-installer.log), [sanitized XML](evidence/t03b1-b-20261108-r1/surefire-raw/TEST-tests.Installer.sanitized.xml), [command/exit metadata](evidence/t03b1-b-20261108-r1/maven-command-results.json) |

Counts are tests/failures/errors/skipped. Original Surefire XML hashes and sanitization metadata are recorded per run. The random test password existed only in the PowerShell process environment and was not written to logs or artifacts.
