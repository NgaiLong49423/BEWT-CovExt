package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CreateGroupPage;

public class AddEmptyGroup extends BaseTest {

        @Test
        public void addEmptyGroup() {

                CreateGroupPage groups = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .sideUsers()
                        .groups()
                        .createGroup()
                        .saveError();

                assertEquals("Invalid field:  Group Title ", groups.getEmptyTitleAlert());
        }
}
