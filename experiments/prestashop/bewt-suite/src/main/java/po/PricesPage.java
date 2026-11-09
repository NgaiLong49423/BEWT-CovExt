package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class PricesPage extends AdminSidebar {

        @FindBy(id = "priceTE")
    protected WebElement preTaxRetail;

        @FindBy(id = "priceTI")
        protected WebElement retailPriceWithTax;

        @FindBy(id = "finalPrice")
        protected WebElement finalPrice;

        @FindBy(id = "id_tax_rules_group")
    protected WebElement taxRules;

        public PricesPage(WebDriver driver) {
                super(driver);
        }

        public PricesPage setPretaxRetail(String pretaxPrice) {
                preTaxRetail.clear();
        preTaxRetail.sendKeys(pretaxPrice);
        return new PricesPage(driver);
        }

        public PricesPage chooseTaxRules10() {
        taxRules.sendKeys("IT Reduced Rate (10%)");
        return this;
    }

        public String getRetailPriceWithTax() {
                return retailPriceWithTax.getText();
        }

        public String getFinalPrice() {
                return finalPrice.getText();
        }

}
