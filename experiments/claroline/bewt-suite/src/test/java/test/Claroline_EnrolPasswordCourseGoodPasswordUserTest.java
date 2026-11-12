package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AuthCoursesPage;
import po.IndexPage;

public class Claroline_EnrolPasswordCourseGoodPasswordUserTest extends BaseTest {
	
	@Test
	public void enrolPasswordCourseGoodPassword() throws InterruptedException{
		AuthCoursesPage acp = new IndexPage(driver)
				.login("user001", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
				.enrolToCourse()
				.searchCourse("Course002")
				.enrolPassword(requiredRuntimeCredential("CLAROLINE_TEST_COURSE_PASSWORD"));
		
		assertEquals("You've been enrolled on the course", acp.getMessage());
		acp.doLogout();
	}
}
