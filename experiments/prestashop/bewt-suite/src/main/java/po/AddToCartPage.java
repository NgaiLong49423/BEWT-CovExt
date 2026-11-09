package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddToCartPage {
        WebDriver driver;
        @FindBy(id = "customer")
        WebElement customerSearch;
        @FindBy(xpath = "//*[@id=\"customers\"]/div/div/div[2]/button")
        WebElement choose;
        @FindBy(id = "product")
        WebElement product;
        @FindBy(id = "submitAddProduct")
        WebElement submitaddToProduct;
        @FindBy(id = "qty")
        WebElement qty;

        public AddToCartPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public AddToCartPage addCustomerName(String nameStr) {
                customerSearch.sendKeys(nameStr);
                return this;
        }

        public AddToCartPage clickOnChooseCustomer() {
                choose.click();
                return new AddToCartPage(driver);
        }

        public AddToCartPage addProductName(String productName) {
                product.sendKeys(productName);
                return this;
        }

        public AddToCartPage addQuantity(String qtyNo) {
                qty.clear();
                qty.sendKeys(qtyNo);
                return this;
        }

        public AddToCartPage submitProductAndFail() {
                submitaddToProduct.click();
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        e.printStackTrace();
                }
                return new AddToCartPage(driver);
        }

        public String getErrorMessage() {
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                return driver.findElement(By.id("products_err")).getText();
        }
}
