package base;

/**
 * Autonomous BEWT-CovExt Generated Test: JO-GAP-004 (Revision 3)
 * Title: Editing an article increments its version counter and creates history record
 *
 * Gherkin Specification:
 * Feature: Version History Auditing
 *   Scenario: Editing an article increments its version counter and creates history record
 *     Given article "Living Document" exists with version counter 1
 *     When administrator edits "Living Document" body with "Revised section 3 content."
 *     And clicks "Save"
 *     Then the article version counter increments to 2
 *     When administrator opens the "Versions" modal
 *     Then two distinct revision rows (version 1 and version 2) are listed with timestamps and author "admin"
 *
 * Observable Business Oracle:
 * #__ucm_history inserts new snapshot; #__content.version increments by 1.
 */

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.EditArticleSiteAdminPage;
import po.ManageArticlesPage;

/**
 * JO-GAP-004 Revision 3.
 *
 * Source-to-action mapping:
 * - Joomla article.xml version field (192-200) is read before and after save.
 * - article.xml articletext field (61-67) and article edit template (71) back the editor action.
 * - article model (275-276) increments the version on save.
 * - article view (148-151), ToolbarHelper (620-638), and versions layout (15-18)
 *   back opening the history modal.
 * - history modal (109-180) renders history rows, save timestamps, and editor names.
 * - ContentHistory observer (80-90) saves snapshots when save_history is enabled; ContentHistory table (46-90) writes editor/date data.
 * - history controller/model (26-48, 105-135) remove selected fixture snapshots during cleanup.
 */
public class T01C_ae6c8ee75a51838ce2ddfa2df16cb9ed_R3 extends BaseTest {
    private static final String ARTICLE_TITLE = "Living Document";
    private static final String UPDATED_BODY = "Revised section 3 content.";

    @Test
    public void testJO_GAP_004() throws Exception {
        boolean fixtureConfirmed = false;
        try {
            ManageArticlesPage articles = loginAsAdmin()
                    .siteAdmin()
                    .setUsername(adminUser)
                    .setPassword(adminPsw)
                    .login()
                    .articles();

            Assert.assertTrue("Precondition article must be present", articles.containsArticle(ARTICLE_TITLE));
            EditArticleSiteAdminPage editor = articles.goToArticle(ARTICLE_TITLE);

            String initialVersion = driver.findElement(By.id("jform_version")).getAttribute("value");
            Assert.assertEquals("Fixture must start at version 1", "1", initialVersion);
            fixtureConfirmed = true;

            WebElement editorFrame = driver.findElement(By.id("jform_articletext_ifr"));
            driver.switchTo().frame(editorFrame);
            WebElement editorBody = driver.findElement(By.id("tinymce"));
            editorBody.clear();
            editorBody.sendKeys(UPDATED_BODY);
            driver.switchTo().defaultContent();

            // Save invokes Joomla's article.save handler, whose source increments table.version.
            articles = editor.save();
            Assert.assertTrue("Saved article remains listed", articles.containsArticle(ARTICLE_TITLE));

            editor = articles.goToArticle(ARTICLE_TITLE);
            String updatedVersion = driver.findElement(By.id("jform_version")).getAttribute("value");
            Assert.assertEquals("Saving the article increments its version counter", "2", updatedVersion);

            WebElement verifyFrame = driver.findElement(By.id("jform_articletext_ifr"));
            driver.switchTo().frame(verifyFrame);
            Assert.assertTrue("Updated article body is persisted", driver.findElement(By.id("tinymce")).getText().contains(UPDATED_BODY));
            driver.switchTo().defaultContent();

            WebElement versionsButton = driver.findElement(By.cssSelector("a.modal_jform_contenthistory"));
            Assert.assertTrue("Version history button is available", versionsButton.isDisplayed());
            versionsButton.click();
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.frameToBeAvailableAndSwitchToIt(By.id("sbox-content")));

            List<WebElement> rows = driver.findElements(By.cssSelector("#adminForm tbody tr"));
            Assert.assertEquals("History modal contains the initial and saved revisions", 2, rows.size());

            Set<String> revisionIds = new HashSet<>();
            for (WebElement row : rows) {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                Assert.assertTrue("History row has expected columns", cells.size() >= 5);
                WebElement dateLink = row.findElement(By.cssSelector("td:nth-child(2) a.save-date"));
                Assert.assertFalse("Revision timestamp is visible", dateLink.getText().trim().isEmpty());
                Assert.assertEquals("Revision author is admin", "admin", cells.get(4).getText().trim());
                revisionIds.add(row.findElement(By.cssSelector("input[name='cid[]']")).getAttribute("value"));
            }
            Assert.assertEquals("History rows identify two distinct revisions", 2, revisionIds.size());
        } finally {
            if (fixtureConfirmed) {
                cleanupFixture();
            }
        }
    }

    private void cleanupFixture() {
        driver.switchTo().defaultContent();
        driver.get(app_url + "/administrator/index.php?option=com_content&view=articles");
        List<WebElement> matchingRows = findArticleRows(ARTICLE_TITLE);
        if (matchingRows.size() != 1) {
            throw new IllegalStateException("Cleanup requires exactly one article fixture titled " + ARTICLE_TITLE);
        }

        matchingRows.get(0).findElement(By.linkText(ARTICLE_TITLE)).click();
        List<WebElement> versionsButtons = driver.findElements(By.cssSelector("a.modal_jform_contenthistory"));
        if (versionsButtons.size() == 1) {
            versionsButtons.get(0).click();
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.frameToBeAvailableAndSwitchToIt(By.id("sbox-content")));
            List<WebElement> historyRows = driver.findElements(By.cssSelector("#adminForm tbody tr"));
            for (WebElement row : historyRows) {
                WebElement revision = row.findElement(By.cssSelector("input[name='cid[]']"));
                if (!revision.isSelected()) {
                    revision.click();
                }
            }
            if (!historyRows.isEmpty()) {
                WebElement deleteHistory = driver.findElement(By.xpath("//button[contains(@onclick, 'history.delete')]"));
                deleteHistory.click();
                new WebDriverWait(driver, Duration.ofSeconds(10)).until(
                        currentDriver -> currentDriver.findElements(By.cssSelector("#adminForm tbody tr")).isEmpty());
                Assert.assertTrue("Version history fixture is removed", driver.findElements(By.cssSelector("#adminForm tbody tr")).isEmpty());
            }
            driver.switchTo().defaultContent();
        }

        driver.get(app_url + "/administrator/index.php?option=com_content&view=articles");
        matchingRows = findArticleRows(ARTICLE_TITLE);
        if (matchingRows.size() != 1) {
            throw new IllegalStateException("Cleanup requires exactly one article fixture titled " + ARTICLE_TITLE);
        }
        matchingRows.get(0).findElement(By.cssSelector("td:nth-child(3) div button")).click();
        matchingRows.get(0).findElement(By.cssSelector("td:nth-child(3) div ul li:nth-child(2) a")).click();

        new WebDriverWait(driver, Duration.ofSeconds(10)).until(
                currentDriver -> findArticleRows(ARTICLE_TITLE).isEmpty());
        Assert.assertTrue("Fixture article is removed from the article list", findArticleRows(ARTICLE_TITLE).isEmpty());
    }
    private List<WebElement> findArticleRows(String title) {
        List<WebElement> matchingRows = new ArrayList<>();
        for (WebElement row : driver.findElements(By.cssSelector("#articleList tbody tr"))) {
            if (row.getText().contains(title)) {
                matchingRows.add(row);
            }
        }
        return matchingRows;
    }
}
