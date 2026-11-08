# Reset and Cleanup Results

**Result: PASS for both independent reset cycles and teardown.**

The original Selenium test creates a Kanboard project named `Test 2`.

| Run | Count before Selenium | Count after Selenium | Data storage |
|---|---:|---:|---|
| A | 0 | 1 | Fresh Run A data volume |
| B | 0 | 1 | Different fresh Run B data volume |

After Run A, its container and all three run-owned volumes were removed and their absence verified before Run B. Run B used a distinct container/network/volume set. Its read-only SQLite query returned zero `Test 2` rows before the test, demonstrating that Run A's data did not carry over. See `evidence/reset-comparison.json`.

Before each teardown, the fixed cleanup utility checked the exact recorded container ID/name/image reference and all six task/run ownership labels. It checked the full mount inventory, confirmed only that container referenced each volume, and confirmed only that container was attached to the labeled run network. Only recorded T03-A resources were removed. Runtime used fixed Docker CLI commands and no Compose project/file. No `docker compose ls` output or generic project name was used as cleanup authorization.

| Run | Container/network/three volumes | Protected inventory |
|---|---|---|
| A | Removed and absent | PASS, unchanged |
| B | Removed and absent | PASS, unchanged |

The final Docker inventory returned to 32 containers (2 running), 11 networks and 24 volumes; the pulled Kanboard image remained locally available (19 images). The two existing ExpressCart containers stayed running and their fingerprints were unchanged. Run B cleanup was invoked again after all resources were absent; it returned PASS with `actionsPerformed: []`, confirming idempotency without further Docker mutation.

The T01-B resources removed during the user's separately confirmed memory-freeing window are recorded in `evidence/preflight/docker-inventory-change-review.json`; T03-A issued no destroy command for them.
