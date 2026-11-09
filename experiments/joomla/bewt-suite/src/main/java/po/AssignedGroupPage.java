package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import utils.JavascriptExecutor;

public class AssignedGroupPage extends EditUserPage {

        @FindBy(xpath = "//*[@id=\"toolbar-save\"]/button")
        protected WebElement saveAndCloseBtn;

        public AssignedGroupPage(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        //group id = 10
        public AssignedGroupPage checkGroup(int id) {
                WebElement targetCheckbox = driver.findElement(By.id("1group_"+id));
                //required to avoid flakiness
                new JavascriptExecutor(driver).scrollTo(targetCheckbox);
                new JavascriptExecutor(driver).click(targetCheckbox);
                //targetCheckbox.click();
                return this;
        }

        public ManageUsersPage saveAndClose() {
                saveAndCloseBtn.click();
                return new ManageUsersPage(driver);
        }



}
