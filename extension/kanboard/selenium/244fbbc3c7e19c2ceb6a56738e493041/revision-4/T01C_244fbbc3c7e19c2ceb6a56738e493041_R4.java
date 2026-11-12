package tests;

import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import po.KanboardHomePage;
import po.LoginPage;
import po.ProjectManagementPage;
import po.ProjectPage;
import po.SearchResultsPage;
import po.TaskPage;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-001 (Revision 4)
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
public class T01C_244fbbc3c7e19c2ceb6a56738e493041_R4 extends BaseTest {

    @Test
    public void testKB_GAP_001() {
        // Given: log in, create a uniquely named task in the approved project, then close it.
        KanboardHomePage home = new LoginPage(driver).loginToKanboard(
                requiredCredential("KANBOARD_TEST_USERNAME"),
                requiredCredential("KANBOARD_TEST_PASSWORD"));
        String taskName = "BEWT-COVEXT-KB-GAP-001-" + UUID.randomUUID().toString().replace("-", "");
        ProjectPage project = home.goToProject("Test Project");
        new ProjectManagementPage(driver).newTask().setNewTaskName(taskName).saveNewTask();
        TaskPage taskPage = project.goToTask(taskName);
        Assert.assertEquals("New task must start open before Given-state setup", "open",
                taskPage.getStatus().trim().toLowerCase(Locale.ROOT));
        taskPage.closeTask();
        confirmYes();
        waitForStatus(taskPage, "closed");

        // When: reopen the closed task through Kanboard's sidebar action and confirmation.
        driver.findElement(By.linkText("Reopen this task")).click();
        confirmYes();
        waitForStatus(taskPage, "open");

        // Then: assert the open status badge and exact task membership in status:open results.
        Assert.assertEquals("Reopened task status badge", "open",
                taskPage.getStatus().trim().toLowerCase(Locale.ROOT));
        driver.findElement(By.id("form-search")).clear();
        home.search("status:open " + taskName);
        String foundTask = new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> new SearchResultsPage(d).getFirstTask());
        Assert.assertEquals("status:open search must return the task created by this test", taskName, foundTask);
    }

    private void confirmYes() {
        WebElement confirm = new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> d.findElement(By.id("modal-confirm-button")));
        Assert.assertEquals("Confirmation modal must offer the Gherkin-approved Yes action",
                "Yes", confirm.getText().trim());
        confirm.click();
    }

    private void waitForStatus(TaskPage taskPage, String expectedStatus) {
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> expectedStatus.equals(
                taskPage.getStatus().trim().toLowerCase(Locale.ROOT)));
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
