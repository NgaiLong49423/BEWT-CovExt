package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class RegisterEmployeePage {
        WebDriver driver;

        @FindBy(id = "page-header-desc-employee-new_employee")
        WebElement addEmployee;
        @FindBy(id = "firstname")
        WebElement firstname;
        @FindBy(id = "lastname")
        WebElement lastname;
        @FindBy(id = "passwd")
        WebElement passwd;
        @FindBy(id = "email")
        WebElement email;
        @FindBy(id = "id_profile")
        WebElement permission;
        @FindBy(id = "employee_form_submit_btn")
        WebElement submitAddEmployee;
        @FindBy(xpath = "//*[@id=\"content\"]/div[4]/div")
        WebElement alertMsg;

        public RegisterEmployeePage(WebDriver driver) {
                this.driver = driver;
                PageFactory.initElements(driver, this);
        }

        public EmployeesPage addEmployee(String nameStr, String lastnameStr, String emailStr, String passStr,
                        String permissionStr) {
                firstname.sendKeys(nameStr);
                lastname.sendKeys(lastnameStr);
                email.sendKeys(emailStr);
                passwd.sendKeys(passStr);
                permission.sendKeys(permissionStr);
                submitAddEmployee.click();
                return new EmployeesPage(driver);
        }

        public RegisterEmployeePage addEmployeeNoName(String emailStr, String passStr, String permissionStr) {
                email.sendKeys(emailStr);
                passwd.sendKeys(passStr);
                permission.sendKeys(permissionStr);
                submitAddEmployee.click();
                return new RegisterEmployeePage(driver);
        }

        public RegisterEmployeePage addEmployeeNoPassword(String nameStr, String lastnameStr, String emailStr,
                        String permissionStr) {
                firstname.sendKeys(nameStr);
                lastname.sendKeys(lastnameStr);
                email.sendKeys(emailStr);
                permission.sendKeys(permissionStr);
                submitAddEmployee.click();
                return new RegisterEmployeePage(driver);
        }

        public RegisterEmployeePage addEmployeeNoEmail(String nameStr, String lastnameStr, String passStr,
                        String permissionStr) {
                firstname.sendKeys(nameStr);
                lastname.sendKeys(lastnameStr);
                passwd.sendKeys(passStr);
                permission.sendKeys(permissionStr);
                submitAddEmployee.click();
                return new RegisterEmployeePage(driver);
        }

        public RegisterEmployeePage addEmployeeNoPermission(String nameStr, String lastnameStr, String emailStr, String passStr) {
                firstname.sendKeys(nameStr);
                lastname.sendKeys(lastnameStr);
                email.sendKeys(emailStr);
                passwd.sendKeys(passStr);
                submitAddEmployee.click();
                return new RegisterEmployeePage(driver);
        }

        public EmployeesPage editEmployee(String lastnameStr) {
                lastname.clear();
                lastname.sendKeys(lastnameStr);
                submitAddEmployee.click();
                return new EmployeesPage(driver);
        }

        public String getAlertMessage() {
                return alertMsg.getText();
        }

}
