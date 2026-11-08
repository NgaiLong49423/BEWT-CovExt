package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class EditCategoryPage extends NewCategoryPage {
	
	@FindBy(id = "jsnewKey")
	protected WebElement url;
	
	@FindBy(name = "delete")
	protected WebElement deleteBtn;
	
	
	public EditCategoryPage(WebDriver driver) {
		super(driver);
	}
	
	public EditCategoryPage setUrl(String url) {
		this.url.clear();
		this.url.sendKeys(url);
		return this;
	}
	
	public CategoriesPage delete() {
		deleteBtn.click();
		return new CategoriesPage(driver);
	}
	

	
	

}
