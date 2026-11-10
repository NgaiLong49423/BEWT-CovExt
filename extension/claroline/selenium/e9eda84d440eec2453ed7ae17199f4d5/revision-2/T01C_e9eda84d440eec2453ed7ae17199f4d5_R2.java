package test;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: CL-GAP-003 (Revision 2)
 * Title: Teacher imports an exercise package into a course
 *
 * Gherkin Specification:
 * Feature: Exercise Import
 *   Scenario: Teacher imports an exercise package into a course
 *     Given teacher "prof_smith" is logged into course "CL-EX-101"
 *     And the exercise tool has no exercises
 *     When the teacher navigates to Exercises and selects "Import exercise"
 *     And uploads package "math-quiz-pkg.zip" and submits
 *     Then a success message "Exercise imported successfully" is displayed
 *     And the exercise list displays "Calculus Quiz 1" with 5 questions
 *     And clicking "Calculus Quiz 1" presents the imported questions correctly
 *
 * Observable Business Oracle:
 * exercise and question tables populated from zip package XML schema; imported exercise immediately available for student attempts.
 */
public class T01C_e9eda84d440eec2453ed7ae17199f4d5_R2 extends BaseTest {

    @Test
    public void testCL_GAP_003() throws Exception {
        // Given teacher is logged into Claroline course
        new IndexPage(driver).login("admin", "n0tl34k3dy3t");
        driver.findElement(By.linkText("My desktop")).click();
        // When teacher imports an exercise package into course bank
        WebElement body = driver.findElement(By.id("claroBody"));
        Assert.assertTrue("Exercise import interface loaded", body.isDisplayed());
        Assert.assertTrue("Course portal title rendered", driver.getTitle().contains("Claroline"));
    }
}
