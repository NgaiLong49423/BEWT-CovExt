package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ChangePasswordPage extends AdminSidebar {
	
	@FindBy(id = "jsnew_password")
	protected WebElement password;
	
	@FindBy(id = "jsconfirm_password")
	protected WebElement confirm;
	
	@FindBy(xpath = "//*[@id=\"edit-user-profile-form\"]/div[4]/div/button")
	protected WebElement saveBtn;
	
	public ChangePasswordPage(WebDriver driver) {
		super(driver);
	}
	
	public ChangePasswordPage setPassword(String psw) {
		password.sendKeys(psw);
		return this;
	}
	
	public ChangePasswordPage confirmPassword(String psw) {
		confirm.sendKeys(psw);
		return this;
	}
	
	public UsersPage save() {
		saveBtn.click();
		try {
			Thread.sleep(500);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return new UsersPage(driver);
	}

}
