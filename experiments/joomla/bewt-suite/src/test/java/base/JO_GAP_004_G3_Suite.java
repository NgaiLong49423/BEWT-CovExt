package base;

import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import org.junit.BeforeClass;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import po.BaseNavBar;
import po.EditProfilePage;
import po.LoggedHome;
import po.ManageArticlesPage;
import po.SiteAdminHome;

/**
 * Creates and verifies the exact JO-GAP-004 precondition through Joomla's UI,
 * then runs the immutable R3 candidate in the same disposable application run.
 */
@RunWith(Suite.class)
@Suite.SuiteClasses({ T01C_ae6c8ee75a51838ce2ddfa2df16cb9ed_R3.class })
public class JO_GAP_004_G3_Suite {
    private static final String ARTICLE_TITLE = "Living Document";
    private static final String INITIAL_BODY = "Initial fixture text for version history.";

    @BeforeClass
    public static void prepareFixture() throws Exception {
        String evidencePath = required("BEWT_FIXTURE_EVIDENCE_PATH");
        String runId = required("BEWT_G3_RUN_ID");
        WebDriver driver = null;
        String frontendWindow = null;
        String adminWindow = null;
        boolean fixtureCreated = false;
        boolean fixtureVerified = false;
        String outcome = "FAIL";
        String reason = "FIXTURE_SETUP_EXCEPTION";
        String saveHistorySetting = "NOT_READ_UI";
        String cleanupOutcome = "NOT_REQUIRED";
        String optionsRoutePath = "NOT_VISITED";
        String optionsPageTitle = "NOT_VISITED";
        String optionsContext = "NOT_VISITED";
        boolean optionsFormVisible = false;
        int saveHistoryRadioCount = 0;
        int versionCounter = 0;
        int initialHistoryRows = 0;

        try {
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--no-sandbox", "--headless=new", "--disable-gpu", "--screen-info={1920x1080}", "--lang=en");
            try {
                driver = new RemoteWebDriver(new URL(ExperimentConfig.webdriverUrl()), options);
            } catch (MalformedURLException e) {
                throw new IllegalArgumentException("BEWT_WEBDRIVER_URL must be a valid URL", e);
            }
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(30));
            driver.manage().window().maximize();
            driver.get(ExperimentConfig.appUrl());

            frontendWindow = driver.getWindowHandle();
            EditProfilePage loggedIn = new BaseNavBar(driver).authorLogin()
                    .setUsername(ExperimentConfig.adminUsername())
                    .setPassword(ExperimentConfig.adminPassword())
                    .login();
            SiteAdminHome adminHome = loggedIn.siteAdmin()
                    .setUsername(ExperimentConfig.adminUsername())
                    .setPassword(ExperimentConfig.adminPassword())
                    .login();
            adminWindow = driver.getWindowHandle();
            ManageArticlesPage articles = adminHome.articles();
            List<WebElement> existing = articleTitleLinks(driver);
            if (!existing.isEmpty()) {
                outcome = "BLOCKED";
                reason = "FIXTURE_TITLE_ALREADY_EXISTS";
                throw new IllegalStateException("Refusing to modify an existing article fixture title");
            }

            driver.switchTo().window(frontendWindow);
            LoggedHome home = loggedIn.createPost()
                    .setTitle(ARTICLE_TITLE)
                    .setBody(INITIAL_BODY)
                    .save();
            if (home == null) {
                driver.switchTo().window(adminWindow);
                driver.get(ExperimentConfig.appUrl() + "administrator/index.php?option=com_content&view=articles");
                fixtureCreated = !articleTitleLinks(driver).isEmpty();
                outcome = "BLOCKED";
                reason = "ARTICLE_SAVE_DID_NOT_RETURN_HOME";
                throw new IllegalStateException("Joomla article setup did not return to the home page");
            }
            fixtureCreated = true;

            driver.switchTo().window(adminWindow);
            driver.get(ExperimentConfig.appUrl() + "administrator/index.php?option=com_content&view=articles");
            List<WebElement> created = waitForArticleTitle(driver);
            if (created.size() != 1) {
                outcome = "FAIL";
                reason = "EXPECTED_ONE_EXACT_TITLE_MATCH";
                throw new IllegalStateException("Fixture setup requires exactly one exact-title article");
            }
            created.get(0).click();
            String version = driver.findElement(By.id("jform_version")).getAttribute("value");
            versionCounter = "1".equals(version) ? 1 : 0;
            if (!"1".equals(version)) {
                outcome = "BLOCKED";
                reason = "FIXTURE_VERSION_NOT_ONE";
                throw new IllegalStateException("Fixture setup requires article version counter 1");
            }

            List<WebElement> versionsButtons = driver.findElements(By.cssSelector("a.modal_jform_contenthistory"));
            if (versionsButtons.size() != 1 || !versionsButtons.get(0).isDisplayed()) {
                outcome = "BLOCKED";
                reason = "VERSION_HISTORY_CONTROL_UNAVAILABLE";
                throw new IllegalStateException("Fixture setup requires Joomla version history to be enabled");
            }
            versionsButtons.get(0).click();
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.frameToBeAvailableAndSwitchToIt(By.id("sbox-content")));
            List<WebElement> historyRows = driver.findElements(By.cssSelector("#adminForm tbody tr"));
            initialHistoryRows = historyRows.size();
            if (historyRows.size() != 1) {
                outcome = "BLOCKED";
                reason = "EXPECTED_ONE_INITIAL_HISTORY_ROW";
                throw new IllegalStateException("Fixture setup requires one initial history snapshot");
            }

