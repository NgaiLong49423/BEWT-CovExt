package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.BaseNavBar;
import po.NewAccountPage;
import utils.Strings;

public class AddExistingUserFails extends BaseTest {

        @Test
        public void addExistingUserFails() {
                String username = "username001";
                String realname = "username001";
                String email = "username@example.invalid";


                NewAccountPage userPage = new BaseNavBar(driver)
                        .manage()
                        .manageUsers()
                        .createNewUser()
                        .setUsername(username)
                        .setRealname(realname)
                        .setEmail(email)
                        .setAccessLevel(Strings.updater)
                        .createUserFails();

                assertEquals(Strings.errorExistingUser, userPage.getError());
        }
}
