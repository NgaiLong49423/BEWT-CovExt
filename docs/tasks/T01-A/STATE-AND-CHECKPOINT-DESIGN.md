# T01-A — Workflow State and Checkpoint Design

## State transitions

`WorkflowStatus` is an engineering lifecycle, not a research result:

```text
STARTED → BASELINE_COLLECTED → CANDIDATES_GENERATED → AWAITING_HUMAN_REVIEW
  ├─ ACCEPTED_FOR_IMPLEMENTATION → JAVA_GENERATED → VALIDATING
  │  ├─ EXECUTION_COMPLETED
  │  └─ REPAIRING → VALIDATING (at most 2 repairs)
  ├─ REVISION_REQUIRED → CANDIDATES_GENERATED (same ID, revision + 1; preserve review ledger)
  └─ REJECTED (terminal)
Non-terminal states may become BLOCKED or FAILED when an error is recorded.
```

`VALIDATED` is not a workflow status or an agent-settable boolean. `parseValidationResult` derives `technicalEligibility` from source-pinned compile/fixture/E2E/cleanup stage records grouped under invocation IDs. It permits partial records: `NOT_RUN` has no stage run or execution evidence; `BLOCKED` may represent a pre-execution block; FAIL and INCONCLUSIVE remain distinct. Repeat records are zero to three distinct invocations, not individual stage runs. Only three complete PASS repeats and all primary PASS stages derive `ELIGIBLE`; partial/inconclusive records are `UNVERIFIED`, while a recorded FAIL is `INELIGIBLE`. Research acceptance is a separate `researchAcceptance` decision with a reviewer reference and evidence, and cannot override technical eligibility. An accepted record is still only a validated data contract; the T01-B runtime must authenticate the reviewer and independently verify referenced evidence before a research gate can accept it.

## Pause, checkpoint and resume

- The installed `@langchain/langgraph` version is 1.6.0. Its shipped `interrupt.d.ts` documents `interrupt(value)` and resumption with `Command({ resume })`; `graph/state.d.ts` exposes a `checkpointer` compile option.
- T01-A's `CheckpointReference` records `threadId`, `checkpointId`, pause time and expected resume status. `pauseAtHumanReview` records a logical checkpoint reference only; it does not persist a LangGraph checkpoint.
- T01-B should interrupt in the human-review node before Java generation, compile with `graph.compile({ checkpointer })`, and persist a server-generated `thread_id` mapped to the immutable run ID. Use a production-persistent saver for crash recovery; `MemorySaver` is process-local and suitable only for tests.
- On resume, load the saved graph state by exact thread/checkpoint, then validate run ID, app ID, source commit, candidate ID and revision. Each `HumanReviewDecision` carries run/thread/checkpoint identity and an applied decision ID so a stale or replayed decision is rejected.
- Verify the selected checkpoint is still awaiting the same review before applying the decision. Accept, revise and reject lead to distinct states; Java generation requires the exact accepted candidate and applied decision.
- `reviewDecisions` and `appliedDecisionIds` are append-only across revisions. `submitReviewDecision` consumes the active checkpoint pointer while the decision keeps its run/thread/checkpoint identity. `reviseCandidate` preserves both ledgers and clears the prior checkpoint. Before a new review, `pauseAtHumanReview` requires a checkpoint ID unused by any prior decision; the parser also rejects an active review checkpoint already present in history. Java generation requires an applied ACCEPT for the exact active candidate revision, so an earlier revision's approval cannot authorize the revised candidate.
- Nodes may execute again around an interrupt, so side-effecting nodes need idempotency keys and evidence records.

## Failure and recovery limits

- `blockWorkflow` records an error and the exact resumable status. A blocked task can resume only to that recorded status; blocked/failed states without error context are invalid.
- A checkpoint ID is a reference, not proof of durable storage. No graph, saver, `interrupt`, resume, crash or recovery path runs in T01-A; crash recovery remains `NOT_TESTED`.
- Reviewer ID authentication and evidence-path content verification belong to the trusted review service in T01-B. A non-empty `reviewerId` and a syntactically valid evidence reference are not proof of identity or artifact contents.
