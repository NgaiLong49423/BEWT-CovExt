package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import utils.Strings;

public class EditUserPage extends ManageNavBar {

        @FindBy(name="realname")
        protected WebElement realName;

        @FindBy(name = "username")
        protected WebElement username;

        @FindBy(xpath = "/html/body/div[3]/form/table/tbody/tr[8]/td/input[2]")
        protected WebElement updateUserBtn;

        @FindBy(xpath = "/html/body/div[4]/form[2]/input[3]")
        protected WebElement deleteUserBtn;

        public EditUserPage(WebDriver driver) {
                super(driver);
        }

        public EditUserPage setRealName(String name) {
                realName.clear();
                realName.sendKeys(name);
                return this;
        }

        public EditUserPage setUsername(String usr) {
                username.clear();
                username.sendKeys(usr);
                return this;
        }

        public String getRealName() {
                return realName.getAttribute("value");
        }

        public EditUserPage updateUser() {
                updateUserBtn.click();
                driver.findElement(By.linkText(Strings.contin)).click();
                return new EditUserPage(driver);
        }

        public EditUserPage updateUserFails() {
                updateUserBtn.click();
                return new EditUserPage(driver);
        }

        public String getError() {
                return driver.findElement(By.xpath("/html/body/div[2]/table/tbody/tr[2]/td/p")).getText();
        }

        public DeleteUserConfirmPage deleteUser() {
                deleteUserBtn.click();
                return new DeleteUserConfirmPage(driver);
        }

}