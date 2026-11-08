# KB-GAP-004"éÝyø§yÔ Change an Existing Task Assignee

Status: PROPOSED. Human decision: PENDING. Novelty: NOT_VERIFIED.

Evidence: task modification form renders assignee field; TaskModificationController validates and applies updates and checks assignee permission. Baseline task creation does not set or assert an assignee.

Draft:
Given an existing task and eligible project member
When the authorized user assigns the task to that member
Then the modification view shows the selected member after save and reopen

Oracle: selected assignee persisted and displayed. Risks: project membership and role setup; exact display locator. Reviewer: verify fixture permissions and historical overlap.
