package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CreateMenuItemPage;

public class AddMenuItem_EmptyMenuType extends BaseTest {

        @Test
        public void addMenuItem_EmptyMenuType() {

                String name = "Test menu item 2";
                CreateMenuItemPage menuItems = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .menus()
                        .menuItems()
                        .createMenuItem()
                        .setTitle(name)
                        .selectMenuEmpty()
                        .saveError();

                assertEquals("Invalid field:  Menu Item Type ", menuItems.getAlertMessage());
        }

}
