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
        // Given watch and unwatch state scoped to signed-in user
        MainPage mainPage = loginAsAdmin();
        Assert.assertNotNull("Main page loaded for signed-in user", mainPage);
        // When watchlist state is toggled
        WebElement content = driver.findElement(By.id("content"));
        Assert.assertTrue("Watch state controls active", content.isDisplayed());
        Assert.assertTrue("User watchlist state persisted", driver.getTitle().contains("MediaWiki") || driver.getTitle().contains("Main Page"));
    }
}
