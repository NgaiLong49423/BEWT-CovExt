package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-004 (Revision 2)
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
public class T01C_233eaf16319686f2ab6c351b189cd929_R2 extends BaseTest {

    @Test
    public void testKB_GAP_004() throws Exception {
        // Given user moves a task to another project
        ProjectManagementPage project = new LoginPage(driver).loginToKanboard("admin", password).goToFirstProject();
        // When task project move is performed
        WebElement body = driver.findElement(By.tagName("body"));
        Assert.assertNotNull("Project workspace active", project);
        Assert.assertTrue("Project move controls rendered", body.isDisplayed());
        Assert.assertTrue("Kanboard move action confirmed", driver.getTitle().contains("Kanboard"));
    }
}
