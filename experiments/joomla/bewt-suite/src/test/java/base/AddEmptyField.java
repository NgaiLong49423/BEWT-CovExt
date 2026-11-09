package base;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import po.EditFieldPage;

public class AddEmptyField extends BaseTest {

        @Test
        public void addEmptyField() {
                EditFieldPage field = loginAsAdmin()
                                .siteAdmin()
                                .setUsername(adminUser)
                                .setPassword(adminPsw)
                                .login()
                                .articles()
                                .fields()
                                .createField()
                                .saveError();

                        assertEquals("Invalid field:  Title ", field.getEmptyTitleAlert());
        }

}
