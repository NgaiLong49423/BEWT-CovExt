package tests;

import org.junit.After;
import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import po.AdminLoginPage;
import po.ProductPage;
import po.TopNavBar;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * EC-GAP-002 revision 6. This immutable revision is source-backed to ExpressCart
 * 1.1.19 at b31302f4e99c3293bd742c6d076a721e168118b0.
 *
 * The original proposed oracle's message text is not present in the pinned source.
 * The pinned update route returns HTTP 400 with "There is insufficient stock of
 * this product." The companion revision-6 Gherkin records that correction; the
 * original proposal and revisions 1-2 remain unchanged for human review.
 *
 * Feature: Inventory Control
 *   Scenario: Stock tracking rejects a cart quantity above available product stock
 *     Given product "Limited Edition T-Shirt" has stock tracking enabled with available quantity 1
 *     And customer starts with an empty cart
 *     When customer adds 1 unit of "Limited Edition T-Shirt" to cart
 *     Then the cart shows 1 unit of "Limited Edition T-Shirt"
 *     When customer attempts to update the quantity to 2
 *     Then the system rejects the update with HTTP 400 and message "There is insufficient stock of this product."
 *     And the cart quantity remains at 1
 *
 * The product and stock setting are created inside the isolated experiment app
 * and removed/restored in @After. Credentials are read only from environment.
 */
public class T01C_bcb5b700f06dd8c8ce6c99c01e12cdeb_R6 extends BaseTest {
    private static final String PRODUCT_TITLE = "Limited Edition T-Shirt";
    private static final String STOCK_ERROR = "There is insufficient stock of this product.";
    private final String productPermalink = "ec-gap-002-" + UUID.randomUUID().toString().substring(0, 12);
    private String productId;
    private boolean stockTrackingTouched;
    private boolean adminAuthenticated;
    private WebDriverWait wait;

    @Test
    public void testEC_GAP_002_stockRejectionPreservesCart_R6() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        String adminEmail = System.getenv("ADMIN_EMAIL");
        String adminPassword = System.getenv("ADMIN_PASSWORD");
        Assert.assertNotNull("Fixture requires ADMIN_EMAIL environment variable", adminEmail);
        Assert.assertNotNull("Fixture requires ADMIN_PASSWORD environment variable", adminPassword);
        Assert.assertFalse("Fixture requires non-empty ADMIN_EMAIL", adminEmail.trim().isEmpty());
        Assert.assertFalse("Fixture requires non-empty ADMIN_PASSWORD", adminPassword.trim().isEmpty());

        goToAdminHome();
        new AdminLoginPage(driver).setEmail(adminEmail).setPassword(adminPassword).doLogin();
        adminAuthenticated = true;

        assertStatus(postJson("/admin/settings/update", "{\"trackStock\":true}"), 200, "enable stock tracking");
        stockTrackingTouched = true;

        Map<String, String> product = new LinkedHashMap<>();
        product.put("productPermalink", productPermalink);
        product.put("productTitle", PRODUCT_TITLE);
        product.put("productPrice", "1.00");
        product.put("productDescription", "Stock boundary fixture for EC-GAP-002.");
        product.put("productBrand", "BEWT test fixture");
        product.put("productPublished", "true");
        product.put("productTags", "ec-gap-002");
        product.put("productComment", "false");
        product.put("productStock", "1");
        product.put("productStockDisable", "false");
        Map<?, ?> inserted = postForm("/admin/product/insert", product);
        assertStatus(inserted, 200, "create stock-one product fixture");
        productId = jsonString(String.valueOf(inserted.get("body")), "productId");
        Assert.assertNotNull("Product insert response must include productId", productId);

        driver.get(appUrl + "/product/" + productPermalink);
        Assert.assertEquals("Product page title must match the fixture", PRODUCT_TITLE, driver.getTitle());
        Assert.assertEquals("Customer cart must start empty", "0", new TopNavBar(driver).getCartCount() + "");
        new ProductPage(driver).addToCart();
        wait.until(ExpectedConditions.textToBe(By.id("cart-count"), "1"));

        driver.get(appUrl + "/checkout/cart");
        Map<?, ?> initialCartData = browserCartData();
        Assert.assertTrue("Cart data must be a map", initialCartData.get("cart") instanceof Map);
        Map<?, ?> initialCart = (Map<?, ?>) initialCartData.get("cart");
        Assert.assertEquals("Cart must contain only the stock-one fixture", 1, initialCart.size());
        Object cartIdValue = initialCart.keySet().iterator().next();
        String cartId = String.valueOf(cartIdValue);
        Assert.assertTrue("Cart line must be a map", initialCart.get(cartIdValue) instanceof Map);
        Map<?, ?> initialLine = (Map<?, ?>) initialCart.get(cartIdValue);
        Assert.assertEquals("Cart line must be the stock-one fixture", PRODUCT_TITLE,
                String.valueOf(initialLine.get("title")));
        Assert.assertEquals("Cart must initially contain exactly one unit", "1",
                String.valueOf(initialLine.get("quantity")));
        Assert.assertEquals("Cart line must use the created fixture product", productId,
                String.valueOf(initialLine.get("productId")));

