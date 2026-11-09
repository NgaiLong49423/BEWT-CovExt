# prestashop — G1 candidate review packet

**Review state:** PROPOSED ONLY — no novelty/oracle decision and no implementation approval.

- App/source version: 1.6.1.23
- Source pin: [PrestaShop/PrestaShop@475d65fbda93403cd1afde0db09764c5295e952c](https://github.com/PrestaShop/PrestaShop/tree/475d65fbda93403cd1afde0db09764c5295e952c) (tree `49d5f69067638991fca7bf7b16bf79700793cff4`; provenance PINNED_RELEASE_SOURCE_AVAILABLE)
- Baseline pin: BEWT @ `0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`)
- Dataset: [proposal bundle](../../../../data/coverage/prestashop/source-backed-gap-proposals.json), [shortlist](../../../../data/coverage/prestashop/source-backed-gap-shortlist.json), [baseline mapping](../../../../data/coverage/prestashop/baseline-mapping.json), [source index](../../T04-E/source-reference-index.json)
- Candidate count: 4; technical review order: 3. Order is not acceptance.
- G1: NOT_VERIFIED; behavioral denominator/RQ2: NOT_ESTABLISHED/NOT_EVALUATED.

## PS-GAP-001 — Cart-rule per-customer usage limit is enforced

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Customer and shop administrator / Admin configures; customer redeems.
- Proposed preconditions: Cart rule with quantity_per_user=1; customer account; eligible cart; rule unused by that customer.
- Proposed fixture/action: Redeem once, reset cart and attempt to redeem again as the same customer.
- Expected observable (oracle proposal, not approved): First redemption is accepted; second is rejected or omitted and the order total reflects no second discount.
- Negative control: A different customer can redeem if global quantity remains available.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline adds/edits products, customers and address data but has no mapped cart-rule redemption case.

Source references:
- [PS-S01](https://github.com/PrestaShop/PrestaShop/blob/475d65fbda93403cd1afde0db09764c5295e952c/classes/CartRule.php) — `classes/CartRule.php` lines 41-57,88-97,504-532; blob `762371fb28f33c162be00c92a47a409a4b331de7`. Cart-rule model carries per-customer quantity, minimum amount, carrier/product restrictions and checks validity.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Cart-rule per-customer usage limit is enforced
  Given Cart rule with quantity_per_user=1; customer account; eligible cart; rule unused by that customer.
  When Redeem once, reset cart and attempt to redeem again as the same customer.
  Then First redemption is accepted; second is rejected or omitted and the order total reflects no second discount.
  And A different customer can redeem if global quantity remains available.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Define first and second redemption as separate completed order/usage observations; reset the cart without resetting the per-customer usage record. Verify totals and usage count.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## PS-GAP-002 — Carrier eligibility follows configured price/weight range

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Customer and administrator / Admin configures; customer selects carrier.
- Proposed preconditions: Two carriers with disjoint price or weight ranges and an order cart on either side of the boundary.
- Proposed fixture/action: Proceed to carrier selection with cart value/weight below, at and above configured ranges.
- Expected observable (oracle proposal, not approved): The available-carrier calculation returns only carriers with a matching price/weight range when range_behavior requests deactivation; with fallback behavior enabled, the carrier remains eligible and the configured maximum-range price path applies.
- Negative control: Switch from price-based to weight-based range and ensure the other basis does not determine eligibility.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline address/category/product cases do not check shipping carrier selection or range boundaries.

Source references:
- [PS-S02](https://github.com/PrestaShop/PrestaShop/blob/475d65fbda93403cd1afde0db09764c5295e952c/classes/Carrier.php) — `classes/Carrier.php` lines 30-47,66-93,248-299,330-412,602-686,1283-1419; blob `704763700a5deb01b4f69fdc5a864e4c76e9d92d`. Carrier model calculates range-based delivery prices and filters carriers for an order; range_behavior=disabled removes out-of-range carriers, while other configured behavior permits fallback pricing.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Carrier eligibility follows configured price/weight range
  Given Two carriers with disjoint price or weight ranges and an order cart on either side of the boundary.
  When Proceed to carrier selection with cart value/weight below, at and above configured ranges.
  Then The available-carrier calculation returns only carriers with a matching price/weight range when range_behavior requests deactivation; with fallback behavior enabled, the carrier remains eligible and the configured maximum-range price path applies.
  And Switch from price-based to weight-based range and ensure the other basis does not determine eligibility.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Separate price-range and weight-range scenarios, and separately pin fallback mode. The current combined oracle has multiple branches that should not be conflated.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## PS-GAP-003 — Successful payment creates one order and applies stock synchronization

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Customer / Registered customer with checkout access.
- Proposed preconditions: One available product, known initial stock, valid address and deterministic test payment module.
- Proposed fixture/action: Complete checkout once; reload order confirmation and product stock.
- Expected observable (oracle proposal, not approved): Exactly one order/history entry exists and stock quantity changes according to configured stock-dependency mode.
- Negative control: Force payment validation failure and verify no completed order/stock decrement is falsely recorded.
- Baseline overlap screen: POTENTIAL_PARTIAL_OVERLAP_NOT_SEMANTICALLY_REVIEWED. Baseline out-of-stock validity concerns product state but does not exercise payment-to-order transition or stock delta.

Baseline references:
`prestashop-28-outofstockvalidity` — `prestashop/gherkin/28_OutOfStockValidity.feature` (Tries to create an order for an out of stock product and fails); Java `prestashop/baseline/prestashop-1.6.1.23/src/test/java/tests/OutOfStockValidity.java`, assertion refs 23:assertTrue.
`prestashop-01-addnewproduct` — `prestashop/gherkin/01_AddNewProduct.feature` (Adds a new product); Java `prestashop/baseline/prestashop-1.6.1.23/src/test/java/tests/AddNewProduct.java`, assertion refs 20:assertTrue.

Source references:
- [PS-S03](https://github.com/PrestaShop/PrestaShop/blob/475d65fbda93403cd1afde0db09764c5295e952c/classes/PaymentModule.php) — `classes/PaymentModule.php` lines 145-162,265-373,680-696,798-800; blob `74ab460c0115e2db281490bbc8cba72111d822f3`. Order validation writes order and history data and synchronizes stock where configured.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Successful payment creates one order and applies stock synchronization
  Given One available product, known initial stock, valid address and deterministic test payment module.
  When Complete checkout once; reload order confirmation and product stock.
  Then Exactly one order/history entry exists and stock quantity changes according to configured stock-dependency mode.
  And Force payment validation failure and verify no completed order/stock decrement is falsely recorded.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Use an offline deterministic payment module only. Pin stock-dependency mode and assert one order/history record plus the correct stock delta; no real payment provider.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:
