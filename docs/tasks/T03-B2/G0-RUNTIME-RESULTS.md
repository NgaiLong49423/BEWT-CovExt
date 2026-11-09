# G0 runtime results



**Current disposition: PARTIAL; G0 is not accepted.** Run A r5 is `BLOCKED` before readiness and business tests: Docker did not assign host ports and the app container was later observed exited with code 137. The cause is `ROOT_CAUSE_NOT_VERIFIED`; no direct OOM/kill evidence is available. Maven, Selenium, business assertions, and DB reset are `NOT_RUN`; the runner exited 1. Exact ownership cleanup passed with no run residuals and no missing baseline IDs. Run B remains `NOT_RUN`. Latest samples are below the hard 4 GiB gate, so no diagnostic or full run was started. The pinned image still contains one unattributed source patch, and the runtime manifest remains unpromoted pending Team Lead review.



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



Runner preflight passed at 4,353,576,960 free bytes. The runner created the exact recorded app/browser containers and an internal network, then failed because Docker reported no assigned host port for either requested loopback mapping. No readiness probes, Maven/Selenium session, AddUser, or database reset ran. The app container later exited with code 137; Selenium remained running until verified cleanup. Runner exit code was 1 and its first cleanup result was BLOCKED. Exit 137 does not establish OOM. A later exact-ID events query returned no r5 events for either container. Evidence is immutable under `evidence/t03b2-a-20261109-r5/`; query evidence is `evidence/offline-verification-20261109-r28/r5-docker-events-query.json`.



Cleanup validation was corrected to permit an empty HostPort only when Docker's NetworkSettings reports no external port, and to account for a stopped container with a detached incomplete endpoint. The full recorded ID, image, ownership labels, mount, network membership, residual labels, and baseline inventory checks remain mandatory. The fault suite now passes 22/22. Cleanup-only against the exact r5 record exited 0 and returned PASS; independent postcheck found zero runId/full-label containers, networks, or volumes, no recorded IDs, and no baseline inventory IDs missing. Evidence: `evidence/t03b2-a-20261109-r5/cleanup-recovery-r21.json` and `cleanup-recovery-postcheck-r21.json`.



Run A r5 is `BLOCKED` before application/Selenium tests; Run B remains `NOT_RUN`. Latest host free RAM after the failed attempt was 3.809 GiB (<4 GiB); no new run was started.



## Runner port correction — r22



After r5, the runner selects two distinct host loopback ports, probes both immediately before resource creation, records that the probe socket is released (`reservationHeld: false`), requests explicit `127.0.0.1:<selected>:<container-port>` bindings, and compares both `HostConfig.PortBindings` and `NetworkSettings.Ports` to the selected ports after start. Bind races are classified `PORT_BIND_CONFLICT`; Docker remains authoritative because the probe does not reserve the port. Unit/fault tests cover occupied ports and exact binding mismatches. This correction has not been exercised in Docker runtime; Run A/B remain incomplete.



## Current gate recheck and port guard — 2026-11-09 (r28/r31)

Three host samples were 4.340, 4.330, and 4.332 GiB free; Docker Engine 29.8.0 was reachable, the WSL VM process working set was 1,696,399,360 bytes, and no T03-B2-owned containers, networks, or volumes were listed. This remains below the preferred ~6 GiB margin, so neither a diagnostic container nor full G0 runtime was started. No experiment Docker resources were created, started, stopped, or removed. Evidence: `evidence/offline-verification-20261109-r28/runtime-gate-recheck.json`.

The corrected read-only event query returned no r5 events for either exact recorded container ID (both Docker commands exited 0). It does not establish exit 137's cause; status is `ROOT_CAUSE_NOT_VERIFIED`. r4's default-network ID delta also remains unexplained. Current states: Run A r5 `BLOCKED`, Run B `NOT_RUN`; HTTP/MySQL/Selenium and `test.Claroline_AddUserTest` are `NOT_RUN`.

Offline port/cleanup tests and syntax checks are recorded under `evidence/offline-verification-20261109-r31/`. Docker runtime binding remains `PORT_BINDING_RUNTIME_NOT_VERIFIED`. Image derivative acceptance is explicitly pending Team Lead decision; no runtime manifest has been promoted and G0 remains `PARTIAL`.

## Latest memory gate recheck — r32

Three samples measured 2.959, 2.971, and 2.965 GiB free, below the runner's hard 4 GiB gate. Docker Engine 29.8.0 remained available; Docker VM memory limit was 7,157,477,376 bytes; WSL VM process working set was 655,040,512 bytes. Task-owned container/network/volume counts remained zero. No diagnostic or G0 run was started; no task Docker resources were changed. Evidence: `evidence/offline-verification-20261109-r32/runtime-gate-recheck.json`.



## Public evidence redaction note

Raw Docker before/after inventories for r3-r5 contain identifiers/names of unrelated local projects. They remain in the local evidence directories and are excluded from the public commit. Sanitized summaries preserve inventory counts and before/after resource equality/deltas using SHA-256 fingerprints without disclosing those names: `evidence/t03b2-a-20261109-r3/docker-inventory-sanitized-summary.json`, and likewise in r4 and r5. r5 cleanup recovery and independent zero-residual checks are published separately.

## Current diagnostic outcome — 2026-11-09

App-only diagnostic `t03b2-d-20261109-r1` is `BLOCKED`: Docker accepted container creation/start (exit 0), but despite exact requested/HostConfig loopback mapping `127.0.0.1:52508`, `NetworkSettings.Ports` was `{"80/tcp":[]}`. Runtime port verification failed before readiness; HTTP/MySQL, Selenium, Maven, business assertions, and DB reset are `NOT_RUN`. App snapshot was running with exit code 0 and `OOMKilled=false`. Exact resource cleanup recovery and independent residual checks PASS. Since the diagnostic did not pass, do not run G0 A/B. G0 remains `PARTIAL`, pending runtime port behavior and Team Lead provenance decision. See `evidence/t03b2-d-20261109-r1/diagnostic-assessment-r1.json`, `cleanup-recovery-r1.json`, and `post-cleanup-independent-check.json`.

For r5, locally retained Docker Desktop logs verify Docker-Client stop requests followed by force escalation after three seconds for both app and Selenium. The exit-137 termination mechanism is therefore consistent with forced stop; the initiating caller and reason the app did not exit after signal 15 are unknown. OOM is not verified. See sanitized `evidence/offline-verification-20261109-r34/r5-stop-escalation-trace.json`.

## Docker Desktop port-forwarder root cause — r39

Read-only analysis of Docker Desktop `com.docker.backend.exe.log` found the same forwarding failure on both r5 and diagnostic r1. For r5 app and Selenium, `exposer.Approve` was followed by `exposer.Add` with an empty mapping and repeated `container has port bindings but no suitable container IP found` warnings. In r1, Docker Desktop approved the requested host port but attempted `127.0.0.1:0`, removed the forward, and logged the same warning. The recorded internal-bridge endpoint had an IP but no gateway. This verifies Docker Desktop backend port-forwarder address selection as the cause of the empty active mapping; the exact selection rule remains unidentified. No retained trace indicates an allocator conflict.

Both Docker contexts resolve to Docker Desktop 4.92.0 / Engine 29.8.0; there is no alternate local engine. The G0 network isolation requirement remains in place. No Maven/Selenium or G0 A/B runs will follow the failed diagnostic unless a compatible isolated runtime is available or Team Lead approves a revised network isolation design. Evidence: `evidence/offline-verification-20261109-r39/docker-port-forwarder-diagnosis.json`.