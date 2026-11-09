package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.ManageArticlesPage;

public class ArchiveArticle extends BaseTest {

        @Test
        public void archiveArticle() {
                ManageArticlesPage articles = loginAsAdmin()
                                .siteAdmin()
                                .setUsername(adminUser)
                                .setPassword(adminPsw)
                                .login()
                                .articles()
                                .archiveSecondArticle();

                assertEquals("1 article archived.", articles.getAlertMessage());
                articles.logout();
        }

}
