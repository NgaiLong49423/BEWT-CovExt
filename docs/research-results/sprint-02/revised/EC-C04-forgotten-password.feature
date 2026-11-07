Feature: Customer forgotten-password request

  Scenario: Return the generic response for an unregistered email
    Given an email address is not present in the customer collection
    When the visitor opens the forgotten-password form
    And submits that email address
    Then the page shows a success notification
    And the notification says "If your account exists, a password reset has been sent to your email"
