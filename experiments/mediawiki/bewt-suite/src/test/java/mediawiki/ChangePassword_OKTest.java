package mediawiki;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.ChangeCredentialsPage;

public class ChangePassword_OKTest extends BaseTest {

        @Test
        public void changePassword_OK() {
                ChangeCredentialsPage psw = loginAsUser()
                        .specialPages()
                        .changeCredentials()
                        .clickUsername()
                        .setPassword(ExperimentConfig.alternatePassword())
                        .confirmPassword(ExperimentConfig.alternatePassword())
                        .change();

                assertEquals("Your credentials have been changed.", psw.getSuccessMessage());

        }

}
