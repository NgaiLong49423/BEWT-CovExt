# Fixture and Reset Assessment

Use a fresh, isolated Kanboard instance/database for each invocation with a stable seeded project, task, parent task, column, actor, and (for KB-GAP-004) active same-project target. Record fixture IDs in run evidence, use unique synthetic values, and assert the resulting object identity as well as its visible state. Teardown must be scoped to resources whose invocation ownership is verified.

T03-A reset/cleanup records contain two historical smoke runs and are feasibility evidence only. They do not change shared G0 from `NOT_VERIFIED`; T04-B performs no Docker reset or live fixture run. Stable selectors, seed reproducibility, reset behavior, and cleanup ownership therefore remain unverified runtime prerequisites for T04-C/implementation.

For KB-GAP-004, use a direct active project member with Manager/Member role as the target, keep actor permission stable, and include a role-based unauthorized negative control. Do not claim forged non-member owner-ID rejection without a focused runtime test.
