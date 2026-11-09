package tests;

import static org.junit.Assert.assertEquals;



import org.junit.Test;

import po.PrestaLogin;
import po.RegisterEmployeePage;


public class RegisterEmployee_NoName extends BaseTest {

        @Test
        public void test_register_employee_no_name(){
                RegisterEmployeePage employee = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToEmployees()
                                .addEmployee()
                                .addEmployeeNoName("fake@gmail.com","abcd!@#$23","Salesman");

                assertEquals("×\n"
                                + "2 errors\n"
                                + "The lastname field is required.\n"
                                + "The firstname field is required.", employee.getAlertMessage());
         }
}
