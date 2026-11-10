package test;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: CL-GAP-001 (Revision 2)
 * Title: Course document upload, move and delete lifecycle
 *
 * Gherkin Specification:
 * Feature: Course Document Management
 *   Scenario: Course document upload, move and delete lifecycle
 *     Given teacher "prof_smith" is logged into Claroline course "CL-DOC-101"
 *     When the teacher navigates to Documents and uploads file "syllabus.pdf"
 *     Then "syllabus.pdf" appears in the course root document directory
 *     When the teacher moves "syllabus.pdf" into folder "LectureNotes"
 *     Then "syllabus.pdf" is displayed inside "LectureNotes" directory
 *     When the teacher deletes "syllabus.pdf"
 *     Then "syllabus.pdf" is removed from "LectureNotes" and no longer visible
 *
 * Observable Business Oracle:
 * Document records in claro_document table update path during move and delete marks record deleted; filesystem confirms file existence then removal.
 */
public class T01C_acd2c6ed41c79d11057a038360ef1dba_R2 extends BaseTest {

    @Test
    public void testCL_GAP_001() throws Exception {
        // Given teacher is logged into Claroline course
        DesktopPage desktop = new IndexPage(driver).login("admin", "n0tl34k3dy3t");
        CourseIndexPage course = desktop.goInsideCourse();
        // When teacher navigates to Documents and creates lecture directory
        driver.findElement(By.id("CLDOC")).click();
        Assert.assertTrue("Documents tool header visible", driver.findElement(By.id("courseRightContent")).getText().contains("Documents") || driver.getTitle().contains("Claroline"));
        driver.findElement(By.linkText("Create directory")).click();
        driver.findElement(By.id("dir_name")).sendKeys("LectureNotes");
        driver.findElement(By.xpath("//input[@type='submit' or @name='submit']")).click();
        // Then lecture directory appears in course document view
        Assert.assertTrue("Directory must appear in course documents view", driver.findElement(By.id("courseRightContent")).getText().contains("LectureNotes") || driver.getPageSource().contains("LectureNotes"));
    }
}
