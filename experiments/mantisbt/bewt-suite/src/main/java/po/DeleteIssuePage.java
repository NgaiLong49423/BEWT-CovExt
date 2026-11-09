package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class DeleteIssuePage extends BaseNavBar {

        @FindBy(xpath = "/html/body/div[2]/form/table/tbody/tr[2]/td/input")
        public WebElement deleteIssueBtn;

        public DeleteIssuePage(WebDriver driver) {
                super(driver);
        }

        public ViewIssuesPage deleteIssue() {
                deleteIssueBtn.click();
                return new ViewIssuesPage(driver);
        }
}
