package tests;

import static org.junit.Assert.assertTrue;


import org.junit.Test;

import po.PrestaLogin;
import po.StatesPage;


public class AddNewState extends BaseTest {

        @Test
        public void test_add_new_state(){

                StatesPage states = new PrestaLogin(driver)
                        .loginToPresta(adminMail, adminPsw)
                        .goToStates()
                        .addNewState()
                        .addNewState("Liguria3", "1121", "Italy", "Europe");

                assertTrue(states.getSuccesssMessage().contains("Successful creation"));

        }

}
