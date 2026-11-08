package tests;

import static org.junit.Assert.assertFalse;

import org.junit.Test;

import po.AdminLogin;
import po.ContentPage;

public class DeletePostTest extends BaseTest {
	
	@Test
	public void deletePost() {
		ContentPage content = new AdminLogin(driver)
				.setUsername(username)
				.setPassword(password)
				.login()
				.content()
				.editContent("Follow Bludit")
				.delete();
		assertFalse(content.containsElement("Follow Bludit"));
	}
	
}
