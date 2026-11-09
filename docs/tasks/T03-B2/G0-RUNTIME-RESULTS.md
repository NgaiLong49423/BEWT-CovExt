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

Both Docker contexts resolve to Docker Desktop 4.92.0 / Engine 29.8.0; there is no alternate local engine. This was the state before the Team Lead approved a revised egress-limited network profile. The r39 diagnostic remains historically BLOCKED and unchanged. The approved profile disables bridge IP masquerading and adds host-control/container-egress probes, but has not been runtime-verified. Offline validation passes 30/30 fault tests and five syntax checks at `evidence/offline-verification-20261109-r41/`. The latest three host samples were 3.484, 2.845, and 2.518 GiB free, below the new stable 6 GiB gate. Independent task-label inventory counts were zero for containers, networks, and volumes; diagnostic r2 and G0 Run A/B remain `NOT_RUN`. No Docker resources were changed. See `evidence/offline-verification-20261109-r42/runtime-gate-recheck.json` and the current status in `TASK-REPORT.md` and `CLEANUP-AND-RESOURCE-PROTECTION.md`.

## Latest runtime gate recheck — r43

Three new samples measured 1.162, 1.180, and 1.194 GiB free. Docker Desktop Engine 29.8.0 and task-owned inventory queries responded successfully; containers, networks, and volumes matching the complete Claroline task labels were zero. The 6 GiB gate remains BLOCKED, so diagnostic r2 and G0 A/B were not started. No Docker resources were created, stopped, or removed. Evidence: evidence/offline-verification-20261109-r43/runtime-gate-recheck.json.

## Offline network-policy hardening — r44

The approved egress-limited bridge verifier requires IPv6 explicitly disabled; offline fault-injection tests pass 30/30 and five syntax checks pass (exit 0) under `evidence/offline-verification-20261109-r44/`.

## Runtime gate and diagnostic r2 — 2026-11-09

Read-only preflight r46 passed the stable 6 GiB gate with samples 6.744, 6.589, and 6.601 GiB; Docker Engine responded and full task-label container/network/volume counts were zero. Evidence: `evidence/offline-verification-20261109-r46/`.

App-only diagnostic `t03b2-d-20261109-r2` ran on the approved profile. Docker network inspection verified bridge mode, IP masquerading disabled, and IPv6 disabled; loopback port forwarding also verified. The host TCP control to `1.1.1.1:443` passed, but the Claroline container connected to that external TCP target, so the runner correctly returned `BLOCKED` (exit 1) for `EGRESS_POLICY_VIOLATION`. Application readiness, Maven, Selenium, business assertions, and database reset were `NOT_RUN`. Cleanup returned PASS for the recorded container/network, with zero run-labeled residual containers/networks/volumes. Independent before/after inventory counts and fingerprints match. No other Docker resource changed. Evidence: `evidence/t03b2-d-20261109-r2/`.

Diagnostic r2 shows the non-internal no-masquerade profile is not egress-limited: its app container connected to the host control target `1.1.1.1:443`. r2's actual result and cleanup remain unchanged.

## Internal bridge diagnostic r3 — 2026-11-09

Preflight r49 passed with host RAM free samples 6.355, 6.355, and 6.357 GiB; Docker Engine responded and full task-label residual counts were zero. Evidence: `evidence/offline-verification-20261109-r49/`.

Diagnostic `t03b2-d-20261109-r3` selected `172.26.254.0/24` after checking Docker network subnets and Windows IPv4 routes. Docker inspect confirmed bridge mode, `Internal=true`, IPv6 disabled, and the recorded subnet/gateway. The loopback HostConfig port was `127.0.0.1:50555`, but Docker reported `NetworkSettings.Ports` as `{"80/tcp":[]}`; the runner correctly returned `BLOCKED` (exit 1) before egress probing, HTTP/MySQL readiness, Maven, Selenium, business assertion, or DB reset. Evidence: `evidence/t03b2-d-20261109-r3/`.

