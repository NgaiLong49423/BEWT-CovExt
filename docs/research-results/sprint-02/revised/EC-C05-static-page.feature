Feature: Static content page management

  Scenario: Create and view an enabled static page
    Given an administrator has access to static page management
    And a unique page slug is not already in use
    When the administrator opens the new static-page form
    And enters a page name, the unique page slug, and unique page content
    And enables the page and saves it
    When a visitor opens the storefront route for that page slug
    Then the browser title equals the page name
    And the page body displays the unique page content
