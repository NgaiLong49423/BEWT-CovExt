package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CourseCreatePage;
import po.IndexPage;

public class Claroline_AddPasswordCourseTest extends BaseTest {
	
	@Test
	public void addPasswordCourse() throws InterruptedException{
		CourseCreatePage ccp = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.addCourse()
				.addPasswordCourse("Course002", "002", "Humanities", requiredRuntimeCredential("CLAROLINE_TEST_COURSE_PASSWORD"));
		assertEquals("You have just created the course website : 002", ccp.getMessage());
		ccp.goToAdminPage().doLogout();
	}
}
