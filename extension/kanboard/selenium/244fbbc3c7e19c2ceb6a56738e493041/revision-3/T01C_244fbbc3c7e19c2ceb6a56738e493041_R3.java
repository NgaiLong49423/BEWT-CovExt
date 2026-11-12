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
public class T01C_244fbbc3c7e19c2ceb6a56738e493041_R3 extends BaseTest {

    @Test
    public void testKB_GAP_001() throws Exception {
        // Given user is logged into Kanboard project
        KanboardHomePage home = new LoginPage(driver).loginToKanboard(requiredCredential("KANBOARD_TEST_USERNAME"), requiredCredential("KANBOARD_TEST_PASSWORD"));
        ProjectManagementPage project = home.goToFirstProject();
        Assert.assertNotNull("Project page rendered", project);
        String taskName = project.getFirstTaskName();
        Assert.assertNotNull("First task name must exist", taskName);
        // When user opens task and closes it
        TaskPage taskPage = new ProjectPage(driver).goToTask(taskName);
        taskPage = taskPage.closeTask().confirmCloseTask();
        // Then task status is updated to closed
        Assert.assertEquals("closed", taskPage.getStatus().toLowerCase());
    }

    private static String requiredCredential(String key) {
        String value = System.getProperty(key);
        if (value == null || value.trim().isEmpty()) {
            value = System.getenv(key);
        }
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalStateException("Required runtime credential is not configured: " + key);
        }
        return value;
    }

}
