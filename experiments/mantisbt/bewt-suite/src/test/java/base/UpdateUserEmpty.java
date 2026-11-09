package base;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import po.BaseNavBar;
import po.EditUserPage;
import utils.Strings;

public class UpdateUserEmpty extends BaseTest {

        @Test
        public void updateUserEmpty() {
                String originalName = "username001";
                EditUserPage editUser = new BaseNavBar(driver)
                                .manage()
                                .manageUsers()
                                .goToUser(originalName)
                                .setUsername("")
                                .updateUserFails();

                assertEquals(Strings.errorInvalidUser, editUser.getError());
                editUser.logout();
        }
}
