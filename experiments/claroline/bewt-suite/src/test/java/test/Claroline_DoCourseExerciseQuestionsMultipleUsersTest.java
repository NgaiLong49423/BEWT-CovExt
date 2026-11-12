package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.IndexPage;
import po.TrackExercisePage;

public class Claroline_DoCourseExerciseQuestionsMultipleUsersTest extends BaseTest {
	
	@Test
	public void runTest() throws InterruptedException{
		TrackExercisePage tep = new IndexPage(driver)
			.login("testuser1", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
			.goInsideCourse()
			.goToExercisePage()
			.goInsideExercise()
			.doExerciseN(2, 2, 3)
			.doLogoutAndGoHome(driver)
			.login("testuser2", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
			.goInsideCourse()
			.goToExercisePage()
			.goInsideExercise()
			.doExerciseN(1, 2, 3)
			.doLogoutAndGoHome(driver)
			.login("testuser3", requiredRuntimeCredential("CLAROLINE_TEST_FIXTURE_USER_PASSWORD"))
			.goInsideCourse()
			.goToExercisePage()
			.goInsideExercise()
			.doExerciseN(1, 1, 2)
			.doLogoutAndGoHome(driver)
			.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
			.goInsideCourse()
			.goToExercisePage()
			.viewStats();

		assertEquals("testuser1 testuser1", tep.getUserName(1));
		assertEquals("-3", tep.getUserResult(1));
		assertEquals("testuser2 testuser2", tep.getUserName(2));
		assertEquals("0", tep.getUserResult(2));
		assertEquals("testuser3 testuser3", tep.getUserName(3));
		assertEquals("6", tep.getUserResult(3));
		
	}
}
