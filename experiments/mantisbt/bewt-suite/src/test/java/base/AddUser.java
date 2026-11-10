package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.BaseNavBar;
import po.ManageUsersPage;
import utils.Strings;

public class AddUser extends BaseTest {

        @Test
        public void addUser() {
                System.out.println("DEBUG MANTIS: Current URL=" + driver.getCurrentUrl() + ", Title=" + driver.getTitle());
                if (driver.getPageSource().contains("error")) {
                    System.out.println("DEBUG MANTIS: Page contains error text: " + driver.getPageSource().substring(0, Math.min(1000, driver.getPageSource().length())));
                }
                String username = "username001";
                String realname = "username001";
                String email = "username@example.invalid";
                ManageUsersPage usersPage = new BaseNavBar(driver)
                                .manage()
                                .manageUsers()
                                .createNewUser()
                                .setUsername(username)
                                .setRealname(realname)
                                .setEmail(email)
                                .setAccessLevel(Strings.updater)
                                .createUser();
                assertEquals(username, usersPage.getUsername(2));
                assertEquals(realname, usersPage.getRealName(2));
                assertEquals(email, usersPage.getEmail(2));
                assertEquals(Strings.updater, usersPage.getAccessLevel(2));
                usersPage.logout();

        }
}