            fixtureVerified = true;
            outcome = "PASS";
            reason = "EXACT_TITLE_VERSION_AND_HISTORY_VERIFIED";
            System.out.println("JO-GAP-004 fixture setup PASS: exact title, version 1, and one initial history row verified.");
        } catch (Exception | AssertionError e) {
            if (fixtureCreated && !fixtureVerified) {
                cleanupOutcome = cleanupCreatedFixture(driver, adminWindow);
            }
            writeEvidence(evidencePath, runId, outcome, reason, versionCounter, initialHistoryRows,
                    fixtureCreated, saveHistorySetting, cleanupOutcome, optionsRoutePath, optionsPageTitle,
                    optionsContext, optionsFormVisible, saveHistoryRadioCount);
            throw e;
        } finally {
            if (driver != null) {
                driver.quit();
            }
        }
        writeEvidence(evidencePath, runId, outcome, reason, versionCounter, initialHistoryRows,
                fixtureCreated, saveHistorySetting, cleanupOutcome, optionsRoutePath, optionsPageTitle,
                optionsContext, optionsFormVisible, saveHistoryRadioCount);
    }

    private static List<WebElement> articleTitleLinks(WebDriver driver) {
        return driver.findElements(By.cssSelector("#articleList a")).stream()
                .filter(link -> ARTICLE_TITLE.equals(link.getText().trim()))
                .toList();
    }

    private static List<WebElement> waitForArticleTitle(WebDriver driver) {
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(currentDriver -> !articleTitleLinks(currentDriver).isEmpty());
        return articleTitleLinks(driver);
    }

    private static String cleanupCreatedFixture(WebDriver driver, String adminWindow) {
        if (driver == null || adminWindow == null) return "FAILED_ADMIN_SESSION_UNAVAILABLE";
        try {
            driver.switchTo().defaultContent();
            driver.switchTo().window(adminWindow);
            driver.get(ExperimentConfig.appUrl() + "administrator/index.php?option=com_content&view=articles");
            List<WebElement> matching = articleTitleLinks(driver);
            if (matching.isEmpty()) return "PASS_EXACT_ARTICLE_ABSENT";
            if (matching.size() != 1) return "FAILED_EXACT_TITLE_MATCH_COUNT_" + matching.size();

            matching.get(0).click();
            List<WebElement> versionsButtons = driver.findElements(By.cssSelector("a.modal_jform_contenthistory"));
            if (versionsButtons.size() == 1) {
                versionsButtons.get(0).click();
                new WebDriverWait(driver, Duration.ofSeconds(10))
                        .until(ExpectedConditions.frameToBeAvailableAndSwitchToIt(By.id("sbox-content")));
                List<WebElement> rows = driver.findElements(By.cssSelector("#adminForm tbody tr"));
                for (WebElement row : rows) {
                    WebElement revision = row.findElement(By.cssSelector("input[name='cid[]']"));
                    if (!revision.isSelected()) revision.click();
                }
                if (!rows.isEmpty()) {
                    driver.findElement(By.xpath("//button[contains(@onclick, 'history.delete')]")).click();
                    new WebDriverWait(driver, Duration.ofSeconds(10)).until(
                            currentDriver -> currentDriver.findElements(By.cssSelector("#adminForm tbody tr")).isEmpty());
                }
                driver.switchTo().defaultContent();
            }

            driver.get(ExperimentConfig.appUrl() + "administrator/index.php?option=com_content&view=articles");
            matching = articleTitleLinks(driver);
            if (matching.size() != 1) return "FAILED_ARTICLE_MATCH_BEFORE_TRASH_" + matching.size();
            WebElement row = matching.get(0).findElement(By.xpath("./ancestor::tr[1]"));
            row.findElement(By.cssSelector("td:nth-child(3) div button")).click();
            row.findElement(By.cssSelector("td:nth-child(3) div ul li:nth-child(2) a")).click();
            new WebDriverWait(driver, Duration.ofSeconds(10)).until(
                    currentDriver -> articleTitleLinks(currentDriver).isEmpty());
            return "PASS_HISTORY_AND_EXACT_ARTICLE_REMOVED";
        } catch (RuntimeException e) {
            return "FAILED_CLEANUP_" + e.getClass().getSimpleName();
        }
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Required runtime environment variable is missing: " + name);
        }
        return value;
    }

    private static void writeEvidence(String evidencePath, String runId, String outcome, String reason,
            int version, int historyRows, boolean fixtureCreated, String saveHistorySetting,
            String cleanupOutcome, String optionsRoutePath, String optionsPageTitle,
            String optionsContext, boolean optionsFormVisible, int saveHistoryRadioCount) throws Exception {
        Path path = Path.of(evidencePath);
        Files.createDirectories(path.getParent());
        String json = "{\n"
                + "  \"candidateId\": \"JO-GAP-004\",\n"
                + "  \"runId\": \"" + runId + "\",\n"
                + "  \"fixtureTitle\": \"" + ARTICLE_TITLE + "\",\n"
                + "  \"outcome\": \"" + outcome + "\",\n"
                + "  \"reason\": \"" + reason + "\",\n"
                + "  \"versionCounter\": " + version + ",\n"
                + "  \"initialHistoryRows\": " + historyRows + ",\n"
                + "  \"saveHistorySettingValue\": \"" + saveHistorySetting + "\",\n"
                + "  \"fixtureCreatedThroughJoomlaUi\": " + fixtureCreated + ",\n"
                + "  \"fixtureCleanupOutcome\": \"" + cleanupOutcome + "\",\n"
                + "  \"optionsRoutePath\": \"" + optionsRoutePath + "\",\n"
                + "  \"optionsPageTitle\": \"" + optionsPageTitle + "\",\n"
                + "  \"optionsContext\": \"" + optionsContext + "\",\n"
                + "  \"optionsFormVisible\": " + optionsFormVisible + ",\n"
                + "  \"saveHistoryRadioCount\": " + saveHistoryRadioCount + ",\n"
                + "  \"candidateJavaSha256\": \"" + required("BEWT_CANDIDATE_JAVA_SHA256") + "\",\n"
                + "  \"fixtureSetupSha256\": \"" + required("BEWT_FIXTURE_SETUP_SHA256") + "\"\n"
                + "}\n";
        Files.writeString(path, json);
    }
}
