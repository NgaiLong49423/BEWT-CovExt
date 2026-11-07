Feature: Shopping cart clearing

  Scenario: Empty a cart containing a product
    Given a fresh browser session has an empty cart
    And a published seed product is available
    When the customer adds one product to the cart
    And opens the cart view
    Then the cart contains one item
    When the customer clicks the empty cart button
    Then the confirmation modal is displayed
    When the customer confirms the empty-cart action
    Then the cart view displays "Cart empty"
    And the cart item count is zero
    And the success notification says "Cart successfully emptied"
    And the cart action buttons are hidden
