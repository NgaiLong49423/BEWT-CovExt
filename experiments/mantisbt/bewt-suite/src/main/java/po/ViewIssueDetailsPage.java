package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ViewIssueDetailsPage extends BaseNavBar {

        @FindBy(xpath = "/html/body/table[3]/tbody/tr[7]/td[2]")
        protected WebElement priority;

        @FindBy(xpath = "/html/body/table[3]/tbody/tr[7]/td[4]")
        protected WebElement severity;

        @FindBy(xpath = "/html/body/table[3]/tbody/tr[8]/td[2]")
        protected WebElement status;

        @FindBy(xpath = "/html/body/table[3]/tbody/tr[11]/td[2]")
        protected WebElement summary;

        public ViewIssueDetailsPage(WebDriver driver) {
                super(driver);
        }

        public String getPriority() {
                return priority.getText();
        }

        public String getSeverity() {
                return severity.getText();
        }

        public String getStatus() {
                return status.getText();
        }

        public String getSummary() {
                return summary.getText();
        }

}
