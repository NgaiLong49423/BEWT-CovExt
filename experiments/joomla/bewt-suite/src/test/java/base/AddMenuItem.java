package base;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import po.MenuItemsPage;

public class AddMenuItem extends BaseTest {

        @Test
        public void addMenuItem() {
                String name = "Test menu item";

                MenuItemsPage menuItems = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .menus()
                        .menuItems()
                        .createMenuItem()
                        .setTitle(name)
                        .selectMenu()
                        .selectArchivedArticleType()
                        .save();

                assertEquals("Menu item saved.", menuItems.getAlertMessage());
                assertTrue(menuItems.containsMenuItem(name));
                menuItems.logout();
        }
}
