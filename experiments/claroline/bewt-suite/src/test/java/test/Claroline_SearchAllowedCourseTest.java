package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminCoursesPage;
import po.IndexPage;

public class Claroline_SearchAllowedCourseTest extends BaseTest {
	
	@Test
	public void searchAllowedCourse() throws InterruptedException{
		
		AdminCoursesPage acp = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.advancedCourseSearch()
				.searchAllowed("Course001");
		assertEquals("Course001",acp.getCourseName());
		acp.doLogout();
		
	}
}
