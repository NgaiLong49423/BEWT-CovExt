package po;

import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ManageFieldGroupsPage extends SiteAdminPageObject {


        @FindBy(xpath = "//*[@id=\"toolbar-new\"]/button")
        protected WebElement createGroupBtn;


        public ManageFieldGroupsPage(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public CreateFieldGroupPage createGroup() {
                createGroupBtn.click();
                return new CreateFieldGroupPage(driver);
        }

        public boolean isGroupPresent(String group) {
                try {
                        return driver.findElement(By.id("groupList")).getText().contains(group);
                } catch(NoSuchElementException e) {
                        if(driver.findElement(By.xpath("//*[@id=\"j-main-container\"]/div[3]")).getText().contains("No Matching Results")) {
                                return false;
                        }
                        else {
                                throw e;
                        }

                }

        }

        public boolean isGroupPresentAtFirstRow(String group) {
                try {
                        return driver.findElement(By.xpath("//*[@id=\"fieldgroupList\"]/tbody/tr[1]/th/div/a")).getText().contains(group);
                } catch(NoSuchElementException e) {
                        if(driver.findElement(By.xpath("//*[@id=\"j-main-container\"]/div[3]")).getText().contains("No Matching Results")) {
                                return false;
                        }
                        else {
                                throw e;
                        }

                }

        }

        public ManageFieldGroupsPage selectIthFieldGroup(int i) {
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/table/tbody/tr["+i+"]/td[2]/input")).click();
                return this;
        }

        public ManageFieldGroupsPage deleteSelectedGroup() {
                driver.findElement(By.xpath("//*[@id=\"toolbar-trash\"]/button/span")).click();
                return new ManageFieldGroupsPage(driver);
        }

        public String getAlertMessage() {
                return driver.findElement(By.xpath("//*[@id=\"system-message-container\"]/div/div")).getText();
        }


}
