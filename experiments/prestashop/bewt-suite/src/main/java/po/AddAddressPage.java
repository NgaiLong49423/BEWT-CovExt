package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddAddressPage {
        WebDriver driver;
        @FindBy(id = "email")
        WebElement email;
        @FindBy(id = "alias")
        WebElement alias;
        @FindBy(id = "firstname")
        WebElement firstname;
        @FindBy(id = "lastname")
        WebElement lastname;
        @FindBy(id = "address1")
        WebElement address1;
        @FindBy(id = "postcode")
        WebElement postcode;
        @FindBy(id = "city")
        WebElement city;
        @FindBy(id = "phone")
        WebElement phone;
        @FindBy(id = "phone_mobile")
        WebElement phone_mobile;
        @FindBy(name = "id_state")
        WebElement id_state;
        @FindBy(id = "address_form_submit_btn")
        WebElement submitAddress;
        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMsg;

        public AddAddressPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public AddressesPage addAddress(String emailStr, String aliasStr, String firstStr, String lastStr,
                        String addressStr, String postStr, String phoneStr, String mobileStr, String stateId, String cityStr) {
                email.sendKeys(emailStr);
                alias.sendKeys(aliasStr);
                firstname.clear();
                firstname.sendKeys(firstStr);
                lastname.clear();
                lastname.sendKeys(lastStr);
                address1.sendKeys(addressStr);
                postcode.sendKeys(postStr);
                phone.sendKeys(phoneStr);
                phone_mobile.sendKeys(mobileStr);
                id_state.sendKeys(stateId);
                city.sendKeys(cityStr);
                submitAddress.click();
                return new AddressesPage(driver);
        }

        public AddAddressPage addEmptyAddress() {
                submitAddress.click();
                return new AddAddressPage(driver);
        }

        public AddressesPage editName(String name) {
                firstname.clear();
                firstname.sendKeys(name);
                submitAddress.click();
                return new AddressesPage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }

}
