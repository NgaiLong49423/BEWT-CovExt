package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class EditUserPage extends PageObject {

        public EditUserPage(WebDriver driver) {
                super(driver);
        }

        public AssignedGroupPage assignedGroups() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        e.printStackTrace();
                }
                driver.findElement(By.linkText("Assigned User Groups")).click();
                return new AssignedGroupPage(driver);
        }


}
