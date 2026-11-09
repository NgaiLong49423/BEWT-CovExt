package base;

import static org.junit.Assert.assertTrue;

import org.junit.Test;

import po.ManageFieldsPage;

public class DeleteField extends BaseTest {

        @Test
        public void deleteField() {
                String field = "Test Field 000";
                ManageFieldsPage fields = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .articles()
                        .fields()
                        .selectIthField(1)
                        .deleteSelectedField();

                assertTrue(!fields.isFieldPresentAtFirstRow(field));
                fields.logout();
        }
}
