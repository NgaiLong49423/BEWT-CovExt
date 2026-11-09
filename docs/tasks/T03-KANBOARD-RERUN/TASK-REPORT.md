# Kanboard G0 — evidence recovery and safe rerun preparation

- Base: `origin/main` `65c3f6ef92d7e4f4fdf202f65b70ed4198929261`.
- Branch: `task/kanboard-rerun-evidence`; proposed task status `PARTIAL`. The final commit and PR are supplied in the external handoff.
- Gate: `BLOCKED_EVIDENCE` pending original artifact recovery or a separately reviewed clean rerun. Nothing here accepts G0.

## Recovery search and findings

The original task worktree `D:/Github-Projects/BEWT-CovExt-worktrees/t03a-kanboard-g0` and three related T04-C/T03-B worktrees were searched read-only, including ignored files under `experiments/kanboard`, for Surefire XML and command artifacts. They contain the four already-preserved sanitized XML files, but no `TEST-tests.AddNewProject.xml` in that search. This is a bounded search, not proof no archive exists elsewhere. `docs/tasks/T03-A/MAVEN-RUN-METADATA.md` explicitly labels the two saved Maven commands reconstructions; `docs/tasks/T04-C/G0-INDEPENDENT-ACCEPTANCE-AUDIT.md` records the differing original and sanitized XML hashes. No original bytes or exact command were recovered, and no historic file was changed.

## Safety correction

`experiments/kanboard/tools/kanboard-g0.mjs` now requires `Mounts` to be an inspected array and requires distinct actual volume names matching the expected inventory. A synthetic zero-volume record previously allowed missing `Mounts`; a duplicate mount could satisfy the prior length-only check while omitting another expected volume. The existing cleanup executable independently requires exactly three recorded volumes, so the missing-field zero-volume case is not represented as an established exploit of the historic Kanboard runs. Tests cover empty, missing, null, malformed and duplicate mount inspection. No Docker call is required.

## Preconditions for a future rerun

1. Confirm current permitted runtime host and exclusive lease, run ID, resource ownership and cleanup protocol; T04-G recorded Cloud-only for its own task and its broader current scope is unconfirmed. Do not infer authorization to change firewall or use privileged exec. Confirm available CPU, RAM, disk, image digest, Chrome/driver compatibility and exact relevant baseline resource inventory.
2. Review and implement a controlled app-specific runner before execution: current `kanboard-g0.mjs` exposes helper functions and cleanup; it does not itself orchestrate the full startup, Maven invocation and evidence capture. Two distinct run IDs and isolated owned networks/volumes are necessary. No runtime execution was performed in this task.
3. At invocation, capture executable, exact argument array, working directory, timestamps, exit code, manifest and source hashes; never record secret environment values. Retain raw Surefire XML securely outside the public repository, hash the original bytes immediately, and produce a separately hashed sanitized copy plus an auditable sanitization record. Record browser and driver versions and image digest. Do not substitute sanitized-file hash for original-file hash.
4. For each run, establish HTTP/DB readiness and a clean pre-test sentinel, execute the original `tests.AddNewProject` assertion, capture raw/sanitized JUnit and Maven results, check post-test sentinel, and teardown only exact verified task-owned resources. Record independent before/after inventories and prove zero residual task resources. Repeat with a fresh reset and no inherited data; retain every failure and partial-cleanup record.
5. Have an independent reviewer inspect the original/sanitized evidence linkage and the complete G0 matrix. Do not infer acceptance from a green test or a new single run.

## Verification and next action

`node --experimental-strip-types --test experiments/kanboard/tools/test/kanboard-g0.test.mjs experiments/kanboard/tools/test/cleanup-kanboard-g0.test.mjs docs/tasks/T04-C/test/g0-audit.test.mjs`: exit 0; 29 PASS, 0 FAIL, 0 skipped. `evidence/offline-tests.txt` and `evidence/offline-tests-exit.txt` record the run. These are offline regression checks, not runtime evidence. No Docker/Cloud/Gemini usage, cost or cleanup occurred. No `bewt-original/`, shared status, other app resources, or historical raw evidence was changed.

Next: Team Lead clarify current host/isolation policy if necessary; build and review the write-once runner and evidence sanitizer before any actual rerun. Keep G0 evidence blocked until that rerun or original source evidence is independently reviewed.
