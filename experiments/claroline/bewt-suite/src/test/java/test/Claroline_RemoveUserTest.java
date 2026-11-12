package test;

import static org.junit.Assert.assertTrue;

import org.junit.Test;

import po.AdminUsersPage;
import po.IndexPage;

public class Claroline_RemoveUserTest extends BaseTest {
	
	@Test
	public void removeUserTest() throws InterruptedException{
		AdminUsersPage aup = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.searchUser("user001")
				.removeUser();
		
		
		assertTrue(!aup.getBodyText(driver).contains("Name001"));
		assertTrue(!aup.getBodyText(driver).contains("Firstname001"));
		aup.doLogout();
	}
}
