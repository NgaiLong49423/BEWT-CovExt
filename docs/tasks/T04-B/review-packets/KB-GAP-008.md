# KB-GAP-008 — Edit an existing column

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate definition SHA-256: `20136b8f8c82c03f67835e97371a1a5563b5717521ac2dbbf2cb9b5a9dd47275` (canonical record from `data/coverage/kanboard/gap-candidates.json`). Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Board/list shows changed title after save.

Preconditions:
- Project with editable column.

Source evidence:
- [`app/Template/column/edit.php` L5-20](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/column/edit.php#L5-20) — SHA-256 `645c4d7615905c8214a00054a31dd684659c479425eae4ff8d227cfcd82126ab`
- [`app/Controller/ColumnController.php` L114-L143](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/ColumnController.php#L114-L143) — SHA-256 `1b3af43b10edf72517f933a023776367ea29ee75b9181468364dbfd36944edb7`

## Technical review

**Baseline cases reviewed:** KB-006, KB-007

**Oracle review:** Edit a pre-existing column, save, reload the same project board and assert the same column ID displays the unique replacement title.

**Implementation conditions:**
- Seed and record project and existing column IDs.
- Use a unique replacement title and preserve the column ID in the assertion.
- Verify the actor can edit project columns.
- Reset by isolated database/volume or restore the original title only after ownership is proven.

**Known risks:**
- UI selectors, fixture isolation, and repeatability are not runtime-verified.

**Unresolved questions:**
- Which stable UI route/locator opens edit for the intended column?
- Does the board view reflect the rename after reload without stale client state?

**Evidence for reviewer:** see pinned links above and pairwise entries for all 30 baseline cases. No live execution evidence was created.

## Fixture, reset and cleanup

- Fixture: Seed project and existing column; record their IDs and original title.
- Reset: Fresh isolated DB/volume or restore the original title on the exact owned column.
- Cleanup: Only restore/delete after verifying project and column IDs belong to the invocation.
- Runtime status: NOT_RUN

## Rubric assessment

See [T04-B Human Review Rubric](../HUMAN-REVIEW-RUBRIC.md). These qualitative statuses do not aggregate into acceptance.

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

- Conditions for implementation: null (human reviewer to complete)
- Reviewer evidence: null (human reviewer to attach)

G1 readiness: false. Runtime behavior, selectors, fixture/reset, and cleanup are not verified by this static review.
