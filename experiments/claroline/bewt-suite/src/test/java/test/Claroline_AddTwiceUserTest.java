package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminAddNewUserPage;
import po.IndexPage;

public class Claroline_AddTwiceUserTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{
		AdminAddNewUserPage aanup = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.addUser()
				.addNewStudent("Name001", "Firstname001", "user001", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"), requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"));
		
		assertEquals("This username is already taken",aanup.getMessage());
		aanup.doLogout();
	}
}
