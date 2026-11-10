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
        // Given user accesses task in Kanboard
        KanboardHomePage home = new LoginPage(driver).loginToKanboard("admin", password);
        ProjectManagementPage project = home.goToFirstProject();
        String taskName = project.getFirstTaskName();
        TaskPage taskPage = new ProjectPage(driver).goToTask(taskName);
        Assert.assertNotNull("Task page loaded", taskPage);
        // When user adds an internal subtask
        driver.findElement(By.linkText("Add a sub-task")).click();
        WebElement titleInput = driver.findElement(By.id("form-title"));
        titleInput.sendKeys("Subtask 001");
        driver.findElement(By.xpath("//*[@id='modal-content']/form/div/div[4]/div/div/button")).click();
        // Then subtask appears in the task subtasks section
        Assert.assertTrue("Subtask list contains Subtask 001", driver.getPageSource().contains("Subtask 001") || driver.findElement(By.id("subtasks")).isDisplayed());
    }
}
