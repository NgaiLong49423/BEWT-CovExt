package tests;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
public class ForgottenPasswordTest extends BaseTest {

    @Test
    public void returnGenericResponseForUnregisteredEmail() {
        String nonExistentEmail = System.getenv("TEST_UNREGISTERED_EMAIL");
        Assert.assertNotNull("Fixture preflight must provide TEST_UNREGISTERED_EMAIL", nonExistentEmail);
        Assert.assertFalse("Fixture email must not be blank", nonExistentEmail.trim().isEmpty());
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get(appUrl + "/customer/forgotten");

        WebElement form = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("customerForgotten")));
        WebElement emailInput = form.findElement(By.id("email"));
        emailInput.clear();
        emailInput.sendKeys(nonExistentEmail);

        WebElement submitButton = form.findElement(By.cssSelector("button[type='submit'], input[type='submit'], button"));
        submitButton.click();

        WebElement notifyMessage = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("notify_message")));
        Assert.assertTrue("Success notification should be visible", notifyMessage.isDisplayed());

        String expectedNotificationText = "If your account exists, a password reset has been sent to your email";
        String actualNotificationText = notifyMessage.getText().trim();
        Assert.assertEquals("Notification text mismatch", expectedNotificationText, actualNotificationText);
    }
}
