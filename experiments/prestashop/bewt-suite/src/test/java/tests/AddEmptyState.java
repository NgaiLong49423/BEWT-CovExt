package tests;




import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AddNewStatePage;
import po.PrestaLogin;



public class AddEmptyState extends BaseTest {

        @Test
        public void test_add_empty_state(){

                AddNewStatePage state = new PrestaLogin(driver)
                        .loginToPresta(adminMail, adminPsw)
                        .goToStates()
                        .addNewState()
                        .addEmptyState();

                assertEquals("×\n"
                                + "2 errors\n"
                                + "The iso_code field is required.\n"
                                + "The name field is required.", state.getAlertMessage());

        }

}
