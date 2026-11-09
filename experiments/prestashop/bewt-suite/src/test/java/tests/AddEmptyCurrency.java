package tests;
import static org.junit.Assert.assertEquals;
import org.junit.Test;

import po.AddCurrencyPage;
import po.PrestaLogin;

public class AddEmptyCurrency extends BaseTest {

        @Test
        public void test_add_empty_currency(){
                AddCurrencyPage currency = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToCurrency()
                                .clickAddCurrency()
                                .addEmptyCurrency();

                assertEquals("×\n"
                                + "3 errors\n"
                                + "The name field is required.\n"
                                + "The iso_code field is required.\n"
                                + "The sign field is required.", currency.getAlertMessage());
        }
}
