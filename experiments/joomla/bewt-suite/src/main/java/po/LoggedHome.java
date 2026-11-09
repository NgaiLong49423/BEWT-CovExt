package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class LoggedHome extends LoggedNavBar {

        @FindBy(xpath = "/html/body/div/div/div/main/div[3]/div[1]/div[1]/div[2]/div/button")
        protected WebElement firstArticleToggle;

        public LoggedHome(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public String getFirstArticleTitle() {
                return driver.findElement(By.xpath("/html/body/div/div/div/main/div[3]/div[1]/div[1]/div[1]/h2/a")).getText();
        }

        public String getFirstArticleBody() {
                return driver.findElement(By.xpath("/html/body/div/div/div/main/div[3]/div[1]/div[1]/p")).getText();
        }

        public CreatePostPage editFirstArticle() {
                firstArticleToggle.click();
                driver.findElement(By.linkText("Edit")).click();
                return new CreatePostPage(driver);
        }

        public ArchivedArticlesPage testMenuItem() {
                driver.findElement(By.linkText("Test menu item")).click();
                return new ArchivedArticlesPage(driver);
        }

}
