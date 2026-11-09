package po;

import java.util.ArrayList;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SiteAdminPageObject extends PageObject {

        @FindBy(xpath = "/html/body/nav/div/div/div/ul[3]/li/a")
        protected WebElement dropDownToggle;

        public SiteAdminPageObject(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public void logout() {
                dropDownToggle.click();
                driver.findElement(By.linkText("Logout")).click();
                ArrayList<String> tabs2 = new ArrayList<String> (driver.getWindowHandles());
                driver.close();
            driver = driver.switchTo().window(tabs2.get(0));
            LoggedNavBar bar = new LoggedNavBar(driver);
            bar.adminLogout();
        }

}
