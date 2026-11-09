package tests;

import static org.junit.Assert.assertEquals;



import org.junit.Test;

import po.PrestaLogin;
import po.RegisterEmployeePage;


public class RegisterEmployee_NoPassword extends BaseTest {

        @Test
        public void test_register_employee_no_passsword(){
                RegisterEmployeePage employee = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToEmployees()
                                .addEmployee()
                                .addEmployeeNoPassword("John", "Smith", "smith@gmail.com","Salesman");


                assertEquals("×\n"
                                + "The password must be at least 8 characters long.", employee.getAlertMessage());
         }
}
