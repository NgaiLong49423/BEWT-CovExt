# T01-B Review Fixes — Invocation Lifecycle and Guaranteed Cleanup

**Date:** 2026-11-08

**Branch:** `feature/t01b-langgraph-runtime`

**PR:** https://github.com/NgaiLong49423/BEWT-CovExt/pull/3

**Reviewed head addressed:** `9f2f441d61a4294c5e5c387cbe2aed1863498c3a`

**Base (`origin/main`):** `1610790b0a4f031608d59a9e52e085ee52454d29`

## Changes and root causes

1. **Evidence collisions and shared fixture ownership.** The adapter previously keyed its in-memory `runs` map and all stage/evidence paths by workflow `runId`. Repair validations within a workflow therefore reused Compose ownership and `wx` filenames. `ExpressCartExperimentAdapter.validate()` now assigns a deterministic validation invocation ID from workflow run, repair attempt and artifact hash. `prepareFixture()`, `runSelenium()`, `cleanup()`, and `writeRunEvidence()` use `docs/tasks/T01-B/evidence/<workflow>/invocations/<invocation>/`; Compose project names are derived from a digest of the full workflow/invocation identity. Each stage reference remains linked to its invocation, and `repairAttempts` is carried unchanged into `ValidationResult`.
2. **Cleanup depended on process memory and was not guaranteed after a stage error.** Fixture ownership metadata now pins workflow run, invocation, project, source commit/version, candidate/revision, Compose path and SHA-256. A new adapter instance can reconstruct a run only after those fields and the Compose file digest match; Docker Compose labels are checked before removal. Dispatcher/evidence exceptions are converted into stage outcomes so the validation path still attempts cleanup after fixture startup. Cleanup failures are reported as `BLOCKED` with append-only, uniquely named recovery records; repeated cleanup after existing PASS evidence is refused as `NOT_RUN`.
3. **Terminal evidence used a pre-terminal snapshot.** `evidence_recording` now computes `EXECUTION_COMPLETED` before invoking the evidence writer. Failure in evidence recording still routes to `FAILED`. The CLI marks the saved record as `terminal-finalization` and records that terminal state, validation history, and failure history.

## Source and tests

- Adapter lifecycle and ownership: [`adapters/expresscart/experiment.ts`](../../../adapters/expresscart/experiment.ts) — `validate`, `prepareFixture`, `runSelenium`, `cleanup`, `getOrCreateRun`, `recoverRun`, `compose`, `writeRunEvidence`.
- Workflow terminal snapshot: [`framework/src/runtime/workflow.ts`](../../../framework/src/runtime/workflow.ts), `evidence_recording` node.
- State contract: [`framework/src/contracts.ts`](../../../framework/src/contracts.ts), optional `validationInvocationId`.
- Serialized terminal evidence: [`framework/src/cli.ts`](../../../framework/src/cli.ts), `recordEvidence` callback.
- Adapter integration coverage: [`framework/test/integration/expresscart-adapter-lifecycle.test.ts`](../../../framework/test/integration/expresscart-adapter-lifecycle.test.ts).
- Terminal snapshot regression: [`framework/test/integration/workflow.test.ts`](../../../framework/test/integration/workflow.test.ts).

The adapter integration test ran two actual validations in workflow `adapter-lifecycle-c41735f2-cd57-4e7f-ae9b-5cd540a8d387`, with invocations `inv-3fa7814f8831c9eb3103c5ba` and `inv-ebf055249e5bbada140a85c3`. Each compile, fixture preflight and scoped cleanup passed; the dispatcher correctly rejected Selenium because the test intentionally did not register an approved generated artifact. The test also prepared a separate Compose project and used a fresh adapter instance (`adapter-lifecycle-c41735f2-cd57-4e7f-ae9b-5cd540a8d387-restart`, invocation `inv-recovery-70894f67-b3cc-43c8-8138-3ccd109f42fc`) to verify candidate/revision mismatch was refused, injected a scoped `compose down` failure which remained `BLOCKED`, then performed real verified cleanup successfully. Cleanup PASS additionally requires post-down verification that the invocation's containers, volumes and networks are absent.

## Verification

- Framework `npm ci`: PASS, 71 packages installed; 0 vulnerabilities.
- Framework `npm run build`: PASS.
- Framework unit tests: 21/21 PASS.
- Framework integration tests: 14/14 PASS, including actual adapter/Compose lifecycle and cleanup fault injection.
- ExpressCart Agent `npm ci`: PASS, 34 packages installed; 0 vulnerabilities.
- ExpressCart Agent build: PASS; tests: 5/5 PASS.
- Existing Compose project `bewt-covext-expresscart-b31302f` remains `running(2)`. Read-only after-run snapshot lists only its two containers; no T01-B invocation project remains. Snapshot: [`evidence/review-fixes/08-docker-after-state.log`](evidence/review-fixes/08-docker-after-state.log). The repository checkout is a separate worktree, and no ExpressCart application source or Docker configuration was changed.
- Logs: [`evidence/review-fixes/`](evidence/review-fixes/).

## Remaining limits and review gate

