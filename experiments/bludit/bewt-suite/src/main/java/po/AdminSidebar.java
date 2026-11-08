package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class AdminSidebar extends PageObject {
	
	@FindBy(linkText = "New content")
	protected WebElement newContent;
	
	@FindBy(linkText = "Content")
	protected WebElement content;
	
	@FindBy(linkText = "Users")
	protected WebElement users;
	
	@FindBy(linkText = "General")
	protected WebElement general;
	
	@FindBy(linkText = "Categories")
	protected WebElement categories;
	
	@FindBy(linkText = "Advanced")
	protected WebElement advanced;
	
	@FindBy(linkText = "Language")
	protected WebElement language;
	
	
	public AdminSidebar(WebDriver driver) {
		super(driver);
	}
	
	public NewContentPage newContent() {
		newContent.click();
		return new NewContentPage(driver);
	}
	
	public ContentPage content() {
		try {
			Thread.sleep(1000);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		content.click();
		return new ContentPage(driver);
	}
	
	public UsersPage users() {
		try {
			Thread.sleep(500);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		users.click();
		return new UsersPage(driver);
	}
	
	public GeneralSettingsPage generalSettings() {
		general.click();
		return new GeneralSettingsPage(driver);
	}
	
	public CategoriesPage categories() {
		categories.click();
		return new CategoriesPage(driver);
	}
	
	public AdvancedSettingsPage advancedSettings() {
		advanced.click();
		return new AdvancedSettingsPage(driver);
	}
	
	public LanguagePage language() {
		language.click();
		return new LanguagePage(driver);
	}

}
