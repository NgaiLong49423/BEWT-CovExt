# KB-GAP-008 — Edit an existing column

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate version SHA-256: `20136b8f8c82c03f67835e97371a1a5563b5717521ac2dbbf2cb9b5a9dd47275`. Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Board/list shows changed title after save.

Preconditions:
- Project with editable column.

Source evidence:
- [`app/Template/column/edit.php` L5-20](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/column/edit.php#L5-20) — SHA-256 `645c4d7615905c8214a00054a31dd684659c479425eae4ff8d227cfcd82126ab`
- [`app/Controller/ColumnController.php` L114-L143](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/ColumnController.php#L114-L143) — SHA-256 `1b3af43b10edf72517f933a023776367ea29ee75b9181468364dbfd36944edb7`

## Baseline comparison

All 30 baseline cases were compared; see the machine-readable 150-row dataset. Partial overlaps: KB-006 (Adds a new column); KB-007 (Tries to add a column without name and fails). This static mapping is not proof of dataset-wide novelty.

## Technical recommendation

**RECOMMEND_ACCEPT** — Editing an existing column is distinct from the baseline create-column and blank-create validation behavior.

This is not a Team Lead decision.

## Human decision record — intentionally blank

- Reviewer identity: null
- Review date: null
- Commit reviewed: null
- Decision: null
- Rationale: null
- Oracle confirmation: null
- Novelty assessment: null

G1 readiness: false. Runtime behavior, selectors, fixture/reset, and cleanup are not verified by this static review.
