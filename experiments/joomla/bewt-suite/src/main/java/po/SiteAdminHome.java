package po;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SiteAdminHome extends PageObject {


        @FindBy(xpath = "/html/body/div[2]/section/div/div/div[2]/div[1]/div/div/div/ul[3]/li[1]/a")
        protected WebElement usersLink;

        @FindBy(linkText = "Articles")
        protected WebElement articles;

        @FindBy(linkText = "Categories")
        protected WebElement categories;

        @FindBy(linkText = "Menu(s)")
        protected WebElement menus;

        @FindBy(xpath = "//*[@id=\"content\"]/div/div/div[2]/div[1]/div/div/div/ul[3]/li[1]/a")
        protected WebElement sideUsers;

        @FindBy(xpath = "//*[@id=\"menu12\"]/li[2]/a")
        protected WebElement sideContent;

        public SiteAdminHome(WebDriver driver) {
                super(driver);
        }

        public ManageUsersPage users() {
                usersLink.click();
                return new ManageUsersPage(driver);
        }

        public ManageArticlesPage articles() {
                articles.click();
                return new ManageArticlesPage(driver);
        }

        public ManageCategoriesPage categories() {
                categories.click();
                return new ManageCategoriesPage(driver);
        }

        public MenuPage menus() {
                menus.click();
                return new MenuPage(driver);
        }

        public UsersSidebar sideUsers() {
                sideUsers.click();
                return new UsersSidebar(driver);
        }

        public ContentSidebar sideContent() {
                sideContent.click();
                return new ContentSidebar(driver);
        }



}
