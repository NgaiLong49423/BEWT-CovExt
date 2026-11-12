package test;

import static org.junit.Assert.assertTrue;

import org.junit.Test;

import po.AdminUsersPage;
import po.IndexPage;

public class Claroline_AddMultipleUsersTest extends BaseTest {

	
	@Test
	public void runTest() throws InterruptedException {
		AdminUsersPage aup = new IndexPage(driver)
			.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
			.goToAdminPage()
			.addUser()
			.addNewStudent("testuser1", "testuser1", "testuser1", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"), requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
			.addNewUser()
			.addNewTeacher("testuser2", "testuser2", "testuser2", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"), requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
			.addNewUser()
			.addNewAdmin("testuser3", "testuser3", "testuser3", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"), requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
			.backToAdmin()
			.goToUsersList();
		
		
		assertTrue(aup.getBodyText(driver).contains("testuser1"));
		assertTrue(aup.getBodyText(driver).contains("testuser2"));
		assertTrue(aup.getBodyText(driver).contains("testuser3"));
		aup.doLogout();

	}
}
