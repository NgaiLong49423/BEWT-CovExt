# Oracle Qualification

Candidate expected results must be visible through the application UI and tied to the exact entity under test. Proposed oracle framing:

- **001:** Reopen the known closed task; verify its displayed state becomes Open. The existing `status:open` search may corroborate, but must not be the novelty-bearing primary oracle because the filter facility is already covered.
- **002:** Submit a unique synthetic comment, reload the task view, and verify the exact text appears in that task's comment history and not a second control task.
- **003:** Create a uniquely named child under a pinned parent and verify child identity and parent association in the parent's subtask area; title-only presence is insufficient.
- **004:** Assign one stable pre-seeded eligible same-project target and verify the selected assignee after save/reopen; separately retain an unauthorized actor/role control. No claim is made that the server rejects a forged non-member `owner_id`.
- **008:** Rename a pre-existing column and verify the same column ID shows the new title after save and reload.

The technical packets also state candidate-specific baseline comparisons, implementation conditions, known risks and unresolved questions. Human oracle confirmation remains null.

Static source inspection cannot establish locator stability, persistence on a live instance, permission-boundary behavior, or semantic correctness under runtime conditions. Oracle confirmation remains null for every human review record.
