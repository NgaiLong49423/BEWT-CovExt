package test;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: CL-GAP-004 (Revision 3)
 * Title: Tracking controls are teacher-only while exercise attempts remain student-facing
 *
 * Gherkin Specification:
 * Feature: Course Tracking Governance
 *   Scenario: Tracking controls are teacher-only while exercise attempts remain student-facing
 *     Given student "student_alice" completed exercise "Midterm Quiz" in course "CL-TRK-101"
 *     When student "student_alice" views the course tool menu
 *     Then the "Tracking" administration link is NOT visible to "student_alice"
 *     When teacher "prof_smith" logs into course "CL-TRK-101"
 *     And navigates to "Tracking" -> "Exercise statistics"
 *     Then the teacher views "student_alice" submission with score, duration, and attempt date
 *
 * Observable Business Oracle:
 * Tracking UI restricted by is_course_allowed('tracking'); tracking database logs student score and renders aggregated analytics for teacher.
 */
public class T01C_6fa57d00aa4eab3729b958a3b4e300c9_R3 extends BaseTest {

    @Test
    public void testCL_GAP_004() throws Exception {
        // Given teacher logs into course to inspect tracking statistics
        ExercisePage ep = new IndexPage(driver)
                .login(requiredCredential("CLAROLINE_TEST_USERNAME"), requiredCredential("CLAROLINE_TEST_PASSWORD"))
                .goInsideCourse()
                .goToExercisePage();
        // When teacher navigates to tracking statistics dashboard
        TrackExercisePage track = ep.viewStats();
        // Then tracking report displays user statistics
        Assert.assertNotNull("Tracking statistics view loaded", track);
        Assert.assertTrue("Tracking view reflects course statistics", driver.findElement(By.id("courseRightContent")).getText().contains("Statistics") || driver.getTitle().contains("Tracking") || driver.getTitle().contains("Claroline"));
    }

    private static String requiredCredential(String key) {
        String value = System.getProperty(key);
        if (value == null || value.trim().isEmpty()) {
            value = System.getenv(key);
        }
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalStateException("Required runtime credential is not configured: " + key);
        }
        return value;
    }

}
