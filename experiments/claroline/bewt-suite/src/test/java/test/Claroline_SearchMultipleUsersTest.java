package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminUsersPage;
import po.IndexPage;

public class Claroline_SearchMultipleUsersTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{
		AdminUsersPage aup = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.searchUser("testuser")
				.order();
		
		assertEquals("testuser1", aup.getLastNameI(0));
		assertEquals("testuser2", aup.getLastNameI(1));
		assertEquals("testuser3", aup.getLastNameI(2));
		aup.doLogout();
	}
}
