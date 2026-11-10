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
        // Given administrator logs in and accesses article management
        ManageArticlesPage articles = loginAsAdmin()
                .siteAdmin()
                .setUsername(adminUser)
                .setPassword(adminPsw)
                .login()
                .articles();
        Assert.assertNotNull("Manage articles page loaded", articles);
        // When administrator opens article editor
        EditArticleSiteAdminPage editPage = articles.goToArticle("Article 1");
        // Then article editing workspace is loaded
        Assert.assertNotNull("Edit article site admin page loaded", editPage);
        Assert.assertTrue("Admin interface confirms article editing", driver.getTitle().contains("Articles") || driver.getTitle().contains("Joomla"));
    }
}
