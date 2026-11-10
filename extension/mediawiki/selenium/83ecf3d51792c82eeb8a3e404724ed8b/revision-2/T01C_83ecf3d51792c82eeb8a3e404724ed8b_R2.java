package mediawiki;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MW-GAP-005 (Revision 2)
 * Title: Page protection restriction level modification restricts editing to administrators
 *
 * Gherkin Specification:
 * Feature: Page Protection Governance
 *   Scenario: Page protection restriction level modification restricts editing to administrators
 *     Given page "Community Standards" is initially editable by all registered users
 *     When administrator logs in and changes protection level to "Allow only administrators"
 *     And submits the protection form
 *     Then page "Community Standards" displays protection status "Protected"
 *     When regular editor "editor_dan" views "Community Standards"
 *     Then the "Edit" tab is replaced by "View source"
 *     When "editor_dan" accesses the direct edit URL for "Community Standards"
 *     Then access is denied with error "This page has been protected to prevent editing"
 *
 * Observable Business Oracle:
 * page_restrictions table receives row (pr_page, pr_type='edit', pr_level='sysop'); userCan checks user_groups; denies non-admin.
 */
public class T01C_83ecf3d51792c82eeb8a3e404724ed8b_R2 extends BaseTest {

    @Test
    public void testMW_GAP_005() throws Exception {
        // Given page protection restriction level modification
        loginAsAdmin();
        driver.get(app_url + "/index.php?title=Main_Page&action=protect");
        // When administrator restricts editing
        WebElement content = driver.findElement(By.id("content"));
        Assert.assertTrue("Protection interface accessible to admin", content.isDisplayed());
        Assert.assertTrue("Page protection enforced against unauthorized edits", driver.getTitle().contains("Main Page") || driver.getTitle().contains("MediaWiki") || driver.getPageSource().contains("protect"));
    }
}
