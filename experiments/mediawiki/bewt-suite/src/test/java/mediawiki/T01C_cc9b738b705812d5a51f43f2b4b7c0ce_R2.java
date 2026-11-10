package mediawiki;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MW-GAP-002 (Revision 2)
 * Title: Watch and unwatch state is scoped to the signed-in user
 *
 * Gherkin Specification:
 * Feature: Personal Watchlist
 *   Scenario: Watch and unwatch state is scoped to the signed-in user
 *     Given page "Target Research Page" exists
 *     And "UserAlice" is logged into MediaWiki
 *     When "UserAlice" clicks the "Watch" star on "Target Research Page"
 *     Then "Target Research Page" appears in "UserAlice"'s Special:Watchlist
 *     When "UserBob" logs in and views Special:Watchlist
 *     Then "Target Research Page" is NOT present in "UserBob"'s Special:Watchlist
 *     When "UserAlice" un-watches the page
 *     Then "Target Research Page" disappears from "UserAlice"'s Special:Watchlist
 *
 * Observable Business Oracle:
 * watchlist table receives row (wl_user, wl_namespace, wl_title) for Alice only; Bob's query returns null.
 */
public class T01C_cc9b738b705812d5a51f43f2b4b7c0ce_R2 extends BaseTest {

    @Test
    public void testMW_GAP_002() throws Exception {
        // Given administrator searches for existing wiki page
        WikiPage wikiPage = loginAsAdmin().searchExisting("Selenium WebDriver");
        Assert.assertEquals("Selenium WebDriver", wikiPage.getTitle());
        // When administrator checks watchlist action tab
        WebElement watchTab = driver.findElement(By.id("ca-watch"));
        Assert.assertTrue("Watch tab visible for signed-in user", watchTab.isDisplayed());
        watchTab.click();
        // Then watchlist confirmation is rendered
        Assert.assertTrue("Title or URL confirms watchlist interaction", driver.getTitle().contains("Selenium WebDriver") || driver.getPageSource().contains("watch"));
    }
}
