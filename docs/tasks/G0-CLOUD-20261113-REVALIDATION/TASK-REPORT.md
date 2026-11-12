# G0 Cloud Revalidation — 2026-11-13

## Outcome

The authorized existing VM was rechecked before a fresh G0 run. It was already `RUNNING`, so no start/restart command was issued. Docker was active and all eight configured application image references resolved locally. No application container, network, volume, Maven process, or G0 evidence directory was created by this revalidation.

**Current G0 outcome: `BLOCKED` before runtime startup because secure runtime test credentials are unavailable on the VM.** The `runner` process environment had none of the required credential variable names, and a bounded path scan found only `.env.example` files, no runtime `.env` file. Secret Manager could not be listed because its API is disabled and the current identity lacks permission to enable/access it. The API was not enabled. No credential values were read or recorded.

The previous 2026-11-12 final4 result remains historical evidence: eight base smoke tests passed on its recorded source head with provenance limitations. This revalidation does not repeat or upgrade that result. G3 remains unrun in this task.

## Verified VM and Docker state

- Project: `gen-lang-client-0311012609`
- VM: `bewt-covext-runner`, instance ID `3042402845209891905`
- Zone and machine type: `asia-southeast1-a`, `c4d-highmem-8`
- State: `RUNNING` before and after inspection; restart was unnecessary
- OS: Ubuntu 24.04.5 LTS
- Resources: 8 CPUs; 61 GiB RAM total, 60 GiB available; root filesystem 193 GiB total, 173 GiB available
- Docker service: `active`; Docker Engine `29.9.3`; Compose `5.7.0`; storage driver `overlayfs`
- Docker inventory: 0 containers, 17 images; no cleanup or prune was performed
- All eight configured application image references resolved by read-only `docker image inspect`; see `evidence/runtime-preflight.json`.

## Checkout isolation and credential boundary

The pre-existing `/home/runner/BEWT-CovExt` checkout points to `main` at `a21e65dcce44f85b3ad1d0eaa350ce717e1bf22c` and has 25 status entries. It was not modified. A G0 worktree was not created and the runner was not launched because required credentials were absent. At observation time the intended PR #28 source was `1f6b8c2f074d354bfe9d223f7aa8bb3113c6c051`; PR #28 later advanced to `e18f3030810513a9bc219c26be406a3ba3ee9bef` with credential transport hardening. The VM checkout has not been synchronized to either PR head.

PR #28 commit `e18f3030810513a9bc219c26be406a3ba3ee9bef` now moves container runtime and installer credentials through short-lived env files; the secret values no longer appear in the host `docker` command arguments. Residual access remains for Docker daemon administrators through container configuration and for root/process inspection inside the isolated app container while an installer runs. The credential source has not been loaded, so these paths were not exercised with real values.

The next executable step requires the Team Lead to finish injecting the app-specific G0 variables into the VM's transient runner environment and notify me to proceed. Values must stay out of chat, Git, persisted evidence, and captured logs. Once notified, revalidate the exact PR #28 source SHA and worktree cleanliness, execute all eight apps sequentially, retain allowlisted sanitized evidence, and verify zero residual resources.

## Evidence

- `evidence/runtime-preflight.json` — value-free VM, Docker, image-resolution, checkout, and credential-availability observations.
- No Maven/JUnit, application-readiness, fixture, or cleanup evidence was generated in this revalidation.
