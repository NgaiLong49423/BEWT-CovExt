package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddSupplierPage {
        WebDriver driver;
        @FindBy(id = "page-header-desc-supplier-new_supplier")
        WebElement addSupplier;
        @FindBy(id = "name")
        WebElement name;
        @FindBy(id = "address")
        WebElement address;
        @FindBy(id = "city")
        WebElement city;
        @FindBy(id = "id_country")
        WebElement country;
        @FindBy(id = "supplier_form_submit_btn")
        WebElement submitSupplier;
        @FindBy(xpath = "//*[@id=\"tr_2_12_1\"]/td[7]/div/div/a")
        WebElement dropDownMeny;
        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMsg;

        public AddSupplierPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public void clickAddSupplier() {
                addSupplier.click();
        }

        public SupplierPage addSupplier(String nameStr, String addressStr, String cityStr, String countryStr) {
                name.sendKeys(nameStr);
                address.sendKeys(addressStr);
                city.sendKeys(cityStr);
                country.sendKeys(countryStr);
                submitSupplier.click();
                return new SupplierPage(driver);
        }

        public AddSupplierPage addEmptySupplier() {
                submitSupplier.click();
                return new AddSupplierPage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }

}
