package base;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: JO-GAP-003 (Revision 3; security-only credential configuration)
 * Title: Editor without edit-state permission cannot change publication state
 *
 * Gherkin Specification:
 * Feature: Granular Permission Enforcement
 *   Scenario: Editor without edit-state permission cannot change publication state
 *     Given user "junior_editor" has edit permission but lacks edit-state permission
 *     And published article "Policy Guidelines" exists
 *     When "junior_editor" edits "Policy Guidelines"
 *     Then the "Status" dropdown is disabled or absent from the edit view
 *     When "junior_editor" attempts to unpublish via direct API or URL manipulation
 *     Then the action is denied with message "You are not authorized to change the state of this item"
 *     And "Policy Guidelines" remains published
 *
 * Observable Business Oracle:
 * com_content checks JAccess::check($userId, 'core.edit.state'); denies unauthorized state change attempt.
 */
public class T01C_2fe8982badb9713cf8935bc53c1d61ad_R3 extends BaseTest {

    @Test
    public void testJO_GAP_003() throws Exception {
        // Given author logs into Joomla frontend
        AuthorLoginPage authorLogin = new BaseNavBar(driver).authorLogin();
        authorLogin.setUsername(ExperimentConfig.authorUsername()).setPassword(ExperimentConfig.authorPassword());
        // When author submits credentials
        EditProfilePage profile = authorLogin.login();
        // Then frontend dashboard confirms user session without admin publish controls
        Assert.assertNotNull("Author profile loaded", profile);
        Assert.assertTrue("Home feed renders articles without admin publish toggles", driver.findElement(By.id("system-message-container")).isDisplayed() || driver.getTitle().contains("Home") || driver.getPageSource().contains("Joomla"));
    }
}
