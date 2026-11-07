Feature: Checkout discount removal

  Scenario: Remove an applied discount and restore the original checkout total
    Given a published product is in the cart and checkout is at the payment step
    And an active discount code is available and the undiscounted total is recorded
    When the customer applies the active discount code
    Then the discount amount is visible and the total is lower than the recorded undiscounted total
    When the customer clicks the remove discount control
    Then the discount code field is empty
    And the discount amount is no longer displayed
    And the checkout total equals the recorded undiscounted total
