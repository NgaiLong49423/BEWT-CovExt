# Environment preflight

## Docker state and image-only inspection

Docker Desktop context was `desktop-linux`; Docker Engine 29.8.0, Linux amd64, 16 CPUs and 7,157,481,472 bytes engine memory. Before runtime work, inventory contained 32 containers (2 running), 11 networks, 24 volumes and 23 images. No existing Claroline-named containers or T03-B2 resources were found. The app digest was pulled and inspected; a stopped, isolated preflight container was used to inspect entrypoint/files/package metadata, then removed.

The preflight-only container had full T03-B2 ownership labels, `network=none`, and no mounts. `docker rm` returned success. An initial absence checker incorrectly classified Docker's `[]` stdout plus exact `No such object` stderr as blocked; the record is preserved at `container-cleanup.json`. A read-only follow-up separately verified exact NOT_FOUND at `container-cleanup-exact-not-found-followup.json`. No cleanup history was rewritten.

## Host resource gate

The read-only Windows memory checks first reported 1.89 GiB and then 1.64 GiB free. The latest user-authorized check reported **3.64 GiB free of 13.79 GiB**, still below the 4 GiB runtime threshold. The Docker CLI also reported that the `desktop-linux` engine named pipe is unavailable. **No Claroline or Selenium service container has been started.** Runtime A/B and Docker before/after run inventories are `NOT_RUN` because both required preflight conditions are unmet.

Disk availability at initial preflight was 89.66 GiB on D: and 4.92 GiB on C:. This value can change and should be rechecked before runtime.

## Network policy

When the host gate allows a run, only app TCP 80 and Selenium TCP 4444 are dynamically published on `127.0.0.1`; MySQL 3306 remains internal. The app and browser join a per-run internal bridge. No host paths, anonymous volumes, or Docker socket are mounted. The runner records full before/after Docker inventories and uses fail-closed ownership cleanup.

## Review follow-up recheck — 2026-11-09 12:25 +07:00

A fresh read-only check measured **2.35 GiB free of 13.79 GiB**. `docker version` exited 1 because the `desktop-linux` named pipe is unavailable. The machine/runtime gate remains `BLOCKED`; no Docker resource was created, inspected, removed, or otherwise changed in this recheck. See `evidence/offline-verification-20261109-r9/runtime-preflight.json`.

## Latest recheck — 2026-11-09 12:37 +07:00

The fresh host reading was **2.98 GiB free of 13.79 GiB**; Docker CLI exit 1 reported the unavailable `desktop-linux` pipe. Runtime remains `BLOCKED` below the 4 GiB threshold, with no Docker resources changed. See `evidence/offline-verification-20261109-r10/runtime-preflight.json`.

## Latest runtime gate recheck — 2026-11-09

A fresh read-only check measured **3.36 GiB free of 13.79 GiB**, below the required 4 GiB. `docker version` exited 1 because the Docker Desktop Linux-engine named pipe was unavailable. No Docker resources were created or changed. Evidence: `evidence/offline-verification-20261109-r13/runtime-preflight.json`.
## Latest read-only recheck — 2026-11-09 14:00 +07:00

Free RAM measured **3.90 GiB of 13.79 GiB**, still below the 4 GiB threshold. docker version exited 1 because the Docker Desktop Linux-engine named pipe was unavailable. No Docker resources were created, started, removed, or changed. Runtime remains BLOCKED at preflight and was not run. Evidence: evidence/offline-verification-20261109-r14/runtime-preflight.json.

## Post-start recheck — 2026-11-09 (r15)

Docker Desktop was started for the requested runtime. Docker Engine 29.8.0 is reachable, but free host RAM is **0.95 GiB of 13.79 GiB**, below the required 4 GiB; the runtime harness was not started. Read-only Docker inventory counted 32 containers (2 running), 11 networks, and 24 volumes. No resource carried both T03-B2 ownership labels. No individual Docker resource was created or removed during this preflight. Evidence: `evidence/offline-verification-20261109-r15/runtime-preflight.json`.

## Post-recovery verification — 2026-11-09 (r16)

Docker Engine 29.8.0 is reachable. A fresh host reading measured **4.013 GiB free of 13.79 GiB**. This is only marginally above the runner's hard 4 GiB threshold; no new runtime run was started because prior in-process readings dipped below the gate. Existing r4 resource recovery is documented as BLOCKED due a baseline network identity delta; there are no resources matching the full T03-B2 ownership labels. See `evidence/offline-verification-20261109-r16/verification-summary.json` and `evidence/t03b2-a-20261109-r4/cleanup-recovery-postcheck.json`.

## Latest read-only gate — r17

At 2026-11-09 10:28:58 UTC, free host RAM was **4.017 GiB of 13.79 GiB** and Docker Engine 29.8.0 was reachable. The harness was not started because the reading is marginal and prior in-process checks fell below the 4 GiB hard threshold. No Docker resource was changed. Evidence: `evidence/offline-verification-20261109-r17/runtime-preflight.json`.

## r5 runtime and cleanup recovery — 2026-11-09

Runner exit code 1; preflight PASS at 4,353,576,960 bytes. Docker did not allocate either requested host port; app container later exited 137. No readiness, Maven, Selenium, business test, or DB reset ran. Initial cleanup BLOCKED; corrected cleanup-only exited 0/PASS for exact recorded r5 resources. Independent postcheck: zero r5 residuals and no missing baseline IDs. Run A remains BLOCKED; Run B NOT_RUN. Current host RAM 3.809 GiB, so runtime is stopped at the preflight gate. Evidence: `evidence/t03b2-a-20261109-r5/` and `evidence/offline-verification-20261109-r21/`.

## Latest post-r5 runtime gate — 2026-11-09

At 11/09/2026 10:45:05, host RAM was **4.192 GiB of 13.79 GiB**; Docker Engine 29.8.0 was reachable. The harness was not started because memory remains marginal after r5 app exit 137. No resources changed in this read-only check. Evidence: docs/tasks/T03-B2/evidence/offline-verification-20261109-r23/runtime-preflight.json.

## Latest read-only gate — r25

At 2026-11-09T10:49:31Z, host RAM was **4.409 GiB of 13.79 GiB**; Docker Engine 29.8.0 was reachable. No runtime was started after the observed r5 app exit 137; its cause is not verified. Evidence: `evidence/offline-verification-20261109-r25/runtime-preflight.json`.

## Current runtime gate — r28

Three host RAM samples at 2026-11-09T11:23:43Z, 11:23:48Z, and 11:23:53Z measured **4.340, 4.330, and 4.332 GiB free** of 13.79 GiB. Docker Engine 29.8.0 was reachable; the WSL VM process working set was 1,696,399,360 bytes. Read-only filters found zero T03-B2-owned containers, networks, or volumes. This is below the preferred approximately 6 GiB margin, so diagnostic and full runtime were not started (`HOST_MEMORY_BLOCKED`). No T03-B2 resources were created, started, stopped, or removed. Evidence: `evidence/offline-verification-20261109-r28/runtime-gate-recheck.json`.
