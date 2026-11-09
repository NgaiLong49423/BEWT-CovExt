package tests;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AddManufacturerPage;
import po.PrestaLogin;


public class AddEmptyManufacturer extends BaseTest {

        @Test
        public void test_add_empty_manufacturer(){
                AddManufacturerPage manufacturers = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToManufacturer()
                                .clickAddManufacturer()
                                .addEmptyManufacturer();

                assertEquals("×\n"
                                + "The name field is required.", manufacturers.getAlertMessage());
        }
}
