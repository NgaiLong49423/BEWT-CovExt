package tests;

import java.util.UUID;


import po.AdminLoginPage;
import po.UsersPage;

import static org.junit.Assert.assertEquals;



import org.junit.Test;


public class AddUserTest extends BaseTest {

	@Test
	public void testExpressCartNewUser() throws Exception {
		String newUserPassword = UUID.randomUUID().toString();
			goToAdminHome();
			UsersPage users = new AdminLoginPage(driver)
				.setEmail(requiredEnvironment("BEWT_ADMIN_EMAIL"))
				.setPassword(requiredEnvironment("BEWT_ADMIN_PASSWORD"))
				.doLogin()
				.newUser()
				.setUsername("TestUser000")
				.setEmail("test000@test.com")
				.setPassword(newUserPassword)
				.setConfirmPassword(newUserPassword)
				.addUser()
				.users();
			Thread.sleep(2000);
			assertEquals(users.getUserText("test000@test.com"), "User: TestUser000 - (test000@test.com)\nRole: User");
			users.logout();
		
	}


}
