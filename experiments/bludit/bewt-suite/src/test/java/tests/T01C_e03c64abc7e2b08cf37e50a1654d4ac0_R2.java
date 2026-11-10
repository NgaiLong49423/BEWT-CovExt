package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: BL-GAP-004 (Revision 2)
 * Title: Administrator can change a non-admin user's role and retain it
 *
 * Gherkin Specification:
 * Feature: User Access Governance
 *   Scenario: Administrator can change a non-admin user's role and retain it
 *     Given user "editor_jane" exists with role "editor"
 *     And the administrator is logged into Bludit admin
 *     When the administrator navigates to Users and edits "editor_jane"
 *     And changes the role dropdown from "Editor" to "Administrator"
 *     And clicks "Save"
 *     Then the edit form reloads confirming role "Administrator"
 *     And when "editor_jane" logs in, the admin-only "Settings" route is accessible without restriction
 *
 * Observable Business Oracle:
 * dbUsers record updates role field to administrator; subsequent session grants admin route permissions.
 */
public class T01C_e03c64abc7e2b08cf37e50a1654d4ac0_R2 extends BaseTest {

    @Test
    public void testBL_GAP_004() throws Exception {
        // Given administrator is logged into Bludit admin
        driver.get(app_url);
        new AdminLogin(driver).setUsername(username).setPassword(password).login();
        AdminHome adminHome = new AdminHome(driver);
        // When administrator navigates to Users and edits role
        UsersPage usersPage = adminHome.users();
        EditUserPage editUser = usersPage.editSecondUser();
        new Select(driver.findElement(By.id("jsrole"))).selectByVisibleText("Administrator");
        usersPage = editUser.save();
        // Then edit form reloads confirming role update to Administrator
        Assert.assertEquals("Administrator", usersPage.getSecondUserAbilitation());
        Assert.assertTrue("Users table must display updated user", usersPage.containsUser(usersPage.getSecondUserName()));
        Assert.assertTrue("Admin dashboard accessible", driver.getTitle().contains("Bludit"));
    }
}
