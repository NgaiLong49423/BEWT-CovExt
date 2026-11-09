package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddManufacturerPage {
        WebDriver driver;

        @FindBy(id = "name")
        WebElement name;
        @FindBy(id = "manufacturer_form_submit_btn")
        WebElement submitManufacturer;
        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMessage;

        public AddManufacturerPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }


        public ManufacturerPage addManufacturer(String nameStr) {
                name.clear();
                name.sendKeys(nameStr);
                submitManufacturer.click();
                try {
                        Thread.sleep(3000);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                return new ManufacturerPage(driver);
        }

        public AddManufacturerPage addEmptyManufacturer() {
                submitManufacturer.click();
                return new AddManufacturerPage(driver);
        }

        public String getAlertMessage() {
                return alertMessage.getText();
        }
}
