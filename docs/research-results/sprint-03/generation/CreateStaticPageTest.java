package tests;

import org.junit.After;
import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.AdminLoginPage;

import java.time.Duration;
import java.util.UUID;

public class CreateStaticPageTest extends BaseTest {

    private String createdPageSlug;
    private String createdPageName;
    private boolean pageCreated = false;
    private String adminEmail;
    private String adminPassword;

    @Test
    public void testCreateAndViewEnabledStaticPage() {
        adminEmail = System.getProperty("admin.email", System.getenv("ADMIN_EMAIL"));
        adminPassword = System.getProperty("admin.password", System.getenv("ADMIN_PASSWORD"));
        Assert.assertNotNull("Admin email must be configured via system property 'admin.email' or env var 'ADMIN_EMAIL'", adminEmail);
        Assert.assertNotNull("Admin password must be configured via system property 'admin.password' or env var 'ADMIN_PASSWORD'", adminPassword);

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        // Given an administrator has access to static page management
        driver.get(appUrl + "/admin/login");
        AdminLoginPage loginPage = new AdminLoginPage(driver);
        loginPage.setEmail(adminEmail);
        loginPage.setPassword(adminPassword);
        loginPage.doLogin();

        WebElement staticPagesLink = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//a[contains(@href, '/admin/settings/pages') or contains(., 'Static pages')]")
        ));
        staticPagesLink.click();
        wait.until(ExpectedConditions.urlContains("/admin/settings/pages"));

        // And a unique page slug is not already in use
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        String pageSlug = "test-page-" + uniqueSuffix;
        String pageName = "Test Static Page " + uniqueSuffix;
        String pageContent = "Unique static content body: " + UUID.randomUUID().toString();
        this.createdPageSlug = pageSlug;
        this.createdPageName = pageName;

        Assert.assertFalse(
            "Page slug should not already exist in the static pages table",
            driver.getPageSource().contains(pageSlug)
        );

        // When the administrator opens the new static-page form
        WebElement newPageButton = wait.until(ExpectedConditions.elementToBeClickable(
            By.xpath("//a[contains(@href, '/admin/settings/pages/new') or contains(., 'New page') or contains(., 'Create new')]")
        ));
        newPageButton.click();
        wait.until(ExpectedConditions.urlContains("/admin/settings/pages/new"));

        // And enters a page name, the unique page slug, and unique page content
        WebElement nameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("pageName")));
        nameInput.clear();
        nameInput.sendKeys(pageName);

        WebElement slugInput = driver.findElement(By.id("pageSlug"));
        slugInput.clear();
        slugInput.sendKeys(pageSlug);

        WebElement editable = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".note-editable")));
        editable.click();
        editable.sendKeys(pageContent);

        ((JavascriptExecutor) driver).executeScript(
            "if (typeof $ !== 'undefined' && $('#pageContent').length) {" +
            "    if ($('#pageContent').summernote) {" +
            "        $('#pageContent').summernote('code', arguments[0]);" +
            "    } else {" +
            "        $('#pageContent').val(arguments[0]);" +
            "    }" +
            "}",
            pageContent
        );

        // And enables the page and saves it
        WebElement pageEnabledCheckbox = driver.findElement(By.id("pageEnabled"));
        if (!pageEnabledCheckbox.isSelected()) {
            try {
                pageEnabledCheckbox.click();
            } catch (Exception e) {
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", pageEnabledCheckbox);
            }
        }
        Assert.assertTrue("Page enabled checkbox should be selected", pageEnabledCheckbox.isSelected());

        WebElement saveButton = wait.until(ExpectedConditions.elementToBeClickable(By.id("btnPageUpdate")));
        saveButton.click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.cssSelector("#notify_message, .alert-success")
        ));
        pageCreated = true;

        // When a visitor opens the storefront route for that page slug
        driver.get(appUrl + "/" + pageSlug);

        // Then the browser title equals the page name
        wait.until(ExpectedConditions.titleIs(pageName));
        Assert.assertEquals("Browser title must equal the page name", pageName, driver.getTitle());

        // And the page body displays the unique page content
        WebElement pageBody = wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("body")));
        wait.until(d -> pageBody.getText().contains(pageContent));
        Assert.assertTrue("The page body must display the unique page content", pageBody.getText().contains(pageContent));
    }

    @After
    public void tearDown() {
        if (pageCreated && createdPageName != null) {
            try {
                driver.get(appUrl + "/admin/settings/pages");
                WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
                if (driver.getCurrentUrl().contains("/admin/login") && adminEmail != null && adminPassword != null) {
                    AdminLoginPage loginPage = new AdminLoginPage(driver);
                    loginPage.setEmail(adminEmail);
                    loginPage.setPassword(adminPassword);
                    loginPage.doLogin();
                    driver.get(appUrl + "/admin/settings/pages");
                }

                By pageItemLocator = By.xpath("//li[contains(@class, 'list-group-item') and contains(., '" + createdPageName + "')]");
                WebElement pageItem = wait.until(ExpectedConditions.presenceOfElementLocated(pageItemLocator));
                WebElement deleteBtn = pageItem.findElement(By.cssSelector("button#btnPageDelete, button.btn-outline-danger"));
                deleteBtn.click();

                confirmDelete(wait);

                wait.until(ExpectedConditions.invisibilityOfElementLocated(pageItemLocator));
            } catch (Exception e) {
                Assert.fail("Failed to cleanup created static page '" + createdPageName + "': " + e.getMessage());
            }
        }
    }

    private void confirmDelete(WebDriverWait wait) {
        try {
            Alert alert = wait.withTimeout(Duration.ofSeconds(3)).until(ExpectedConditions.alertIsPresent());
            alert.accept();
            return;
        } catch (Exception ignored) {
        }
        try {
            WebElement bootboxConfirm = wait.withTimeout(Duration.ofSeconds(3)).until(
                ExpectedConditions.elementToBeClickable(By.cssSelector(".bootbox .btn-danger, .bootbox .btn-primary, .bootbox-accept, button[data-bb-handler='confirm']"))
            );
            bootboxConfirm.click();
        } catch (Exception ignored) {
        }
    }
}
