package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddCurrencyPage {
        WebDriver driver;

        @FindBy(id = "page-header-desc-currency-new_currency")
        WebElement addCurrency;

        @FindBy(id = "name")
        WebElement name;

        @FindBy(id = "iso_code")
        WebElement iso_code;

        @FindBy(id = "iso_code_num")
        WebElement iso_code_num;

        @FindBy(id = "sign")
        WebElement sign;

        @FindBy(id = "currency_form_submit_btn")
        WebElement submitCurrency;

        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMsg;

        public AddCurrencyPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public void clickAddCurrency() {
                addCurrency.click();
        }

        public CurrencyPage addCurrency(String nameStr, String isoStr, String isoCodeStr, String signStr) {
                name.sendKeys(nameStr);
                iso_code.sendKeys(isoStr);
                iso_code_num.sendKeys(isoCodeStr);
                sign.sendKeys(signStr);
                submitCurrency.click();
                return new CurrencyPage(driver);
        }

        public AddCurrencyPage addEmptyCurrency() {
                submitCurrency.click();
                return new AddCurrencyPage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }
}
