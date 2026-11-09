# Baseline Overlap Matrix

The full 5 × 30 matrix is machine-readable at `data/reviews/kanboard/t04b-review-dataset.json`. It preserves case IDs, raw titles, observed behavior, test action, expected oracle, Java assertions, classification, rationale, and evidence references for each pair.

| Candidate | Related baseline cases | Relationship |
|---|---|---|
| KB-GAP-001 | KB-017, KB-018, KB-027 | Open/closed task filtering and closing are adjacent; reopening is not asserted. Keep state transition as primary oracle. |
| KB-GAP-002 | None identified | No baseline comment-create or task-comment-history assertion. |
| KB-GAP-003 | KB-003, KB-004 | Generic task title entry/required-title validation overlap; parent-child relationship is distinct. |
| KB-GAP-004 | None identified | Baseline task creation does not change or assert task assignment. |
| KB-GAP-008 | KB-006, KB-007 | Same entity type and title field, but baseline creates a new column; proposal updates an existing one. |

The remaining pairs are recorded `DISTINCT_BEHAVIOR_SUPPORTED` as a static mapping observation only. Do not interpret this as dataset-wide novelty or G1 acceptance.
