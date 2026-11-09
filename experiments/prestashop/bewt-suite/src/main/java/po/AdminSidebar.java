package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.FindBy;

public class AdminSidebar extends PageObject {

        @FindBy(xpath = "//*[@id=\"maintab-AdminCatalog\"]/a")
    protected WebElement catalog;

        @FindBy(xpath = "//*[@id=\"subtab-AdminProducts\"]/a")
    protected WebElement product;

        @FindBy(xpath = "//*[@id=\"maintab-AdminParentLocalization\"]/a")
        protected WebElement localization;

        @FindBy(xpath =  "//*[@id=\"subtab-AdminStates\"]/a")
        protected WebElement states;

        @FindBy(id = "subtab-AdminFeatures")
        protected WebElement features;

        @FindBy(id = "subtab-AdminAttributesGroups")
    protected WebElement attributes;

        @FindBy(id = "maintab-AdminParentCustomer")
    protected WebElement customers;

        @FindBy(id = "subtab-AdminAddresses")
    protected WebElement address;

        @FindBy(id = "subtab-AdminCategories")
    protected WebElement category;

        @FindBy(id = "subtab-AdminManufacturers")
    protected WebElement manufacturer;

    @FindBy(id = "subtab-AdminSuppliers")
    protected WebElement supplier;

    @FindBy(id = "maintab-AdminAdmin")
    protected WebElement administration;

    @FindBy(id = "subtab-AdminEmployees")
    protected WebElement employees;

    @FindBy(id = "maintab-AdminParentOrders")
    protected WebElement orders;

    @FindBy(id = "subtab-AdminTags")
    protected WebElement tags;

    @FindBy(id = "subtab-AdminLanguages")
    protected WebElement language;

    @FindBy(id = "subtab-AdminCurrencies")
    protected WebElement currency;

        public AdminSidebar(WebDriver driver) {
                super(driver);
        }

        public ProductsPage goToProducts() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                Actions action = new Actions(driver);
            action.moveToElement(catalog).moveToElement(product).click().build().perform();
            return new ProductsPage(driver);
    }

        public StatesPage goToStates() {
                Actions action = new Actions(driver);
        action.moveToElement(localization).moveToElement(states).click().build().perform();
        return new StatesPage(driver);
        }

        public FeaturesPage goToFeatures() {
        Actions action = new Actions(driver);
        action.moveToElement(catalog).moveToElement(features).click().build().perform();
        return new FeaturesPage(driver);
    }

        public AttributesPage goToAttributes() {
        Actions action = new Actions(driver);
        action.moveToElement(catalog).moveToElement(attributes).click().build().perform();
        return new AttributesPage(driver);
    }

        public AddressesPage goToAddresses() {
        Actions action = new Actions(driver);
        action.moveToElement(customers).moveToElement(address).click().build().perform();
        return new AddressesPage(driver);
    }

        public CategoriesPage goToCategories() {
        Actions action = new Actions(driver);
        action.moveToElement(catalog).moveToElement(category).click().build().perform();
        return new CategoriesPage(driver);
    }

        public ManufacturerPage goToManufacturer() {
        Actions action = new Actions(driver);
        action.moveToElement(catalog).moveToElement(manufacturer).click().build().perform();
        return new ManufacturerPage(driver);
    }

        public SupplierPage goToSuppliers() {
                Actions action = new Actions(driver);
        action.moveToElement(catalog).moveToElement(supplier).click().build().perform();
        return new SupplierPage(driver);
        }

        public EmployeesPage goToEmployees() {
        Actions action = new Actions(driver);
        action.moveToElement(administration).moveToElement(employees).click().build().perform();
        return new EmployeesPage(driver);
    }

        public OrdersPage goToOrders() {
                orders.click();
                return new OrdersPage(driver);
        }

        public TagsPage goToTags() {
        Actions action = new Actions(driver);
        action.moveToElement(catalog).moveToElement(tags).click().build().perform();
        return new TagsPage(driver);
    }

        public LanguagesPage goToLanguages() {
        Actions action = new Actions(driver);
        action.moveToElement(localization).moveToElement(language).click().build().perform();
        return new LanguagesPage(driver);
    }

        public CurrencyPage goToCurrency() {
        Actions action = new Actions(driver);
        action.moveToElement(localization).moveToElement(currency).click().build().perform();
        return new CurrencyPage(driver);
    }



}
