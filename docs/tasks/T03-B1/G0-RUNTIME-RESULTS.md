# G0 Runtime Results

Two independent fresh starts completed against the same immutable application image digest and browser image digest. Each run used new application and browser containers, a unique labeled network, dynamic loopback ports, and a new writable container layer.

| Run | Install | Base business test | Sentinel before → after | Teardown |
|---|---|---|---|---|
| A — `t03b1-a-20261108-r4` | PASS, 1 test | `tests.AddContentTest` PASS, 1 test | absent → present | PASS |
| B — `t03b1-b-20261108-r1` | PASS, 1 test | `tests.AddContentTest` PASS, 1 test | absent → present | PASS |

For both runs, Maven exit codes were 0 and JUnit counts were tests=1, failures=0, errors=0, skipped=0 for each selected class. The business test logged in using the Installer credential, created the original `Test Content` sentinel, and passed its unchanged title assertion. The homepage response hash and sentinel state are in [Run A](evidence/t03b1-a-20261108-r4/sentinel-state-before-test.json) and [Run B](evidence/t03b1-b-20261108-r1/sentinel-state-before-test.json), with corresponding after-test state files.

Run A's first wrapper exit reported `RUN_BLOCKED` because Surefire wrote XML under `target/surefire-reports` rather than the configured evidence path. The original logs show both Maven runs succeeded; the same-run XML was recovered, its test counts matched those logs, its original hashes were recorded, and sanitized copies are linked above. The correction is documented in [Run A evidence classification](evidence/t03b1-a-20261108-r4/evidence-classification-correction.json). No test outcome was regenerated or changed.

These results propose Bludit G0 `READY_FOR_REVIEW`; they do not mark G0 `ACCEPTED` or any candidate `VALIDATED`. G1–G4 were not run.
