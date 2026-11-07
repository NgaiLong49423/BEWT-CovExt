Feature: Admin product publication-state persistence

  Scenario: Persist an unpublished state for a dedicated test product
    Given the experiment setup created a dedicated product with a unique run-specific title through the admin UI
    And the dedicated product is published and its exact title is recorded for this run
    When an administrator finds that exact product in the admin product list
    And turns off its published checkbox
    And reloads the product list
    Then the same product remains in the admin product list
    And its published checkbox is unchecked
    And cleanup restores the product to published and deletes only this run's dedicated product through the admin UI
