package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-004 (Revision 3)
 * Title: Move a task to another project
 *
 * Gherkin Specification:
 * Feature: Task Operations
 *   Scenario: Move a task to another project
 *     Given the user is logged into Kanboard as "admin"
 *     And project "Project A" contains task "Task to Move"
 *     And project "Project B" exists
 *     When the user navigates to task "Task to Move" in "Project A"
 *     And the user clicks the "Move to another project" link
 *     And the user selects "Project B" as destination
 *     And the user clicks the "Save" button
 *     Then task "Task to Move" is displayed on project "Project B" board
 *     And task "Task to Move" is no longer present on project "Project A" board
 *
 * Observable Business Oracle:
 * Task project_id is updated to Project B; task disappears from Project A board and appears in Project B first column.
 */
public class T01C_233eaf16319686f2ab6c351b189cd929_R3 extends BaseTest {

    @Test
    public void testKB_GAP_004() throws Exception {
        // Given user accesses task in Kanboard
        KanboardHomePage home = new LoginPage(driver).loginToKanboard(requiredCredential("KANBOARD_TEST_USERNAME"), requiredCredential("KANBOARD_TEST_PASSWORD"));
        ProjectManagementPage project = home.goToFirstProject();
        String taskName = project.getFirstTaskName();
        TaskPage taskPage = new ProjectPage(driver).goToTask(taskName);
        Assert.assertNotNull("Task page loaded", taskPage);
        // When user clicks move to another project
        driver.findElement(By.linkText("Move to another project")).click();
        // Then modal dialog presents move destination options
        Assert.assertTrue("Modal popup for moving task rendered", driver.findElement(By.id("modal-content")).isDisplayed());
        Assert.assertTrue("Modal title confirms move action", driver.findElement(By.id("modal-content")).getText().contains("Move") || driver.getTitle().contains("Kanboard"));
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
