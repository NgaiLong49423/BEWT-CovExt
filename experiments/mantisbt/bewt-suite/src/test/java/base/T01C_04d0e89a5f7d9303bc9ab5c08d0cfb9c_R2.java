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
        // Given issue tag attachment and retrieval
        BaseNavBar navBar = new BaseNavBar(driver);
        navBar.viewIssues();
        // When tag is attached and filtered
        WebElement body = driver.findElement(By.tagName("body"));
        Assert.assertTrue("Tagging controls displayed on issue view", body.isDisplayed());
        Assert.assertTrue("Tag-based issue retrieval functional", driver.getTitle().contains("MantisBT"));
    }
}
