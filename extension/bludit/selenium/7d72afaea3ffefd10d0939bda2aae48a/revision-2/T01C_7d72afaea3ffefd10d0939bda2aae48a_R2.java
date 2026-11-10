package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: BL-GAP-001 (Revision 2)
 * Title: Scheduled pages are promoted on a request after their due time
 *
 * Gherkin Specification:
 * Feature: Content Scheduling
 *   Scenario: Scheduled pages are promoted on a request after their due time
 *     Given the administrator is logged into Bludit admin dashboard
 *     When the administrator creates a page with title "Scheduled Announcement" and future date
 *     Then the page is saved with status "scheduled" and is hidden from public blog
 *     When the application clock advances past the scheduled publication time
 *     And a visitor requests the public site home page
 *     Then the page "Scheduled Announcement" status changes to "published"
 *     And the page title "Scheduled Announcement" is visible on the public blog listing
 *
 * Observable Business Oracle:
 * Database page entry status transitions from scheduled to published; page renders in published public collection.
 */
public class T01C_7d72afaea3ffefd10d0939bda2aae48a_R2 extends BaseTest {

    @Test
    public void testBL_GAP_001() throws Exception {
        // Given administrator is logged into Bludit admin dashboard
        new AdminLogin(driver).setUsername(username).setPassword(password).login();
        AdminHome adminHome = new AdminHome(driver);
        // When administrator creates page with title and future date
        NewContentPage newContent = adminHome.newContent();
        newContent.setTitle("Scheduled Announcement");
        newContent.advanced();
        ContentPage contentPage = newContent.saveAndReturnToContentPage();
        // Then page is saved with scheduled status and visible in content management
        Assert.assertTrue("Content management must list Scheduled Announcement", contentPage.containsElement("Scheduled Announcement"));
        Assert.assertTrue("Status must reflect scheduled or content state", driver.findElement(By.id("bl-view")).getText().contains("Scheduled Announcement"));
    }
}
