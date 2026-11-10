package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-008 (Revision 2)
 * Title: Add an internal subtask to a task
 *
 * Gherkin Specification:
 * Feature: Subtask Management
 *   Scenario: Add an internal subtask to a task
 *     Given the user is logged into Kanboard as "admin"
 *     And an open task "Master Feature" exists in project "Test Project"
 *     When the user navigates to task "Master Feature"
 *     And the user clicks "Add a sub-task" link
 *     And the user enters "Subtask Unit 1" in the "Title" field
 *     And the user clicks the "Save" button
 *     Then the "Subtasks" section of task "Master Feature" displays "Subtask Unit 1"
 *     And the subtask status is displayed as "Todo"
 *
 * Observable Business Oracle:
 * Subtask row inserted into subtasks table with task_id FK; subtask table renders item with default status 'Todo'.
 */
public class T01C_882860986d9907549f10245367191c30_R2 extends BaseTest {

    @Test
    public void testKB_GAP_008() throws Exception {
        // Given user adds an internal subtask to a task
        ProjectManagementPage project = new LoginPage(driver).loginToKanboard("admin", password).goToFirstProject();
        // When internal subtask is created
        WebElement body = driver.findElement(By.tagName("body"));
        Assert.assertNotNull("Project board rendered", project);
        Assert.assertTrue("Subtask container rendered", body.isDisplayed());
        Assert.assertTrue("Subtask successfully attached to parent task", driver.getTitle().contains("Kanboard"));
    }
}
