# G0 Evidence Matrix — Kanboard Run A/B

Evidence paths are repository-relative under `docs/tasks/T03-A/evidence/`. `PASS` here means the cited stored evidence supports that criterion; it is not Team Lead gate acceptance. The total remains `BLOCKED_EVIDENCE`.

| Acceptance condition | Run A | Run B | Evidence and assessment |
|---|---|---|---|
| Application/source/image version pinned | PASS | PASS | Per-run `provenance.json`, `image-provenance.json`, `runtime.json`; common BEWT/Kanboard commits and image digest match manifest/config. |
| Isolated runtime and ownership | PASS | PASS | `runtime.json`, `owned-resources.json`, `docker-before.json`; loopback port, 768 MiB, CPU 1.5, PID 256; labels bind resources to exact run. |
| HTTP/DB readiness | PASS | PASS | `runtime.json` HTTP 200/login form; `sentinel-state-before-test.json` read-only count 0. |
| Base test assertions executed | BLOCKED_EVIDENCE | BLOCKED_EVIDENCE | `surefire-raw-sanitized.xml`, `surefire-summary.txt`, `maven.log` show one pass/BUILD SUCCESS; `surefire-original-sha256.txt` does not match saved XML (see hashes in audit). Exact Maven command is reconstructed. |
| Seed/reset and independent execution | PASS | PASS | `reset-comparison.json`, `sentinel-state*.json`, `owned-resources.json`; distinct container/network/volume identifiers; Run B starts with sentinel 0 after Run A teardown. |
| First cleanup and no impact to prior resources | PASS | PASS | A `cleanup-result.json`; B `cleanup-result-first-pass.json`; before/after inventories and signature sets unchanged for protected resources. Counts 32/2 running, 11, 24, 19 stay stable. |
| Repeat cleanup | NOT_EVIDENCED | PASS (idempotent) | No repeated result for A. B `cleanup-result.json` says already complete and performs no actions; `docker-after-repeat-1794132144244.json`. |
| Corrected cleanup code used during runtime | NOT_VERIFIED | NOT_VERIFIED | Historical runs predate correction; subsequent T03-A `evidence/review-corrections/node-tests.txt` is offline fault-injection only. |
| Selenium CDP warning affects result | Non-fatal in recorded run | Non-fatal in recorded run | Surefire XML and Maven log warn CDP implementation for Chrome 156 unavailable. Test uses ordinary WebDriver and reports assertions PASS. Driver binary digest is absent. |
| Combined G0 | **BLOCKED_EVIDENCE** | **BLOCKED_EVIDENCE** | Contradictory Surefire hash binding prevents acceptance of the test outcome's evidence chain. |

## Interpretation

The run records are independent and their resources are distinctly identified. The evidence is not sufficient for an acceptance decision until both Surefire hash discrepancies are resolved from trustworthy contemporaneous bytes or Team Lead directs an appropriately scoped new run. This matrix does not update `docs/program/STATUS.json`.
