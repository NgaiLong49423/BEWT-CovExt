package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;


import utils.JavascriptExecutor;

public class AddProductPage {
        WebDriver driver;

        @FindBy(id = "page-header-desc-product-new_product")
        WebElement addNewProduct;
        @FindBy(id = "name_1")
        WebElement nameOfProduct;
        @FindBy(name = "submitAddproduct")
        WebElement submitProduct;
        @FindBy(id = "priceTE")
        WebElement preTaxRetail;
        @FindBy(id = "priceTI")
        WebElement retailPriceWithTax;
        @FindBy(id = "link-Prices")
        WebElement pricesTab;
        @FindBy(id = "link-Features")
        WebElement featuresTab;
        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMsg;

        public AddProductPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public ProductsPage submitProduct() {
                new JavascriptExecutor(driver).scrollTo(submitProduct);
                submitProduct.click();
                return new ProductsPage(driver);
        }

        public AddProductPage submitError() {
                new JavascriptExecutor(driver).scrollTo(submitProduct);
                submitProduct.click();
                return new AddProductPage(driver);
        }

        public void addNewFeatures() {
                featuresTab.click();
        }

        public AddProductPage setPretaxRetail(String pretaxPrice) {
                pricesTab.click();
                preTaxRetail.clear();
                preTaxRetail.sendKeys(pretaxPrice);
                return this;
        }

        public AddProductPage addNameOfProduct(String name) {
                nameOfProduct.clear();
                nameOfProduct.sendKeys(name);
                return this;
        }

        public PricesPage prices() {
                pricesTab.click();
                return new PricesPage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }
}
