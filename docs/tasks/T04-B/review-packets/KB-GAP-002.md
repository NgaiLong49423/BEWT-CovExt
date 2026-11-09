# KB-GAP-002 — Create and view a task comment

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate version SHA-256: `6ce78f7b99fb089ba58d3409fad22e7502d13997e239cad758815f2ebdac833a`. Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Exact new comment appears in that task's comment history.

Preconditions:
- Existing visible task; authenticated user may comment.

Source evidence:
- [`app/Template/task_comments/create.php` L1](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task_comments/create.php#L1) — SHA-256 `cac16def5e15645f3c2c042914cfdfc9bb4c43f14670540a8f312aa333f14639`
- [`app/Template/task/sidebar.php` L50](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task/sidebar.php#L50) — SHA-256 `3ee86e19a97f2cb806a97bc76e48168d07e9722a0464c0c11f71b87d079969b7`
- [`app/Controller/CommentController.php` L44-L60](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/CommentController.php#L44-L60) — SHA-256 `5e84cb2c974810d85fa06f9dc3f446645caa3e6a46a06a23b16e58ecc27c3351`

## Baseline comparison

All 30 baseline cases were compared; see the machine-readable 150-row dataset. Partial overlaps: none identified. This static mapping is not proof of dataset-wide novelty.

## Technical recommendation

**RECOMMEND_ACCEPT** — Comment creation and task-scoped rendered history have no matching action/oracle in the 30 mapped cases.

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
