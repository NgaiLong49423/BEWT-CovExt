package tests;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AddAddressPage;
import po.PrestaLogin;


public class AddEmptyAddress extends BaseTest {

        @Test
        public void test_add_empty_address(){
                AddAddressPage address = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToAddresses()
                                .addAddress()
                                .addEmptyAddress();

                assertEquals("×\n"
                                + "4 errors\n"
                                + "This email address is not valid. Please use an address like bob@example.com.\n"
                                + "An address located in a country containing states must have a state selected.\n"
                                + "Your Zip/postal code is incorrect.\n"
                                + "It must be entered as follows: 00000\n"
                                + "You must register at least one phone number.", address.getAlertMessage());
        }
}
