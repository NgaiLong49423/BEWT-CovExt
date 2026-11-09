package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import utils.JavascriptExecutor;

public class ManageGroupsPage extends SiteAdminPageObject {

        @FindBy(xpath ="//*[@id=\"toolbar-new\"]/button")
        protected WebElement newGroupBtn;

        @FindBy(xpath = "//*[@id=\"toolbar-delete\"]/button")
        protected WebElement deleteBtn;

        public ManageGroupsPage(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public CreateGroupPage createGroup() {
                newGroupBtn.click();
                return new CreateGroupPage(driver);
        }

        public String getIthGroupName(int i) {
                return driver.findElement(By.xpath("//*[@id=\"groupList\"]/tbody/tr["+i+"]/td[2]/a")).getText();
        }

        public ManageGroupsPage selectIthGroup(int i) {

                //WebElement selector = driver.findElement(By.xpath("/html/body/div[1]/div[2]/section/div/div/main/form/div/div/div/table/tbody/tr["+i+"]/td[1]/input"));
                WebElement selector = driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/table/tbody/tr["+i+"]/td[1]/input"));
                new JavascriptExecutor(driver).scrollTo(selector);
                new JavascriptExecutor(driver).click(selector);
                return this;
        }

        public ManageGroupsPage deleteGroup() {
                deleteBtn.click();
                driver.switchTo().alert().accept();
                driver.switchTo().alert().accept();
                driver.switchTo().defaultContent();
                return new ManageGroupsPage(driver);
        }

        public boolean isGroupPresent(String group) {
                return driver.findElement(By.id("groupList")).getText().contains(group);
        }


}
