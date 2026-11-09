package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class ManageUsersPage extends ManageNavBar {

        //@FindBy(className = "button-small")
        @FindBy(xpath = "/html/body/table[3]/tbody/tr[1]/td[1]/form/input[2]")
        public WebElement createUserBtn;

        public ManageUsersPage(WebDriver driver) {
                super(driver);
                PageFactory.initElements(driver, this);
        }

        public NewAccountPage createNewUser() {
                createUserBtn.click();
                return new NewAccountPage(driver);
        }

        public String getUsername(int i) {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr["+(i+2)+"]/td[1]/a")).getText();
        }

        public String getRealName(int i) {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr["+(i+2)+"]/td[2]")).getText();
        }

        public String getEmail(int i) {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr["+(i+2)+"]/td[3]")).getText();
        }

        public String getAccessLevel(int i) {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr["+(i+2)+"]/td[4]")).getText();
        }

        public EditUserPage goToUser(String user) {
                driver.findElement(By.linkText(user)).click();
                return new EditUserPage(driver);
        }

        public boolean isUserPresent(String userName) {
                return driver.findElement(By.tagName("BODY")).getText().contains(userName);
        }


}
