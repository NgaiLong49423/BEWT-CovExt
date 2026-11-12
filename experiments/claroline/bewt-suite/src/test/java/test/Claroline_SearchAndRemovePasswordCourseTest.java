package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.AdminCoursesPage;
import po.IndexPage;

public class Claroline_SearchAndRemovePasswordCourseTest extends BaseTest {
	
	@Test
	public void searchAndRemovePasswordCourse() throws InterruptedException{
		AdminCoursesPage acp = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goToAdminPage()
				.advancedCourseSearch()
				.searchPassword("Course002");
		
		assertEquals("Course002",acp.getCourseName());
		acp.removeCourse(2);
		assertEquals("The course has been successfully deleted",acp.getMessage());
		acp.doLogout();
	}
}
