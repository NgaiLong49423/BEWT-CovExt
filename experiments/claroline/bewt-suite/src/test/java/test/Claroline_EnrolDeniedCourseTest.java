package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AuthCoursesPage;
import po.IndexPage;

public class Claroline_EnrolDeniedCourseTest extends BaseTest {
	
	@Test
	public void enrolDeniedCourse() throws InterruptedException{
		AuthCoursesPage acp = new IndexPage(driver)
				.login("user001", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
				.enrolToCourse()
				.searchCourse("Course003")
				.enrolDenied();
		
		assertEquals("This course currently does not allow new enrolments (registration: close)", acp.getErrorMsg());
		acp.doLogout();
	}
}
