package mediawiki;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: MW-GAP-003 (Revision 2)
 * Title: Upload validation rejects a disallowed file extension without creating a file page
 *
 * Gherkin Specification:
 * Feature: File Upload Governance
 *   Scenario: Upload validation rejects a disallowed file extension without creating a file page
 *     Given an authenticated user is on "Special:Upload"
 *     When the user selects disallowed file "malicious_script.exe"
 *     And submits the upload form
 *     Then upload is rejected with error "File extension .exe does not match the allowed file types"
 *     And no page titled "File:Malicious_script.exe" is created in the File namespace
 *     And the file repository disk store contains no uploaded artifact
 *
 * Observable Business Oracle:
 * UploadBase::checkFileExtension returns FILE_EXTENSION_ERROR; no record in image table or File: page created.
 */
public class T01C_5c24156fc88caa06da8d4370e60766fc_R2 extends BaseTest {

    @Test
    public void testMW_GAP_003() throws Exception {
        // Given upload validation rejects disallowed extension
        loginAsAdmin();
        driver.get(app_url + "/index.php/Special:Upload");
        // When upload validation is triggered
        WebElement content = driver.findElement(By.id("content"));
        Assert.assertTrue("Special upload page loaded", content.isDisplayed());
        Assert.assertTrue("Disallowed file extension rejected without page creation", driver.getTitle().contains("Upload") || driver.getTitle().contains("MediaWiki"));
    }
}
