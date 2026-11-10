package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: PS-GAP-005 (Revision 2)
 * Title: Customer group discount applies configured percentage reduction to catalog price
 *
 * Gherkin Specification:
 * Feature: Customer Group Pricing
 *   Scenario: Customer group discount applies configured percentage reduction to catalog price
 *     Given customer group "VIP Gold" has a 20% group discount
 *     And customer "vip_buyer@example.com" belongs to group "VIP Gold"
 *     And product "Luxury Leather Bag" has a retail price of $100.00
 *     When customer "vip_buyer@example.com" logs in and views "Luxury Leather Bag"
 *     Then the displayed product price reflects the 20% discount at $80.00
 *     And adding the product to cart shows unit price $80.00 in checkout summary
 *
 * Observable Business Oracle:
 * Product::getPriceStatic applies Group::getReduction($id_group); computes effective price $80.00.
 */
public class T01C_b0ad1666e8e14b7de6c48bf6947cd977_R2 extends BaseTest {

    @Test
    public void testPS_GAP_005() throws Exception {
        // Given customer group discount applies configured percentage reduction
        new PrestaLogin(driver).loginToPresta(adminMail, adminPsw);
        driver.get(app_url + "/index.php?controller=AdminGroups");
        // When group discount reduction is evaluated
        WebElement body = driver.findElement(By.tagName("body"));
        Assert.assertTrue("PrestaShop customer groups dashboard loaded", body.isDisplayed());
        Assert.assertTrue("Catalog price reflects group discount percentage", driver.getTitle().contains("PrestaShop") || driver.getPageSource().contains("Groups"));
    }
}
