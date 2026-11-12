package test;

import static org.junit.Assert.*;


import org.junit.Test;
import po.EditExercisePage;
import po.IndexPage;


public class Claroline_AddCourseExerciseTest extends BaseTest {

	@Test
	public void runTest() throws InterruptedException{
		EditExercisePage eep = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goInsideCourse()
				.goToExercisePage()
				.newExercise()
				.addExercise("Exercise 001");
		
		assertEquals("Exercise added", eep.getCourseMessage());
		eep.doLogout();
	}
}
