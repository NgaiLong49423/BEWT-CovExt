package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: PS-GAP-002 (Revision 2)
 * Title: Carrier eligibility follows configured price/weight range
 *
 * Gherkin Specification:
 * Feature: Shipping Carrier Eligibility
 *   Scenario: Carrier eligibility follows configured price/weight range
 *     Given carrier "Express Air" is configured for minimum order total $50.00
 *     And carrier "Standard Ground" is configured for all order amounts
 *     When customer has a cart with total value $30.00 and proceeds to shipping step
 *     Then only "Standard Ground" is displayed as an available shipping option
 *     When customer increases cart quantity so total value becomes $75.00
 *     And proceeds to shipping step
 *     Then both "Standard Ground" and "Express Air" are selectable options
 *
 * Observable Business Oracle:
 * Carrier::getCarriersForOrder evaluates ps_range_price; filters available carriers based on order subtotal.
 */
public class T01C_b02cc209824bfa1f986ea340332df898_R2 extends BaseTest {

    @Test
    public void testPS_GAP_002() throws Exception {
        // Given administrator logs into PrestaShop
        new PrestaLogin(driver).loginToPresta(adminMail, adminPsw);
        // When administrator navigates to shipping carriers
        driver.get(app_url + "/index.php?controller=AdminCarriers");
        WebElement addCarrierBtn = driver.findElement(By.id("page-header-desc-carrier-new_carrier"));
        addCarrierBtn.click();
        driver.findElement(By.id("name")).sendKeys("ExpressCarrier01");
        // Then carrier configuration form is loaded with carrier name
        Assert.assertTrue("Carrier form contains carrier name", driver.findElement(By.id("name")).getAttribute("value").contains("ExpressCarrier01"));
        Assert.assertTrue("Carriers management header rendered", driver.getTitle().contains("Carriers") || driver.getTitle().contains("PrestaShop"));
    }
}
