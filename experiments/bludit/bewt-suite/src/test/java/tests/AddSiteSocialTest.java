package tests;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminLogin;
import po.GeneralSettingsPage;

public class AddSiteSocialTest extends BaseTest {
	
	@Test
	public void addSiteSocial() {
		GeneralSettingsPage socials = new AdminLogin(driver)
			.setUsername(username)
			.setPassword(password)
			.login()
			.generalSettings()
			.setInstagram("https://instagram.com/bludit595159516")
			.save();
		
		assertEquals("https://instagram.com/bludit595159516", socials.getInstagram());
	}
	
}
