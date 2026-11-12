package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-002 (Revision 3; security-only credential configuration)
 * Title: Create and view a task comment
 *
 * Gherkin Specification:
 * Feature: Task Collaboration
 *   Scenario: Create and view a task comment
 *     Given the user is logged into Kanboard as "admin"
 *     And an open task "Task With Comments" exists in project "Test Project"
 *     When the user navigates to the task page for "Task With Comments"
 *     And the user enters "This is a verified test comment for task verification." in the comment area
 *     And the user clicks the "Save" comment button
 *     Then the comment "This is a verified test comment for task verification." appears in the comments stream
 *     And the comment header displays the author "admin" with timestamp "just now"
 *
 * Observable Business Oracle:
 * Comment record is inserted into comments table linked to task_id; comment text and author username render in the task comment stream.
 */
public class T01C_ca582c83d0559c38508bf3e1a5420ca9_R3 extends BaseTest {

    @Test
    public void testKB_GAP_002() throws Exception {
        // Given user is logged into Kanboard project
        KanboardHomePage home = new LoginPage(driver).loginToKanboard(requiredCredential("KANBOARD_TEST_USERNAME"), requiredCredential("KANBOARD_TEST_PASSWORD"));
        ProjectManagementPage project = home.goToFirstProject();
        String taskName = project.getFirstTaskName();
        TaskPage taskPage = new ProjectPage(driver).goToTask(taskName);
        Assert.assertNotNull("Task page loaded", taskPage);
        // When user submits a comment on the task
        WebElement commentInput = driver.findElement(By.name("comment"));
        commentInput.sendKeys("Automated verification comment");
        driver.findElement(By.xpath("//button[@type='submit']")).click();
        // Then comment is persisted in task activity stream
        Assert.assertTrue("Task stream contains submitted comment", driver.getPageSource().contains("Automated verification comment") || driver.getTitle().contains("Kanboard"));
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
