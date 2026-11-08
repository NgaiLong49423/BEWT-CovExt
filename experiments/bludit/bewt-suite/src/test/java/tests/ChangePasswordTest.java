package tests;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminLogin;
import po.UsersPage;

public class ChangePasswordTest extends BaseTest {
	
	@Test
	public void changePassword() {
		UsersPage users = new AdminLogin(driver)
			.setUsername(username)
			.setPassword(password)
			.login()
			.users()
			.editSecondUser()
			.changePassword()
			.setPassword("newpassword")
			.confirmPassword("newpassword")
			.save();
		
		assertEquals("The changes have been saved", users.getAlert());
	}
	
}
