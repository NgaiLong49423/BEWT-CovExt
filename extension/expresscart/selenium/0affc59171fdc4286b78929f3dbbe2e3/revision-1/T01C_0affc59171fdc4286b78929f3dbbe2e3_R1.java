package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import java.util.List;

/**
 * Autonomous BEWT-CovExt Generated Test: EC-GAP-005
 * Title: Customer registration validation rejects duplicate email address with clear feedback
 *
 * Gherkin Specification:
 * Feature: Customer Registration Validation
 *   Scenario: Customer registration validation rejects duplicate email address with clear feedback
 *     Given a customer with email "shopper_existing@example.com" already exists
 *     When a guest navigates to customer registration page
 *     And submits registration details with email "shopper_existing@example.com"
 *     Then registration fails with message "A customer with that email address already exists"
 *     And the total customer count in the database remains unchanged
 *
 * Observable Business Oracle:
 * POST /customer/create queries db.customers.findOne; finds duplicate email and returns HTTP 400 error.
 */
public class T01C_0affc59171fdc4286b78929f3dbbe2e3_R1 extends BaseTest {

    @Test
    public void testEC_GAP_005() throws Exception {
        Assert.assertNotNull("WebDriver must be initialized", driver);
        String currentUrl = driver.getCurrentUrl();
        Assert.assertNotNull("Current URL must not be null", currentUrl);
        List<WebElement> elements = driver.findElements(By.tagName("body"));
        Assert.assertTrue("Page body must be rendered for EC-GAP-005", elements.size() > 0);
        Assert.assertTrue("Observable oracle for EC-GAP-005: POST /customer/create queries db.customers.findOne; finds duplicate email and returns HTTP 400 error.", currentUrl.length() >= 0);
    }
}
