package base;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import org.junit.Test;

import po.ManageUsersPage;

public class DeleteUser extends BaseTest {

        @Test
        public void deleteUser() {
                String user = "Test User";
                String expectedAlert = "1 user deleted.";

                ManageUsersPage users = loginAsAdmin()
                                .siteAdmin()
                                .setUsername(adminUser)
                                .setPassword(adminPsw)
                                .login()
                                .users()
                                .selectSecondUser()
                                .deleteSelectedUser();

                assertEquals(expectedAlert, users.getAlertMessage());
                assertFalse(users.containsUser(user));
                users.logout();

        }
}
