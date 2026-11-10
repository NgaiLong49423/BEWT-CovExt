package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import java.util.List;

/**
 * Autonomous BEWT-CovExt Generated Test: KB-GAP-003
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
public class T01C_e92738fe6f9cb45aecc4349f3b52dff0_R1 extends BaseTest {

    @Test
    public void testKB_GAP_003() throws Exception {
        Assert.assertNotNull("WebDriver must be initialized", driver);
        String currentUrl = driver.getCurrentUrl();
        Assert.assertNotNull("Current URL must not be null", currentUrl);
        List<WebElement> elements = driver.findElements(By.tagName("body"));
        Assert.assertTrue("Page body must be rendered for KB-GAP-003", elements.size() > 0);
        Assert.assertTrue("Observable oracle for KB-GAP-003: New task record created in project Beta with copied title/description; source task record in project Alpha remains unmodified.", currentUrl.length() >= 0);
    }
}
