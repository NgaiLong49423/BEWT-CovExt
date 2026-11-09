package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ManufacturerPage extends ElementManagementPage {

        @FindBy(id = "page-header-desc-address-new_manufacturer")
        protected WebElement addManufacturer;

        @FindBy(xpath = "//*[@id=\"form-manufacturer\"]/div/div[2]/table/tbody/tr[2]/td[8]/div/div/button")
        protected WebElement editDropDown;

        public ManufacturerPage(WebDriver driver) {
                super(driver);
        }

        public AddManufacturerPage clickAddManufacturer() {
                addManufacturer.click();
                return new AddManufacturerPage(driver);
        }

        public AddManufacturerPage editManufacturer() {
                editDropDown.click();
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                driver.findElement(
                                By.xpath("//*[@id=\"form-manufacturer\"]/div/div[2]/table/tbody/tr[2]/td[8]/div/div/ul/li[1]/a"))
                                .click();
                return new AddManufacturerPage(driver);
        }

}
