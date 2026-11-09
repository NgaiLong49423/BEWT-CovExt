# KB-GAP-001 - Reopen a Closed Task
Status: PROPOSED. Human decision: PENDING. Novelty: NOT_VERIFIED.

Evidence: pinned task sidebar exposes Open for a closed task; TaskStatusController::open changes status; filter helpers include status:open. Baseline KB-018 closes task 3 and KB-027 searches closed tasks; no baseline test reopens it.

Draft:
Given an existing task is closed and visible to the authorized user
When the user opens the task and selects Open
Then the task displays Open status
And the task appears in the status:open search results

Oracle: visible status plus query result. Risks: stable fixture and permission. Reviewer: check historical overlap and whether the selected target is repeatable.
