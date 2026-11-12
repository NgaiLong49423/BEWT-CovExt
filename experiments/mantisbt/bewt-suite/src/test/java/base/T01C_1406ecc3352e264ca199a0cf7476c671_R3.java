package base;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import po.BaseNavBar;
import po.LoginPage;

/**
 * Autonomous BEWT-CovExt Generated Test: MB-GAP-001 (Revision 3)
 * Title: User monitors and stops monitoring an issue for their own account
 *
 * Gherkin Specification:
 * Feature: Issue Monitoring
 *   Scenario: User monitors and stops monitoring an issue for their own account
 *     Given developer "dev_dave" is viewing issue #201
 *     And "dev_dave" is not currently listed as a monitor
 *     When "dev_dave" clicks the "Monitor" button
 *     Then the page reloads displaying "dev_dave" in the "Users monitoring this issue" list
 *     And the action button label changes to "End Monitoring"
 *     When "dev_dave" clicks "End Monitoring"
 *     Then "dev_dave" is removed from the monitoring list
 *     And other monitoring users remain unaffected
 *
 * Observable Business Oracle:
 * The current user's monitor entry appears and then disappears from the issue UI,
 * the toggle label follows that state, and all pre-existing monitor links are preserved.
 */
public class T01C_1406ecc3352e264ca199a0cf7476c671_R3 extends BaseTest {
    private static final String ISSUE_ID = "201";
    private static final String TEST_USERNAME = "dev_dave";
    private static final By MONITOR_TABLE = By.xpath(
            "//table[.//td[contains(@class,'form-title') and contains(normalize-space(.),'Users monitoring this issue')]]");

    @Test
    public void testMB_GAP_001() {
        String username = ExperimentConfig.monitorUsername();
        String password = ExperimentConfig.monitorPassword();
        Assert.assertEquals("The configured test account must match the Gherkin actor", TEST_USERNAME, username);

        LoginPage loginPage = new BaseNavBar(driver).logout();
        loginPage.setUsername(username).setPassword(password).login();

        String issueUrl = app_url + "/view.php?id=" + ISSUE_ID;
        driver.get(issueUrl);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        wait.until(ExpectedConditions.presenceOfElementLocated(MONITOR_TABLE));
        Assert.assertTrue("The requested issue must be open", driver.getCurrentUrl().contains("id=" + ISSUE_ID));

        String initialList = monitorListText();
        Assert.assertFalse("dev_dave must not already be listed as a monitor", initialList.contains(TEST_USERNAME));
        Set<String> originalMonitors = monitorEntries();
        Assert.assertTrue("The initial action must be Monitor", isActionVisible("Monitor"));

        boolean completed = false;
        try {
            clickAction("Monitor");
            wait.until(ExpectedConditions.visibilityOfElementLocated(actionLocator("End Monitoring")));

            String monitoredList = monitorListText();
            Assert.assertTrue("The monitoring list must display dev_dave after the action",
                    monitoredList.contains(TEST_USERNAME));
            Set<String> monitorsAfterAdd = monitorEntries();
            Set<String> addedEntries = new HashSet<>(monitorsAfterAdd);
            addedEntries.removeAll(originalMonitors);
            Assert.assertEquals("Monitoring must add exactly one list entry", 1, addedEntries.size());
            Assert.assertEquals("Existing monitors must remain unchanged after adding the current user",
                    originalMonitors, intersection(originalMonitors, monitorsAfterAdd));

            clickAction("End Monitoring");
            wait.until(ExpectedConditions.visibilityOfElementLocated(actionLocator("Monitor")));

            String finalList = monitorListText();
            Assert.assertFalse("dev_dave must be removed from the monitoring list", finalList.contains(TEST_USERNAME));
            Assert.assertEquals("Removing the current user must preserve all other monitors",
                    originalMonitors, monitorEntries());
            completed = true;
        } finally {
            if (!completed && isActionVisible("End Monitoring")) {
                clickAction("End Monitoring");
                wait.until(ExpectedConditions.visibilityOfElementLocated(actionLocator("Monitor")));
            }
        }
    }

    private String monitorListText() {
        WebElement table = driver.findElement(MONITOR_TABLE);
        return table.findElement(By.xpath(".//tr[contains(@class,'row-1')]/td[last()]"))
                .getText().replaceAll("\\s+", " ").trim();
    }

    private Set<String> monitorEntries() {
        WebElement table = driver.findElement(MONITOR_TABLE);
        Set<String> entries = new TreeSet<>();
        for (WebElement link : table.findElements(
                By.xpath(".//tr[contains(@class,'row-1')]/td[last()]//a"))) {
            String href = link.getAttribute("href");
            String label = link.getText().replaceAll("\\s+", " ").trim();
            entries.add((href == null ? "" : href) + "|" + label);
        }
        return entries;
    }

    private boolean isActionVisible(String label) {
        for (WebElement element : driver.findElements(actionLocator(label))) {
            if (element.isDisplayed()) return true;
        }
        return false;
    }

    private void clickAction(String label) {
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.elementToBeClickable(actionLocator(label))).click();
    }

    private By actionLocator(String label) {
        return By.xpath("//*[self::a or self::button or self::input[@type='submit' or @type='button']]"
                + "[normalize-space(.)='" + label + "' or @value='" + label + "']");
    }

    private Set<String> intersection(Set<String> left, Set<String> right) {
        Set<String> result = new HashSet<>(left);
        result.retainAll(right);
        return result;
    }
}
