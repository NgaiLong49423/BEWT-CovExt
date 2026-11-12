package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminUsersPage;
import po.IndexPage;

public class Claroline_SearchUserTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{
		AdminUsersPage aup = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.searchUser("user001");
		
		assertEquals("Name001", aup.getLastName());
		assertEquals("Firstname001", aup.getFirstName());
		assertEquals("User", aup.getRole());
		aup.doLogout();
	}
}
