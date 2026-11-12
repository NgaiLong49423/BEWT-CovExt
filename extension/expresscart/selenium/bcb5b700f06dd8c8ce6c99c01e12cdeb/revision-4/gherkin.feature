Feature: Inventory Control
  Scenario: Stock tracking rejects a cart quantity above available product stock
    Given product "Limited Edition T-Shirt" has stock tracking enabled with available quantity 1
    And customer starts with an empty cart
    When customer adds 1 unit of "Limited Edition T-Shirt" to cart
    Then the cart shows 1 unit of "Limited Edition T-Shirt"
    When customer attempts to update the quantity to 2
    Then the system rejects the update with HTTP 400 and message "There is insufficient stock of this product."
    And the cart quantity remains at 1
