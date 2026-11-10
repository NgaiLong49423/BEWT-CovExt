@proposed @review_required
Feature: Retrieve two identified revisions of a page
  Scenario: Both specific revisions remain observable after an edit
    Given an isolated MediaWiki page contains the synthetic original text
    And its existing revision identity is recorded as R0
    When an authorized editor updates the same page with the synthetic revised text
    And the newly saved revision identity is recorded as R1
    Then R1 is different from R0
    When the editor opens the page revision identified by R0
    Then that revision displays the synthetic original text
    When the editor opens the page revision identified by R1
    Then that revision displays the synthetic revised text
