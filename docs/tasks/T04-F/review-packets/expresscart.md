# expresscart — G1 candidate review packet

**Review state:** PROPOSED ONLY — no novelty/oracle decision and no implementation approval.

- App/source version: 1.1.19 (BEWT label 1.19)
- Source pin: [mrvautin/expressCart@b31302f4e99c3293bd742c6d076a721e168118b0](https://github.com/mrvautin/expressCart/tree/b31302f4e99c3293bd742c6d076a721e168118b0) (tree `d98ab97ab9ea1b007104f485e36098fdd2c16b61`; provenance PINNED_SOURCE_AVAILABLE)
- Baseline pin: BEWT @ `0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`)
- Dataset: [proposal bundle](../../../../data/coverage/expresscart/source-backed-gap-proposals.json), [shortlist](../../../../data/coverage/expresscart/source-backed-gap-shortlist.json), [baseline mapping](../../../../data/coverage/expresscart/baseline-mapping.json), [source index](../../T04-E/source-reference-index.json)
- Candidate count: 3; technical review order: 2. Order is not acceptance.
- G1: NOT_VERIFIED; behavioral denominator/RQ2: NOT_ESTABLISHED/NOT_EVALUATED.

## EC-GAP-002 — Stock tracking rejects a cart quantity above available product or variant stock

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Customer and administrator / Customer adds; admin controls stock.
- Proposed preconditions: One product/variant with stock=1 and stock tracking enabled; start with empty cart.
- Proposed fixture/action: Set tracked product or variant stock to 1, add quantity 1, then request update to quantity 2 and inspect response and cart state.
- Expected observable (oracle proposal, not approved): With stock tracking enabled and tracking not disabled for the item, attempting to set quantity above product/variant stock returns HTTP 400 with an insufficient-stock message and leaves the prior cart quantity unchanged.
- Negative control: With global trackStock disabled or product stock tracking disabled, do not assert this stock-rejection response.
- Baseline overlap screen: POTENTIAL_PARTIAL_OVERLAP_NOT_SEMANTICALLY_REVIEWED. Base AddProduct and AddNewProdToCart exercise creation/cart addition but do not assert stock quantity boundary.

Baseline references:
`expresscart-05-addproducttest` — `expresscart/gherkin/05_AddProductTest.feature` (Adds a product to the system); Java `expresscart/baseline/expresscart-1.19/src/test/java/tests/AddProductTest.java`, assertion refs 30:assertEquals.
`expresscart-07-addnewprodtocarttest` — `expresscart/gherkin/07_AddNewProdToCartTest.feature` (Adds a product to the cart); Java `expresscart/baseline/expresscart-1.19/src/test/java/tests/AddNewProdToCartTest.java`, assertion refs 24:assertEquals, 26:assertEquals.

Source references:
- [EC-S02](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/routes/product.js) — `routes/product.js` lines 97-112,194-246,291-320; blob `e654616837f9624f82b9a1596b94ce93ad46b0de`. Product insert/edit and variant routes persist stock and stock-disable fields.
- [EC-S05](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/routes/index.js) — `routes/index.js` lines 541-550,583-639,641-642; blob `774f41491d90d3c4f23151c5c70b340f97c89ae0`. Cart update rejects quantities beyond product/variant stock with HTTP 400 before changing the session cart; enforcement depends on stock tracking and product stock-disable configuration.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Stock tracking rejects a cart quantity above available product or variant stock
  Given One product/variant with stock=1 and stock tracking enabled; start with empty cart.
  When Set tracked product or variant stock to 1, add quantity 1, then request update to quantity 2 and inspect response and cart state.
  Then With stock tracking enabled and tracking not disabled for the item, attempting to set quantity above product/variant stock returns HTTP 400 with an insufficient-stock message and leaves the prior cart quantity unchanged.
  And With global trackStock disabled or product stock tracking disabled, do not assert this stock-rejection response.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Review product and variant stock branches separately; pin global/per-item tracking configuration and require the exact expected response/body from the source before choosing the UI oracle.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## EC-GAP-003 — Customer address update persists and is copied from session into order snapshot

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Customer / Authenticated customer.
- Proposed preconditions: Synthetic customer session with customerPresent/customerId, populated cart, and address fields accepted by the customer update schema; omit address fields from order request to exercise session fallback.
- Proposed fixture/action: Update address through /customer/update, verify database and session values, then create one order with request address fields omitted and compare order snapshot.
- Expected observable (oracle proposal, not approved): Customer update writes address fields to the customer record and session; a subsequent order creation request that omits address fields falls back to those session values in the persisted order snapshot.
- Negative control: Use a distinct request-body address and verify the order route prefers the request value over the session fallback.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Base AddUser is admin user management; it does not cover storefront customer address persistence.

Source references:
- [EC-S03](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/routes/customer.js) — `routes/customer.js` lines 93-120,131-210; blob `fc57d7a52432da13e0cb819c4eb100e85ec5ee17`. Customer routes save/update customer address fields and session address values.
- [EC-S01](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/routes/order.js) — `routes/order.js` lines 110-190,286-304; blob `2c171c46d0b04cd690ec0b62cc4daddbe101a768`. Order routes create orders from session/cart data and expose a restricted order-status update route.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Customer address update persists and is copied from session into order snapshot
  Given Synthetic customer session with customerPresent/customerId, populated cart, and address fields accepted by the customer update schema; omit address fields from order request to exercise session fallback.
  When Update address through /customer/update, verify database and session values, then create one order with request address fields omitted and compare order snapshot.
  Then Customer update writes address fields to the customer record and session; a subsequent order creation request that omits address fields falls back to those session values in the persisted order snapshot.
  And Use a distinct request-body address and verify the order route prefers the request value over the session fallback.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- HOLD for security-owner review: the cited `/admin/order/create` path is documented as lacking route-level authorization. Do not exercise this route until a safe isolated test principal and handling are explicitly approved; separate the authorization defect from the candidate persistence oracle.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:
