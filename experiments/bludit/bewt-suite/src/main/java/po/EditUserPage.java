package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class EditUserPage extends AdminSidebar {
	
	@FindBy(linkText = "Change password")
	protected WebElement changePassword;
	
	@FindBy(id = "jsfacebook")
	protected WebElement facebook;
	
	@FindBy(id = "jsinstagram")
	protected WebElement instagram;
	
	@FindBy(id = "jsdelete-user-all")
	protected WebElement delete;
	
	@FindBy(xpath = "//*[@id=\"edit-user-profile-form\"]/div[12]/div/button")
	protected WebElement saveBtn;

	public EditUserPage(WebDriver driver) {
		super(driver);
	}
		
	public ChangePasswordPage changePassword() {
		changePassword.click();
		return new ChangePasswordPage(driver);
	}
	
	public EditUserPage setFb(String fb) {
		facebook.sendKeys(fb);
		return this;
	}
	
	public EditUserPage setIg(String ig) {
		instagram.sendKeys(ig);
		return this;
	}
	
	public UsersPage save() {
		saveBtn.click();
		return new UsersPage(driver);
	}
	
	public String getFb() {
		return facebook.getAttribute("value");
	}
	
	public String getIg() {
		return instagram.getAttribute("value");
	}
	
	public UsersPage delete() {
		delete.click();
		driver.switchTo().alert().accept();
		driver.switchTo().defaultContent();
		return new UsersPage(driver);
	}
}
