package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class UsersPage extends AdminSidebar {
	
	@FindBy(linkText = "Add a new user")
	protected WebElement addUser;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[2]/td[1]/a")
	protected WebElement secondUserName;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[2]/td[5]/b")
	protected WebElement secondUserAbilitation;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[2]/td[1]/a")
	protected WebElement firstUserName;
	
	@FindBy(id = "alert")
	protected WebElement alert;
	
	public UsersPage(WebDriver driver) {
		super(driver);
	}
	
	public AddUserPage addUser() {
		addUser.click();
		return new AddUserPage(driver);
	}
	
	public String getSecondUserName() {
		return secondUserName.getText();
	}
	
	public EditUserPage editSecondUser() {
		secondUserName.click();
		return new EditUserPage(driver);
	}
	
	public EditUserPage editFirstUser() {
		firstUserName.click();
		return new EditUserPage(driver);
	}
	
	public String getSecondUserAbilitation() {
		return secondUserAbilitation.getText();
	}
	
	public boolean containsUser(String usr) {
		return driver.findElement(By.tagName("body")).getText().contains(usr);
	}
	
	public String getAlert() {
		return alert.getText();
	}
	
	

}
