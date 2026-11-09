# G0 runtime results

**Status: source base verified / image patch unattributed / runtime `NOT_RUN`.** The pinned image base layer is byte-for-byte identical to the official Claroline 1.11.10 release package. A later image layer changes `claroline/inc/lib/add_course.lib.inc.php` by commenting out the 128-attempt course-identifier allocation guard; the patch source is unknown and is pinned only by the image digest. The latest host check after Docker Desktop startup measured 0.95 GiB free, below the runner's 4 GiB safety threshold; Docker Engine is available but the runner was not invoked. Per the preflight gate, no Claroline or Selenium service container was started. Therefore no HTTP/MySQL/Selenium readiness, AddUser execution, or clean-state run is claimed.

The harness is prepared at `experiments/claroline/tools/run-claroline-g0.mjs`. Each invocation takes a never-before-used ID such as `t03b2-a-YYYYMMDD-r1` and creates a write-once directory under `docs/tasks/T03-B2/evidence/`. It rechecks free host memory before Docker operations. Running A/B requires a fresh user confirmation and at least 4 GiB free, then separate clean IDs. The official source package and image base are now verified; image provenance remains partial because one later source patch is unattributed.

| Check | Result |
|---|---|
| Claroline HTTP `/claroline11110/claroline/index.php` | `NOT_RUN` |
| MySQL process/database and seed-state verification | `NOT_RUN` |
| Selenium Grid/browser readiness | `NOT_RUN` |
| `test.Claroline_AddUserTest` | `NOT_RUN` |
| Independent clean-state Run A and B | `NOT_RUN` |
| Official runtime manifest validation | `NOT_PROMOTED` pending review of the image-only source patch and runtime gate |
| Proposed G0 | `PARTIAL`; runtime is `NOT_RUN`, not `G0_READY_FOR_REVIEW` |

## Latest gate recheck — 2026-11-09

A new read-only preflight measured 2.35 GiB free RAM (<4 GiB) and Docker CLI exit 1 because the `desktop-linux` daemon pipe was unavailable. No Docker resources were changed. Runtime checks remain `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r9/runtime-preflight.json`. The earlier 3.64 GiB reading above is historical and superseded by this lower current reading.

## Latest gate recheck — 2026-11-09 12:37 +07:00

The latest read-only preflight measured 2.98 GiB free RAM (<4 GiB) and Docker CLI exit 1 because the `desktop-linux` daemon pipe was unavailable. No Docker resources changed. Runtime remains `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r10/runtime-preflight.json`. Earlier readings in this file are historical and superseded by this check.

## Latest gate and provenance update — 2026-11-09

Source-package provenance is now verified: the historical `zefredz/claroline@1.11.10` tag and the separately published CLCHAT package account for all files in the official release archive. The pinned runtime image remains unverified against this source. The latest read-only host check measured 3.36 GiB free of 13.79 GiB and Docker CLI exit 1 because the Docker Desktop engine pipe is unavailable. No Docker resource was changed. Runtime A/B, HTTP/MySQL readiness, Selenium, AddUser, and DB reset remain `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r13/`.
## Image source comparison update — 2026-11-09 (r14)

The immutable image base layer is verified against the official 1.11.10 source archive. The final image contains one later, unattributed application-code patch in course-identifier allocation; this difference is recorded and does not change the pinned image identity. Runtime A/B, HTTP/MySQL readiness, Selenium, AddUser, and DB reset remain `NOT_RUN` because RAM is below 4 GiB and Docker Engine is unavailable. Evidence: `evidence/offline-verification-20261109-r14/`.

## Latest user-authorized gate recheck — 2026-11-09 14:00 +07:00

The latest read-only check measured 3.90 GiB free of 13.79 GiB, still below the required 4 GiB. `docker version` exited 1 because the Docker Desktop Linux-engine named pipe is unavailable. No Docker resources were created, started, removed, or changed. Runtime remains `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r14/runtime-preflight.json`.

The candidate Claroline object was validated in memory by the actual `parseApplicationManifest()` parser (PASS), using source commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` and the pinned image digest. No runtime manifest file was promoted because the image-only code patch is unattributed and the runtime gate remains unmet. Evidence: `evidence/offline-verification-20261109-r14/manifest-candidate-parser.json`.

## Post-start gate recheck — 2026-11-09 (r15)

Docker Desktop was started to enable the requested runtime. Docker Engine 29.8.0 now responds, but free host RAM is 0.95 GiB, below the required 4 GiB; the harness was not run. Read-only inventory showed 32 containers (2 running), 11 networks, 24 volumes, and zero containers/networks/volumes with both `project=bewt-covext` and `task=t03b2-g0` labels. No individual Docker resource was created or removed by this preflight. Evidence: `evidence/offline-verification-20261109-r15/runtime-preflight.json`.