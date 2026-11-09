package tests;

import static org.junit.Assert.assertEquals;
import org.junit.Test;

import po.AddSupplierPage;
import po.PrestaLogin;


public class AddEmptySupplier extends BaseTest {

        @Test
        public void test_add_empty_supplier(){
                AddSupplierPage suppliers = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToSuppliers()
                                .clickAddSupplier()
                                .addEmptySupplier();

                assertEquals("×\n"
                                + "5 errors\n"
                                + "alias is required.\n"
                                + "address1 is required.\n"
                                + "city is required.\n"
                                + "The address is not correct. Please make sure all of the required fields are completed.\n"
                                + "The name field is required.", suppliers.getAlertMessage());
        }
}
