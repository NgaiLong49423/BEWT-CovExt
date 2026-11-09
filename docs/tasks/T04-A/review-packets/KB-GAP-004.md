# KB-GAP-004 - Change an Existing Task Assignee

- Candidate status: PROPOSED
- Team Lead decision: PENDING
- Novelty: NOT_VERIFIED
- Technical recommendation: KEEP_PROPOSED_WITH_ADDITIONAL_GUARDS (engineering recommendation only; not a candidate decision)

## Source evidence

- `app/Template/task_modification/show.php` L19 renders the assignee field.
- `app/Controller/TaskModificationController.php` L81-L105 loads the existing task and uses `getAssignableUsersList(task.project_id)` for the edit form.
- `app/Model/ProjectUserRoleModel.php` L163-L197 returns active project users whose role is not Viewer; the model comment identifies Manager and Member as assignable roles.
- `app/Helper/TaskHelper.php` L115-L130 hides the assignee field when the actor cannot change assignees.
- `app/Controller/TaskModificationController.php` L154-L164 checks actor permissions before applying an assignee change.
- `app/Helper/ProjectRoleHelper.php` L186-L214 defines the `canChangeAssignee` and `canUpdateTask` role checks.

Every source reference is pinned to Kanboard commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` and is present in `data/coverage/kanboard/provenance-index.json`.

## Proposed fixture conditions

1. Use a stable, pre-seeded project and existing task; record fixture IDs and reset procedure.
2. Actor is an active project member whose role permits updating the task and changing its assignee.
3. Target is an active assignable member of the same project (Manager or Member, not Viewer), selected from that project's assignable-user list.
4. Keep membership and permissions unchanged across reruns. Do not rely on a dynamically created or unseeded user.
5. Include an unauthorized-role negative control.
6. Treat server-side rejection of a forged non-member `owner_id` as NOT_VERIFIED until a focused test establishes that boundary.

## Draft scenarios - pending human review

### Authorized actor assigns an eligible project member

Given a stable project with an existing task and an active Manager or Member target
And the actor can update the task and change its assignee
When the actor assigns the task to the target and saves the form
Then the target remains selected after reopening the task form

### Actor without assignee permission is rejected

Given a stable project with an existing task and an eligible target member
And the actor role cannot change assignees
When the actor attempts to change the assignee
Then the request is denied and the stored assignee remains unchanged

## Baseline comparison and limitations

Baseline task creation does not assert changing an existing task's assignee. This is a proposal only; baseline absence does not prove novelty. The inspected source demonstrates the UI's assignable-user list and actor permission checks. It does not, by itself, establish rejection of a forged non-member owner ID. Selectors, fixture reset, runtime behavior, repeatability, historical overlap, oracle, and novelty remain unverified.
