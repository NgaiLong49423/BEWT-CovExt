package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminAddNewUserPage;
import po.IndexPage;

public class Claroline_AddWrongPasswordUserTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{
		AdminAddNewUserPage aanup = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.addUser()
				.addNewStudent("user", "user", "user", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"), requiredDifferentCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD", "CLAROLINE_TEST_MISMATCHED_USER_PASSWORD"));
		
		assertEquals("You typed two different passwords",aanup.getMessage());
		aanup.doLogout();
	}
}
