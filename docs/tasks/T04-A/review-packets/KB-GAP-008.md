# KB-GAP-008"éÝyø§yÔ Edit an Existing Column

Status: PROPOSED. Human decision: PENDING. Novelty: NOT_VERIFIED.

Evidence: column edit form posts to ColumnController::update; controller validates and updates title/task limit/description. Baseline creates columns and tests empty-title validation, but does not edit an existing column.

Draft:
Given a project has an editable board column
When the user changes its title and saves
Then the board/list displays the new title after reload

Oracle: visible column title. Risks: unique title fixture and board refresh. Reviewer: inspect historical overlap and verify no existing maintenance test covers the same update semantics.
