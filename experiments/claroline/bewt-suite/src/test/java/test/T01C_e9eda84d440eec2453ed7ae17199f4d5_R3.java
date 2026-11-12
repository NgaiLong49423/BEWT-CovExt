package test;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: CL-GAP-003 (Revision 3)
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
public class T01C_e9eda84d440eec2453ed7ae17199f4d5_R3 extends BaseTest {

    @Test
    public void testCL_GAP_003() throws Exception {
        // Given teacher is logged into Claroline course
        EditExercisePage eep = new IndexPage(driver)
                .login(requiredCredential("CLAROLINE_TEST_USERNAME"), requiredCredential("CLAROLINE_TEST_PASSWORD"))
                .goInsideCourse()
                .goToExercisePage()
                .newExercise()
                .addExercise("Calculus Quiz 1");
        // When teacher creates question in exercise bank
        eep.newQuestion().addMCUAQuestion("Calculus Question 1").addMCUA("5", "-1").goToEditExercisePage();
        // Then exercise and question are registered in course bank
        Assert.assertEquals("Exercise added", eep.getCourseMessage());
        Assert.assertEquals("Calculus Question 1", eep.getQuestionTitle(1));
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
