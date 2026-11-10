# Prestashop — Human Review Packet (Milestone 3 / G1)

**Application Version:** 1.6.1.23  
**Baseline Physical Features:** 33  
**Baseline Test Classes:** 35  
**Baseline Assertions:** 35  
**Baseline Unique Behavioral Units (D_base):** 24  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Prestashop** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. PS-GAP-001 — Cart-rule per-customer usage limit is enforced

- **Target Novelty Class:** `NOVEL_VOUCHER_QUOTA_CONTROL`
- **Actor:** Customer and Shop Administrator (Admin creates voucher; Customer redeems)
- **Preconditions:** Cart rule 'WELCOME10' configured with discount 10%, global quantity 100, and quantity_per_user=1; customer 'cust1@example.com'.
- **Test Data:** `{"voucherCode": "WELCOME10", "customer": "cust1@example.com"}`

#### Gherkin Specification
```gherkin
Feature: Voucher Usage Quotas
  Scenario: Cart-rule per-customer usage limit is enforced
    Given cart rule "WELCOME10" is active with a usage limit of 1 per customer
    And customer "cust1@example.com" has an active cart with qualifying items
    When the customer applies voucher "WELCOME10"
    Then voucher "WELCOME10" is accepted and a 10% discount is deducted from order total
    When the customer completes the order
    And creates a second cart and attempts to apply voucher "WELCOME10" again
    Then voucher application is rejected with message "You cannot use this voucher anymore (usage limit reached)"
```

#### Observable Business Oracle
- **Positive Oracle:** CartRule::checkValidity verifies count in ps_order_cart_rule against quantity_per_user; rejects second redemption.
- **Negative Control:** A different customer account can redeem WELCOME10 for their first order.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete cart rule and test orders.

#### Source Code Anchors
- **File:** `classes/CartRule.php` (Lines: `450-520`) @ commit `475d65fbda93403cd1afde0db09764c5295e952c` — *per-user voucher quota validation*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline adds products, customers, and categories, but zero voucher/cart-rule tests.

#### Review Ledger Entry Template
- **Candidate ID:** `PS-GAP-001`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. PS-GAP-002 — Carrier eligibility follows configured price/weight range

- **Target Novelty Class:** `NOVEL_CARRIER_THRESHOLD_SELECTION`
- **Actor:** Customer and Administrator (Admin sets carrier ranges; Customer selects delivery)
- **Preconditions:** Carrier 'Express Air' configured for cart total >= $50.00; Carrier 'Standard Ground' configured for all carts.
- **Test Data:** `{"carrierAir": "Express Air", "threshold": 50.0}`

#### Gherkin Specification
```gherkin
Feature: Shipping Carrier Eligibility
  Scenario: Carrier eligibility follows configured price/weight range
    Given carrier "Express Air" is configured for minimum order total $50.00
    And carrier "Standard Ground" is configured for all order amounts
    When customer has a cart with total value $30.00 and proceeds to shipping step
    Then only "Standard Ground" is displayed as an available shipping option
    When customer increases cart quantity so total value becomes $75.00
    And proceeds to shipping step
    Then both "Standard Ground" and "Express Air" are selectable options
```

#### Observable Business Oracle
- **Positive Oracle:** Carrier::getCarriersForOrder evaluates ps_range_price; filters available carriers based on order subtotal.
- **Negative Control:** If carrier range behavior is set to disable carrier when out of range, carrier is omitted rather than erroring.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset carrier ranges.

#### Source Code Anchors
- **File:** `classes/Carrier.php` (Lines: `320-390`) @ commit `475d65fbda93403cd1afde0db09764c5295e952c` — *carrier range eligibility calculation*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline tests addresses and checkout steps, but never tests carrier price/weight threshold eligibility.

#### Review Ledger Entry Template
- **Candidate ID:** `PS-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. PS-GAP-003 — Successful payment creates one order and applies stock synchronization

- **Target Novelty Class:** `NOVEL_ORDER_STOCK_SYNCHRONIZATION`
- **Actor:** Customer (Shopper completing checkout)
- **Preconditions:** Product 'Printed Summer Dress' has stock=10; customer at payment step with valid cart.
- **Test Data:** `{"product": "Printed Summer Dress", "initialStock": 10, "orderedQty": 2}`

#### Gherkin Specification
```gherkin
Feature: Order Placement and Stock Sync
  Scenario: Successful payment creates one order and applies stock synchronization
    Given product "Printed Summer Dress" has available stock 10
    And customer has 2 units of "Printed Summer Dress" in cart
    When customer completes payment using "Bank wire" payment module
    Then an order confirmation screen is displayed with a unique Order Reference
    And exactly one order record is created in the orders table
    And the available stock for "Printed Summer Dress" updates to 8
