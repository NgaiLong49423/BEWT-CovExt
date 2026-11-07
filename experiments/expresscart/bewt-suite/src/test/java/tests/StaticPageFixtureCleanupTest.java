package tests;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.NoAlertPresentException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.AdminLoginPage;

import java.time.Duration;
import java.util.List;

/** UI-only cleanup helper for a uniquely identified experiment page fixture. */
public class StaticPageFixtureCleanupTest extends BaseTest {

    @Test
    public void deleteNamedExperimentPage() {
        String pageName = System.getProperty("fixture.page.name");
        Assert.assertNotNull("fixture.page.name is required", pageName);

        String adminEmail = System.getenv("ADMIN_EMAIL");
        String adminPassword = System.getenv("ADMIN_PASSWORD");
        Assert.assertNotNull("ADMIN_EMAIL must be set", adminEmail);
        Assert.assertNotNull("ADMIN_PASSWORD must be set", adminPassword);

        goToAdminHome();
        new AdminLoginPage(driver).setEmail(adminEmail).setPassword(adminPassword).doLogin();
        driver.get(appUrl + "/admin/settings/pages");

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        By rowLocator = By.xpath("//li[contains(@class, 'list-group-item') and contains(normalize-space(.), "
                + "'" + pageName + "')] ");
        List<WebElement> rows = wait.until(d -> {
            List<WebElement> found = d.findElements(rowLocator);
            return found.isEmpty() ? null : found;
        });
        Assert.assertEquals("Expected exactly one uniquely named experiment page", 1, rows.size());
        rows.get(0).findElement(By.id("btnPageDelete")).click();

        try {
            Alert confirmation = driver.switchTo().alert();
            confirmation.accept();
        } catch (NoAlertPresentException ignored) {
            // The application may have already processed/dismissed its native confirmation.
        }

        wait.until(ExpectedConditions.invisibilityOfElementLocated(rowLocator));
        Assert.assertTrue("Experiment page row must be removed", driver.findElements(rowLocator).isEmpty());
    }
}
