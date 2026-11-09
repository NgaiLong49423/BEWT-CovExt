# KB-GAP-003 — Create a subtask under a task

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate definition SHA-256: `89f5b4023b698f63e29401818b4e27617dda5bd760ac4ac5a33ee365acc4cc23` (canonical record from `data/coverage/kanboard/gap-candidates.json`). Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Child title appears in the parent's subtask section.

Preconditions:
- Existing parent task and permitted actor.

Source evidence:
- [`app/Template/subtask/create.php` L15](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/subtask/create.php#L15) — SHA-256 `ba9bfc92f2237acffc885f335102a6a002292e0c6bea90a715611d0847b5ecdb`
- [`app/Template/task/sidebar.php` L41](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task/sidebar.php#L41) — SHA-256 `3ee86e19a97f2cb806a97bc76e48168d07e9722a0464c0c11f71b87d079969b7`
- [`app/Controller/SubtaskController.php` L65-L113](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/SubtaskController.php#L65-L113) — SHA-256 `5c5d8280fcbbcb85bfd710d3c962c22bc55967afd98b4ef17aa4b6821aed057b`
- [`app/Model/SubtaskModel.php` L117-L123](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Model/SubtaskModel.php#L117) — SHA-256 `d5caa19e6d29c115428a154ad1f67869a4991240b5bac2fcf00f1596efad9c61`
- [`app/Template/task/show.php` L13-L18](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task/show.php#L13) — SHA-256 `02468fe0c39ea66e78189903853bab1c70b36879ec4a14cf788150078af946f8`
- [`app/Template/subtask/show.php` L1-L8](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/subtask/show.php#L1) — SHA-256 `37f905a21ac023a9df0d222adb6b80eb12a48464de986f162c13e06339c374c8`

## Technical review

**Baseline cases reviewed:** KB-003, KB-004

**Oracle review:** Create one uniquely named child from a pinned parent task and verify the child is listed under that exact parent and linked to the expected parent ID.

**Implementation conditions:**
- Seed and record the parent task ID.
- Use a unique child title and capture the created child ID.
- Assert parent-child association, not just title presence in a global task list.
- Cleanup only the created child after ownership and parent association are verified, or reset the isolated database.

**Known risks:**
- UI selectors, fixture isolation, and repeatability are not runtime-verified.

**Unresolved questions:**
- Does the pinned UI expose a stable parent-scoped subtask list after redirect?
- Can cleanup delete only the new child without cascading to unrelated tasks?

**Evidence for reviewer:** see pinned links above and pairwise entries for all 30 baseline cases. No live execution evidence was created.

## Fixture, reset and cleanup

- Fixture: Seed one parent task and capture the child ID created by this invocation.
- Reset: Fresh isolated DB/volume or return the parent to a verified empty-subtask state.
- Cleanup: Delete only the child after verifying its ID and parent_id; never delete the parent as cleanup.
- Runtime status: NOT_RUN

## Rubric assessment

See [T04-B Human Review Rubric](../HUMAN-REVIEW-RUBRIC.md). These qualitative statuses do not aggregate into acceptance.

## Baseline comparison

All 30 baseline cases were compared by rule-based screening; see the machine-readable 150-row dataset. Overlap flags: KB-003 (Adds a new task to a project); KB-004 (Tries to  add a task without title and fails). Pairs labeled NO_DIRECT_OVERLAP_FLAGGED have not received independent semantic review and are not novelty findings.

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

- Conditions for implementation: null (human reviewer to complete)
- Reviewer evidence: null (human reviewer to attach)

G1 readiness: false. Runtime behavior, selectors, fixture/reset, and cleanup are not verified by this static review.
