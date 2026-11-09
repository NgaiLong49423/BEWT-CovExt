package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ProductsPage extends AdminSidebar {

        @FindBy(id = "page-header-desc-product-new_product")
    protected WebElement addNewProduct;

        @FindBy(className = "alert-success")
        protected WebElement tagMessage;

        @FindBy(xpath = "//*[@id=\"tr__7_0\"]/td[11]/div/div/a")
        protected WebElement editProduct;

        public ProductsPage(WebDriver driver) {
                super(driver);
        }

        public AddProductPage addNewProduct() {
                addNewProduct.click();
                return new AddProductPage(driver);
        }

        public String getSuccesssMessage() {
                return tagMessage.getText();
        }

        public AddProductPage editProduct() {
                editProduct.click();
                return new AddProductPage(driver);
        }

}
