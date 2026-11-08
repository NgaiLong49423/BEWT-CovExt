package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class AdminLogin extends PageObject {
	
	@FindBy(name = "username")
	protected WebElement username;
	
	@FindBy(name = "password")
	protected WebElement password;
	
	@FindBy(xpath = "/html/body/div/div/div/form/div[4]/button")
	protected WebElement loginBtn;
	
	@FindBy(className = "uk-alert")
	protected WebElement alert;
	
	public AdminLogin(WebDriver driver) {
		super(driver);
	}
	
	public AdminLogin setUsername(String usr) {
		username.sendKeys(usr);
		return this;
	}
	
	public AdminLogin setPassword(String psw) {
		password.sendKeys(psw);
		return this;
	}
	
	public AdminHome login() {
		loginBtn.click();
		return new AdminHome(driver);
	}
	
	public AdminLogin badLogin() {
		loginBtn.click();
		return new AdminLogin(driver);
	}
	
	public boolean isAlertVisible() {
		return alert.isDisplayed();
	}
	
	public String getAlertText() {
		return alert.getText();
	}

}
