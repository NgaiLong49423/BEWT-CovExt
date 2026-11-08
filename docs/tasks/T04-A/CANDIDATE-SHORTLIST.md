# Candidate Shortlist

Status: PROPOSED_FOR_HUMAN_REVIEW. No ACCEPT/REVISE/REJECT decisions have been created.

| Rank | ID | Candidate | Reason |
|---:|---|---|---|
| 1 | KB-GAP-001 | Reopen a closed task | Direct inverse lifecycle with visible status and search oracle |
| 2 | KB-GAP-002 | Create and view a task comment | Persisted collaboration behavior with task-scoped oracle |
| 3 | KB-GAP-003 | Create a subtask | Parent-child relation distinct from top-level task creation |
| 4 | KB-GAP-004 | Change an existing task assignee | Common workflow with source-backed permission boundary |
| 5 | KB-GAP-008 | Edit an existing column | Complements baseline create/validation coverage with a direct UI path |

KB-GAP-004 requires a stable pre-seeded project/task, an active Manager/Member target in the same project, an actor allowed to update the task and change assignees, and an unauthorized-role negative control. The engineering recommendation is `KEEP_PROPOSED_WITH_ADDITIONAL_GUARDS`; it is not a Team Lead decision. Server-side rejection of a forged non-member owner ID remains `NOT_VERIFIED`.

Deferred candidates and reasons are recorded in [shortlist.json](../../../data/coverage/kanboard/shortlist.json). This prioritization considers source evidence, business value, UI oracle clarity, fixture cost, and repeatability risk. It does not establish novelty, feasibility, acceptance, or validation.
