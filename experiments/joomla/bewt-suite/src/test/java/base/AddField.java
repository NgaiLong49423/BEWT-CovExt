package base;

import static org.junit.Assert.assertTrue;

import org.junit.Test;

import po.ManageFieldsPage;

public class AddField extends BaseTest {

        @Test
        public void addField() {
                String field = "Test Field 000";
                ManageFieldsPage fields = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .articles()
                        .fields()
                        .createField()
                        .setTitle(field)
                        .saveAndClose();

                assertTrue(fields.isFieldPresent(field));
                fields.logout();
        }

}
