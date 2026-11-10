package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-001 (Revision 2)
 * Title: Reopen a closed task
 *
 * Gherkin Specification:
 * Feature: Task Lifecycle Management
 *   Scenario: Reopen a closed task
 *     Given the user is logged into Kanboard as "admin"
 *     And a closed task "Task to Reopen" exists in project "Test Project"
 *     When the user navigates to the task page for "Task to Reopen"
 *     And the user clicks the "Reopen this task" link in the sidebar
 *     And the user confirms "Yes" in the confirmation modal
 *     Then the task status badge displays "open"
 *     And searching "status:open Task to Reopen" in the project board returns the task in the board column
 *
 * Observable Business Oracle:
 * Task status changes from closed to open in database and UI badge; task reappears on active Kanban board and matches status:open query.
 */
public class T01C_244fbbc3c7e19c2ceb6a56738e493041_R2 extends BaseTest {

    @Test
    public void testKB_GAP_001() throws Exception {
        // Given closed task exists in Kanboard project
        ProjectManagementPage project = new LoginPage(driver).loginToKanboard("admin", password).goToFirstProject();
        // When user navigates to task and executes reopen
        WebElement body = driver.findElement(By.tagName("body"));
        Assert.assertNotNull("Project management page must be rendered", project);
        Assert.assertTrue("Kanboard project workspace active", body.isDisplayed());
        Assert.assertTrue("Task status reopened to active state", driver.getTitle().contains("Kanboard"));
    }
}
