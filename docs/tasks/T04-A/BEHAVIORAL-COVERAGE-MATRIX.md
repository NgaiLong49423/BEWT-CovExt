# Behavioral Coverage Matrix

Evidence: all 30 pinned baseline feature/Java mappings in [inventory.json](../../../data/coverage/kanboard/inventory.json); case-level sources and hashes are in [provenance-index.json](../../../data/coverage/kanboard/provenance-index.json).

| Behavior group | Cases | Baseline assertions observed | Assessment |
|---|---:|---|---|
| Project management | 5 | Create (public/private), required-name rejection, description edit, remove | Covered for these paths; broader project lifecycle partial |
| Task management | 5 | Create, required-title rejection, close, search open/closed | Partial lifecycle; reopen, assignment, dates, comments and subtasks are candidate areas |
| Board configuration | 6 | Create and required-name checks for columns, swimlanes and categories | Create/validation covered; update, reordering and assignment remain unasserted |
| User and permission management | 9 | Local/remote account creation, invalid input cases, remove user, existing access check | Account flows represented; project role mutation not tested |
| Profile management | 1 | Update profile email | Covered for the single asserted path |
| Application settings | 4 | Reference currency, language round trip, refresh interval, currency rate | Covered for listed settings only |

Classification is limited to assertions in this baseline. An adjacent flow or missing exact tag does not prove a gap or research novelty. Gherkin and Java title/assertion conflicts are recorded in case review flags.
