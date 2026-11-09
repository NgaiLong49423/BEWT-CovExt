package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class AddressesPage extends ElementManagementPage {

        @FindBy(id = "page-header-desc-address-new_address")
        protected WebElement addAddress;

        @FindBy(xpath = "//*[@id=\"form-address\"]/div/div[2]/table/tbody/tr[1]/td[9]/div/div/a")
    protected WebElement edit;

        public AddressesPage(WebDriver driver) {
                super(driver);
        }

        public AddAddressPage addAddress() {
                addAddress.click();
                return new AddAddressPage(driver);
        }

        public AddAddressPage editAddress() {
                edit.click();
                return new AddAddressPage(driver);
        }





}
