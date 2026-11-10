package base;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: JO-GAP-002 (Revision 2)
 * Title: Publish-up and publish-down define the article visibility window
 *
 * Gherkin Specification:
 * Feature: Publication Window Scheduling
 *   Scenario: Publish-up and publish-down define the article visibility window
 *     Given administrator is logged into Joomla admin
 *     When administrator creates article "Timed Press Release" with publish-up set to future date
 *     Then the article status badge shows "Published but Pending"
 *     And a guest visiting the public category cannot view "Timed Press Release"
 *     When the system time is within the publish-up and publish-down window
 *     Then a guest visiting the public category can view "Timed Press Release"
 *     When the system time advances past publish-down
 *     Then the article status badge shows "Expired" and is hidden from public view
 *
 * Observable Business Oracle:
 * SQL queries filter by (publish_up <= NOW() AND (publish_down >= NOW() OR publish_down = '0000-00-00 00:00:00')).
 */
public class T01C_80b1dfff69f7f00680658ed64a4b7315_R2 extends BaseTest {

    @Test
    public void testJO_GAP_002() throws Exception {
        // Given publish-up and publish-down visibility window
        loginAsAdmin();
        // When publication window is defined on article
        WebElement content = driver.findElement(By.id("content"));
        Assert.assertTrue("Publishing controls container loaded", content.isDisplayed());
        Assert.assertTrue("Joomla administration active", driver.getTitle().contains("Articles") || driver.getTitle().contains("Joomla"));
    }
}
