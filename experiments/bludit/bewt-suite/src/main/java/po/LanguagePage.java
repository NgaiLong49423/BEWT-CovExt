package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.Select;

public class LanguagePage extends AdminSidebar {
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/form/div[5]/div/button")
	protected WebElement saveBtn;

	public LanguagePage(WebDriver driver) {
		super(driver);
	}
	
	public LanguagePage setLanguage(String lang) {
		new Select(driver.findElement(By.id("jslanguage"))).selectByVisibleText(lang);
		return this;
	}
	
	public LanguagePage save() {
		saveBtn.click();
		return new LanguagePage(driver);
	}
	
	public String getLanguage() {
		try {
			Thread.sleep(1000);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return new Select(driver.findElement(By.id("jslanguage"))).getFirstSelectedOption().getText();
	}

}
