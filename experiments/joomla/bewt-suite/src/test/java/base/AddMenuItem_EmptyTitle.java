package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CreateMenuItemPage;

public class AddMenuItem_EmptyTitle extends BaseTest {

        @Test
        public void addMenuItem_EmptyTitle() {

                CreateMenuItemPage menuItems = loginAsAdmin()
                        .siteAdmin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login()
                        .menus()
                        .menuItems()
                        .createMenuItem()
                        .selectMenuEmpty()
                        .selectArchivedArticleType()
                        .saveError();

                assertEquals("Invalid field:  Menu Title ", menuItems.getAlertMessage());
        }

}
