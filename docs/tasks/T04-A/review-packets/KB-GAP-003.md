# KB-GAP-003 - Create a Subtask
Status: PROPOSED. Human decision: PENDING. Novelty: NOT_VERIFIED.

Evidence: parent task sidebar action, subtask create form, SubtaskController::save. Baseline creates top-level tasks but never asserts a parent-child relationship.

Draft:
Given an existing parent task is visible
When the user creates a subtask with a unique title
Then the new title is listed in the parent's subtask section

Oracle: child displayed within parent task. Risks: cleanup child without removing parent; confirm repeatability. Reviewer: check historical overlap and whether child lifecycle is in scope.
