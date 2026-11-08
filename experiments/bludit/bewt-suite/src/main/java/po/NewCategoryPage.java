package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class NewCategoryPage extends AdminSidebar {
	
	@FindBy(id = "jscategory")
	protected WebElement name;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/form/div[2]/div/button")
	protected WebElement saveBtn;
	
	public NewCategoryPage(WebDriver driver) {
		super(driver);
	}
	
	public NewCategoryPage setName(String name) {
		this.name.sendKeys(name);
		return this;
	}
	
	public CategoriesPage save() {
		saveBtn.click();
		return new CategoriesPage(driver);
	}

}
