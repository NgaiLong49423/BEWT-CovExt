# T04-E — Behavior and baseline mapping review

This is a static source-pinned review. It identifies behavior paths and testable hypotheses; it does not establish runtime behavior, semantic novelty or RQ2 gain. All candidates remain `PROPOSED`, `SOURCE_SUPPORTED_PROPOSAL`, and novelty `NOT_VERIFIED`.

| App | Source-supported behavior groups | Baseline comparison |
|---|---|---|
| Bludit | Scheduled publish state, cover image, post/page type, administrator role update | Related add-content/date/URL/parent/user cases exist; exact proposed oracles are not asserted. |
| Claroline | Course document operations, group authorization, exercise import, teacher tracking rights | Course enrollment/access/exercise cases create partial overlap; document lifecycle/import are not mapped. Release source is partial. |
| ExpressCart | Order create/state update, product/variant stock, customer address, discount date validation | Product/cart/coupon cases partly overlap; no mapped order or customer-address case. Compared with Sprint EC-C01..C05; EC-GAP-004 tests invalid date windows, unlike EC-C01 discount removal. |
| Joomla | Featured flag, publication windows, edit-state ACL, article version counter | Article create/edit/archive and user-group cases are adjacent, not proof of the selected state oracles. |
| MantisBT | Per-user monitoring, private note/time tracking, issue relationships, attachment upload | Issue CRUD/status cases are adjacent; subproject links are only a partial analogue to issue relationships. |
| MediaWiki | Page move/redirect, user watchlist, upload validation, revision lookup | Page CRUD/redirect/revert cases partly overlap move/revision; watchlist and upload are not mapped. |
| PrestaShop | Cart-rule usage limits, carrier ranges, order validation/history and stock sync, stock quantity | Product/out-of-stock tests partly overlap inventory; no mapped coupon redemption, carrier boundary or payment/order flow. |

Baseline overlap labels are screening descriptions, not semantic verdicts. Exact case IDs and source refs are in each JSON candidate record. T04-D structural maps and heuristic tags are not treated as behavioral proof or a denominator.

Each app has four proposals and a three-item technical review order. Order reflects source clarity and fixture/oracle feasibility only; it is not acceptance or implementation approval. Human reviewers still need to inspect all baseline scenarios/assertions, confirm UI/runtime behavior and decide novelty/fixture feasibility. No decision ledger was written.
