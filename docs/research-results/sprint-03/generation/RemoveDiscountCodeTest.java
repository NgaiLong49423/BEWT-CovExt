package tests;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.PaymentPage;

import java.time.Duration;
import java.util.List;

public class RemoveDiscountCodeTest extends BaseTest {

    private WebDriverWait wait;

    @Before
    public void setUpWait() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @Test
    public void testRemoveAppliedDiscountRestoresOriginalTotal() {
        String discountCode = System.getProperty("test.discount.code");
        Assert.assertNotNull("Precondition failed: System property 'test.discount.code' is required but not set.", discountCode);
        Assert.assertFalse("Precondition failed: System property 'test.discount.code' must not be blank.", discountCode.trim().isEmpty());

        goToHome();
        String currentUrl = driver.getCurrentUrl();
        if (!currentUrl.contains("/checkout/payment")) {
            String paymentUrl = currentUrl.replaceAll("/(checkout.*)?$", "") + "/checkout/payment";
            driver.get(paymentUrl);
        }

        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("discountCode")));
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("total-cart-amount")));
        } catch (Exception e) {
            Assert.fail("Precondition failed: Checkout is not at the payment step with cart items or discount module is not active.");
        }

        WebElement totalElement = driver.findElement(By.id("total-cart-amount"));
        double undiscountedTotal = parsePrice(totalElement.getText().trim());
        Assert.assertTrue("Precondition failed: Undiscounted total must be greater than zero.", undiscountedTotal > 0.0);

        PaymentPage paymentPage = new PaymentPage(driver);
        paymentPage.setDiscountCode(discountCode.trim());
        WebElement applyBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("addDiscountCode")));
        applyBtn.click();

        WebElement discountAmountElement = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("discount-amount")));
        Assert.assertTrue("Expected discount amount to be displayed after applying discount code.", discountAmountElement.isDisplayed());

        wait.until(driverInstance -> {
            WebElement el = driverInstance.findElement(By.id("total-cart-amount"));
            return parsePrice(el.getText().trim()) < undiscountedTotal;
        });
        double discountedTotal = parsePrice(driver.findElement(By.id("total-cart-amount")).getText().trim());
        Assert.assertTrue("Discounted total should be strictly less than undiscounted total.", discountedTotal < undiscountedTotal);

        WebElement removeButton = wait.until(ExpectedConditions.elementToBeClickable(By.id("removeDiscountCode")));
        removeButton.click();

        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.id("discount-amount")));
        List<WebElement> remainingDiscountElements = driver.findElements(By.id("discount-amount"));
        Assert.assertTrue("Discount amount should no longer be displayed after removal.",
                remainingDiscountElements.isEmpty() || !remainingDiscountElements.get(0).isDisplayed());

        wait.until(ExpectedConditions.attributeToBe(By.id("discountCode"), "value", ""));
        WebElement discountField = driver.findElement(By.id("discountCode"));
        String fieldValue = discountField.getAttribute("value");
        Assert.assertTrue("Discount code input field should be empty after removal.",
                fieldValue == null || fieldValue.trim().isEmpty());

        wait.until(driverInstance -> {
            WebElement el = driverInstance.findElement(By.id("total-cart-amount"));
            return Math.abs(parsePrice(el.getText().trim()) - undiscountedTotal) < 0.001;
        });
        double restoredTotal = parsePrice(driver.findElement(By.id("total-cart-amount")).getText().trim());
        Assert.assertEquals("Restored total should equal the recorded undiscounted total.",
                undiscountedTotal, restoredTotal, 0.01);
    }

    private double parsePrice(String text) {
        if (text == null) {
            return 0.0;
        }
        String cleaned = text.replaceAll("[^0-9.]", "");
        if (cleaned.isEmpty()) {
            return 0.0;
        }
        return Double.parseDouble(cleaned);
    }
}
