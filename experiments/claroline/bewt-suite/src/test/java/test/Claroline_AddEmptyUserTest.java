package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminAddNewUserPage;
import po.IndexPage;

public class Claroline_AddEmptyUserTest extends BaseTest {
	
	
	@Test
	public void runTest() throws InterruptedException{
		AdminAddNewUserPage aanup = new IndexPage(driver)
			.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
			.goToAdminPage()
			.addUser()
			.addNewStudent("", "", "", "", "");
		
		assertEquals("You left some required fields empty",aanup.getMessage());
		aanup.doLogout();
	}
}
