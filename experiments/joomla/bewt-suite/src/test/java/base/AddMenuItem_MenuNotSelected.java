package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CreateMenuItemPage;

public class AddMenuItem_MenuNotSelected extends BaseTest {

        @Test
        public void addMenuItem_MenuNotSelected() {

                String name = "Test menu item2";
                CreateMenuItemPage menuItems = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .menus()
                        .menuItems()
                        .createMenuItem()
                        .setTitle(name)
                        .selectArchivedArticleType()
                        .saveError();

                assertEquals("Invalid field:  Menu ", menuItems.getAlertMessage());
        }

}
