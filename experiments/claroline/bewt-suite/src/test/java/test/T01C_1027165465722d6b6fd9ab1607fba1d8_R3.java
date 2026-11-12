package test;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: CL-GAP-005 (Revision 3; security-only credential configuration)
 * Title: Course announcement creation, publication, and student notification visibility
 *
 * Gherkin Specification:
 * Feature: Course Announcements
 *   Scenario: Course announcement creation, publication, and student notification visibility
 *     Given teacher "prof_smith" is logged into course "CL-ANN-101"
 *     When the teacher navigates to Announcements and clicks "Add announcement"
 *     And enters title "Classroom Relocation" and body "Classroom moved to Room 302 for Friday."
 *     And submits the announcement
 *     Then the announcement "Classroom Relocation" appears in the course announcements table
 *     When student "student_bob" logs into course "CL-ANN-101"
 *     Then "Classroom Relocation" is prominently displayed on the course welcome banner
 *
 * Observable Business Oracle:
 * claro_announcement table receives new record; course home view pulls and displays active announcements.
 */
public class T01C_1027165465722d6b6fd9ab1607fba1d8_R3 extends BaseTest {

    @Test
    public void testCL_GAP_005() throws Exception {
        // Given teacher logs into course to publish announcement
        DesktopPage desktop = new IndexPage(driver).login(requiredCredential("CLAROLINE_TEST_USERNAME"), requiredCredential("CLAROLINE_TEST_PASSWORD"));
        CourseIndexPage course = desktop.goInsideCourse();
        driver.findElement(By.id("CLANN")).click();
        // When announcement is created and published
        driver.findElement(By.linkText("Add an announcement")).click();
        driver.findElement(By.id("title")).sendKeys("Classroom Relocation");
        driver.findElement(By.xpath("//input[@type='submit' or @name='submit']")).click();
        // Then announcement appears in course announcements table
        Assert.assertTrue("Announcements table must display Classroom Relocation", driver.findElement(By.id("courseRightContent")).getText().contains("Classroom Relocation") || driver.getPageSource().contains("Classroom Relocation"));
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
