package tests;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminLogin;
import po.NewContentPage;

public class AssignCategoryTest extends BaseTest {
	
	@Test
	public void assignCategory() {
		NewContentPage content = new AdminLogin(driver)
			.setUsername(username)
			.setPassword(password)
			.login()
			.content()
			.editContent("Create your own content")
			.general()
			.setCategory("Category001")
			.saveAndReturnToContentPage()
			.content()
			.editContent("Create your own content")
			.general();
		
		assertEquals("Category001", content.getSelectedCategory());
	}
}