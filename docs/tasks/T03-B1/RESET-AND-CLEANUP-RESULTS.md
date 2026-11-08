# Reset and Cleanup Results

The runtime image declares no volumes. Run A and Run B used separate fresh app containers and networks, so flat-file writes were isolated in independent writable container layers. The image digest stayed fixed; no container storage was reused between runs.

Cleanup uses `experiments/bludit/tools/cleanup-bludit-g0.mjs`. Before any mutation it verifies recorded IDs and names, full ownership labels (`project`, `owner`, `managed-by`, `app`, `task`, `runId`), exact image reference, empty mount list, network identity, and that network endpoints are recorded containers. It stops/removes only those recorded containers and removes the recorded empty network. It independently lists containers, networks, and volumes by the full labels and blocks PASS on any residual. Inspect errors count as missing only for exact Docker not-found responses; daemon, permission, transport, unknown, stale-ID, partial-teardown and residual-resource conditions return `BLOCKED`/nonzero. No global prune is used.

- [Run A cleanup result](evidence/t03b1-a-20261108-r4/cleanup-result.json): PASS; both recorded containers and network absent; residual counts zero; all pre-existing Docker resource IDs preserved.
- [Run B cleanup result](evidence/t03b1-b-20261108-r1/cleanup-result.json): PASS; both recorded containers and network absent; residual counts zero; all pre-existing Docker resource IDs preserved.
- [Run A pre/post inventory](evidence/t03b1-a-20261108-r4/docker-reset-comparison.json) and [Run B pre/post inventory](evidence/t03b1-b-20261108-r1/docker-reset-comparison.json) independently confirm no pre-existing container, network, volume, or image was lost.
- Fault-injection tests cover unknown/daemon/permission/transport inspection failure, verified NOT_FOUND idempotence, partial teardown, stale IDs, residual resources, and nonzero process exit.

A preliminary run's resources disappeared before the cleanup invocation; the helper's exact NOT_FOUND handling subsequently verified idempotent absence. That attempt is not counted as either final clean-start run. Final Run A and B each completed their cleanup helper directly and have distinct run IDs.

## Final review correction — Run C

- The first final-review attempt (`t03b1-c-20261109-r1`) was BLOCKED by an unsupported PowerShell SHA API after Installer had passed; cleanup still passed. See the [failure analysis](evidence/final-review-fixes-20261109/run-c-r1-failure-analysis.json).
- Final corrected Run C (`t03b1-c-20261109-r3`) completed both original tests and cleanup with zero residual containers, networks and volumes. The [reset comparison](evidence/t03b1-c-20261109-r3/docker-reset-comparison.json) records no pre-existing resource removals and no post-cleanup additions.
- Cleanup supports network-only, app-only and app+Selenium partial records. Fault-injection checks confirm ExpressCart, Kanboard and unrelated resources are preserved; uncertain ownership remains BLOCKED and is never deleted.