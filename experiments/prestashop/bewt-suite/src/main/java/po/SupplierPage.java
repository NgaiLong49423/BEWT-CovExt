package po;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SupplierPage extends ElementManagementPage {

    @FindBy(id = "page-header-desc-supplier-new_supplier")
    protected WebElement addSupplier;

    @FindBy(xpath = "//*[@id=\"form-supplier\"]/div/div[2]/table/tbody/tr[2]/td[7]/div/div/button")
    protected WebElement removeDropDown;

        public SupplierPage(WebDriver driver) {
                super(driver);
        }

        public AddSupplierPage clickAddSupplier() {
        addSupplier.click();
        return new AddSupplierPage(driver);
    }

        public SupplierPage removeSupplier() {
                removeDropDown.click();
                driver.findElement(By.xpath("//*[@id=\"form-supplier\"]/div/div[2]/table/tbody/tr[2]/td[7]/div/div/ul/li[3]/a")).click();
                driver.switchTo().alert().accept();
                driver.switchTo().defaultContent();
                return new SupplierPage(driver);
        }

}
