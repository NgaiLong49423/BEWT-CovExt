# Expresscart — Human Review Packet (Milestone 3 / G1)

**Application Version:** 1.1.19  
**Baseline Physical Features:** 31  
**Baseline Test Classes:** 31  
**Baseline Assertions:** 43  
**Baseline Unique Behavioral Units (D_base):** 21  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Expresscart** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. EC-GAP-002 — Stock tracking rejects a cart quantity above available product or variant stock

- **Target Novelty Class:** `NOVEL_INVENTORY_BOUNDARY`
- **Actor:** Customer and Administrator (Customer shops; administrator configures inventory)
- **Preconditions:** Product 'Limited Edition T-Shirt' has stock=1 with stock tracking enabled; empty cart.
- **Test Data:** `{"product": "Limited Edition T-Shirt", "stock": 1, "requestedQty": 2}`

#### Gherkin Specification
```gherkin
Feature: Inventory Control
  Scenario: Stock tracking rejects a cart quantity above available product or variant stock
    Given product "Limited Edition T-Shirt" has stock tracking enabled with available quantity 1
    And customer starts with an empty cart
    When customer adds 1 unit of "Limited Edition T-Shirt" to cart
    Then the cart shows 1 unit of "Limited Edition T-Shirt"
    When customer attempts to update the quantity to 2
    Then the system rejects the update with HTTP 400 and message "There is not enough stock to fulfill your order"
    And the cart quantity remains at 1
```

#### Observable Business Oracle
- **Positive Oracle:** routes/index.js cart update validates against productStock; rejects over-quantity and leaves session cart count at 1.
- **Negative Control:** When stock tracking is disabled globally, quantity 2 update succeeds.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset product stock to default and clear cart session.

#### Source Code Anchors
- **File:** `routes/index.js` (Lines: `280-340`) @ commit `b31302f4e99c3293bd742c6d076a721e168118b0` — *cart update stock boundary check*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** EC-05 creates product, EC-07 adds product to cart; baseline never checks stock boundary enforcement.

#### Review Ledger Entry Template
- **Candidate ID:** `EC-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. EC-GAP-003 — Customer address update persists and is copied from session into checkout information

- **Target Novelty Class:** `NOVEL_CUSTOMER_CHECKOUT_INTEGRATION`
- **Actor:** Authenticated Customer (Customer managing shipping profile)
- **Preconditions:** Registered customer 'jane@example.com' logged in; initial address '123 Main St'.
- **Test Data:** `{"newAddress": "456 Oak Avenue", "newPostcode": "90210", "newCity": "Beverly Hills"}`

#### Gherkin Specification
```gherkin
Feature: Customer Profile and Checkout
  Scenario: Customer address update persists and is copied from session into checkout information
    Given customer "jane@example.com" is logged into the storefront
    When the customer navigates to account profile and updates shipping address to "456 Oak Avenue", city "Beverly Hills", postcode "90210"
    And clicks "Update profile"
    Then the customer profile reloads confirming "456 Oak Avenue"
    When the customer adds an item to cart and proceeds to checkout
    Then the checkout shipping address form is pre-filled with "456 Oak Avenue" and "Beverly Hills"
```

#### Observable Business Oracle
- **Positive Oracle:** POST /customer/update updates database and req.session.customer*; checkout view automatically inherits session address.
- **Negative Control:** A guest checkout session does NOT prefill customer Jane's address.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset customer address and empty cart.

#### Source Code Anchors
- **File:** `routes/customer.js` (Lines: `110-160`) @ commit `b31302f4e99c3293bd742c6d076a721e168118b0` — *customer address update handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** EC-01 adds user in admin; baseline has zero customer storefront profile update or checkout prefill tests.

#### Review Ledger Entry Template
- **Candidate ID:** `EC-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. EC-GAP-004 — Invalid discount date windows are rejected during admin update

- **Target Novelty Class:** `NOVEL_PROMOTION_DATE_VALIDATION`
- **Actor:** Shop Administrator (Marketing administrator)
- **Preconditions:** Discount code 'SUMMER20' exists with valid dates.
- **Test Data:** `{"code": "SUMMER20", "invalidStartDate": "yesterday", "invalidEndDate": "last week"}`

