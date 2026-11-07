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
- Restart recovery is tested by reconstructing the adapter in a fresh instance in the same Node process; an OS-level kill/restart exactly between fixture startup and graph checkpoint was not induced. Recovery still requires valid persisted owner metadata and exact Docker labels.
- Technical eligibility remains `UNVERIFIED`; oracle and novelty remain `UNVERIFIED`; research acceptance remains `NOT_REVIEWED`. G2 and D1 are not accepted. The 8-application / 40-case scope and historical Sprint 01–05 records are unchanged.
- This report proposes the task for review only. Do not merge PR #3 or begin T02 before Team Lead review.
