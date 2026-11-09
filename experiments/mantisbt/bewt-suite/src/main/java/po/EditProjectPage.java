package po;

import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.Select;

import utils.Strings;

public class EditProjectPage extends CreateProjectPage {

        @FindBy(xpath = "/html/body/div[6]/a[1]/table/tbody/tr[4]/td/form/input[3]")
        protected WebElement categoryInput;

        @FindBy(xpath = "/html/body/div[6]/a[1]/table/tbody/tr[5]/td/form/input[3]")
        protected WebElement existingCategoryInput;

        @FindBy(xpath = "/html/body/div[6]/a[1]/table/tbody/tr[4]/td/form/input[4]")
        protected WebElement addCategoryBtn;

        @FindBy(xpath = "/html/body/div[6]/a[1]/table/tbody/tr[5]/td/form/input[4]")
        protected WebElement addExistingCategoryBtn;

        @FindBy(xpath = "/html/body/div[6]/a[1]/table/tbody/tr[3]/td[1]")
        protected WebElement projectCategory;

        @FindBy(name = "status")
        protected WebElement projectStatus;

        @FindBy(name = "view_state")
        protected WebElement viewState;

        @FindBy(id = "project-description")
        protected WebElement projectDescription;

        @FindBy(xpath = "/html/body/div[3]/form/table/tbody/tr[9]/td[2]/input")
        protected WebElement updateProjectBtn;

        @FindBy(xpath = "/html/body/div[6]/a[1]/table/tbody/tr[3]/td[3]/form[1]/input[2]")
        protected WebElement editCategoryBtn;

        @FindBy(xpath = "/html/body/div[4]/form/input[3]")
        protected WebElement deleteProjectBtn;

        @FindBy(xpath = "/html/body/div[6]/a[1]/table/tbody/tr[3]/td[3]/form[2]/input[2]")
        protected WebElement deleteCategoryBtn;

        @FindBy(xpath = "/html/body/div[5]/table/tbody/tr[1]/td/form/input[2]")
        protected WebElement createSubprojectBtn;

        @FindBy(xpath = "/html/body/div[5]/table/tbody/tr[3]/td[7]/span[2]/a")
        protected WebElement unlinkFirstSubproject;

        @FindBy(xpath = "/html/body/div[5]/table/tbody/tr[3]/td/form/input[3]")
        protected WebElement linkSubprojectBtn;

        @FindBy(xpath = "/html/body/div[5]/table/tbody/tr[5]/td/form/input[3]")
        protected WebElement linkSecondSubprojectBtn;

        public EditProjectPage(WebDriver driver) {
                super(driver);
        }

        public EditProjectPage enterCategory(String category) {
                categoryInput.clear();
                categoryInput.sendKeys(category);
                return this;
        }

        public EditProjectPage enterExistingCategory(String category) {
                existingCategoryInput.clear();
                existingCategoryInput.sendKeys(category);
                return this;
        }

        public EditProjectPage addCategory() {
                addCategoryBtn.click();
                return this;
        }

        public EditProjectPage addExistingCategory() {
                addExistingCategoryBtn.click();
                return this;
        }

        public String getProjectCategory() {
                try {
                        Thread.sleep(500);
                } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                }
                return projectCategory.getText();
        }

        public EditProjectPage setProjectStatus(String status) {
                new Select(projectStatus).selectByVisibleText(status);
                return this;
        }

        public EditProjectPage setDescription(String descr) {
                description.clear();
                description.sendKeys(descr);
                return this;
        }

        public ManageProjectPage updateProject() {
                updateProjectBtn.click();
                return new ManageProjectPage(driver);
        }

        public EditCategoryPage editCategory() {
                editCategoryBtn.click();
                return new EditCategoryPage(driver);
        }

        public DeleteProjectConfirmPage deleteProject() {
                deleteProjectBtn.click();
                return new DeleteProjectConfirmPage(driver);
        }

        public String getError() {
                return driver.findElement(By.xpath("/html/body/div[2]/table/tbody/tr[2]/td/p")).getText();
        }

        public EditProjectPage setViewState(String state) {
                new Select(viewState).selectByVisibleText(state);
                return this;
        }

        public EditProjectPage deleteCategory() {
                deleteCategoryBtn.click();
                return new EditProjectPage(driver);
        }

        public EditProjectPage confirmDeleteCategory() {
                try {
                        Thread.sleep(1000);
                } catch (InterruptedException e) {
                        e.printStackTrace();
                }
                driver.findElement(By.xpath("/html/body/div[2]/form/input[5]")).click();
                driver.findElement(By.linkText(Strings.contin)).click();
                return new EditProjectPage(driver);
        }

        public boolean containsCategory(String category) {
                return driver.findElement(By.name("categories")).getText().contains(category);
        }

        public CreateSubprojectPage createSubproject() {
                createSubprojectBtn.click();
                return new CreateSubprojectPage(driver);
        }

        public EditProjectPage unlinkSubproject() {
                unlinkFirstSubproject.click();
                driver.findElement(By.linkText(Strings.contin)).click();
                return new EditProjectPage(driver);
        }

        public boolean isSubprojectPresent(String project) {
                try {
                        return driver.findElement(By.xpath("/html/body/div[5]/table/tbody/tr[3]/td[1]/a")).getText().contains(project);
                } catch(NoSuchElementException e) {
                        return false;
                }
        }

        public boolean isSecondSubprojectPresent(String project) {
                try {
                        return driver.findElement(By.xpath("/html/body/div[5]/table/tbody/tr[4]/td[1]/a")).getText().contains(project);
                } catch(NoSuchElementException e) {
                        return false;
                }
        }

        public EditProjectPage selectSubproject(String project) {
                new Select(driver.findElement(By.name("subproject_id"))).selectByVisibleText(project);
                return this;
        }

        public EditProjectPage linkSubproject() {
                linkSubprojectBtn.click();
                driver.findElement(By.linkText(Strings.contin)).click();
                return new EditProjectPage(driver);
        }

        public EditProjectPage linkSecondSubproject() {
                linkSecondSubprojectBtn.click();
                driver.findElement(By.linkText(Strings.contin)).click();
                return new EditProjectPage(driver);
        }





}
