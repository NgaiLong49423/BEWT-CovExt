package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddLanguageIsoCodeValidityPage {
        WebDriver driver;

        @FindBy(id = "page-header-desc-lang-new_language")
        WebElement addLanguage;
        @FindBy(id = "iso_code")
        WebElement iso_code;
        @FindBy(tagName = "body")
        public WebElement tagMessage;

        public AddLanguageIsoCodeValidityPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public void clickAddLanguage() {
                addLanguage.click();
        }

        public String getMessages() {
                return tagMessage.getText();
        }

        public AddLanguageIsoCodeValidityPage addIsoCodeValidity(String isoStr) {
                iso_code.sendKeys(isoStr);
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        e.printStackTrace();
                }
                return new AddLanguageIsoCodeValidityPage(driver);
        }

}
