package tests;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class RemoveDiscountCodeTest extends BaseTest {

    private double parseAmount(String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Amount text cannot be null or empty");
        }
        String cleaned = text.replaceAll("[^0-9.,]", "").trim();
        if (cleaned.contains(",") && cleaned.contains(".")) {
            if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
                cleaned = cleaned.replace(".", "").replace(",", ".");
            } else {
                cleaned = cleaned.replace(",", "");
            }
        } else if (cleaned.contains(",")) {
            cleaned = cleaned.replace(",", ".");
        }
        return Double.parseDouble(cleaned);
    }

    @Test
    public void testRemoveDiscountAndRestoreCheckoutTotal() {
        String discountCode = System.getProperty("test.discount.code");
        if (discountCode == null || discountCode.trim().isEmpty()) {
            Assert.fail("Precondition failed: System property 'test.discount.code' is required but not set.");
        }

        driver.get(appUrl + "/checkout/payment");

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        List<WebElement> cartAmountElements = driver.findElements(By.id("total-cart-amount"));
        if (cartAmountElements.isEmpty() || !cartAmountElements.get(0).isDisplayed()) {
            Assert.fail("Precondition failed: No product in cart or checkout is not at payment step (/checkout/payment).");
        }

        double originalTotal = parseAmount(cartAmountElements.get(0).getText());

        WebElement discountInputField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("discountCode")));
        discountInputField.clear();
        discountInputField.sendKeys(discountCode);

        WebElement addDiscountBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("addDiscountCode")));
        addDiscountBtn.click();

        WebElement discountAmountElement = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("discount-amount")));
        Assert.assertTrue("Discount amount should be visible", discountAmountElement.isDisplayed());

        wait.until(d -> {
            double current = parseAmount(d.findElement(By.id("total-cart-amount")).getText());
            return current < originalTotal;
        });

        double discountedTotal = parseAmount(driver.findElement(By.id("total-cart-amount")).getText());
        Assert.assertTrue("Discounted total should be lower than original undiscounted total", discountedTotal < originalTotal);

        WebElement removeDiscountBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("removeDiscountCode")));
        removeDiscountBtn.click();

        wait.until(ExpectedConditions.textToBePresentInElementValue(By.id("discountCode"), ""));
        WebElement discountCodeField = driver.findElement(By.id("discountCode"));
        Assert.assertEquals("Discount code field should be empty", "", discountCodeField.getAttribute("value"));

        boolean isDiscountAmountAbsent = wait.until(ExpectedConditions.invisibilityOfElementLocated(By.id("discount-amount")));
        Assert.assertTrue("Discount amount should no longer be displayed", isDiscountAmountAbsent);

        wait.until(d -> {
            double current = parseAmount(d.findElement(By.id("total-cart-amount")).getText());
            return Math.abs(current - originalTotal) <= 0.01;
        });

        double finalTotal = parseAmount(driver.findElement(By.id("total-cart-amount")).getText());
        Assert.assertEquals("Checkout total should equal original undiscounted total", originalTotal, finalTotal, 0.01);
    }
}
