@requires_team_lead_review
Feature: Admin product publication-state persistence

  Scenario: Persist an unpublished state for a dedicated test product
    Given the experiment setup created a dedicated product with a unique run-specific title through the admin UI
    And the dedicated product is published and its exact title is recorded for this run
    When an administrator finds that exact product in the admin product list
    And turns off its published checkbox
    And reloads the product list
    Then the same product remains in the admin product list
    And its published checkbox is unchecked

# Mandatory teardown contract; it is independent of whether any When/Then step passes.
# The Java implementation must register @After before the scenario and use try/finally:
# restore the exact fixture to published through the admin UI, then delete only that
# run's exact fixture through the admin UI in finally, and verify it is absent.
# Cleanup failures must be recorded without masking the original assertion failure.