```

#### Observable Business Oracle
- **Positive Oracle:** PaymentModule::validateOrder creates ps_orders row, order history entry, and calls StockAvailable::updateQuantity(-2).
- **Negative Control:** If payment validation fails, no order is inserted and stock remains at 10.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Cancel order and restore product stock to 10.

#### Source Code Anchors
- **File:** `classes/PaymentModule.php` (Lines: `250-340`) @ commit `475d65fbda93403cd1afde0db09764c5295e952c` — *order creation and stock decrement on payment*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** PS-28 tests out-of-stock validity flag; baseline never executes full payment-to-order-creation flow with stock decrement.

#### Review Ledger Entry Template
- **Candidate ID:** `PS-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. PS-GAP-004 — Available quantity update stays consistent with product combination stock

- **Target Novelty Class:** `NOVEL_COMBINATION_STOCK_PARTITIONING`
- **Actor:** Catalog Administrator (Stock Manager)
- **Preconditions:** Product 'T-Shirt' has two combinations: Size S and Size L; initial quantities S=5, L=10.
- **Test Data:** `{"product": "T-Shirt", "comboS": "Size S", "comboL": "Size L", "newQtyS": 8}`

#### Gherkin Specification
```gherkin
Feature: Combination Stock Management
  Scenario: Available quantity update stays consistent with product combination stock
    Given product "T-Shirt" has combinations "Size S" (qty 5) and "Size L" (qty 10)
    When administrator edits combination "Size S" and sets quantity to 8
    And clicks "Save"
    Then the admin combinations list displays "Size S" quantity 8 and "Size L" quantity 10
    When a customer views product "T-Shirt" on storefront with "Size S" selected
    Then availability shows "8 items in stock"
    When customer switches combination to "Size L"
    Then availability dynamically updates to show "10 items in stock"
```

#### Observable Business Oracle
- **Positive Oracle:** ps_stock_available stores distinct rows per id_product_attribute; frontend AJAX update correctly reflects combination quantity.
- **Negative Control:** Attempting to enter a non-integer or negative quantity in admin triggers validation error.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset combination quantities.

#### Source Code Anchors
- **File:** `classes/StockAvailable.php` (Lines: `140-210`) @ commit `475d65fbda93403cd1afde0db09764c5295e952c` — *combination stock management*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** PS-01 adds product, PS-28 tests out of stock; baseline never tests multi-combination stock partitioning.

#### Review Ledger Entry Template
- **Candidate ID:** `PS-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. PS-GAP-005 — Customer group discount applies configured percentage reduction to catalog price

- **Target Novelty Class:** `NOVEL_GROUP_BASED_PRICING`
- **Actor:** Shop Administrator and VIP Customer (Admin sets group pricing; VIP customer shops)
- **Preconditions:** Customer group 'VIP Gold' configured with 20% discount on catalog; customer 'vip_buyer@example.com' assigned to 'VIP Gold'; product price $100.00.
- **Test Data:** `{"group": "VIP Gold", "discount": 20, "customer": "vip_buyer@example.com", "productPrice": 100.0, "expectedPrice": 80.0}`

#### Gherkin Specification
```gherkin
Feature: Customer Group Pricing
  Scenario: Customer group discount applies configured percentage reduction to catalog price
    Given customer group "VIP Gold" has a 20% group discount
    And customer "vip_buyer@example.com" belongs to group "VIP Gold"
    And product "Luxury Leather Bag" has a retail price of $100.00
    When customer "vip_buyer@example.com" logs in and views "Luxury Leather Bag"
    Then the displayed product price reflects the 20% discount at $80.00
    And adding the product to cart shows unit price $80.00 in checkout summary
```

#### Observable Business Oracle
- **Positive Oracle:** Product::getPriceStatic applies Group::getReduction($id_group); computes effective price $80.00.
- **Negative Control:** A guest or regular default customer sees the unreduced price $100.00.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset customer group assignment.

#### Source Code Anchors
- **File:** `classes/Product.php` (Lines: `2700-2780`) @ commit `475d65fbda93403cd1afde0db09764c5295e952c` — *getPriceStatic with group reduction*
- **File:** `classes/Group.php` (Lines: `120-170`) @ commit `475d65fbda93403cd1afde0db09764c5295e952c` — *group reduction percentage*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline tests addresses and customers, but zero customer group discount tests.

#### Review Ledger Entry Template
- **Candidate ID:** `PS-GAP-005`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
