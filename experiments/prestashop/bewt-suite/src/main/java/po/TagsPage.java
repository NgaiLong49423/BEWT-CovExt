package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class TagsPage extends ElementManagementPage {

        @FindBy(id = "page-header-desc-tag-new_tag")
    protected WebElement addTag;

        public TagsPage(WebDriver driver) {
                super(driver);
        }

        public AddTagPage addTag() {
                addTag.click();
                return new AddTagPage(driver);
        }

}
