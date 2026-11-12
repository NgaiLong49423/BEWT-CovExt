package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SearchResultsPage extends TopNavBar {
	
	@FindBy(css = ".table-list .table-list-row .table-list-title a")
	protected WebElement firstTask;

	public SearchResultsPage(WebDriver driver) {
		super(driver);
	}

	public String getFirstTask() {
		return firstTask.getText();
	}

}
