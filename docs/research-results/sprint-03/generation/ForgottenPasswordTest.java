package tests;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.UUID;

public class ForgottenPasswordTest extends BaseTest {

    @Test
    public void testForgottenPasswordGenericResponseForUnregisteredEmail() {
        // Given an email address is not present in the customer collection
        String nonExistentEmail = "nonexistent_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        // When the visitor opens the forgotten-password form
        driver.get(appUrl + "/customer/forgotten");

        // Form id is #customerForgotten, email input is #email, submit button is button inside form
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("#customerForgotten #email")));

        // And submits that email address
        emailInput.clear();
        emailInput.sendKeys(nonExistentEmail);

        WebElement submitButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("#customerForgotten button")));
        submitButton.click();

        // Then the page shows a success notification
        // ExpressCart showNotification helper creates an alert or #notify_message
        WebElement notification = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("#notify_message, .alert-success, .alert, [role='alert']")));

        Assert.assertTrue("Success notification should be visible on the page", notification.isDisplayed());

        // And the notification says "If your account exists, a password reset has been sent to your email"
        String expectedMessage = "If your account exists, a password reset has been sent to your email";
        wait.until(ExpectedConditions.textToBePresentInElement(notification, expectedMessage));
        String actualMessage = notification.getText().trim();

        Assert.assertTrue(
                "Expected notification text to contain: '" + expectedMessage + "', but got: '" + actualMessage + "'",
                actualMessage.contains(expectedMessage)
        );
    }
}
