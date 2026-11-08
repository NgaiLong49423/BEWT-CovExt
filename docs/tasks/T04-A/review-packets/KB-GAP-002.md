# KB-GAP-002 - Create and View a Task Comment
Status: PROPOSED. Human decision: PENDING. Novelty: NOT_VERIFIED.

Evidence: task sidebar comment action; task_comments/create form; CommentController::save. Baseline contains no task comment creation/assertion.

Draft:
Given an existing task is visible and the user can comment
When the user submits a unique non-empty comment
Then the exact comment appears in that task's comment history after save

Oracle: rendered comment associated with selected task. Risks: unique content, cleanup, stable comment locator. Reviewer: compare historical research and confirm the rendered history is suitable as an oracle.
