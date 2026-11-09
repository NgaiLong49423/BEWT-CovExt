package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class EditCategoryPage extends BaseNavBar {

        @FindBy(name = "name")
        protected WebElement categoryName;

        @FindBy(xpath = "/html/body/div[3]/form/table/tbody/tr[4]/td[2]/input")
        protected WebElement updateCategoryBtn;

        public EditCategoryPage(WebDriver driver) {
                super(driver);
        }

        public EditCategoryPage setCategoryName(String name) {
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                }
                categoryName.clear();
                categoryName.sendKeys(name);
                return this;
        }

        public EditProjectPage updateCategory() {
                updateCategoryBtn.click();
                try {
                        Thread.sleep(2000);
                } catch (InterruptedException e) {
                        e.printStackTrace();
                }
                return new EditProjectPage(driver);
        }



}
