# T03-KANBOARD-LEDGER — Write-once Maven evidence primitive

- Base `origin/main`: `33ebd2bd96e6570f8008d7abcc578cf4483c022e`.
- Branch: `task/kanboard-ledger-v2`; proposed status `PARTIAL` pending independent review. Exact commit is in the handoff.
- Scope: a reusable, offline-testable primitive to reserve a unique run directory and store a write-once JSON summary of caller-supplied Maven invocation metadata and byte hashes. No process executor, Docker runner, sanitation, privileged operation or network access is included.

## Behavior and limits

The API checks the requested fixed `tests.AddNewProject` argument array, loopback port, reported working directory, pinned Kanboard/BEWT commits, process status, caller-supplied timestamps, byte buffers and optional absent XML pair. It records distinct SHA-256 hashes for raw/sanitized XML and stdout/stderr without storing these potentially sensitive bytes. It uses `mkdir` and exclusive file creation, rejects duplicate run IDs and overwrites, and accepts only an in-process reservation handle. Timeout and spawn failure can be represented without XML; no outcome is inferred as PASS.

Every record explicitly says `CALLER_SUPPLIED_UNVERIFIED`, `executionVerified: false`, `sanitizationLinkVerified: false`, and notes that neither raw nor sanitized bytes are persisted and the executable path is not recorded. These limitations mean this primitive alone does **not** meet G0 provenance or retention criteria. A trusted future runtime orchestrator must capture the actual process, real executable identity/path, protected raw artifacts, sanitized artifact, sanitizer linkage, fixture state, cleanup and version evidence. It must be reviewed and fault-tested separately before real execution. The API assumes the evidence root is protected from adversarial concurrent filesystem manipulation; it is not a filesystem sandbox. Node file modes may not enforce equivalent ACLs on Windows.

## Actual verification

- `node --experimental-strip-types --test experiments/kanboard/tools/test/maven-evidence.test.mjs experiments/kanboard/tools/test/kanboard-g0.test.mjs experiments/kanboard/tools/test/cleanup-kanboard-g0.test.mjs docs/tasks/T04-C/test/g0-audit.test.mjs`: exit 0, 33 PASS, 0 FAIL, 0 skipped on base `33ebd2bd...`; final log `evidence/offline-tests-final.txt` and exit file after the timestamp-validation correction. Earlier runs on both bases are retained separately.
- Synthetic test secrets were not persisted; duplicate run/file creation, altered commands, invalid pins/status and missing XML failures were exercised in temporary directories only.
- No Docker, Cloud, Maven process, Selenium or Gemini was run. No runtime, cleanup, G0 acceptance or human review is asserted. `bewt-original/`, shared STATUS and historic research evidence were not touched.

## Next work

The full Kanboard rerun orchestration and its lifecycle failure/partial-cleanup tests remain unimplemented. Verify approved runtime host, exclusive lease, network policy, bounded resources and image/driver provenance before any runtime action; implement secure raw retention and independent sanitation verification. Recover original historic evidence if an external archive exists; until then T04-C remains `BLOCKED_EVIDENCE`.
