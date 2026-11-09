# Fixture and Reset Assessment

Use a fresh, isolated Kanboard instance/database for each invocation with a stable seeded project, task, parent task, column, actor, and (for KB-GAP-004) active same-project target. Record fixture IDs in run evidence, use unique synthetic values, and assert the resulting object identity as well as its visible state. Teardown must be scoped to resources whose invocation ownership is verified.

| Candidate | Stable fixture | Isolation and reset proposal | Runtime status |
|---|---|---|---|
| 001 | Existing closed task with recorded project/task IDs and authorized actor | Fresh isolated database per attempt; restore closed state only within owned fixture | NOT_RUN |
| 002 | Two recorded tasks, authenticated commenter, unique synthetic comment | Prefer fresh isolated database; task-scoped delete only after ownership and association checks | NOT_RUN |
| 003 | Recorded parent task and created child ID | Delete only created child after parent linkage/ownership check, otherwise reset isolated database | NOT_RUN |
| 004 | Project, task, actor and active direct same-project Manager/Member target | Keep role membership fixed; isolated database reset; include unauthorized-role control | NOT_RUN |
| 008 | Existing project and column IDs plus original title | Reset isolated database or restore title only after verifying exact owned column | NOT_RUN |

T03-A reset/cleanup records contain two historical smoke runs and are feasibility evidence only. They do not change shared G0 from `NOT_VERIFIED`; T04-B performs no Docker reset or live fixture run. Stable selectors, seed reproducibility, reset behavior, and cleanup ownership therefore remain unverified runtime prerequisites for implementation.

For KB-GAP-004, use a direct active project member with Manager/Member role as the target, keep actor permission stable, and include a role-based unauthorized negative control. Do not claim forged non-member owner-ID rejection without a focused runtime test.
