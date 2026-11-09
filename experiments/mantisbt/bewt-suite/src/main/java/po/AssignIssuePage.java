package po;


import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;


public class AssignIssuePage extends BaseNavBar {

        @FindBy(xpath = "/html/body/div[2]/form/table/tbody/tr[2]/td/input")
        protected WebElement assignIssueBtn;

        public AssignIssuePage(WebDriver driver) {
                super(driver);
        }

        public ViewIssuesPage confirmAssignment() {
                assignIssueBtn.click();
                return new ViewIssuesPage(driver);
        }

}