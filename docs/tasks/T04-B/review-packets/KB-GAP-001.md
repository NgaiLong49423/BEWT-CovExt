# KB-GAP-001 — Reopen a closed task

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate version SHA-256: `a68e50683c9e1e7de066af36c580a6bf1fc729661c898974dac76da0308e2707`. Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Visible Open status and status:open search returns the task.

Preconditions:
- Existing closed task; actor may open it.

Source evidence:
- [`app/Template/task/sidebar.php` L81](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task/sidebar.php#L81) — SHA-256 `3ee86e19a97f2cb806a97bc76e48168d07e9722a0464c0c11f71b87d079969b7`
- [`app/Controller/TaskStatusController.php` L28-L36](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/TaskStatusController.php#L28-L36) — SHA-256 `d39522563f1b0f15751092c84293ab22212c73bf9e7a96d772d20aa16253e8c6`
- [`app/Template/app/filters_helper.php` L11-L13](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/app/filters_helper.php#L11-L13) — SHA-256 `c02169955027781ed402246bc94cde889f46fb320b68363793e0b69bfd38797e`

## Baseline comparison

All 30 baseline cases were compared; see the machine-readable 150-row dataset. Partial overlaps: KB-017 (Searches for open tasks in a project); KB-018 (Closes a task); KB-027 (Searches for closed tasks in a project). This static mapping is not proof of dataset-wide novelty.

## Technical recommendation

**RECOMMEND_REVISE** — The state transition is distinct, but status:open search overlaps the already exercised filter facility; make reopen-and-observe-state the primary oracle.

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
