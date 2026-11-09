package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CreateFieldGroupPage;

public class AddEmptyFieldGroup extends BaseTest {

        @Test
        public void addEmptyFieldGroup() {

                CreateFieldGroupPage groups = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .articles()
                        .fieldGroups()
                        .createGroup()
                        .saveError();

                assertEquals("Invalid field:  Title ", groups.getEmptyTitleAlert());
        }

}
