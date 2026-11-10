@proposed @review_required
Feature: Customer address is reflected in an instore order
  Scenario: An updated customer address is used after a new login
    Given a synthetic customer and product exist in an isolated ExpressCart fixture
    And instore checkout and an isolated email sink have been configured and verified for the fixture
    When the customer updates the account to a synthetic address
    And the customer signs out and signs in using a fresh session
    Then the account displays the updated address
    When the customer places an instore order for the product
    Then the customer's order details display the updated address
