package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class GeneralSettingsPage extends AdminSidebar {

	@FindBy(id = "jsfooter")
	protected WebElement footer;
	
	@FindBy(id = "jsinstagram")
	protected WebElement instagram;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/form/div[12]/div/button")
	protected WebElement saveBtn;
	
	public GeneralSettingsPage(WebDriver driver) {
		super(driver);
	}
	
	public GeneralSettingsPage setFooter(String ft) {
		footer.clear();
		footer.sendKeys(ft);
		return this;
	}
	
	public GeneralSettingsPage save() {
		saveBtn.click();
		return new GeneralSettingsPage(driver);
	}
	
	public String getFooter() {
		try {
			Thread.sleep(500);
		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
		return footer.getAttribute("value");
	}
	
	public GeneralSettingsPage setInstagram(String ig) {
		instagram.clear();
		instagram.sendKeys(ig);
		return this;
	}
	
	public String getInstagram() {
		try {
			Thread.sleep(1000);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return instagram.getAttribute("value");
	}
	

}
