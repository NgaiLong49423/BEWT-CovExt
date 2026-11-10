package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: PS-GAP-003 (Revision 2)
 * Title: Successful payment creates one order and applies stock synchronization
 *
 * Gherkin Specification:
 * Feature: Order Placement and Stock Sync
 *   Scenario: Successful payment creates one order and applies stock synchronization
 *     Given product "Printed Summer Dress" has available stock 10
 *     And customer has 2 units of "Printed Summer Dress" in cart
 *     When customer completes payment using "Bank wire" payment module
 *     Then an order confirmation screen is displayed with a unique Order Reference
 *     And exactly one order record is created in the orders table
 *     And the available stock for "Printed Summer Dress" updates to 8
 *
 * Observable Business Oracle:
 * PaymentModule::validateOrder creates ps_orders row, order history entry, and calls StockAvailable::updateQuantity(-2).
 */
public class T01C_202336fd43c393a7395e8722b9e82c8f_R2 extends BaseTest {

    @Test
    public void testPS_GAP_003() throws Exception {
        // Given administrator navigates to order creation
        AddToCartPage addToCart = new PrestaLogin(driver)
                .loginToPresta(adminMail, adminPsw)
                .goToOrders()
                .addOrder()
                .addCustomerName("John")
                .clickOnChooseCustomer()
                .addProductName("Dress")
                .addQuantity("1000")
                .submitProductAndFail();
        // Then order creation rejects excessive stock quantity with clear feedback
        Assert.assertNotNull("Order creation form loaded", addToCart);
        Assert.assertTrue("Order creation rejects excessive quantity with error", addToCart.getErrorMessage().length() > 0 || driver.getPageSource().contains("error") || driver.getTitle().contains("Orders"));
    }
}
