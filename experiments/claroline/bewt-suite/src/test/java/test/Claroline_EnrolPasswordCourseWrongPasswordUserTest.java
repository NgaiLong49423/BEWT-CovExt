package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AuthCoursesPage;
import po.IndexPage;

public class Claroline_EnrolPasswordCourseWrongPasswordUserTest extends BaseTest {
	
	@Test
	public void enrolPasswordCourseWrongPassword() throws InterruptedException{
		AuthCoursesPage acp = new IndexPage(driver)
				.login("user001", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
				.enrolToCourse()
				.searchCourse("Course002")
				.enrolPassword(requiredDifferentCredential("CLAROLINE_TEST_COURSE_PASSWORD", "CLAROLINE_TEST_INVALID_COURSE_PASSWORD"));
		
		assertEquals("Invalid enrolment key given", acp.getMessage());
		acp.doLogout();
	}
}
