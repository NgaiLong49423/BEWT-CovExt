# T05-B — Current `main` and T04-E reconciliation

- Reviewed T05-B HEAD: `0b6e9803acfd8c70ce252fd6a1fc798e77dc8b9c`.
- Current `origin/main`: `bd9b3b15fca28419ada9862b8a65bac910edf169` (merge of PR #16 / T04-E).
- Merge base: `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb`.
- GitHub PR #15 remained OPEN/DRAFT and `MERGEABLE`/`CLEAN` at inspection. No synchronization was needed. No rebase, merge, reset, or force-push was performed.

## Change-scope comparison

The current-main commits since the merge base merge T04-E's source-backed gap proposal data and documentation. The ExpressCart additions are `data/coverage/expresscart/source-backed-gap-proposals.json` and `data/coverage/expresscart/source-backed-gap-shortlist.json`; there are no current-main changes to `framework/src/runtime/model-provider.ts`, `framework/src/t01c-cli.ts`, `framework/test/model-provider.test.ts`, `config/apps/expresscart.json`, or an ExpressCart schema. T04-E pins the same ExpressCart source commit `b31302f4e99c3293bd742c6d076a721e168118b0`, tree `d98ab97ab9ea1b007104f485e36098fdd2c16b61`, and BEWT baseline commit `0501249ff3e9a5ea83a06155cd2971dc36197056` as the T05-B analysis context. Its data is separate from the T05-B proposal/report; no T04-E files or T04-D mappings were edited.

## Three T04-E ExpressCart proposals

| ID | Proposed behavior | Shortlist |
|---|---|---|
| `EC-GAP-002` | Reject a cart quantity above available product/variant stock when stock tracking is enabled; preserve previous cart quantity. | Rank 1 |
| `EC-GAP-003` | Persist customer address update and use session address fields as the order-snapshot fallback when the request omits address fields. | Rank 2 |
| `EC-GAP-004` | Reject invalid discount date-window updates and preserve stored values. | Not in the two-item technical shortlist |

All three remain `PROPOSED` and `noveltyStatus: NOT_VERIFIED`; T04-E states that its shortlist is review order only, not human acceptance or implementation approval. The ExpressCart proposal file reports `candidateCount: 3`, `shortlistCount: 2`; `EC-GAP-001` was removed and its ID was not reused.

## Relationship to T05-B

T05-B's offline proposal is narrower: an invalid/expired password-reset token request to `/customer/reset/:token` redirects to `/forgot`. It asserts neither existence of the destination page nor visible message behavior. This behavior is distinct from over-stock rejection (`EC-GAP-002`) and invalid discount dates (`EC-GAP-004`). `EC-GAP-003` is in the customer domain and source file family, but covers `/customer/update` address persistence and order-snapshot fallback; it does not cover reset-token validation or redirect behavior. Thus there is no direct behavior-level overlap with the three new T04-E proposals based on their recorded oracles.

The historical T04-D item `EC-C04` is a forgotten-password response and remains an adjacent overlap cue for T05-B. Neither T04-E's proposals nor the source pin decide semantic novelty for the reset-token redirect. T05-B novelty and reviewer/oracle decision remain `UNVERIFIED`/`NOT_RUN`; no candidate is substituted or accepted. The broader program objective remains eight applications / up to five new cases each; this reconciliation does not narrow that scope.

## Decision

Do not synchronize T05-B with current `main` in this correction: GitHub reports the PR mergeable and clean, T04-E's additions are separate data/docs, and no conflicting source/schema/task requirement was found. Keep D-C1 `NOT_APPROVED`, live generation `BLOCKED_AUTHORIZATION`, and `docs/program/STATUS.json` unchanged.
