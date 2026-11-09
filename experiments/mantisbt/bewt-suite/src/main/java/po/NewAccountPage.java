package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.Select;

public class NewAccountPage extends ManageNavBar {
        @FindBy(name = "username")
        public WebElement username;

        @FindBy(name ="realname")
        public WebElement realname;

        @FindBy(name = "email")
        public WebElement email;

        @FindBy(name = "access_level")
        public WebElement accessLevel;

        @FindBy(xpath = "/html/body/div[3]/form/table/tbody/tr[8]/td/input")
        public WebElement createUserBtn;

        public NewAccountPage(WebDriver driver) {
                super(driver);
                PageFactory.initElements(driver, this);
        }

        public NewAccountPage setUsername(String username) {
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                }
                this.username.clear();
                this.username.sendKeys(username);
                return this;
        }

        public NewAccountPage setRealname(String realname) {
                this.realname.clear();
                this.realname.sendKeys(realname);
                return this;
        }

        public NewAccountPage setEmail(String email) {
                this.email.clear();
                this.email.sendKeys(email);
                return this;
        }

        public NewAccountPage setAccessLevel(String level) {
                new Select(accessLevel).selectByVisibleText(level);
                return this;
        }

        public ManageUsersPage createUser() {
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                }
                createUserBtn.click();
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                }
                manageUsers.click();
                return new ManageUsersPage(driver);
        }

        public NewAccountPage createUserFails() {
                createUserBtn.click();
                return new NewAccountPage(driver);
        }

        public String getError() {
                return driver.findElement(By.xpath("/html/body/div[2]/table/tbody/tr[2]/td/p")).getText();
        }


}