Initial cleanup failed closed because Docker Desktop omitted the endpoint `Gateway` despite the explicit gateway in network IPAM. The updated verifier now allows that field to be absent only while requiring the exact recorded network ID and matching internal IPAM; r3 exact cleanup recovery passed. Independent post-check found zero resources with the complete task/run labels; all pre/post container/network/volume/image counts and ID fingerprints match. Evidence: `cleanup-recovery-r1.json` and `post-cleanup-independent-check.json` in the r3 folder.

Do not start G0 Runs A/B: the internal profile still fails Docker Desktop host port forwarding. G0 remains `PARTIAL`/`BLOCKED`.

## Latest recheck — r51 (2026-11-09)

Fresh host RAM samples after the user's cleanup: 4.951, 4.953, and 4.949 GiB. Docker Engine 29.8.0 is available; container/network/volume queries using the full project and task labels returned zero resources (all query exit codes 0). The 6 GiB diagnostic gate is `BLOCKED`; no runtime was started and this recheck changed no Docker resources. Evidence: `evidence/offline-verification-20261109-r51/runtime-gate-recheck.json`.

The latest cleanup fault-injection suite passed 32/32 (exit 0); all five syntax checks passed (exit 0), with logs in `evidence/offline-verification-20261109-r51/`. Diagnostic r3 remains blocked on Docker Desktop internal-bridge host port forwarding; its exact-resource cleanup recovery and independent post-check passed. Do not start G0 A/B until the app-only diagnostic passes.

## Route-isolation candidate and latest gate — r53/r55 (2026-11-09)

The offline candidate keeps the published bridge non-internal with IP masquerading disabled, creates app/browser containers dormant with the exact `/bin/sh -c 'sleep infinity'` bootstrap, then invokes the user-approved one-shot `docker exec --privileged --user 0 <recorded-full-container-id> /bin/sh -c 'ip route del default'`. The runner verifies IPv4 and IPv6 default routes are absent and performs a no-payload external TCP probe before starting app/browser services. Container `HostConfig.Privileged` remains false, `CapAdd` is empty, and no mounts are allowed. The elevated `exec` process is a real security exception for that one process, not a claim that no privileged process is used. This candidate has not run in Docker.

Latest read-only gate r53: host free-memory samples were 4.848, 4.904, and 4.863 GiB (<6 GiB requirement); Docker Engine 29.8.0 responded; exact task-label inventory queries found zero Claroline containers, networks, and volumes. No Docker resource was created, started, stopped, or removed. Diagnostic r4 and Runs A/B remain `NOT_RUN` after the prior r3 blocker; HTTP/MySQL, Selenium, Maven, AddUser, and DB reset remain `NOT_RUN`. Evidence: `evidence/offline-verification-20261109-r53/runtime-gate-recheck.json`.

Offline verification r57 passed 34/34 cleanup/fault tests and five Node syntax checks (all exit 0). Evidence: `evidence/offline-verification-20261109-r57/`. r53's earlier offline attempt had 33/34 tests because a test's expected error-message regex did not match; the assertion was corrected and the fresh r55 suite passed. The later r57 suite also verifies private per-container startup-log paths. A separate r54 summary-capture attempt had an invalid count parser and is not used as verification evidence. SonarCloud failed on d7635f1 with S8786, S5443, and S2259 findings; code changes now simplify route parsing, store startup logs under a fresh private container-home directory, and guard incomplete app/browser records. SonarCloud Quality Gate passed at `8672d5bf56379a89c487e0c7c030c22b62581a32` (6 new issues, 0 security hotspots). The r2 egress violation, r3 empty Docker port report, r5 exit 137/force-stop trace, and unexplained r4 default-network ID delta remain historical and unchanged; the initiating cause for r5 exit 137 remains `ROOT_CAUSE_NOT_VERIFIED`.
