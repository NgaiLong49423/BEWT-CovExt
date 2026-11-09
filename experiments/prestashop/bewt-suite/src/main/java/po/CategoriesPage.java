package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class CategoriesPage extends ElementManagementPage {

        @FindBy(id = "page-header-desc-category-new_category")
    protected WebElement addCategory;

        @FindBy(xpath = "//*[@id=\"tr_2_12_1\"]/td[7]/div/div/a")
    protected WebElement editCategory;

        public CategoriesPage(WebDriver driver) {
                super(driver);
        }

        public AddCategoryPage addCategory() {
        addCategory.click();
        return new AddCategoryPage(driver);
    }

        public AddCategoryPage editCategory() {
                editCategory.click();
                return new AddCategoryPage(driver);
        }

}
