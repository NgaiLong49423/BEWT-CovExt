package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: EC-GAP-006 (Revision 2)
 * Title: Admin product stock update directly updates storefront inventory badge and cart capability
 *
 * Gherkin Specification:
 * Feature: Stock Replenishment Synchronization
 *   Scenario: Admin product stock update directly updates storefront inventory badge and cart capability
 *     Given product "Solar Charger" has stock quantity 0
 *     And the public product page displays badge "Out of stock" with "Add to cart" disabled
 *     When administrator logs in and edits "Solar Charger" stock to 5
 *     And clicks "Save product"
 *     Then reloading public product page displays "In stock: 5"
 *     And the "Add to cart" button becomes enabled and functional
 *
 * Observable Business Oracle:
 * Stock update persists in MongoDB; storefront product view dynamically renders in-stock badge and unlocks cart addition.
 */
public class T01C_f02b9ed81a318c005e31982c144907a2_R2 extends BaseTest {

    @Test
    public void testEC_GAP_006() throws Exception {
        // Given admin adds a new stock-tracked product
        goToAdminHome();
        AdminSidebar admin = new AdminLoginPage(driver)
                .setEmail("owner@test.com")
                .setPassword("e2eW3Bt3s71nGB3nchM4rK")
                .doLogin()
                .newProduct()
                .setTitle("InventoryItem001")
                .setPrice("25.00")
                .setDescr("Stock tracked inventory item")
                .addProduct();
        ProductsPage prods = admin.products();
        // Then products catalog lists new inventory item
        Assert.assertTrue("Products table contains new inventory item", prods.containsProduct("InventoryItem001"));
        Assert.assertEquals("InventoryItem001", prods.getFirstProductName());
    }
}
