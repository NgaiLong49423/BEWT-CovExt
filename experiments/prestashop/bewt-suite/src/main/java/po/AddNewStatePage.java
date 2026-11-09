package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddNewStatePage {
        WebDriver driver;

        @FindBy(xpath = "//*[@id=\"page-header-desc-state-new_state\"]")
        WebElement addNewState;
        @FindBy(id = "name")
        WebElement state_name;
        @FindBy(name = "iso_code")
        WebElement iso_code;
        @FindBy(id = "id_country")
        WebElement country_name;
        @FindBy(id = "id_zone")
        WebElement zone_name;
        @FindBy(id = "state_form_submit_btn")
        WebElement add_state_button;
        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMsg;


        public AddNewStatePage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public void clickOnAddNewState() {
                addNewState.click();
        }

        public StatesPage addNewState(String name, String isoCode, String country, String zone) {
                state_name.sendKeys(name);
                iso_code.sendKeys(isoCode);
                country_name.sendKeys(country);
                zone_name.sendKeys(zone);
                add_state_button.click();
                return new StatesPage(driver);
        }

        public AddNewStatePage addEmptyState() {
                add_state_button.click();
                return new AddNewStatePage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }
}
