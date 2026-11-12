package test;

import static org.junit.Assert.assertTrue;

import org.junit.Test;

import po.IndexPage;
import po.UserPage;

public class Claroline_EnrolMultipleUsersTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{

		UserPage up = new IndexPage(driver)
				.login("testuser1", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
				.enrolToCourse()
				.searchCourse("Course001")
				.enrol()
				.doLogoutAndGoHome(driver)
				.login("testuser2", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
				.enrolToCourse()
				.searchCourse("Course001")
				.enrol()
				.doLogoutAndGoHome(driver)
				.login("testuser3", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
				.enrolToCourse()
				.searchCourse("Course001")
				.enrol()
				.doLogoutAndGoHome(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goInsideCourse()
				.goToUsersPage();
		
		assertTrue(up.getBodyText(driver).contains("testuser1"));
		assertTrue(up.getBodyText(driver).contains("testuser2"));
		assertTrue(up.getBodyText(driver).contains("testuser3"));
		up.doLogout();
		
	}
}
