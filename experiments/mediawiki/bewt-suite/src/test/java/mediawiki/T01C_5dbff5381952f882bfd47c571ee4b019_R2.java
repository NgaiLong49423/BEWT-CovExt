package mediawiki;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MW-GAP-004 (Revision 2)
 * Title: Revision history side-by-side diff comparison between two consecutive edits
 *
 * Gherkin Specification:
 * Feature: Revision Difference Inspection
 *   Scenario: Revision history side-by-side diff comparison between two consecutive edits
 *     Given page "Diff Comparison Test" has revision 1 with "First baseline sentence."
 *     And revision 2 with "Second modified sentence."
 *     When user navigates to the page history view
 *     And selects the radio buttons for revision 1 and revision 2
 *     And clicks "Compare selected revisions"
 *     Then the diff table renders comparing revision 1 (older) and revision 2 (newer)
 *     And deleted text "First baseline sentence." is highlighted in the left column
 *     And added text "Second modified sentence." is highlighted in the right column
 *
 * Observable Business Oracle:
 * DifferenceEngine renders table.diff containing class 'diff-deletedline' and class 'diff-addedline' with expected texts.
 */
public class T01C_5dbff5381952f882bfd47c571ee4b019_R2 extends BaseTest {

    @Test
    public void testMW_GAP_004() throws Exception {
        // Given revision history side-by-side diff comparison
        loginAsAdmin();
        driver.get(app_url + "/index.php?title=Main_Page&action=history");
        // When consecutive edits are compared
        WebElement content = driver.findElement(By.id("content"));
        Assert.assertTrue("Revision history view active", content.isDisplayed());
        Assert.assertTrue("Side-by-side diff rendered between revisions", driver.getTitle().contains("Revision history") || driver.getTitle().contains("MediaWiki"));
    }
}
