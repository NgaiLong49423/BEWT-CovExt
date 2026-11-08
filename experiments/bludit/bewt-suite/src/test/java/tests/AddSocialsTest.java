package tests;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminLogin;
import po.EditUserPage;

public class AddSocialsTest extends BaseTest {
	
	@Test
	public void addSocials() {
		EditUserPage user = new AdminLogin(driver)
			.setUsername(username)
			.setPassword(password)
			.login()
			.users()
			.editFirstUser()
			.setFb("https://www.facebook.com/some_fake_user_name_52432562135863")
			.setIg("https://instagram.com/some_fake_user_name_52432562135863")
			.save()
			.users()
			.editFirstUser();
		
		assertEquals("https://www.facebook.com/some_fake_user_name_52432562135863", user.getFb());
		assertEquals("https://instagram.com/some_fake_user_name_52432562135863", user.getIg());
	}
}