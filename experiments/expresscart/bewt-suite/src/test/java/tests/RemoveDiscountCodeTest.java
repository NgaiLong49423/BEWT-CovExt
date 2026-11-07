package tests;

import org.junit.Assert;
import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.Home;
import po.TopNavBar;

import java.time.Duration;
import java.util.List;

public class RemoveDiscountCodeTest extends BaseTest {

    @After
    public void cleanUpCartFixture() {
        if (driver == null) {
            return;
        }

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        goToHome();
        if (new TopNavBar(driver).getCartCount() == 0) {
            return;
        }

        new TopNavBar(driver).openCart();
        wait.until(ExpectedConditions.elementToBeClickable(By.id("empty-cart"))).click();
        wait.until(ExpectedConditions.elementToBeClickable(By.id("buttonConfirm"))).click();
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("cart-count"), "0"));
    }

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

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        // The generated scenario requires a cart fixture. Create it through the storefront UI
        // in this browser session so the test never depends on another test's session data.
        goToHome();
        new Home(driver).addToCart(1);
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("cart-count"), "1"));
        driver.get(appUrl + "/checkout/payment");
        wait.until(ExpectedConditions.urlContains("/checkout/payment"));

        List<WebElement> cartAmountElements = driver.findElements(By.id("total-cart-amount"));
        WebElement visibleCartAmount = cartAmountElements.stream()
                .filter(WebElement::isDisplayed)
                .findFirst()
                .orElse(null);
        if (visibleCartAmount == null) {
            String currentPath = java.net.URI.create(driver.getCurrentUrl()).getPath();
            String visibleCartCount = driver.findElements(By.id("cart-count")).stream()
                    .map(WebElement::getText).findFirst().orElse("missing");
            Assert.fail("Precondition failed: checkout total is absent; path=" + currentPath
                    + ", cartCount=" + visibleCartCount + ".");
        }

        double originalTotal = parseAmount(visibleCartAmount.getText());

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
