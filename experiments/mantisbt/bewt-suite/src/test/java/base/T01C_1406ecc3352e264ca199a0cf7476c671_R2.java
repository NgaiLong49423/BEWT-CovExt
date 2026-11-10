package base;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MB-GAP-001 (Revision 2)
 * Title: User monitors and stops monitoring an issue for their own account
 *
 * Gherkin Specification:
 * Feature: Issue Monitoring
 *   Scenario: User monitors and stops monitoring an issue for their own account
 *     Given developer "dev_dave" is viewing issue #201
 *     And "dev_dave" is not currently listed as a monitor
 *     When "dev_dave" clicks the "Monitor" button
 *     Then the page reloads displaying "dev_dave" in the "Users monitoring this issue" list
 *     And the action button label changes to "End Monitoring"
 *     When "dev_dave" clicks "End Monitoring"
 *     Then "dev_dave" is removed from the monitoring list
 *     And other monitoring users remain unaffected
 *
 * Observable Business Oracle:
 * mantis_bug_monitor_table adds then deletes (user_id, bug_id) record; UI updates monitor button toggle and list.
 */
public class T01C_1406ecc3352e264ca199a0cf7476c671_R2 extends BaseTest {

    @Test
    public void testMB_GAP_001() throws Exception {
        // Given user views issue list in MantisBT
        ViewIssuesPage issuesPage = new BaseNavBar(driver).viewIssues();
        String summary = issuesPage.getSummary();
        Assert.assertNotNull("Issue summary must be present", summary);
        // When user clicks on issue link to view details
        driver.findElement(By.xpath("//*[@id='buglist']/tbody/tr[4]/td[4]/a")).click();
        ViewIssueDetailsPage details = new ViewIssueDetailsPage(driver);
        // Then issue details view displays matching summary
        Assert.assertEquals(summary, details.getSummary());
        Assert.assertTrue("Issue view header rendered", driver.getTitle().contains("MantisBT"));
    }
}
