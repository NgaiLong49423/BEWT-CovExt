# Baseline Overlap Matrix

The full 5 × 30 matrix is machine-readable at `data/reviews/kanboard/t04b-review-dataset.json`. It preserves case IDs, raw titles, observed behavior, test action, expected oracle, Java assertions, screening label/rule, pair rationale, semantic-review state, and commit-pinned source links and hashes for each pair.

| Candidate | Related baseline cases | Relationship |
|---|---|---|
| KB-GAP-001 | KB-017, KB-018, KB-027 | Open/closed task filtering and closing are adjacent; reopening is not asserted. Keep state transition as primary oracle. |
| KB-GAP-002 | None identified | No baseline comment-create or task-comment-history assertion. |
| KB-GAP-003 | KB-003, KB-004 | Generic task title entry/required-title validation overlap; parent-child relationship is distinct. |
| KB-GAP-004 | KB-013 | Partial overlap: baseline checks project authorized-user visibility/roles; the proposal changes and verifies an existing task assignee. Forged non-member `owner_id` rejection remains `INSUFFICIENT_EVIDENCE`. |
| KB-GAP-008 | KB-006, KB-007 | Same entity type and title field, but baseline creates a new column; proposal updates an existing one. |

The screening process flagged 8 pairs for partial overlap and found no direct overlap flag for the remaining 142. `NO_DIRECT_OVERLAP_FLAGGED` means only that the configured rule list did not flag that pair; it is **not** a finding of distinct behavior. All 150 pairs remain `PENDING_INDEPENDENT_REVIEW`, and no pair is marked novel or duplicate. The eight flagged pairs retain specific rationales and baseline/candidate evidence. Do not interpret the matrix as dataset-wide novelty or G1 acceptance.
