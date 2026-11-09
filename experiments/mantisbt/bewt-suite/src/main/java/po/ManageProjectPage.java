package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ManageProjectPage extends ManageNavBar {

        @FindBy(xpath = "/html/body/table[3]/tbody/tr[1]/td/form/input[2]")
        protected WebElement createProjectBtn;


        public ManageProjectPage(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public CreateProjectPage createProject() {
                createProjectBtn.click();
                return new CreateProjectPage(driver);
        }

        public String getProjectName() {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr[3]/td[1]/a")).getText();
        }

        public String getProjectStatus() {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr[3]/td[2]")).getText();
        }

        public String getProjectVisibility() {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr[3]/td[4]")).getText();
        }

        public String getProjectDescription() {
                return driver.findElement(By.xpath("/html/body/table[3]/tbody/tr[3]/td[5]")).getText();
        }

        public EditProjectPage goToProject(String projectName) {
                driver.findElement(By.linkText(projectName)).click();
                return new EditProjectPage(driver);
        }

        public boolean isProjectPresent(String projectName) {
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                }
                return driver.findElement(By.tagName("BODY")).getText().contains(projectName);
        }


}
