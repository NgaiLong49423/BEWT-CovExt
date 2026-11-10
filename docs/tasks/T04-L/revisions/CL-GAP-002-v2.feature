@proposed @review_required
Feature: Ordinary access to another private group
  Scenario: A student cannot open a private group of which they are not a member
    Given an isolated Claroline course has private groups A and B with distinct synthetic fixture documents
    And an enrolled student is a member of group A but not group B and is neither a manager nor a tutor
    When the student opens the ordinary group B space without registration parameters
    Then the student is redirected to the group listing
    And the private group B document marker is not displayed
    When the student opens the group A fixture document through the ordinary group A space
    Then the group A document marker is displayed
