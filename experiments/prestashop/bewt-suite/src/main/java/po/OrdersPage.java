package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class OrdersPage extends ElementManagementPage {

        @FindBy(id = "page-header-desc-order-new_order")
    protected WebElement addOrder;

        public OrdersPage(WebDriver driver) {
                super(driver);
        }

        public AddToCartPage addOrder() {
                addOrder.click();
                return new AddToCartPage(driver);
        }

}
