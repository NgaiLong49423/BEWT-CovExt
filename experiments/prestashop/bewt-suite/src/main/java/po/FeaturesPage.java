package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class FeaturesPage extends AdminSidebar {

        @FindBy(id = "page-header-desc-feature-new_feature")
    protected WebElement addFeature;

        @FindBy(className = "alert-success")
        protected WebElement tagMessage;

        public FeaturesPage(WebDriver driver) {
                super(driver);
        }

        public AddFeaturesPage clickAddFeature() {
        addFeature.click();
        return new AddFeaturesPage(driver);
    }

        public String getSuccesssMessage() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                return tagMessage.getText();
        }

}
