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
        goToHome();
        Home home = new Home(driver);
        TopNavBar topNavBar = new TopNavBar(driver);

        int initialCartCount = topNavBar.getCartCount();
        Assert.assertEquals("Expected fresh browser session to have an empty cart", 0, initialCartCount);

        By productLinkLocator = By.xpath("//*[@id=\"container\"]/div/div[1]/div/div[1]/div/p/a");
        wait.until(ExpectedConditions.presenceOfElementLocated(productLinkLocator));
        List<WebElement> productButtons = driver.findElements(productLinkLocator);
        Assert.assertFalse("Expected at least one published seed product available on the home page", productButtons.isEmpty());
        home.addToCart(1);
        topNavBar.openCart();
        wait.until(d -> topNavBar.getCartCount() == 1);
        Assert.assertEquals("Cart count should reflect 1 item", 1, topNavBar.getCartCount());

        wait.until(ExpectedConditions.elementToBeClickable(By.id("empty-cart"))).click();
        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".modal.show, .bootbox.modal, #confirmModal")));
        Assert.assertTrue("Confirmation modal should be displayed", modal.isDisplayed());
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".bootbox-accept, #buttonConfirm, .modal.show .btn-danger"))).click();

        WebElement emptyCartMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("cart-empty")));
        Assert.assertEquals("Cart empty", emptyCartMsg.getText().trim());
        wait.until(d -> topNavBar.getCartCount() == 0);
        Assert.assertEquals("Cart item count should be zero", 0, topNavBar.getCartCount());

        WebElement notification = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("notify_message")));
        Assert.assertEquals("Cart successfully emptied", notification.getText().trim());
        List<WebElement> emptyCartBtns = driver.findElements(By.id("empty-cart"));
        boolean emptyCartVisible = emptyCartBtns.stream().anyMatch(WebElement::isDisplayed);
        Assert.assertFalse("Cart action buttons should be hidden when cart is empty", emptyCartVisible);
    }
}
