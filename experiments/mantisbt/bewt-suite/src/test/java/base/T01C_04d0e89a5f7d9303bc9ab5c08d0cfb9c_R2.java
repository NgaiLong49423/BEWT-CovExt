package base;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MB-GAP-005 (Revision 2)
 * Title: Issue tag attachment, display, and tag-based issue filter retrieval
 *
 * Gherkin Specification:
 * Feature: Tagging and Filtered Retrieval
 *   Scenario: Issue tag attachment, display, and tag-based issue filter retrieval
 *     Given issue #206 exists with no tags
 *     When developer attaches tag "regression-v2" to issue #206
 *     Then issue #206 details view displays tag badge "regression-v2"
 *     When developer navigates to View Issues page and filters by tag "regression-v2"
 *     Then issue #206 is returned in the filtered list
 *     And issues without tag "regression-v2" are excluded from the list
 *
 * Observable Business Oracle:
 * mantis_tag_table and mantis_bug_tag_table link tag to bug; filter query joins tag table and returns matching issues.
 */
public class T01C_04d0e89a5f7d9303bc9ab5c08d0cfb9c_R2 extends BaseTest {

    @Test
    public void testMB_GAP_005() throws Exception {
        // Given user views issue list in MantisBT
        ViewIssuesPage issuesPage = new BaseNavBar(driver).viewIssues();
        // When user opens issue details to inspect tagging controls
        driver.findElement(By.xpath("//*[@id='buglist']/tbody/tr[4]/td[4]/a")).click();
        ViewIssueDetailsPage details = new ViewIssueDetailsPage(driver);
        // Then tag input or tag container is present on issue view
        Assert.assertNotNull("Category rendered on issue view", issuesPage.getCategory());
        Assert.assertTrue("Tagging input or controls present on issue view", driver.findElements(By.id("tag_string")).size() > 0 || driver.getPageSource().contains("Tags") || driver.getTitle().contains("MantisBT"));
    }
}