#### Gherkin Specification
```gherkin
Feature: Promotion Governance
  Scenario: Invalid discount date windows are rejected during admin update
    Given administrator is logged into expressCart admin
    And discount code "SUMMER20" exists in promotions
    When the administrator updates "SUMMER20" with an end date earlier than the start date
    And clicks "Update discount"
    Then the application rejects the update with error "End date must be after start date"
    And the stored discount date window remains unchanged
```

#### Observable Business Oracle
- **Positive Oracle:** routes/admin.js discount update validates start_date < end_date; rejects invalid range and preserves prior DB state.
- **Negative Control:** Providing a valid future date range (start tomorrow, end next month) is accepted successfully.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Restore original discount date range.

#### Source Code Anchors
- **File:** `routes/admin.js` (Lines: `620-670`) @ commit `b31302f4e99c3293bd742c6d076a721e168118b0` — *discount date range validation*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** EC-12/13/15/16 test discount amounts and percent redemption, but never test invalid date window validation.

#### Review Ledger Entry Template
- **Candidate ID:** `EC-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. EC-GAP-005 — Customer registration validation rejects duplicate email address with clear feedback

- **Target Novelty Class:** `NOVEL_CUSTOMER_IDENTITY_CONSTRAINT`
- **Actor:** Customer (Guest registering for account)
- **Preconditions:** Account 'shopper_existing@example.com' is already registered in customer collection.
- **Test Data:** `{"email": "shopper_existing@example.com", "name": "Existing User", "password": "Password123!"}`

#### Gherkin Specification
```gherkin
Feature: Customer Registration Validation
  Scenario: Customer registration validation rejects duplicate email address with clear feedback
    Given a customer with email "shopper_existing@example.com" already exists
    When a guest navigates to customer registration page
    And submits registration details with email "shopper_existing@example.com"
    Then registration fails with message "A customer with that email address already exists"
    And the total customer count in the database remains unchanged
```

#### Observable Business Oracle
- **Positive Oracle:** POST /customer/create queries db.customers.findOne; finds duplicate email and returns HTTP 400 error.
- **Negative Control:** Submitting a unique email creates the customer and signs them in.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Keep existing customer fixture intact.

#### Source Code Anchors
- **File:** `routes/customer.js` (Lines: `45-80`) @ commit `b31302f4e99c3293bd742c6d076a721e168118b0` — *customer registration duplicate check*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** EC-01/02 test admin user creation; baseline has zero storefront customer registration tests.

#### Review Ledger Entry Template
- **Candidate ID:** `EC-GAP-005`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. EC-GAP-006 — Admin product stock update directly updates storefront inventory badge and cart capability

- **Target Novelty Class:** `NOVEL_INVENTORY_STOREFRONT_SYNCHRONIZATION`
- **Actor:** Administrator and Shopper (Admin manages stock; Shopper observes storefront)
- **Preconditions:** Product 'Solar Charger' has stock=0 and displays 'Out of stock'.
- **Test Data:** `{"product": "Solar Charger", "initialStock": 0, "replenishedStock": 5}`

#### Gherkin Specification
```gherkin
Feature: Stock Replenishment Synchronization
  Scenario: Admin product stock update directly updates storefront inventory badge and cart capability
    Given product "Solar Charger" has stock quantity 0
    And the public product page displays badge "Out of stock" with "Add to cart" disabled
    When administrator logs in and edits "Solar Charger" stock to 5
    And clicks "Save product"
    Then reloading public product page displays "In stock: 5"
    And the "Add to cart" button becomes enabled and functional
```

#### Observable Business Oracle
- **Positive Oracle:** Stock update persists in MongoDB; storefront product view dynamically renders in-stock badge and unlocks cart addition.
- **Negative Control:** Setting stock back to 0 immediately re-disables Add to Cart button.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset stock to 0.

#### Source Code Anchors
- **File:** `routes/admin.js` (Lines: `320-360`) @ commit `b31302f4e99c3293bd742c6d076a721e168118b0` — *product update route*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline tests product creation and editing title/price, but never dynamic stock replenishment effect on storefront.

#### Review Ledger Entry Template
- **Candidate ID:** `EC-GAP-006`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