- The controlled E2E failure path is dispatcher refusal for an unregistered artifact; the test does not execute Selenium. The earlier approved runtime remains one E2E PASS using a **REUSED** Java artifact. No `GENERATED` or `REPAIRED` Java artifact was produced, and no Gemini call occurred.
- At the reviewed head, restart recovery was tested by reconstructing the adapter in a fresh instance in the same Node process; process termination between fixture startup and checkpoint completion had not yet been induced. The final review correction below adds that process-kill/restart evidence.
- Technical eligibility remains `UNVERIFIED`; oracle and novelty remain `UNVERIFIED`; research acceptance remains `NOT_REVIEWED`. G2 and D1 are not accepted. The 8-application / 40-case scope and historical Sprint 01–05 records are unchanged.
- This report proposes the task for review only. Do not merge PR #3 or begin T02 before Team Lead review.

## Final review corrections — crash-safe invocation recovery

The final review exposed that LangGraph can replay `validation_repair` after a process stops after fixture startup but before the node result is checkpointed. A deterministic ID tied only to workflow, repair attempt and artifact hash could reopen an empty in-memory run while the old Compose resources and immutable `wx` evidence remained. `ExpressCartExperimentAdapter.allocateInvocation()` now scans only the matching invocation family before allocating a new sequence-suffixed ID. It reconstructs a prior run only when `owner.json`, source/version, candidate/revision, Compose file digest and exact Docker Compose project labels agree; it then reconciles that invocation with scoped cleanup. Failure to prove ownership blocks execution and does not run global cleanup. A cleaned invocation keeps its evidence and is never reused as a new execution.

`cleanup()` distinguishes an immutable prior PASS record from actual resource state. If resources are absent, replay is idempotently `NOT_RUN`; if verified owned resources remain, scoped removal is retried and a new reconciliation record is appended; if state cannot be verified or scoped removal fails, the outcome remains `BLOCKED`. `collectEvidence(runId, invocationId?)` traverses only selected run and invocation directories, validates real paths, skips symlinks/junctions and tags each reference with its owning invocation.

The regression in [`framework/test/integration/expresscart-crash-replay.test.ts`](../../../framework/test/integration/expresscart-crash-replay.test.ts) uses a real SQLite checkpointer and ExpressCart adapter. The parent waits for the real fixture preflight, terminates only the dedicated Node child, and opens the same checkpoint database in a new child. The first invocation is reconciled before a fresh invocation runs. The test initially used `invoke({}, config)`, which LangGraph treated as new input and restarted from `START`; changing it to `invoke(null, config)` resumes the pending checkpoint. A crash-only adapter hook keeps the event loop alive until the parent watchdog terminates the child. Successful run evidence: [`evidence/t01b-crash-eb909347-2b33-4a21-8599-3051a1b14a5f/`](evidence/t01b-crash-eb909347-2b33-4a21-8599-3051a1b14a5f/).

The replayed current-code invocation completed Maven compile, real isolated fixture preflight, Selenium/JUnit E2E and scoped cleanup as PASS using the approved **REUSED** EC-C04 Java artifact. JUnit contains one test, zero failures/errors; Selenium recorded Chrome and ChromeDriver `156.0.8078.80`. The interrupted invocation has its own ID and cleanup PASS and is not counted as a second E2E. Docker before/after snapshots show the existing `bewt-covext-expresscart-b31302f` project remained `running(2)` and no T01-B project remained. Gemini calls: zero.

Source and test files changed in this correction:

- [`adapters/expresscart/experiment.ts`](../../../adapters/expresscart/experiment.ts): invocation allocation/reconciliation, resource-state-aware cleanup, nested evidence discovery, test-only post-fixture crash hook.
- [`framework/src/contracts.ts`](../../../framework/src/contracts.ts): optional invocation filter on `ApplicationAdapter.collectEvidence`.
- [`framework/test/integration/expresscart-adapter-lifecycle.test.ts`](../../../framework/test/integration/expresscart-adapter-lifecycle.test.ts): nested evidence, invocation isolation, empty evidence and symlink/junction coverage.
- [`framework/test/fixtures/expresscart-crash-replay-child.ts`](../../../framework/test/fixtures/expresscart-crash-replay-child.ts): dedicated crash/restart child with a no-live-model workflow.
- [`framework/test/integration/expresscart-crash-replay.test.ts`](../../../framework/test/integration/expresscart-crash-replay.test.ts): process-kill recovery, actual reused-artifact E2E and Docker before/after assertions.

## Updated verification boundaries

- Framework: `npm ci` PASS, build PASS, 21/21 unit tests PASS, 15/15 normal integration tests PASS; the opt-in crash test is skipped in the regular command and passed separately (1/1). ExpressCart Agent: `npm ci` PASS and 5/5 tests PASS. Logs are in [`evidence/verification-crash-recovery-20261108/`](evidence/verification-crash-recovery-20261108/).
- The test proves dedicated Node process termination and restart against a retained SQLite checkpoint, plus adapter reconstruction during reconciliation. It does **not** prove recovery from host/OS reboot, power loss, Docker daemon crash, filesystem corruption or concurrent agents.
- Actual E2E is one current-code smoke using a **REUSED** artifact. There are no three repeat invocations, no oracle/novelty decision and no research acceptance. It is not `VALIDATED`; G2 and D1 remain unaccepted. This task does not authorize T02.
- Selenium emitted a CDP-version warning for Chrome 156 despite matching browser/driver pins; the real JUnit test passed. Record this as a runtime limitation for review.

This update records evidence for Team Lead review only. It does not self-accept a gate or merge PR #3.
