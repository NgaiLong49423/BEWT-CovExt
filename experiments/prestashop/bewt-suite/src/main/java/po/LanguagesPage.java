package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class LanguagesPage extends ElementManagementPage {

        @FindBy(id = "page-header-desc-lang-new_language")
    protected WebElement addLanguage;

        public LanguagesPage(WebDriver driver) {
                super(driver);
        }

        public AddLanguageIsoCodeValidityPage clickAddLanguage() {
        addLanguage.click();
        return new AddLanguageIsoCodeValidityPage(driver);
    }



}
