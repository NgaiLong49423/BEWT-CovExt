package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.Select;

import utils.Strings;

public class ViewIssuesPage extends BaseNavBar {



        public ViewIssuesPage(WebDriver driver) {
                super(driver);
        }


        public String getCategory() {
                return driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[4]/td[6]")).getText();
        }

        public String getSeverity() {
                return driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[4]/td[7]/span")).getText();
        }

        public String getStatus() {
                return driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[4]/td[8]/span")).getText();
        }

        public String getSummary() {
                return driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[4]/td[10]")).getText();
        }

        public ViewIssuesPage selectFirstIssue() {
                driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[4]/td[1]/input")).click();
                return this;
        }


        public AssignIssuePage assignIssue() {
                new Select(driver.findElement(By.name("action"))).selectByVisibleText(Strings.assign);
                driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[5]/td/span[1]/input[2]")).click();
                return new AssignIssuePage(driver);
        }

        public EditIssuePage editFirstIssue() {
                driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[4]/td[2]/a/img")).click();
                return new EditIssuePage(driver);
        }

        public DeleteIssuePage deleteIssue() {
                new Select(driver.findElement(By.name("action"))).selectByVisibleText(Strings.delete);
                driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[5]/td/span[1]/input[2]")).click();
                return new DeleteIssuePage(driver);
        }

        public String getIssueListText() {
                return driver.findElement(By.xpath("//*[@id=\"buglist\"]/tbody/tr[1]/td/span[1]")).getText();
        }







}
