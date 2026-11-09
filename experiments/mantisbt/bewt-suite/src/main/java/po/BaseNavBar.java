package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

import utils.Strings;

public class BaseNavBar {

        public WebDriver driver;

        @FindBy(linkText = Strings.viewIssues)
        protected WebElement viewIssues;

        @FindBy(linkText = Strings.manage)
        protected WebElement manage;

        @FindBy(linkText = "Logout")
        protected WebElement logout;

        @FindBy(linkText = Strings.newIssue)
        protected WebElement reportIssue;

        public BaseNavBar(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public ManageNavBar manage() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                manage.click();
                return new ManageNavBar(driver);
        }

        public ReportIssuePage reportIssue() {
                reportIssue.click();
                return new ReportIssuePage(driver);
        }

        public ViewIssuesPage viewIssues() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                viewIssues.click();
                return new ViewIssuesPage(driver);
        }

        public LoginPage logout() {
                logout.click();
                return new LoginPage(driver);
        }
}
