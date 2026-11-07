# T01-A — Workflow State and Checkpoint Design

## State transitions

`WorkflowStatus` is an engineering lifecycle, not a research result:

```text
STARTED → BASELINE_COLLECTED → CANDIDATES_GENERATED → AWAITING_HUMAN_REVIEW
  ├─ ACCEPTED_FOR_IMPLEMENTATION → JAVA_GENERATED → VALIDATING
  │  ├─ EXECUTION_COMPLETED
  │  └─ REPAIRING → VALIDATING (at most 2 repairs)
  ├─ REVISION_REQUIRED → CANDIDATES_GENERATED (same ID, revision + 1)
  └─ REJECTED (terminal)
Non-terminal states may become BLOCKED or FAILED when an error is recorded.
```

`VALIDATED` is absent from the workflow enum. It exists only as a `ValidationResult.researchStatus`, whose parser requires the full research acceptance evidence.

## Pause, checkpoint and resume

- The installed `@langchain/langgraph` version is 1.6.0. Its shipped `interrupt.d.ts` documents `interrupt(value)` and resumption with `Command({ resume })`; `graph/state.d.ts` exposes a `checkpointer` compile option.
- T01-A's `CheckpointReference` records `threadId`, `checkpointId`, pause time and expected resume status. `pauseAtHumanReview` records a logical checkpoint reference only; it does not persist a LangGraph checkpoint.
- T01-B should interrupt in the human-review node before Java generation, compile with `graph.compile({ checkpointer })`, and persist a server-generated `thread_id` mapped to the immutable run ID. Use a production-persistent saver for crash recovery; `MemorySaver` is process-local and suitable only for tests.
- On resume, load the saved graph state by exact thread/checkpoint, then validate run ID, app ID, source commit, candidate ID and revision. Each `HumanReviewDecision` carries run/thread/checkpoint identity and an applied decision ID so a stale or replayed decision is rejected.
- Verify the selected checkpoint is still awaiting the same review before applying the decision. Accept, revise and reject lead to distinct states; Java generation requires the exact accepted candidate and applied decision.
- Keep events/decisions append-only. Nodes may execute again around an interrupt, so side-effecting nodes need idempotency keys and evidence records.

## Failure and recovery limits

- `blockWorkflow` records an error and the exact resumable status. A blocked task can resume only to that recorded status; blocked/failed states without error context are invalid.
- A checkpoint ID is a reference, not proof of durable storage. No graph, saver, `interrupt`, resume, crash or recovery path runs in T01-A; crash recovery remains `NOT_TESTED`.
- Reviewer ID authentication belongs to the trusted review service in T01-B. A non-empty `reviewerId` is not authentication.
