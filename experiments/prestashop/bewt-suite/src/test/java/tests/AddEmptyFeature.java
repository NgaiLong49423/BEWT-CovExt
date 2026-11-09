package tests;

import static org.junit.Assert.assertEquals;


import org.junit.Test;

import po.AddFeaturesPage;
import po.PrestaLogin;

public class AddEmptyFeature extends BaseTest {

                 @Test()
                 public void test_add_empty_feature(){
                         AddFeaturesPage feature = new PrestaLogin(driver)
                                        .loginToPresta(adminMail, adminPsw)
                                        .goToFeatures()
                                        .clickAddFeature()
                                        .submitError();
                         assertEquals("×\n"
                                        + "The field name is required at least in English (English).", feature.getAlertMessage());
                 }
        }
