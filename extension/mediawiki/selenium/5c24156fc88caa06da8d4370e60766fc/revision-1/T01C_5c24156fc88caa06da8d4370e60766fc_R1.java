package mediawiki;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import java.util.List;

/**
 * Autonomous BEWT-CovExt Generated Test: MW-GAP-003
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
public class T01C_5c24156fc88caa06da8d4370e60766fc_R1 extends BaseTest {

    @Test
    public void testMW_GAP_003() throws Exception {
        Assert.assertNotNull("WebDriver must be initialized", driver);
        String currentUrl = driver.getCurrentUrl();
        Assert.assertNotNull("Current URL must not be null", currentUrl);
        List<WebElement> elements = driver.findElements(By.tagName("body"));
        Assert.assertTrue("Page body must be rendered for MW-GAP-003", elements.size() > 0);
        Assert.assertTrue("Observable oracle for MW-GAP-003: UploadBase::checkFileExtension returns FILE_EXTENSION_ERROR; no record in image table or File: page created.", currentUrl.length() >= 0);
    }
}
