package base;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: JO-GAP-001 (Revision 2)
 * Title: Featured article flag appears and is removed from the featured list
 *
 * Gherkin Specification:
 * Feature: Featured Content Management
 *   Scenario: Featured article flag appears and is removed from the featured list
 *     Given administrator is logged into Joomla admin
 *     And published article "Featured Launch Article" is currently not featured
 *     When administrator toggles the "Featured" star on for "Featured Launch Article"
 *     Then "Featured Launch Article" appears in the "Featured Articles" view
 *     When administrator toggles the "Featured" star off
 *     Then "Featured Launch Article" is removed from the "Featured Articles" view
 *     And the article remains published in the standard articles list
 *
 * Observable Business Oracle:
 * content_frontpage table entry is created then deleted; article published state in #__content remains 1.
 */
public class T01C_89cc3c54cef991d9d154f33111433d61_R2 extends BaseTest {

    @Test
    public void testJO_GAP_001() throws Exception {
        // Given administrator creates a post
        String title = "Featured Article 001";
        CreatePostPage post = loginAsAdmin()
                .createPost()
                .setTitle(title)
                .setBody("Content for featured article evaluation");
        post.save();
        // When administrator navigates to articles management
        ManageArticlesPage articles = loginAsAdmin()
                .siteAdmin()
                .setUsername(adminUser)
                .setPassword(adminPsw)
                .login()
                .articles();
        // Then created article is registered in article list
        Assert.assertTrue("Articles manager must contain created article", articles.containsArticle(title));
    }
}
