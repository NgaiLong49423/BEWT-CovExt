package tests;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AddCategoryPage;
import po.PrestaLogin;


public class AddEmptyCategory extends BaseTest {

        @Test
        public void test_add_empty_category(){
                AddCategoryPage category = new PrestaLogin(driver)
                                .loginToPresta(adminMail, adminPsw)
                                .goToCategories()
                                .addCategory()
                                .submitEmptyCategory();
                assertEquals("×\n"
                                + "2 errors\n"
                                + "The field name is required at least in English (English).\n"
                                + "The field link_rewrite is required at least in English (English).", category.getAlertMessage());
        }
}
