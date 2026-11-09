package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AddCategoryPage {
        WebDriver driver;

        @FindBy(id = "page-header-desc-category-new_category")
        WebElement addCategory;
        @FindBy(id = "name_1")
        WebElement name_1;
        @FindBy(name = "submitAddcategoryAndBackToParent")
        WebElement submitCategory;
        @FindBy(xpath = "//*[@id=\"tr_2_12_1\"]/td[7]/div/div/a")
        WebElement dropDownMeny;
        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMsg;


        public AddCategoryPage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public void addCategory() {
                addCategory.click();
        }


        public CategoriesPage submitCategory(String nameStr) {
                name_1.clear();
                name_1.sendKeys(nameStr);
                submitCategory.click();
                return new CategoriesPage(driver);
        }

        public AddCategoryPage submitEmptyCategory() {
                submitCategory.click();
                return new AddCategoryPage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }
}
