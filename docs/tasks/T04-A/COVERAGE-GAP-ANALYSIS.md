# Coverage Gap Analysis

Source comparison used all 30 cases at BEWT commit `0501249ff3e9a5ea83a06155cd2971dc36197056` and source implementation at Kanboard commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`. Candidate source files are hash-indexed in [provenance-index.json](../../../data/coverage/kanboard/provenance-index.json). Ten proposals are in [gap-candidates.json](../../../data/coverage/kanboard/gap-candidates.json).

| ID | Proposed behavior | Baseline comparison | Main uncertainty |
|---|---|---|---|
| KB-GAP-001 | Reopen a closed task | Baseline closes and searches closed tasks, no reopen assertion | Fixture permissions and repeatability |
| KB-GAP-002 | Create and view a task comment | No comment creation/assertion | Stable rendered comment locator and cleanup |
| KB-GAP-003 | Create a subtask | Only top-level task creation asserted | Child cleanup without disturbing parent |
| KB-GAP-004 | Change an existing task assignee | No task assignment update assertion | Membership and role permission preconditions |
| KB-GAP-005 | Set due date and use a date filter | Baseline search uses status filters only | Controlled clock, timezone and locale |
| KB-GAP-006 | Move task between board columns | No task column movement assertion | Selenium drag/drop reliability |
| KB-GAP-007 | Assign a category to an existing task | Categories are created but not assigned to tasks | Best stable user-visible oracle |
| KB-GAP-008 | Edit an existing column | Baseline creates/validates columns only | Unique fixture and board refresh |
| KB-GAP-009 | Change a project member role | Existing admin access is inspected; role is not mutated | AJAX confirmation and last-manager invariant |
| KB-GAP-010 | Edit a swimlane description | Baseline creates/validates swimlanes only | Description visibility and cleanup |

All are `PROPOSED`; semantic novelty and historical overlap require Team Lead review. Search found no Kanboard-specific item in `docs/research-results/final/`, which is not proof of novelty. No runtime feasibility or oracle has been validated.
