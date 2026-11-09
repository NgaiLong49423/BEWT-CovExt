# KB-GAP-004 — Change an existing task assignee

## Scope and evidence

Status: `PROPOSED`; official human decision: `PENDING`. Candidate definition SHA-256: `dfe8dff468d00146a44903447911894447ed57c29174e9e74475d8b0d67af598` (canonical record from `data/coverage/kanboard/gap-candidates.json`). Kanboard source pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.

Expected observable result: Modification form retains target assignee after save/reopen.

Preconditions:
- Use a stable fixture: a pre-seeded project and existing task with recorded fixture IDs and reset procedure.
- Actor is an active project member whose role permits both updating this task and changing its assignee; retain an unauthorized-role negative control.
- Target is an active, assignable member of the same project (Manager/Member, not Viewer); verify the candidate is selected from that project's assignable-user list.
- Keep target membership and actor permissions unchanged across reruns; do not rely on an unseeded or dynamically created user.
- Treat server-side rejection of a forged non-member owner_id as NOT_VERIFIED until a focused test proves that permission boundary.

Source evidence:
- [`app/Template/task_modification/show.php` L19](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Template/task_modification/show.php#L19) — SHA-256 `cbb27942e72a95c437e2ad663b5246dd78b25ff5999ae14c738e751102a81176`
- [`app/Controller/TaskModificationController.php` L136-L164](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/TaskModificationController.php#L136-L164) — SHA-256 `c5246d7310851828d9829cac28ba5f8676b3709e8575e481533b4254a8b8abc7`
- [`app/Controller/TaskModificationController.php` L81-L105](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Controller/TaskModificationController.php#L81-L105) — SHA-256 `c5246d7310851828d9829cac28ba5f8676b3709e8575e481533b4254a8b8abc7`
- [`app/Helper/TaskHelper.php` L115-L130](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Helper/TaskHelper.php#L115-L130) — SHA-256 `f2e0072f9a7380db7677b1d78b0cb1950a86a903feeabfd0b887fa524029c587`
- [`app/Model/ProjectUserRoleModel.php` L163-L197](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Model/ProjectUserRoleModel.php#L163-L197) — SHA-256 `1a42ab03aa99c71340f2b83455891d90c8fd753dcb20b294cbc98b1f6b725bd3`
- [`app/Helper/ProjectRoleHelper.php` L186-L214](https://github.com/kanboard/kanboard/blob/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b/app/Helper/ProjectRoleHelper.php#L186-L214) — SHA-256 `b117f44dd9c608e7be0d69805a6a9fe3b10ba316f2f45f8aa66ed87b3b8b629d`

## Technical review

**Baseline cases reviewed:** KB-013

**Oracle review:** With an authorized actor, assign one active same-project Manager/Member target and verify that exact assignee remains selected after save and reload; separately assert a role without change permission cannot perform the update.

**Implementation conditions:**
- Seed stable project, task, actor and one active direct same-project Manager/Member target.
- Verify the actor role permits both task update and assignee change.
- Keep target membership and role stable across repeats; do not treat Viewer as eligible.
- Include unauthorized-role negative control.
- Do not claim forged non-member owner_id rejection without a focused runtime test.

**Known risks:**
- UI selectors, fixture isolation, and repeatability are not runtime-verified.
- The inspected source builds the selectable list from active non-viewer project members and checks actor permissions; server-side enforcement of a forged non-member owner_id has not been established.

**Unresolved questions:**
- Does the UI save path enforce the proposed actor/target constraints under the pinned build?
- Does the unauthorized-role control fail at the UI boundary consistently?
- Is server-side rejection of forged non-member owner_id implemented? This remains INSUFFICIENT_EVIDENCE.

**Evidence for reviewer:** see pinned links above and pairwise entries for all 30 baseline cases. No live execution evidence was created.

## Fixture, reset and cleanup

- Fixture: Seed project/task/actor and one active direct same-project Manager/Member target; retain an unauthorized actor control.
- Reset: Fresh isolated DB/volume with membership and roles restored from the same fixture seed.
- Cleanup: Teardown only the owned instance; preserve no assumptions about forged owner_id server rejection.
- Runtime status: NOT_RUN

## Rubric assessment

See [T04-B Human Review Rubric](../HUMAN-REVIEW-RUBRIC.md). These qualitative statuses do not aggregate into acceptance.

## Baseline comparison

All 30 baseline cases were compared by rule-based screening; see the machine-readable 150-row dataset. Overlap flags: KB-013 (Check the users permissions on a project). Pairs labeled NO_DIRECT_OVERLAP_FLAGGED have not received independent semantic review and are not novelty findings.

## Technical recommendation

**RECOMMEND_REVISE** — Keep one assignee behavior with actor/target project-role controls; forged non-member owner rejection remains INSUFFICIENT_EVIDENCE.

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
