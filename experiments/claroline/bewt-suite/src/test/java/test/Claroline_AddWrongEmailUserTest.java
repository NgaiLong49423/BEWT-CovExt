package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminAddNewUserPage;
import po.IndexPage;

public class Claroline_AddWrongEmailUserTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{
		AdminAddNewUserPage aanup = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.addUser()
				.addNewEmailStudent("user", "user", "user", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"), requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"), "email");
		
		assertEquals("The email address is not valid",aanup.getMessage());
		aanup.doLogout();
	}
}
