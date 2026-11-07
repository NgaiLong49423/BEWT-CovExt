Feature: Admin product publication state

  Scenario: Persist an unpublished state in the admin product list
    Given an administrator is on the product list
    And a published product is identified for this test
    When the administrator turns off that product's published checkbox
    And reloads the product list
    Then the same product's published checkbox is unchecked
