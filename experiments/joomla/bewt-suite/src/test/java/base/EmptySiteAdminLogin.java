package base;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.SiteAdminLogin;

public class EmptySiteAdminLogin extends BaseTest {

        @Test
        public void emptySiteAdminLogin() {
                SiteAdminLogin login = loginAsAdmin()
                        .siteAdmin()
                        .badLogin();

                assertEquals("Empty password not allowed.", login.getAlertMessage());
        }
}
