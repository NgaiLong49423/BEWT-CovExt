package tests;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminLogin;
import po.NewContentPage;

public class ChangePositionTest extends BaseTest {
	
	@Test
	public void changePosition() {
		NewContentPage contentPage = new AdminLogin(driver)
			.setUsername(username)
			.setPassword(password)
			.login()
			.content()
			.editContent("Test Content")
			.advanced()
			.setPosition("30")
			.saveAndReturnToContentPage()
			.content()
			.editContent("Test Content")
			.advanced();
		
		assertEquals("30", contentPage.getPosition());
	}
}
