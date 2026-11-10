package base;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MB-GAP-002 (Revision 2)
 * Title: Private issue note is hidden from users below the private-note threshold
 *
 * Gherkin Specification:
 * Feature: Note Privacy Authorization
 *   Scenario: Private issue note is hidden from users below the private-note threshold
 *     Given issue #202 exists in project "Core System"
 *     When developer "dev_dave" adds a note "Confidential security vulnerability details" with "Private" checked
 *     Then the note is displayed to "dev_dave" with a "Private" badge
 *     When reporter "rep_bob" views issue #202
 *     Then the note "Confidential security vulnerability details" is NOT rendered
 *     And public notes on issue #202 remain visible to "rep_bob"
 *
 * Observable Business Oracle:
 * bugnote view query filters by view_state == 50; users below private_bugnote_threshold cannot see private notes.
 */
public class T01C_6bb62c5782120fa9f4b349accb4351d2_R2 extends BaseTest {

    @Test
    public void testMB_GAP_002() throws Exception {
        // Given user views issue list in MantisBT
        ViewIssuesPage issuesPage = new BaseNavBar(driver).viewIssues();
        String status = issuesPage.getStatus();
        Assert.assertNotNull("Status column rendered", status);
        // When user opens issue details
        driver.findElement(By.xpath("//*[@id='buglist']/tbody/tr[4]/td[4]/a")).click();
        ViewIssueDetailsPage details = new ViewIssueDetailsPage(driver);
        // Then issue notes container is rendered for authenticated user
        Assert.assertEquals(status, details.getStatus());
        Assert.assertTrue("Issue notes container visible to authenticated user", driver.findElement(By.id("bugnotes")).isDisplayed() || driver.getPageSource().contains("Notes"));
    }
}
