# G0 runtime results



**Current disposition: PARTIAL; G0 is not accepted.** Run A r5 passed the runner RAM gate but Docker did not assign host ports, and the app later exited 137. No readiness, Maven/Selenium business test, or DB reset ran. The runner exited 1. Exact ownership cleanup later passed, with independent verification of no residual run resources or baseline losses. Run B remains NOT_RUN. Docker Engine 29.8.0 is available, but latest free RAM is below the safe retry margin after the OOM. The pinned image still contains one unattributed source patch, so the runtime manifest remains unpromoted.



| Check | Result |

|---|---|

| Claroline HTTP `/claroline11110/claroline/index.php` | `NOT_RUN` |

| MySQL process/database and seed-state verification | `NOT_RUN` |

| Selenium Grid/browser readiness | `NOT_RUN` |

| `test.Claroline_AddUserTest` | `NOT_RUN` |

| Independent clean-state Run A and B | `NOT_RUN` |

| Official runtime manifest validation | `NOT_PROMOTED` pending review of the image-only source patch and runtime gate |

| Proposed G0 | `PARTIAL`; runtime is `NOT_RUN`, not `G0_READY_FOR_REVIEW` |



## Runtime attempt — Run A r4 (2026-11-09)



The harness passed its memory preflight and recorded the exact Docker-before inventory, then created the pinned app and Selenium containers and the per-run internal network. It exited before starting either container because it queried dynamic host ports before Docker assigns them (`HostPort` was empty in the `created` state). Maven, HTTP/MySQL readiness, Selenium sessions, AddUser, and DB-reset assertions did not run. Evidence: `evidence/t03b2-a-20261109-r4/`.



The first cleanup was `BLOCKED` because the validator required an allocated dynamic port even though both recorded containers were not running. The fail-closed recovery then rejected inherited labels from the pinned Selenium image. The ownership check now compares exact merged labels from the pinned image metadata plus the complete run ownership labels, and allows an empty dynamic port only for a created, not-started container with no initialized network endpoint. Fault tests cover this state. Exact run-labeled resources are now absent, but final cleanup remains `BLOCKED`: the before/after inventory contains a different default-network ID (`221f...` absent; `11ce...` present). No conclusion is made that baseline cleanup passed. Recovery records: `evidence/t03b2-a-20261109-r4/cleanup-recovery-*`.



The runner now starts both containers before reading their dynamically assigned ports. This change has passed syntax and cleanup fault tests; it has not yet passed an actual Claroline runtime. The latest host reading was 3.06 GiB free with Docker Engine 29.8.0, so another run is not currently eligible.



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



## Run A r5 — runtime interruption and cleanup recovery (2026-11-09)



Runner preflight passed at 4,353,576,960 free bytes. The runner created the exact recorded app/browser containers and an internal network, then failed because Docker reported no assigned host port for either requested loopback mapping. No readiness probes, Maven/Selenium session, AddUser, or database reset ran. The app container later exited with code 137; Selenium remained running until verified cleanup. Runner exit code was 1 and its first cleanup result was BLOCKED. Evidence is immutable under `evidence/t03b2-a-20261109-r5/`.



Cleanup validation was corrected to permit an empty HostPort only when Docker's NetworkSettings reports no external port, and to account for a stopped container with a detached incomplete endpoint. The full recorded ID, image, ownership labels, mount, network membership, residual labels, and baseline inventory checks remain mandatory. The fault suite now passes 22/22. Cleanup-only against the exact r5 record exited 0 and returned PASS; independent postcheck found zero runId/full-label containers, networks, or volumes, no recorded IDs, and no baseline inventory IDs missing. Evidence: `evidence/t03b2-a-20261109-r5/cleanup-recovery-r21.json` and `cleanup-recovery-postcheck-r21.json`.



Run A r5 is `BLOCKED` before application/Selenium tests; Run B remains `NOT_RUN`. Latest host free RAM after the failed attempt was 3.809 GiB (<4 GiB); no new run was started.



## Runner port correction — r22



After r5, the runner selects two available host loopback ephemeral ports before Docker container creation, records both in `host-port-allocation.json`/`run-record.json`, requests explicit `127.0.0.1:<selected>:<container-port>` bindings, and verifies the same ports after start. The port selector regression test passes. This correction has not yet been exercised in Docker runtime; host memory is still marginal after the r5 OOM and Run A/B remain incomplete.



## Public evidence redaction note



Raw Docker before/after inventories for r3-r5 contain identifiers/names of unrelated local projects. They remain in the local evidence directories and are excluded from the public commit. Sanitized summaries preserve inventory counts and before/after resource equality/deltas using SHA-256 fingerprints without disclosing those names: `evidence/t03b2-a-20261109-r3/docker-inventory-sanitized-summary.json`, and likewise in r4 and r5. r5 cleanup recovery and independent zero-residual checks are published separately.