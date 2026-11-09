# KB-GAP-003 — Create a subtask under a task

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate version SHA-256: `89f5b4023b698f63e29401818b4e27617dda5bd760ac4ac5a33ee365acc4cc23`. Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Child title appears in the parent's subtask section.

Preconditions:
- Existing parent task and permitted actor.

Source evidence:
- [`app/Template/subtask/create.php` L15](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/subtask/create.php#L15) — SHA-256 `ba9bfc92f2237acffc885f335102a6a002292e0c6bea90a715611d0847b5ecdb`
- [`app/Template/task/sidebar.php` L41](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task/sidebar.php#L41) — SHA-256 `3ee86e19a97f2cb806a97bc76e48168d07e9722a0464c0c11f71b87d079969b7`
- [`app/Controller/SubtaskController.php` L65-L113](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/SubtaskController.php#L65-L113) — SHA-256 `5c5d8280fcbbcb85bfd710d3c962c22bc55967afd98b4ef17aa4b6821aed057b`

## Baseline comparison

All 30 baseline cases were compared; see the machine-readable 150-row dataset. Partial overlaps: KB-003 (Adds a new task to a project); KB-004 (Tries to  add a task without title and fails). This static mapping is not proof of dataset-wide novelty.

## Technical recommendation

**RECOMMEND_ACCEPT** — Top-level task creation overlaps generic title entry, while parent-child identity and subtask listing are distinct assertions.

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
