# G0 runtime results

**Status: `PROVENANCE_BLOCKED` / runtime `NOT_RUN`.** The latest user-authorized host free memory recheck returned 3.64 GiB, below the runner's 4 GiB safety threshold; a read-only Docker CLI query also found the `desktop-linux` daemon pipe unavailable. Per the preflight gate, no Claroline or Selenium service container was started. Therefore no HTTP/MySQL/Selenium readiness, AddUser execution, or clean-state run is claimed.

The harness is prepared at `experiments/claroline/tools/run-claroline-g0.mjs`. Each invocation takes a never-before-used ID such as `t03b2-a-YYYYMMDD-r1` and creates a write-once directory under `docs/tasks/T03-B2/evidence/`. It rechecks free host memory before Docker operations. Running A/B requires a fresh user confirmation and at least 4 GiB free, then separate clean IDs. Source provenance remains a separate blocker even if runtime feasibility passes.

| Check | Result |
|---|---|
| Claroline HTTP `/claroline11110/claroline/index.php` | `NOT_RUN` |
| MySQL process/database and seed-state verification | `NOT_RUN` |
| Selenium Grid/browser readiness | `NOT_RUN` |
| `test.Claroline_AddUserTest` | `NOT_RUN` |
| Independent clean-state Run A and B | `NOT_RUN` |
| Official runtime manifest validation | `BLOCKED` by unverified Claroline source commit |
| Proposed G0 | `PROVENANCE_BLOCKED`; not `G0_READY_FOR_REVIEW` |

## Latest gate recheck — 2026-11-09

A new read-only preflight measured 2.35 GiB free RAM (<4 GiB) and Docker CLI exit 1 because the `desktop-linux` daemon pipe was unavailable. No Docker resources were changed. Runtime checks remain `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r9/runtime-preflight.json`. The earlier 3.64 GiB reading above is historical and superseded by this lower current reading.
