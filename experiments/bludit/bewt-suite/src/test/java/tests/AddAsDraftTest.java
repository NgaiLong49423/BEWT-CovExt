package tests;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import po.AdminLogin;
import po.ContentPage;

public class AddAsDraftTest extends BaseTest {
	
	@Test
	public void addAsDraft() {
		ContentPage content = new AdminLogin(driver)
				.setUsername(username)
				.setPassword(password)
				.login()
				.newContent()
				.setTitle("Draft Content")
				.saveDraft();
		assertEquals("Draft Content", content.getFirstDraftTitle());
		
	}
}