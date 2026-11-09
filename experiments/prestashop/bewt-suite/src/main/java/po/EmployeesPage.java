package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class EmployeesPage extends ElementManagementPage {

        @FindBy(id = "page-header-desc-employee-new_employee")
        protected WebElement addEmployee;

        @FindBy(xpath = "//*[@id=\"form-employee\"]/div/div[2]/table/tbody/tr[1]/td[8]/div/a")
    protected WebElement edit;

        public EmployeesPage(WebDriver driver) {
                super(driver);
                // TODO Auto-generated constructor stub
        }

        public RegisterEmployeePage addEmployee() {
                addEmployee.click();
                return new RegisterEmployeePage(driver);
        }

        public RegisterEmployeePage editEmployee() {
                edit.click();
                return new RegisterEmployeePage(driver);
        }

}
