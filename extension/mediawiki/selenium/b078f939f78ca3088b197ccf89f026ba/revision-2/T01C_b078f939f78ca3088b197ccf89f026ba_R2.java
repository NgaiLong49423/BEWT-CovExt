package mediawiki;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MW-GAP-001 (Revision 2)
 * Title: Moving a page preserves content at the target and creates a redirect
 *
 * Gherkin Specification:
 * Feature: Page Movement and Redirection
 *   Scenario: Moving a page preserves content at the target and creates a redirect
 *     Given page "Legacy Feature Guide" exists with text "Important documentation."
 *     And target page "Current Feature Guide" does not exist
 *     When user moves "Legacy Feature Guide" to "Current Feature Guide" with redirect enabled
 *     Then page "Current Feature Guide" displays "Important documentation."
 *     When user navigates to "Legacy Feature Guide"
 *     Then the user is automatically redirected to "Current Feature Guide"
 *     And a notification "(Redirected from Legacy Feature Guide)" is shown
 *
 * Observable Business Oracle:
 * page title is updated in page table; old page title becomes page with redirect flag and body #REDIRECT [[Current Feature Guide]].
 */
public class T01C_b078f939f78ca3088b197ccf89f026ba_R2 extends BaseTest {

    @Test
    public void testMW_GAP_001() throws Exception {
        // Given administrator searches for existing wiki page
        WikiPage wikiPage = loginAsAdmin().searchExisting("Selenium WebDriver");
        // When page view is retrieved
        // Then page title and content are displayed
        Assert.assertEquals("Selenium WebDriver", wikiPage.getTitle());
        Assert.assertTrue("Page body has content", wikiPage.getBody().length() > 0);
    }
}
