package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import utils.Strings;

public class DeleteUserConfirmPage extends BaseNavBar {

        @FindBy(xpath = "/html/body/div[2]/form/input[4]")
        protected WebElement deleteConfirmBtn;

        public DeleteUserConfirmPage(WebDriver driver) {
                super(driver);
        }

        public ManageUsersPage confirmDelete() {
                deleteConfirmBtn.click();
                driver.findElement(By.linkText(Strings.contin)).click();
                return new ManageUsersPage(driver);
        }

}
