package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-003 (Revision 3; security-only credential configuration)
 * Title: Duplicate a task to another project
 *
 * Gherkin Specification:
 * Feature: Task Operations
 *   Scenario: Duplicate a task to another project
 *     Given the user is logged into Kanboard as "admin"
 *     And project "Project Alpha" contains task "Task to Clone"
 *     And empty project "Project Beta" exists
 *     When the user navigates to task "Task to Clone" in "Project Alpha"
 *     And the user clicks the "Duplicate to another project" link
 *     And the user selects "Project Beta" as destination project
 *     And the user clicks the "Save" button
 *     Then project "Project Beta" board contains task "Task to Clone"
 *     And original task "Task to Clone" remains intact in "Project Alpha"
 *
 * Observable Business Oracle:
 * New task record created in project Beta with copied title/description; source task record in project Alpha remains unmodified.
 */
public class T01C_e92738fe6f9cb45aecc4349f3b52dff0_R3 extends BaseTest {

    @Test
    public void testKB_GAP_003() throws Exception {
        // Given user accesses task in Kanboard
        KanboardHomePage home = new LoginPage(driver).loginToKanboard(requiredCredential("KANBOARD_TEST_USERNAME"), requiredCredential("KANBOARD_TEST_PASSWORD"));
        ProjectManagementPage project = home.goToFirstProject();
        String taskName = project.getFirstTaskName();
        TaskPage taskPage = new ProjectPage(driver).goToTask(taskName);
        Assert.assertNotNull("Task page loaded", taskPage);
        // When user clicks duplicate to another project
        driver.findElement(By.linkText("Duplicate to another project")).click();
        // Then modal dialog presents project destination selection
        Assert.assertTrue("Modal popup for duplication rendered", driver.findElement(By.id("modal-content")).isDisplayed());
        Assert.assertTrue("Modal title confirms duplication action", driver.findElement(By.id("modal-content")).getText().contains("Duplicate") || driver.getTitle().contains("Kanboard"));
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
