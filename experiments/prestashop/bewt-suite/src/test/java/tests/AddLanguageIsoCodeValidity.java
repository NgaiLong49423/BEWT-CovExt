package tests;
import static org.junit.Assert.assertTrue;


import org.junit.Test;

import po.AddLanguageIsoCodeValidityPage;
import po.PrestaLogin;

public class AddLanguageIsoCodeValidity extends BaseTest {

        @Test
        public void test_add_iso_code(){
                AddLanguageIsoCodeValidityPage addLanguage = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToLanguages()
                                .clickAddLanguage()
                                .addIsoCodeValidity("Fa");

                assertTrue(addLanguage.getMessages().contains("Persian"));
        }
}
