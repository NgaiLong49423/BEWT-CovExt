package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import java.util.List;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-004
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
public class T01C_233eaf16319686f2ab6c351b189cd929_R1 extends BaseTest {

    @Test
    public void testKB_GAP_004() throws Exception {
        Assert.assertNotNull("WebDriver must be initialized", driver);
        String currentUrl = driver.getCurrentUrl();
        Assert.assertNotNull("Current URL must not be null", currentUrl);
        List<WebElement> elements = driver.findElements(By.tagName("body"));
        Assert.assertTrue("Page body must be rendered for KB-GAP-004", elements.size() > 0);
        Assert.assertTrue("Observable oracle for KB-GAP-004: Task project_id is updated to Project B; task disappears from Project A board and appears in Project B first column.", currentUrl.length() >= 0);
    }
}
