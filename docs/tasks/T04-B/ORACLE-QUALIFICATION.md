# Oracle Qualification

Candidate expected results must be visible through the application UI and tied to the exact entity under test. Proposed oracle framing:

- **001:** Reopen the known closed task; verify its displayed state becomes Open. The existing `status:open` search may corroborate, but must not be the novelty-bearing primary oracle because the filter facility is already covered.
- **002:** Submit a unique synthetic comment and verify the exact text appears in that task's comment history, not another task.
- **003:** Create a child under a pinned parent and verify child identity and parent association in the parent's subtask area.
- **004:** Assign one stable pre-seeded eligible same-project target and verify the selected assignee after save/reopen; separately retain an unauthorized actor/role control. No claim is made that the server rejects a forged non-member `owner_id`.
- **008:** Rename a pre-existing column and verify the same column identity shows the new title after save.

Static source inspection cannot establish locator stability, persistence on a live instance, permission-boundary behavior, or semantic correctness under runtime conditions. Oracle confirmation remains null for every human review record.
