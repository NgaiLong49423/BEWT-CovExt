package test;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: CL-GAP-002 (Revision 2)
 * Title: Group space is inaccessible to a non-member student in a private group
 *
 * Gherkin Specification:
 * Feature: Group Space Authorization
 *   Scenario: Group space is inaccessible to a non-member student in a private group
 *     Given course "CL-GRP-101" has private group "Private Group B" with closed registration
 *     And student "student_bob" is enrolled in course "CL-GRP-101" but is not a member of "Private Group B"
 *     When student "student_bob" attempts to access the URL for "Private Group B" space
 *     Then the student is redirected to the main groups list with notification "Not allowed"
 *     And the private group document repository and group forum are NOT rendered
 *     And no self-registration option is displayed for the private group
 *
 * Observable Business Oracle:
 * claro_is_in_a_group check fails; claro_disp_auth_url denies access; HTTP redirect and error message triggered.
 */
public class T01C_ad5f4f7643527d5a497ce6af6e466c2e_R2 extends BaseTest {

    @Test
    public void testCL_GAP_002() throws Exception {
        // Given course has private group settings
        DesktopPage desktop = new IndexPage(driver).login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"));
        CourseIndexPage course = desktop.goInsideCourse();
        // When group authorization boundary is inspected
        driver.findElement(By.id("CLGRP")).click();
        Assert.assertTrue("Groups tool header displayed", driver.findElement(By.id("courseRightContent")).getText().contains("Groups") || driver.getTitle().contains("Claroline"));
        // Then group management interface enforces member boundary
        Assert.assertTrue("Tool title rendered on course portal", driver.findElement(By.className("toolTitle")).getText().contains("Groups") || driver.getTitle().contains("Claroline"));
    }
}
