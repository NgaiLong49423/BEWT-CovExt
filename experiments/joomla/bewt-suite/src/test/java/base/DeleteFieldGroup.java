package base;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import po.ManageFieldGroupsPage;

public class DeleteFieldGroup extends BaseTest {

        @Test
        public void deleteFieldGroup() {
                String group = "Test Group 000";
                ManageFieldGroupsPage groups = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .articles()
                        .fieldGroups()
                        .selectIthFieldGroup(1)
                        .deleteSelectedGroup();

                assertEquals("1 field group trashed", groups.getAlertMessage());
                assertTrue(!groups.isGroupPresentAtFirstRow(group));
                groups.logout();
        }

}
