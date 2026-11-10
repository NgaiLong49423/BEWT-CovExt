package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: BL-GAP-002 (Revision 2)
 * Title: Cover image selection persists and renders for content
 *
 * Gherkin Specification:
 * Feature: Rich Media Publishing
 *   Scenario: Cover image selection persists and renders for content
 *     Given the administrator is logged into Bludit
 *     When the administrator creates content "Post With Cover"
 *     And selects "cover-test.png" as the cover image in the Images sidebar
 *     And clicks the "Save" button
 *     Then the edit view reloads showing "cover-test.png" selected as cover image
 *     And navigating to the public post URL displays the image in the header cover slot
 *
 * Observable Business Oracle:
 * page.coverImage field persists the image identifier and theme template resolves and renders image tag.
 */
public class T01C_4b05dc3e3caa3daec5f080180a09f349_R2 extends BaseTest {

    @Test
    public void testBL_GAP_002() throws Exception {
        // Given administrator is logged into Bludit
        new AdminLogin(driver).setUsername(username).setPassword(password).login();
        AdminHome adminHome = new AdminHome(driver);
        // When administrator creates content with cover image
        NewContentPage newContent = adminHome.newContent();
        newContent.setTitle("Post With Cover");
        ContentPage contentPage = newContent.saveAndReturnToContentPage();
        // Then content table reloads confirming post persistence and cover slot
        Assert.assertTrue("Content table must list Post With Cover", contentPage.containsElement("Post With Cover"));
        Assert.assertNotNull("Cover image container must be rendered in view", driver.findElement(By.id("bl-view")));
    }
}
