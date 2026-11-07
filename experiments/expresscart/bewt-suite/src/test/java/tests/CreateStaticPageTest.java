package tests;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.NoAlertPresentException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.UnhandledAlertException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.AdminLoginPage;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

public class CreateStaticPageTest extends BaseTest {

    private String pageName;
    private String pageSlug;
    private String pageContent;
    private boolean pageCreated = false;
    private WebDriverWait wait;

    @Before
    public void setUpPreconditions() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        String adminEmail = System.getenv("ADMIN_EMAIL");
        String adminPassword = System.getenv("ADMIN_PASSWORD");

        if (adminEmail == null || adminEmail.trim().isEmpty() || adminPassword == null || adminPassword.trim().isEmpty()) {
            Assert.fail("Precondition failed: ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set.");
        }

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        pageName = "Page " + uniqueSuffix;
        pageSlug = "test-page-" + uniqueSuffix;
        pageContent = "Unique content for test page " + uniqueSuffix;

        goToAdminHome();
        AdminLoginPage loginPage = new AdminLoginPage(driver);
        loginPage.setEmail(adminEmail).setPassword(adminPassword).doLogin();

        wait.until(ExpectedConditions.not(ExpectedConditions.urlContains("/admin/login")));
    }

    @Test
    public void testCreateAndViewEnabledStaticPage() {
        driver.get(appUrl + "/admin/settings/pages/new");

        WebElement nameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("pageName")));
        nameInput.clear();
        nameInput.sendKeys(pageName);

        WebElement slugInput = driver.findElement(By.id("pageSlug"));
        slugInput.clear();
        slugInput.sendKeys(pageSlug);

        WebElement summernoteEditable = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".note-editable")));
        summernoteEditable.click();
        summernoteEditable.clear();
        summernoteEditable.sendKeys(pageContent);

        WebElement enabledCheckbox = driver.findElement(By.id("pageEnabled"));
        if (!enabledCheckbox.isSelected()) {
            enabledCheckbox.click();
        }

        wait.until(d -> pageContent.equals(d.findElement(By.id("pageContent")).getAttribute("value")));

        WebElement saveButton = wait.until(ExpectedConditions.elementToBeClickable(By.id("btnPageUpdate")));
        saveButton.click();
        pageCreated = true;

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("notify_message")));

        driver.get(appUrl + "/" + pageSlug);

        wait.until(ExpectedConditions.titleIs(pageName));
        Assert.assertEquals("Document title should match the created page name.", pageName, driver.getTitle());

        WebElement bodyElement = wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("body")));
        Assert.assertTrue("Page body should display the unique page content.", bodyElement.getText().contains(pageContent));
    }

    @After
    public void cleanUpCreatedPage() {
        if (!pageCreated) {
            return;
        }

        try {
            driver.get(appUrl + "/admin/settings/pages");
            wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

            By targetRowLocator = By.xpath("//li[contains(@class, 'list-group-item') and contains(., '" + pageName + "')]");
            List<WebElement> rows = driver.findElements(targetRowLocator);
            if (!rows.isEmpty()) {
                WebElement row = rows.get(0);
                WebElement deleteButton = row.findElement(By.id("btnPageDelete"));
                try {
                    deleteButton.click();
                    driver.switchTo().alert().accept();
                } catch (UnhandledAlertException e) {
                    try { driver.switchTo().alert().accept(); } catch (NoAlertPresentException ignored) { }
                } catch (NoAlertPresentException ignored) {
                }

                wait.until(ExpectedConditions.invisibilityOfElementLocated(targetRowLocator));
            }

            driver.get(appUrl + "/admin/settings/pages");
            wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));
            List<WebElement> remaining = driver.findElements(targetRowLocator);
            Assert.assertTrue("Cleanup failed: Page with name '" + pageName + "' is still present after deletion.", remaining.isEmpty());
        } catch (Exception e) {
            Assert.fail("Teardown cleanup failed: " + e.getMessage());
        }
    }
}
