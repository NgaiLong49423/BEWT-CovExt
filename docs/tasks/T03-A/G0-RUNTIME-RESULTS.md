# G0 Runtime Results

**Runtime outcome: PASS for two independent Kanboard smoke executions; proposed G0 state: `G0_READY_FOR_REVIEW`.** This evidence is for Kanboard only. It is not Team Lead acceptance and does not update a program-wide gate.

| Run | Unique run ID | Clean start | App readiness | `tests.AddNewProject` / Surefire | Result |
|---|---|---|---|---|---|
| A | `t03a-a-20261108-r2` | Fresh labeled database, plugin and SSL volumes | HTTP 200; login form present; image reports v1.2.15 | Maven exit 0; 1 test, 0 failures/errors/skips | PASS |
| B | `t03a-b-20261108-r2` | Fresh labeled database, plugin and SSL volumes | HTTP 200; login form present; image reports v1.2.15 | Maven exit 0; 1 test, 0 failures/errors/skips | PASS |

Both executions used `kanboard/kanboard:v1.2.15` pinned to registry digest `sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e` and observed local image ID `sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e`. Each used a unique container, bridge network and three newly created labeled volumes. HTTP was bound to loopback on a dynamic port; the container had a 768 MiB memory limit and 1.5 CPU limit.

The test password came from the pinned baseline's runtime environment value, supplied only to each Maven process as `KANBOARD_TEST_PASSWORD`; it is not stored in source or evidence. Each fresh database's `Test 2` sentinel was absent before the browser test and present afterward. The evidence directories contain run-specific logs, sanitized Surefire XML, runtime identity, provenance, and cleanup records. `evidence/reset-comparison.json` verifies the independent reset and matching JUnit results.

No G1–G4 work was performed. No PR has been merged, and `docs/program/STATUS.json` was not changed.
