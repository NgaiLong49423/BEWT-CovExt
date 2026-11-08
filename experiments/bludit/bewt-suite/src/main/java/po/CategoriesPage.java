package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class CategoriesPage extends AdminSidebar {
	
	@FindBy(linkText = "Add a new category")
	protected WebElement addCategory;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[1]/td[1]/a")
	protected WebElement firstCategoryName;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table")
	protected WebElement categoriesTable;

	public CategoriesPage(WebDriver driver) {
		super(driver);
	}
	
	public NewCategoryPage addCategory() {
		addCategory.click();
		return new NewCategoryPage(driver);
	}
	
	public String getFirstCategoryName() {
		return firstCategoryName.getText();
	}
	
	public EditCategoryPage editCategory(String cat) {
		driver.findElement(By.linkText(cat)).click();
		return new EditCategoryPage(driver);
	}
	
	public SiteCategoryPage seeCategoryArticles(String catUrl) {
		driver.findElement(By.linkText("/category/"+catUrl)).click();
		return new SiteCategoryPage(driver);
	}
	
	public boolean containsCategory(String cat) {
		return categoriesTable.getText().contains(cat);
	}


}
