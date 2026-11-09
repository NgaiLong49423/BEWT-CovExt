package po;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.Select;

public class CreateMenuItemPage extends PageObject {

        @FindBy(id = "jform_title")
        protected WebElement title;

        @FindBy(xpath = "/html/body/div[2]/section/div/div/form/div[2]/div/div[1]/div/div[1]/div[1]/div[2]/span/button")
        protected WebElement menuItemType;

        @FindBy(xpath = "//*[@id=\"system-message-container\"]/div/div[1]")
        protected WebElement alertMsg;

        public CreateMenuItemPage(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public CreateMenuItemPage setTitle(String ttl) {
                title.sendKeys(ttl);
                return this;
        }

        public CreateMenuItemPage selectMenu() {
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                }
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/div/div[1]/div/div[2]/fieldset/div[1]/div[2]/div")).click();
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/div/div[1]/div/div[2]/fieldset/div[1]/div[2]/div/div/ul/li[4]")).click();
                return this;
        }

        public CreateMenuItemPage selectMenuEmpty() {
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/div/div[1]/div/div[2]/fieldset/div[1]/div[2]/div")).click();
                driver.findElement(By.tagName("body")).sendKeys(Keys.DOWN);
                driver.findElement(By.tagName("body")).sendKeys(Keys.DOWN);
                driver.findElement(By.tagName("body")).sendKeys(Keys.DOWN);
                driver.findElement(By.tagName("body")).sendKeys(Keys.ENTER);
                return this;
        }

        public CreateMenuItemPage selectArchivedArticleType() {
                menuItemType.click();
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                }
                driver.switchTo().frame(driver.findElement(By.className("iframe")));
                driver.findElement(By.linkText("Articles")).click();
                driver.findElement(By.partialLinkText("Archived Articles")).click();
                driver.switchTo().defaultContent();
                return this;
        }

        public MenuItemsPage save() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                driver.findElement(By.className("button-save")).click();
                return new MenuItemsPage(driver);
        }

        public CreateMenuItemPage saveError() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                driver.findElement(By.className("button-save")).click();
                return new CreateMenuItemPage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }

}
