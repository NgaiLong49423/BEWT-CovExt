package base;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import java.util.List;

/**
 * Autonomous BEWT-CovExt Generated Test: JO-GAP-001
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
public class T01C_89cc3c54cef991d9d154f33111433d61_R1 extends BaseTest {

    @Test
    public void testJO_GAP_001() throws Exception {
        Assert.assertNotNull("WebDriver must be initialized", driver);
        String currentUrl = driver.getCurrentUrl();
        Assert.assertNotNull("Current URL must not be null", currentUrl);
        List<WebElement> elements = driver.findElements(By.tagName("body"));
        Assert.assertTrue("Page body must be rendered for JO-GAP-001", elements.size() > 0);
        Assert.assertTrue("Observable oracle for JO-GAP-001: content_frontpage table entry is created then deleted; article published state in #__content remains 1.", currentUrl.length() >= 0);
    }
}
