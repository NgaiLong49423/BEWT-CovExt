package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ContentPage extends AdminSidebar {
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[4]/td[1]/a")
	protected WebElement firstContentTitle;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[4]/td[1]/a")
	protected WebElement firstContentEdit;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[4]/td[3]/a")
	protected WebElement firstElementUrl;
	
	@FindBy(id = "draft-tab")
	protected WebElement draftTab;
	
	@FindBy(id = "sticky-tab")
	protected WebElement stickyTab;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[9]/td[1]/a")
	protected WebElement thirdContentEdit;
	
	@FindBy(xpath = "//*[@id=\"pages\"]/table/tbody/tr[3]/td[3]/a[3]")
	protected WebElement deleteThirdContent;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[2]/td[1]/a")
	protected WebElement firstDraftTitle;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table/tbody/tr[6]/td[1]/a")
	protected WebElement firstStickyTitle;
	
	@FindBy(xpath = "//*[@id=\"bl-view\"]/table")
	protected WebElement mainTable;

	public ContentPage(WebDriver driver) {
		super(driver);
	}
	
	public String getFirstContentTitle() {
		return firstContentTitle.getText();
	}
	
	public String getFirstDraftTitle() {
		return firstDraftTitle.getText();
	}
	
	public String getFirstElementUrl() {
		return firstElementUrl.getText();
	}
	
	
	public boolean containsElement(String elem) {
		return mainTable.getText().contains(elem);
	}
	
	public String getFirstStickyTitle() {
		return firstStickyTitle.getText();
	}
	
	public NewContentPage editContent(String title) {
		driver.findElement(By.linkText(title)).click();
		return new NewContentPage(driver);
	}

}
