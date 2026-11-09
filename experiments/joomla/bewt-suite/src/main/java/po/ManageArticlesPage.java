package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ManageArticlesPage extends SiteAdminPageObject {

        @FindBy(linkText = "Fields")
        protected WebElement fields;

        @FindBy(linkText = "Field Groups")
        protected WebElement fieldGroups;

        public ManageArticlesPage(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public ManageArticlesPage deleteFirstArticle() {
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/table/tbody/tr[1]/td[3]/div/button")).click();
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/table/tbody/tr[1]/td[3]/div/ul/li[2]/a")).click();
                return this;
        }

        public String getAlertMessage() {
                return driver.findElement(By.className("alert-message")).getText();
        }

        public boolean containsArticle(String title) {
                return driver.findElement(By.id("articleList")).getText().contains(title);
        }

        public EditArticleSiteAdminPage goToArticle(String article) {
                driver.findElement(By.linkText(article)).click();
                return new EditArticleSiteAdminPage(driver);
        }

        public String getFirstArticleCategory() {
                return driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/table/tbody/tr[1]/td[4]/div/div/a")).getText();
        }

        public ManageArticlesPage archiveSecondArticle() {
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/table/tbody/tr[2]/td[3]/div/button")).click();
                driver.findElement(By.xpath("/html/body/div[2]/section/div/div/form/div[2]/table/tbody/tr[2]/td[3]/div/ul/li[1]/a")).click();
                return this;
        }

        public ManageFieldsPage fields() {
                fields.click();
                return new ManageFieldsPage(driver);
        }

        public ManageFieldGroupsPage fieldGroups() {
                fieldGroups.click();
                return new ManageFieldGroupsPage(driver);
        }

}
