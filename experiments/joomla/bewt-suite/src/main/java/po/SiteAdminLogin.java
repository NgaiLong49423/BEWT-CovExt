package po;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SiteAdminLogin extends PageObject {

        @FindBy(id = "mod-login-username")
        protected WebElement username;

        @FindBy(id = "mod-login-password")
        protected WebElement password;

        @FindBy(className = "login-button")
        protected WebElement loginBtn;

        @FindBy(className = "alert-message")
        protected WebElement alertMsg;

        public SiteAdminLogin(WebDriver driver) {
                super(driver);
        }

        public SiteAdminLogin setUsername(String usr) {
                username.clear();
                username.sendKeys(usr);
                return this;
        }

        public SiteAdminLogin setPassword(String psw) {
                password.clear();
                password.sendKeys(psw);
                return this;
        }

        public SiteAdminHome login() {
                loginBtn.click();
                return new SiteAdminHome(driver);
        }

        public SiteAdminLogin badLogin() {
                loginBtn.click();
                return new SiteAdminLogin(driver);
        }


        public String getAlertMessage() {
                return alertMsg.getText();
        }

}
