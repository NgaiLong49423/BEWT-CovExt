# Environment preflight

## Docker state and image-only inspection

Docker Desktop context was `desktop-linux`; Docker Engine 29.8.0, Linux amd64, 16 CPUs and 7,157,481,472 bytes engine memory. Before runtime work, inventory contained 32 containers (2 running), 11 networks, 24 volumes and 23 images. No existing Claroline-named containers or T03-B2 resources were found. The app digest was pulled and inspected; a stopped, isolated preflight container was used to inspect entrypoint/files/package metadata, then removed.

The preflight-only container had full T03-B2 ownership labels, `network=none`, and no mounts. `docker rm` returned success. An initial absence checker incorrectly classified Docker's `[]` stdout plus exact `No such object` stderr as blocked; the record is preserved at `container-cleanup.json`. A read-only follow-up separately verified exact NOT_FOUND at `container-cleanup-exact-not-found-followup.json`. No cleanup history was rewritten.

## Host resource gate

The read-only Windows memory checks first reported 1.89 GiB and then 1.64 GiB free. The latest user-authorized check reported **3.64 GiB free of 13.79 GiB**, still below the 4 GiB runtime threshold. The Docker CLI also reported that the `desktop-linux` engine named pipe is unavailable. **No Claroline or Selenium service container has been started.** Runtime A/B and Docker before/after run inventories are `NOT_RUN` because both required preflight conditions are unmet.

Disk availability at initial preflight was 89.66 GiB on D: and 4.92 GiB on C:. This value can change and should be rechecked before runtime.

## Network policy

When the host gate allows a run, only app TCP 80 and Selenium TCP 4444 are dynamically published on `127.0.0.1`; MySQL 3306 remains internal. The app and browser join a per-run internal bridge. No host paths, anonymous volumes, or Docker socket are mounted. The runner records full before/after Docker inventories and uses fail-closed ownership cleanup.