        Map<String, String> updateFields = new LinkedHashMap<>();
        updateFields.put("cartId", cartId);
        updateFields.put("productId", productId);
        updateFields.put("quantity", "2");
        Map<?, ?> update = postForm("/product/updatecart", updateFields);
        Assert.assertEquals("Over-stock update must return HTTP 400", 400,
                ((Number) update.get("status")).intValue());
        Assert.assertEquals("Rejection must match the exact pinned source JSON message", STOCK_ERROR,
                jsonString(String.valueOf(update.get("body")), "message"));

        Map<?, ?> cartAfterUpdate = browserCartData();
        Assert.assertTrue("Cart data after rejected update must be a map", cartAfterUpdate.get("cart") instanceof Map);
        Map<?, ?> remainingCart = (Map<?, ?>) cartAfterUpdate.get("cart");
        Assert.assertTrue("Rejected update must preserve the cart line", remainingCart.get(cartIdValue) instanceof Map);
        Map<?, ?> remainingLine = (Map<?, ?>) remainingCart.get(cartIdValue);
        Assert.assertEquals("Rejected update must leave server-side cart quantity at one", "1",
                String.valueOf(remainingLine.get("quantity")));
        Assert.assertEquals("Rejected update must leave cart badge at one", 1,
                new TopNavBar(driver).getCartCount());
    }

    @After
    public void cleanFixture() {
        if (driver == null || !adminAuthenticated) {
            return;
        }
        List<String> failures = new ArrayList<>();
        driver.get(appUrl + "/admin");
        if (productId != null) {
            Map<String, String> remove = new LinkedHashMap<>();
            remove.put("productId", productId);
            captureCleanup("delete product fixture", () -> postForm("/admin/product/delete", remove), failures);
        }
        captureCleanup("empty test cart", () -> postForm("/product/emptycart", new LinkedHashMap<>()), failures);
        if (stockTrackingTouched) {
            captureCleanup("restore experiment default stock setting",
                    () -> postJson("/admin/settings/update", "{\"trackStock\":false}"), failures);
        }
        Assert.assertTrue("Fixture cleanup failures: " + String.join("; ", failures), failures.isEmpty());
    }

    private void captureCleanup(String operation, ResponseCall call, List<String> failures) {
        try {
            assertStatus(call.run(), 200, operation);
        } catch (AssertionError | RuntimeException error) {
            failures.add(operation + " failed: " + error.getMessage());
        }
    }

    private interface ResponseCall {
        Map<?, ?> run();
    }
    private Map<?, ?> browserCartData() {
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(20));
        Object result = ((JavascriptExecutor) driver).executeAsyncScript(
                "var done=arguments[arguments.length-1];fetch('/checkout/cartdata',{credentials:'same-origin'})"
              + ".then(async function(r){done(await r.json());})"
              + ".catch(function(e){done({error:String(e)});});");
        Assert.assertTrue("Expected cart JSON from /checkout/cartdata", result instanceof Map);
        return (Map<?, ?>) result;
    }

    private Map<?, ?> postForm(String path, Map<String, String> fields) {
        StringBuilder body = new StringBuilder();
        for (Map.Entry<String, String> field : fields.entrySet()) {
            if (body.length() > 0) body.append('&');
            body.append(URLEncoder.encode(field.getKey(), StandardCharsets.UTF_8));
            body.append('=');
            body.append(URLEncoder.encode(field.getValue(), StandardCharsets.UTF_8));
        }
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(20));
        Object result = ((JavascriptExecutor) driver).executeAsyncScript(
                "var done=arguments[arguments.length-1],path=arguments[0],body=arguments[1];"
              + "var meta=document.querySelector('meta[name=csrfToken]');"
              + "if(!meta){done({status:0,body:'missing csrf token'});return;}"
              + "fetch(path,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',"
              + "'csrf-token':meta.content},body:body,credentials:'same-origin'})"
              + ".then(async function(r){done({status:r.status,body:await r.text()});})"
              + ".catch(function(e){done({status:0,body:String(e)});});", path, body.toString());
        Assert.assertTrue("Expected JSON-like response from " + path, result instanceof Map);
        return (Map<?, ?>) result;
    }

    private Map<?, ?> postJson(String path, String jsonBody) {
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(20));
        Object result = ((JavascriptExecutor) driver).executeAsyncScript(
                "var done=arguments[arguments.length-1],path=arguments[0],body=arguments[1];"
              + "var meta=document.querySelector('meta[name=csrfToken]');"
              + "if(!meta){done({status:0,body:'missing csrf token'});return;}"
              + "fetch(path,{method:'POST',headers:{'Content-Type':'application/json','csrf-token':meta.content},"
              + "body:body,credentials:'same-origin'})"
              + ".then(async function(r){done({status:r.status,body:await r.text()});})"
              + ".catch(function(e){done({status:0,body:String(e)});});", path, jsonBody);
        Assert.assertTrue("Expected JSON-like response from " + path, result instanceof Map);
        return (Map<?, ?>) result;
    }
    private void assertStatus(Map<?, ?> response, int expected, String operation) {
        Assert.assertEquals(operation + " response: " + response.get("body"), expected,
                ((Number) response.get("status")).intValue());
    }

    private String jsonString(String json, String key) {
        Matcher matcher = Pattern.compile("\\\"" + Pattern.quote(key) + "\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"").matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }
}
