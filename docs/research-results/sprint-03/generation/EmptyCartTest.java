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
    public void testEmptyCartContainingAProduct() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        Home home = new Home(driver);
        TopNavBar topNavBar = new TopNavBar(driver);

        // Navigate to home page using BaseTest.goToHome() instead of Home.goHome()
        goToHome();

        // Given a fresh browser session has an empty cart
        int initialCartCount = topNavBar.getCartCount();
        Assert.assertEquals("Expected fresh browser session to have an empty cart", 0, initialCartCount);

        // And a published seed product is available (validate 1-based index 1 element)
        By productLinkLocator = By.xpath("//*[@id=\"container\"]/div/div[1]/div/div[1]/div/p/a");
        wait.until(ExpectedConditions.presenceOfElementLocated(productLinkLocator));
        List<WebElement> productButtons = driver.findElements(productLinkLocator);
        Assert.assertFalse("Expected at least one published seed product available on the home page", productButtons.isEmpty());

        // When the customer adds one product to the cart (using 1-based index)
        home.addToCart(1);

        // And opens the cart view
        topNavBar.openCart();

        // Then the cart contains one item
        wait.until(d -> topNavBar.getCartCount() == 1);
        Assert.assertEquals("Cart count should reflect 1 item", 1, topNavBar.getCartCount());

        // When the customer clicks the empty cart button
        WebElement emptyCartButton = wait.until(ExpectedConditions.elementToBeClickable(By.id("empty-cart")));
        emptyCartButton.click();

        // Then the confirmation modal is displayed
        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".modal.show, .bootbox.modal, #confirmModal")));
        Assert.assertTrue("Confirmation modal should be displayed", modal.isDisplayed());

        // When the customer confirms the empty-cart action
        WebElement confirmButton = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".bootbox-accept, #buttonConfirm, .modal.show .btn-danger")));
        confirmButton.click();

        // Then the cart view displays 'Cart empty'
        WebElement emptyCartMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("cart-empty")));
        Assert.assertEquals("Cart empty", emptyCartMsg.getText().trim());

        // And the cart item count is zero
        wait.until(d -> topNavBar.getCartCount() == 0);
        Assert.assertEquals("Cart item count should be zero", 0, topNavBar.getCartCount());

        // And the success notification says 'Cart successfully emptied' (check #notify_message if present)
        List<WebElement> notifications = driver.findElements(By.id("notify_message"));
        if (!notifications.isEmpty() && notifications.get(0).isDisplayed()) {
            Assert.assertTrue("Notification text should contain expected message",
                    notifications.get(0).getText().contains("Cart successfully emptied"));
        }

        // And the cart action buttons are hidden
        List<WebElement> emptyCartBtns = driver.findElements(By.id("empty-cart"));
        boolean emptyCartVisible = emptyCartBtns.stream().anyMatch(WebElement::isDisplayed);
        Assert.assertFalse("Cart action buttons should be hidden when cart is empty", emptyCartVisible);
    }
}
