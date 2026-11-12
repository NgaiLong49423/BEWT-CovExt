# Human Decision Packet — KB-GAP-001 Revision 7

## Decision requested

Review whether the candidate's Gherkin wording should identify the Kanboard sidebar action by its visible label or by the lifecycle operation it performs.

## Evidence

- Candidate: `KB-GAP-001`, “Reopen a closed task”.
- Gherkin SHA-256 remains `f14129dbbe8ef3788643689cdea05678e09372d2fc6e5961a02d9cbe1d67bf62`.
- The Gherkin says the visible link is **“Reopen this task”**.
- The pinned upstream source commit is `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`. In `app/Template/task/sidebar.php`, its inactive-task branch renders **“Open this task”** and routes to `TaskStatusController::open`.
- The preliminary R6 run reached the closed task, then failed to locate the Gherkin's literal label. The sanitized JUnit is recorded under run `g3-kb-gap001-r6-20261112-prelim-a`; cleanup passed with zero residual resources.
- Revision 7 keeps the Gherkin unchanged and targets the visible “Open this task” action, which is the source-backed operation that transitions the task to open. This is a proposed implementation, not a human decision.

## Reviewer response

- Semantic equivalence accepted: `PENDING`
- Gherkin wording correction required: `PENDING`
- Oracle invalid / candidate rejected: `PENDING`
- Reviewer identity, timestamp, rationale/signature: not supplied

No human approval or scientific validation is inferred from this packet.
