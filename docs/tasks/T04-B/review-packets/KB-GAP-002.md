# KB-GAP-002 — Create and view a task comment

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate definition SHA-256: `6ce78f7b99fb089ba58d3409fad22e7502d13997e239cad758815f2ebdac833a` (canonical record from `data/coverage/kanboard/gap-candidates.json`). Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Exact new comment appears in that task's comment history.

Preconditions:
- Existing visible task; authenticated user may comment.

Source evidence:
- [`app/Template/task_comments/create.php` L1](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task_comments/create.php#L1) — SHA-256 `cac16def5e15645f3c2c042914cfdfc9bb4c43f14670540a8f312aa333f14639`
- [`app/Template/task/sidebar.php` L50](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task/sidebar.php#L50) — SHA-256 `3ee86e19a97f2cb806a97bc76e48168d07e9722a0464c0c11f71b87d079969b7`
- [`app/Controller/CommentController.php` L44-L60](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/CommentController.php#L44-L60) — SHA-256 `5e84cb2c974810d85fa06f9dc3f446645caa3e6a46a06a23b16e58ecc27c3351`
- [`app/Model/CommentModel.php` L56-L76](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Model/CommentModel.php#L56) — SHA-256 `e0d108970059f54813ccda3df018446f312807a503cbbad240cf07d4e008dda9`
- [`app/Model/CommentModel.php` L130-L140](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Model/CommentModel.php#L130) — SHA-256 `e0d108970059f54813ccda3df018446f312807a503cbbad240cf07d4e008dda9`
- [`app/Template/task/show.php` L45-L51](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task/show.php#L45) — SHA-256 `02468fe0c39ea66e78189903853bab1c70b36879ec4a14cf788150078af946f8`
- [`app/Template/task_comments/show.php` L14-L23](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task_comments/show.php#L14) — SHA-256 `7eaf3d3a0e314594fff9a6d41dced23fb6f3f4afb2dad153ee26ab20a51f434d`

## Technical review

**Baseline cases reviewed:** No directly related baseline action/oracle identified; all 30 pair rows remain available.

**Oracle review:** Submit a unique synthetic comment to a known task, reload the task view, and assert exact text appears in that task comment history; confirm it does not appear in a second control task.

**Implementation conditions:**
- Seed two tasks and retain their IDs.
- Use unique synthetic comment text per invocation; do not use personal data.
- Verify the submitter is authenticated and comment creation is permitted.
- Reload the task view before asserting persistence; reset with a fresh isolated database/volume or verified task-scoped cleanup.

**Known risks:**
- UI selectors, fixture isolation, and repeatability are not runtime-verified.

**Unresolved questions:**
- Are comment timestamps/ordering stable enough to locate the new entry?
- Is a fresh database the only acceptable cleanup path for comments?

**Evidence for reviewer:** see pinned links above and pairwise entries for all 30 baseline cases. No live execution evidence was created.

## Fixture, reset and cleanup

- Fixture: Seed two tasks and an authenticated commenter; generate unique synthetic comment text and retain both task IDs.
- Reset: Prefer fresh isolated DB/volume because comments are append-like test data.
- Cleanup: Use owner-verified task-scoped comment cleanup only if independently demonstrated; otherwise teardown the isolated instance.
- Runtime status: NOT_RUN

## Rubric assessment

See [T04-B Human Review Rubric](../HUMAN-REVIEW-RUBRIC.md). These qualitative statuses do not aggregate into acceptance.

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

- Conditions for implementation: null (human reviewer to complete)
- Reviewer evidence: null (human reviewer to attach)

G1 readiness: false. Runtime behavior, selectors, fixture/reset, and cleanup are not verified by this static review.
