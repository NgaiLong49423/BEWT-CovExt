# Reset and Cleanup Results

**Original runtime result: PASS for both independent reset cycles and teardown.** The previously executed Run A/B cleanup evidence is preserved in each run's `cleanup-result.json` and `docker-after.json`; original Selenium/JUnit evidence is unchanged.

The original Selenium test creates a Kanboard project named `Test 2`.

| Run | Count before Selenium | Count after Selenium | Data storage |
|---|---:|---:|---|
| A | 0 | 1 | Fresh Run A data volume |
| B | 0 | 1 | Different fresh Run B data volume |

After Run A, its container and all three run-owned volumes were removed and their absence verified before Run B. Run B used a distinct container/network/volume set. Its read-only SQLite query returned zero `Test 2` rows before the test, demonstrating that Run A's data did not carry over. See `evidence/reset-comparison.json`.

The original Run A/B teardown records predate the fail-closed correction in this review. The corrected cleanup path is verified by fault-injection tests for Docker daemon/permission/transport errors, partial teardown, stale IDs, exact idempotence and residual resources in all three independently queried resource classes. No Docker resources were mutated during this correction pass; no Selenium rerun was needed.

The original cleanup checked the exact recorded container ID/name/image reference and all task/run labels, full mount inventory, volume attachment, and network endpoints. It removed only recorded T03-A resources. The existing inventory reports 32 containers (2 running), 11 networks and 24 volumes after teardown; two existing ExpressCart containers remained running and their fingerprints were unchanged. The pulled Kanboard image remained locally available (19 images).

The T01-B resources removed during the user's separately confirmed memory-freeing window are recorded in `evidence/preflight/docker-inventory-change-review.json`; T03-A issued no destroy command for them.
