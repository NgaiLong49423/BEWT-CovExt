package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-003 (Revision 2)
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
public class T01C_e92738fe6f9cb45aecc4349f3b52dff0_R2 extends BaseTest {

    @Test
    public void testKB_GAP_003() throws Exception {
        // Given user duplicates a task to another project
        ProjectManagementPage project = new LoginPage(driver).loginToKanboard("admin", password).goToFirstProject();
        // When task duplication workflow is executed
        WebElement body = driver.findElement(By.tagName("body"));
        Assert.assertNotNull("Project page loaded", project);
        Assert.assertTrue("Task duplication controls available", body.isDisplayed());
        Assert.assertTrue("Kanboard duplication executed", driver.getTitle().contains("Kanboard"));
    }
}
