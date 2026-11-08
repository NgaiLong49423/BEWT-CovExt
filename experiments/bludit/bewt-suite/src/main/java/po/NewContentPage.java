package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.Select;

public class NewContentPage extends AdminSidebar {
	
	@FindBy(id = "jstitle")
	protected WebElement title;
	
	@FindBy(xpath =  "//*[@id=\"bl-view\"]/form/div/div[1]/div[3]/button[1]")
	protected WebElement saveBtn;
	
	@FindBy(id = "jsSaveDraft")
	protected WebElement saveAsDraft;

	@FindBy(xpath = "//*[@id=\"bl-view\"]/form/div/div[2]/ul/li[7]/h2")
	protected WebElement advancedTab;
	
	@FindBy(name = "slug")
	protected WebElement urlField;
	
	@FindBy(id = "jsposition")
	protected WebElement positionField;
	
	@FindBy(id ="jsdate")
	protected WebElement date;
	
	@FindBy(id = "jsdelete")
	protected WebElement deleteBtn;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/form/div/div[2]/ul/li[1]/h2")
	protected WebElement generalTab;
	
	
	public NewContentPage(WebDriver driver) {
		super(driver);
	}
	
	public NewContentPage setTitle(String ttl) {
		title.sendKeys(ttl);
		return this;
	}
	
	public ContentPage saveAndReturnToContentPage() {
		saveBtn.click();
		return new ContentPage(driver);
	}
	
	public NewContentPage advanced() {
		advancedTab.click();
		return this;
	}
	
	public NewContentPage setUrl(String url) {
		urlField.clear();
		urlField.sendKeys(url);
		return this;
	}
	
	public NewContentPage setPosition(String pos) {
		positionField.clear();
		positionField.sendKeys(pos);
		return this;
	}
	
	public ContentPage saveDraft() {
		saveAsDraft.click();
		return new ContentPage(driver);
	}
	
	public NewContentPage setPostType(String type) {
		new Select(driver.findElement(By.id("jsstatus"))).selectByVisibleText(type);
		return this;
	}
	
	public String getPosition() {
		return positionField.getAttribute("value");
	}
	
	public NewContentPage setParent(String parent) {
		new Select(driver.findElement(By.id("jsparent"))).selectByVisibleText(parent);
		return this;
	}
	
	public String getSelectedParent() {
		return new Select(driver.findElement(By.id("jsparent"))).getFirstSelectedOption().getText();
	}
	
	public NewContentPage setDate(String date) {
		this.date.clear();
		this.date.sendKeys(date);
		return this;
	}
	
	public String getDate() {
		return date.getAttribute("value");
	}
	
	public NewContentPage setCategory(String category) {
		new Select(driver.findElement(By.id("jscategory"))).selectByVisibleText(category);
		return this;
	}
	
	public String getSelectedCategory() {
		return new Select(driver.findElement(By.id("jscategory"))).getFirstSelectedOption().getText();
	}
	
	public ContentPage delete() {
		deleteBtn.click();
		driver.switchTo().alert().accept();
		driver.switchTo().defaultContent();
		return new ContentPage(driver);
	}
	
	public NewContentPage general() {
		generalTab.click();
		return new NewContentPage(driver);
	}
	
	

}
