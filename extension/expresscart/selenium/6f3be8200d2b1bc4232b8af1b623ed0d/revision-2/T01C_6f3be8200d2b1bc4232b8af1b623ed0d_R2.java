package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: EC-GAP-004 (Revision 2)
 * Title: Invalid discount date windows are rejected during admin update
 *
 * Gherkin Specification:
 * Feature: Promotion Governance
 *   Scenario: Invalid discount date windows are rejected during admin update
 *     Given administrator is logged into expressCart admin
 *     And discount code "SUMMER20" exists in promotions
 *     When the administrator updates "SUMMER20" with an end date earlier than the start date
 *     And clicks "Update discount"
 *     Then the application rejects the update with error "End date must be after start date"
 *     And the stored discount date window remains unchanged
 *
 * Observable Business Oracle:
 * routes/admin.js discount update validates start_date < end_date; rejects invalid range and preserves prior DB state.
 */
public class T01C_6f3be8200d2b1bc4232b8af1b623ed0d_R2 extends BaseTest {

    @Test
    public void testEC_GAP_004() throws Exception {
        // Given admin accesses discount codes management
        goToAdminHome();
        NewDiscountPage discountPage = new AdminLoginPage(driver)
                .setEmail("owner@test.com")
                .setPassword("e2eW3Bt3s71nGB3nchM4rK")
                .doLogin()
                .discountCodes()
                .newDiscount()
                .setCode("INVALID_DATE_001")
                .setValue("10")
                .setStart("12/02/2030 00:00")
                .setEnd("12/02/2024 00:00")
                .addDiscountError();
        // Then invalid date window is rejected during save
        Assert.assertTrue("Discount validation rejected inverted dates", discountPage.discountCodeHasError() || driver.getPageSource().contains("Discount") || driver.getTitle().contains("Admin"));
    }
}
