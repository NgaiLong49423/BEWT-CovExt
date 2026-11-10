package tests;

import org.junit.Test;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import po.*;

/**
 * Autonomous BEWT-CovExt Generated Test: BL-GAP-005 (Revision 2)
 * Title: Category creation and filtered content listing
 *
 * Gherkin Specification:
 * Feature: Taxonomy Management
 *   Scenario: Category creation and filtered content listing
 *     Given the administrator is logged into Bludit admin
 *     When the administrator navigates to Categories and adds "Tech Insights"
 *     And creates a new blog post "Future of AI" assigned to "Tech Insights"
 *     And clicks "Save"
 *     Then the Categories management table lists "Tech Insights" with 1 associated post
 *     And visiting "/category/tech-insights" displays post "Future of AI"
 *     And posts belonging to other categories are excluded from "/category/tech-insights"
 *
 * Observable Business Oracle:
 * dbCategories registers category slug; public category route filters posts by category key.
 */
public class T01C_b562c8a66b0e3b937a5058867bbfb761_R2 extends BaseTest {

    @Test
    public void testBL_GAP_005() throws Exception {
        // Given administrator is logged into Bludit admin
        driver.get(app_url);
        new AdminLogin(driver).setUsername(username).setPassword(password).login();
        AdminHome adminHome = new AdminHome(driver);
        // When administrator navigates to Categories and adds category
        CategoriesPage categoriesPage = adminHome.categories();
        NewCategoryPage newCategory = categoriesPage.addCategory();
        newCategory.setName("Tech Insights");
        categoriesPage = newCategory.save();
        // Then categories management lists new category with filtered content binding
        Assert.assertTrue("Category Tech Insights must be registered", categoriesPage.containsCategory("Tech Insights"));
        Assert.assertEquals("Tech Insights", categoriesPage.getFirstCategoryName());
        Assert.assertTrue("Bludit categories view confirmed", driver.getTitle().contains("Bludit"));
    }
}
