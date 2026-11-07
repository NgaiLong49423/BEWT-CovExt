package tests;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.Home;
import po.TopNavBar;

import java.time.Duration;
import java.util.List;

public class EmptyCartTest extends BaseTest {

    @Test
    public void testEmptyCartContainingProduct() {
        goToHome();

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        TopNavBar topNavBar = new TopNavBar(driver);
        Assert.assertEquals("Expected fresh browser session cart count to be 0", 0, topNavBar.getCartCount());

        By firstProductLocator = By.xpath("//*[@id='container']/div/div[1]/div/div[1]/div/p/a");
        List<WebElement> seedProducts = driver.findElements(firstProductLocator);
        Assert.assertFalse("Precondition failed: Published seed product link is missing at " + firstProductLocator,
                seedProducts.isEmpty());

        Home home = new Home(driver);
        home.addToCart(1);

        topNavBar.openCart();

        WebElement cartCount = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("cart-count")));
        Assert.assertEquals("Expected cart item count to be 1", "1", cartCount.getText().trim());

        WebElement emptyCartBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("empty-cart")));
        emptyCartBtn.click();

        WebElement confirmBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("buttonConfirm")));
        Assert.assertTrue("Confirmation modal accept button should be displayed", confirmBtn.isDisplayed());
        confirmBtn.click();

        WebElement cartEmptyMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("cart-empty")));
        Assert.assertTrue("Cart empty element should be displayed", cartEmptyMsg.isDisplayed());
        Assert.assertTrue("Expected 'Cart empty' text in message", cartEmptyMsg.getText().contains("Cart empty"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("cart-count"), "0"));
        Assert.assertEquals("Expected cart item count to be 0", "0", driver.findElement(By.id("cart-count")).getText().trim());

        WebElement notifyMessage = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("notify_message")));
        Assert.assertEquals("Success notification message mismatch", "Cart successfully emptied", notifyMessage.getText().trim());

        boolean emptyCartHidden = wait.until(ExpectedConditions.invisibilityOfElementLocated(By.id("empty-cart")));
        Assert.assertTrue("Expected empty cart button (#empty-cart) to be hidden after clearing", emptyCartHidden);
    }
}
