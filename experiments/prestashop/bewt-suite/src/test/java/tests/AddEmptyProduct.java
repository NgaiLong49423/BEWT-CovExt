package tests;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AddProductPage;
import po.PrestaLogin;

public class AddEmptyProduct extends BaseTest {

        @Test()
        public void test_add_empty_product(){

                AddProductPage product = new PrestaLogin(driver)
                        .loginToPresta(adminMail, adminPsw)
                        .goToProducts()
                        .addNewProduct()
                        .submitError();

                assertEquals("×\n"
                                + "2 errors\n"
                                + "This link_rewrite field is required at least in English (English)\n"
                                + "This name field is required at least in English (English)", product.getAlertMessage());



        }

}
