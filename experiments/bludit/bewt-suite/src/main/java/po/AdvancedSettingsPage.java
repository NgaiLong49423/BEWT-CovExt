package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.Select;

public class AdvancedSettingsPage extends AdminSidebar {
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/form/div[11]/div/button")
	protected WebElement saveBtn;
	
	public AdvancedSettingsPage(WebDriver driver) {
		super(driver);
	}
	
	public AdvancedSettingsPage setHome(String home) {
		new Select(driver.findElement(By.id("jshomepage"))).selectByVisibleText(home);
		return this;
	}
	
	public AdvancedSettingsPage save() {
		saveBtn.click();
		return new AdvancedSettingsPage(driver);
	}
	
	public AdvancedSettingsPage setPostsOrder(String order) {
		new Select(driver.findElement(By.id("jsorderBy"))).selectByVisibleText(order);
		return this;
	}
	
	public String getPostsOrder() {
		try {
			Thread.sleep(500);
		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
		return new Select(driver.findElement(By.id("jsorderBy"))).getFirstSelectedOption().getText();
	}
	
	public String getSelectedHome() {
		try {
			Thread.sleep(1000);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return new Select(driver.findElement(By.id("jshomepage"))).getFirstSelectedOption().getText();
	}
	
	

}
