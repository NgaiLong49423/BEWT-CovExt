package tests;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import po.AdminLogin;
import po.ContentPage;

public class SetStickyPostTest extends BaseTest {
	
	@Test
	public void setStickyPost() {
		ContentPage content = new AdminLogin(driver)
			.setUsername(username)
			.setPassword(password)
			.login()
			.content()
			.editContent("Set up your new site")
			.advanced()
			.setPostType("Sticky")
			.saveAndReturnToContentPage()
			.content();
		
		assertEquals("Set up your new site", content.getFirstStickyTitle());
	}
	
}
