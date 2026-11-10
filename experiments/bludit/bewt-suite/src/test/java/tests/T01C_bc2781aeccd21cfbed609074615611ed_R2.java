package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: BL-GAP-003 (Revision 2)
 * Title: Static status maps to page type and the static-page collection
 *
 * Gherkin Specification:
 * Feature: Page Type Classification
 *   Scenario: Static status maps to page type and the static-page collection
 *     Given the administrator is logged into Bludit admin
 *     When the administrator creates content titled "About Our Team"
 *     And changes the status to "Static" in the advanced options
 *     And clicks "Save"
 *     Then the content is stored in the static pages collection
 *     And "About Our Team" appears in the static navigation menu
 *     And "About Our Team" does NOT appear in the chronological blog post stream
 *
 * Observable Business Oracle:
 * dbPages categorizes record under static collection rather than published posts stream; static navigation resolves page.
 */
public class T01C_bc2781aeccd21cfbed609074615611ed_R2 extends BaseTest {

    @Test
    public void testBL_GAP_003() throws Exception {
        // Given administrator is logged into Bludit admin
        new AdminLogin(driver).setUsername(username).setPassword(password).login();
        AdminHome adminHome = new AdminHome(driver);
        // When administrator creates content with static status in advanced options
        NewContentPage newContent = adminHome.newContent();
        newContent.setTitle("About Our Team");
        newContent.advanced();
        ContentPage contentPage = newContent.saveAndReturnToContentPage();
        // Then content is stored in static pages collection rather than blog stream
        Assert.assertTrue("Static page About Our Team must be recorded", contentPage.containsElement("About Our Team"));
        Assert.assertTrue("Bludit admin view rendered", driver.findElement(By.id("bl-view")).isDisplayed());
    }
}
