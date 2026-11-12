package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CourseCreatePage;
import po.IndexPage;

public class Claroline_AddCourseTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{

		CourseCreatePage ccp = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.addCourse()
				.addAllowedCourse("Course001", "001", "Sciences", "Economics");
		
		assertEquals("You have just created the course website : 001", ccp.getMessage());
		ccp.goToAdminPage()
			.doLogout();
	}
}
