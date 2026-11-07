Feature: Checkout Discount Management
  # Existing tests cover adding, deleting, and applying discount codes during checkout, but never verify removing an applied discount code from an active checkout session via the discount removal route.
  Scenario: Customer removes an active discount code from the checkout order summary
    Given Add an available product to the cart and proceed to the checkout payment step
    When Enter a valid discount code into the discount field and apply it to the cart
    When Verify that the discount is applied to the order subtotal
    Then Click the remove discount button next to the applied discount label
    # Expected behavior: The applied discount is removed, the cart total recalculates back to the original order amount, and the discount code input is displayed again.

Feature: Shopping Cart Management
  # The baseline test suite validates adding products to the cart, but lacks coverage for resetting cart state by emptying the cart directly from the cart view.
  Scenario: Customer empties all items currently stored in the shopping cart
    Given Navigate to the storefront catalog and add an item to the shopping cart
    When Open the cart summary modal or cart view
    When Click the empty cart button
    Then Confirm the action when prompted
    # Expected behavior: The cart contents are cleared, the cart item badge updates to show zero items, and an empty cart confirmation is displayed.

Feature: Product Visibility Management
  # Baseline tests create, search, and delete products, but do not test toggling the published status switch in admin and verifying that unpublished products are omitted from storefront search results.
  Scenario: Admin toggles a product to unpublished and verifies exclusion from public search
    Given Log in to the administration panel at /admin and open the product list
    When Toggle the published state switch of an existing product to unpublished
    When Navigate to the public storefront home page
    Then Submit a search for the title of the unpublished product
    # Expected behavior: The administrative list reflects the unpublished toggle state and the storefront search results do not return the unpublished product.

Feature: Customer Authentication
  # Existing tests focus on user and customer login failures, but do not exercise the customer password reset request route and customer-facing response messaging.
  Scenario: Customer submits a password reset request via forgotten password form
    Given Navigate to the customer login screen at /customer/login
    When Click the link to navigate to /customer/forgotten
    When Enter an email address into the forgotten password email input field
    Then Click the submit button to request a reset link
    # Expected behavior: The application processes the submission and renders a clear notification message regarding the password reset request outcome.

Feature: Static Content Management
  # The baseline covers administrative navigation menu additions, but omits testing creation and rendering of custom standalone content pages via the static pages admin and page routes.
  Scenario: Admin creates a new static content page and views it on the storefront
    Given Log in to the administrative dashboard at /admin and navigate to /admin/settings/pages/new
    When Fill in the page title, permalink URL slug, and page body content
    When Click the save button to persist the page settings
    Then Navigate directly to the storefront page route using the assigned permalink
    # Expected behavior: The page is saved without validation errors and the storefront renders the title and body content at the expected page route.
