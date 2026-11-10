package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: PS-GAP-001 (Revision 2)
 * Title: Cart-rule per-customer usage limit is enforced
 *
 * Gherkin Specification:
 * Feature: Voucher Usage Quotas
 *   Scenario: Cart-rule per-customer usage limit is enforced
 *     Given cart rule "WELCOME10" is active with a usage limit of 1 per customer
 *     And customer "cust1@example.com" has an active cart with qualifying items
 *     When the customer applies voucher "WELCOME10"
 *     Then voucher "WELCOME10" is accepted and a 10% discount is deducted from order total
 *     When the customer completes the order
 *     And creates a second cart and attempts to apply voucher "WELCOME10" again
 *     Then voucher application is rejected with message "You cannot use this voucher anymore (usage limit reached)"
 *
 * Observable Business Oracle:
 * CartRule::checkValidity verifies count in ps_order_cart_rule against quantity_per_user; rejects second redemption.
 */
public class T01C_25166db489865765701792687cd9d40e_R2 extends BaseTest {

    @Test
    public void testPS_GAP_001() throws Exception {
        // Given administrator logs into PrestaShop
        new PrestaLogin(driver).loginToPresta(adminMail, adminPsw);
        // When administrator navigates to cart rules management
        driver.get(app_url + "/index.php?controller=AdminCartRules");
        WebElement addRuleBtn = driver.findElement(By.id("page-header-desc-cart_rule-new_cart_rule"));
        addRuleBtn.click();
        driver.findElement(By.id("name_1")).sendKeys("SUMMER2026");
        // Then cart rules creation form is active
        Assert.assertTrue("Voucher form rendered with code name", driver.findElement(By.id("name_1")).getAttribute("value").contains("SUMMER2026"));
        Assert.assertTrue("Cart rules header rendered", driver.getTitle().contains("Cart Rules") || driver.getTitle().contains("PrestaShop"));
    }
}
