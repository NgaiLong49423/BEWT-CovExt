package base;

import java.net.MalformedURLException;
import java.net.HttpURLConnection;
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
        boolean fixtureCreationAttempted = false;
        boolean fixtureCreated = false;
        boolean frontendArticleConfirmed = false;
        boolean adminListTextContainsTitle = false;
        int articleManagerTitleMatchCount = 0;
        boolean articleEditorOpened = false;
        boolean versionFieldRead = false;
        boolean historyRowsObserved = false;
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
        String currentStage = "DRIVER_STARTUP";
        String exceptionClass = "NONE";
        String browserReachabilityAtFailure = "NOT_PROBED";

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
            currentStage = "APPLICATION_NAVIGATION";
            driver.get(ExperimentConfig.appUrl());

            currentStage = "ADMIN_LOGIN";
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
            currentStage = "FIXTURE_TITLE_PRECHECK";
            ManageArticlesPage articles = adminHome.articles();
            List<WebElement> existing = articleTitleRows(driver);
            if (!existing.isEmpty() || articles.containsArticle(ARTICLE_TITLE)) {
                outcome = "BLOCKED";
                reason = "FIXTURE_TITLE_ALREADY_EXISTS";
                throw new IllegalStateException("Refusing to modify an existing article fixture title");
            }

            driver.switchTo().window(frontendWindow);
            currentStage = "FRONTEND_SAVE";
            fixtureCreationAttempted = true;
            LoggedHome home = loggedIn.createPost()
                    .setTitle(ARTICLE_TITLE)
                    .setBody(INITIAL_BODY)
                    .save();
            if (home != null) {
                try {
                    frontendArticleConfirmed = ARTICLE_TITLE.equals(home.getFirstArticleTitle())
                            && home.getFirstArticleBody().contains(INITIAL_BODY);
                } catch (RuntimeException e) {
                    exceptionClass = e.getClass().getSimpleName();
                    currentStage = "FRONTEND_VERIFY";
                    throw e;
                }
            }
            fixtureCreated = frontendArticleConfirmed;
            if (!frontendArticleConfirmed) {
                outcome = "BLOCKED";
                reason = "FRONTEND_ARTICLE_NOT_CONFIRMED";
                throw new IllegalStateException("Joomla frontend did not show the exact saved article title and body");
            }

            currentStage = "ADMIN_LIST_MATCH";
            driver.switchTo().window(adminWindow);
            driver.get(ExperimentConfig.appUrl() + "administrator/index.php?option=com_content&view=articles");
            try {
                new WebDriverWait(driver, Duration.ofSeconds(10))
                        .until(ExpectedConditions.presenceOfElementLocated(By.id("articleList")));
            } catch (org.openqa.selenium.TimeoutException e) {
                outcome = "BLOCKED";
                reason = "ADMIN_ARTICLE_LIST_UNAVAILABLE";
                throw new IllegalStateException("Joomla admin article list did not load", e);
            }
            adminListTextContainsTitle = articles.containsArticle(ARTICLE_TITLE);
            List<WebElement> created = articleTitleRows(driver);
            articleManagerTitleMatchCount = created.size();
            if (created.size() != 1) {
                outcome = "BLOCKED";
                reason = created.isEmpty() ? "ARTICLE_NOT_LISTED_IN_ADMIN_MANAGER" : "AMBIGUOUS_EXACT_TITLE_ARTICLES";
                throw new IllegalStateException("Joomla admin article manager did not show exactly one exact-title fixture row");
            }
            fixtureCreated = true;
            currentStage = "ARTICLE_EDITOR_NAVIGATION";
            try {
                created.get(0).findElement(By.linkText(ARTICLE_TITLE)).click();
            } catch (RuntimeException e) {
                outcome = "BLOCKED";
                reason = "ARTICLE_EDITOR_NAVIGATION_FAILED";
                throw new IllegalStateException("Joomla exact-title editor link could not be opened", e);
            }
            try {
                new WebDriverWait(driver, Duration.ofSeconds(10))
                        .until(ExpectedConditions.presenceOfElementLocated(By.id("jform_version")));
            } catch (org.openqa.selenium.TimeoutException e) {
                outcome = "BLOCKED";
                reason = "ARTICLE_EDITOR_NOT_OPEN";
                throw new IllegalStateException("Joomla article editor did not open for the exact-title fixture", e);
            }
            articleEditorOpened = true;
            currentStage = "VERSION_FIELD_READ";
            String version = driver.findElement(By.id("jform_version")).getAttribute("value");
            versionFieldRead = true;
            versionCounter = "1".equals(version) ? 1 : 0;
            if (!"1".equals(version)) {
                outcome = "BLOCKED";
                reason = "FIXTURE_VERSION_NOT_ONE";
                throw new IllegalStateException("Fixture setup requires article version counter 1");
            }
            currentStage = "HISTORY_MODAL";
            List<WebElement> versionsButtons = driver.findElements(By.cssSelector("a.modal_jform_contenthistory"));
            if (versionsButtons.size() != 1 || !versionsButtons.get(0).isDisplayed()) {
                outcome = "BLOCKED";
                reason = "VERSION_HISTORY_CONTROL_UNAVAILABLE";
                throw new IllegalStateException("Fixture setup requires Joomla version history to be enabled");
            }
            versionsButtons.get(0).click();
            try {
                new WebDriverWait(driver, Duration.ofSeconds(10))
                        .until(ExpectedConditions.frameToBeAvailableAndSwitchToIt(By.id("sbox-content")));
            } catch (org.openqa.selenium.TimeoutException e) {
                outcome = "BLOCKED";
                reason = "HISTORY_MODAL_UNAVAILABLE";
                throw new IllegalStateException("Joomla version history dialog did not open", e);
            }
            currentStage = "INITIAL_HISTORY_ROWS";
            List<WebElement> historyRows = driver.findElements(By.cssSelector("#adminForm tbody tr"));
            historyRowsObserved = true;
            initialHistoryRows = historyRows.size();
            if (historyRows.size() != 1) {
                outcome = "BLOCKED";
                reason = "EXPECTED_ONE_INITIAL_HISTORY_ROW";
                throw new IllegalStateException("Fixture setup requires one initial history snapshot");
            }

            fixtureVerified = true;
            currentStage = "CANDIDATE_READY";
            outcome = "PASS";
            reason = "EXACT_TITLE_VERSION_AND_HISTORY_VERIFIED";
            System.out.println("JO-GAP-004 fixture setup PASS: exact title, version 1, and one initial history row verified.");
        } catch (Exception | AssertionError e) {
            if ("NONE".equals(exceptionClass)) exceptionClass = e.getClass().getSimpleName();
            browserReachabilityAtFailure = seleniumStatusReachability();
            if (fixtureCreationAttempted && !fixtureVerified) {
                cleanupOutcome = cleanupCreatedFixture(driver, adminWindow);
            }
            writeEvidence(evidencePath, runId, outcome, reason, versionCounter, initialHistoryRows,
                    fixtureCreated, fixtureCreationAttempted, frontendArticleConfirmed, adminListTextContainsTitle, articleManagerTitleMatchCount, articleEditorOpened, versionFieldRead, historyRowsObserved, saveHistorySetting, cleanupOutcome, optionsRoutePath, optionsPageTitle,
                    optionsContext, optionsFormVisible, saveHistoryRadioCount, currentStage, exceptionClass, browserReachabilityAtFailure);
            throw e;
        } finally {
            if (driver != null) {
                driver.quit();
            }
        }
        writeEvidence(evidencePath, runId, outcome, reason, versionCounter, initialHistoryRows,
                fixtureCreated, fixtureCreationAttempted, frontendArticleConfirmed, adminListTextContainsTitle, articleManagerTitleMatchCount, articleEditorOpened, versionFieldRead, historyRowsObserved, saveHistorySetting, cleanupOutcome, optionsRoutePath, optionsPageTitle,
                optionsContext, optionsFormVisible, saveHistoryRadioCount, currentStage, exceptionClass, browserReachabilityAtFailure);
    }

    private static List<WebElement> articleTitleRows(WebDriver driver) {
        return driver.findElements(By.cssSelector("#articleList tbody tr")).stream()
                .filter(row -> row.findElements(By.linkText(ARTICLE_TITLE)).size() == 1)
                .toList();
    }
    private static String seleniumStatusReachability() {
        HttpURLConnection connection = null;
        try {
            String endpoint = ExperimentConfig.webdriverUrl().replaceAll("/+$", "") + "/status";
            connection = (HttpURLConnection) new URL(endpoint).openConnection();
            connection.setConnectTimeout(1500);
            connection.setReadTimeout(1500);
            int status = connection.getResponseCode();
            return status >= 200 && status < 500 ? "REACHABLE_HTTP_" + status : "UNREACHABLE";
        } catch (Exception ignored) {
            return "UNREACHABLE";
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
    private static String cleanupCreatedFixture(WebDriver driver, String adminWindow) {
        if (driver == null || adminWindow == null) return "FAILED_ADMIN_SESSION_UNAVAILABLE";
        try {
            driver.switchTo().defaultContent();
            driver.switchTo().window(adminWindow);
            driver.get(ExperimentConfig.appUrl() + "administrator/index.php?option=com_content&view=articles");
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.presenceOfElementLocated(By.id("articleList")));
            List<WebElement> matching = articleTitleRows(driver);
            boolean titleTextPresent = new ManageArticlesPage(driver).containsArticle(ARTICLE_TITLE);
            if (matching.isEmpty()) {
                return titleTextPresent
                        ? "FAILED_TITLE_REMAINS_IN_ADMIN_LIST_TEXT"
                        : "PASS_EXACT_ARTICLE_ABSENT_VERIFIED_BY_ROWS_AND_LIST_TEXT";
            }
            if (matching.size() != 1) return "FAILED_EXACT_TITLE_MATCH_COUNT_" + matching.size();

            matching.get(0).findElement(By.linkText(ARTICLE_TITLE)).click();
            List<WebElement> versionsButtons = driver.findElements(By.cssSelector("a.modal_jform_contenthistory"));
            if (versionsButtons.size() > 1) return "FAILED_AMBIGUOUS_HISTORY_CONTROLS";
            boolean historyControlAvailable = versionsButtons.size() == 1 && versionsButtons.get(0).isDisplayed();
            if (historyControlAvailable) {
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
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.presenceOfElementLocated(By.id("articleList")));
            matching = articleTitleRows(driver);
            if (matching.size() != 1) return "FAILED_ARTICLE_MATCH_BEFORE_TRASH_" + matching.size();
            WebElement row = matching.get(0);
            row.findElement(By.cssSelector("td:nth-child(3) div button")).click();
            row.findElement(By.cssSelector("td:nth-child(3) div ul li:nth-child(2) a")).click();
            new WebDriverWait(driver, Duration.ofSeconds(10)).until(currentDriver -> {
                List<WebElement> remainingRows = articleTitleRows(currentDriver);
                return remainingRows.isEmpty() && !new ManageArticlesPage(currentDriver).containsArticle(ARTICLE_TITLE);
            });
            boolean exactRowsAbsent = articleTitleRows(driver).isEmpty();
            boolean listTextAbsent = !new ManageArticlesPage(driver).containsArticle(ARTICLE_TITLE);
            if (!exactRowsAbsent || !listTextAbsent) return "FAILED_ARTICLE_STILL_PRESENT_AFTER_TRASH";
            return historyControlAvailable
                    ? "PASS_HISTORY_AND_EXACT_ARTICLE_REMOVED_VERIFIED_BY_ROWS_AND_LIST_TEXT"
                    : "PASS_EXACT_ARTICLE_REMOVED_VERIFIED_BY_ROWS_AND_LIST_TEXT_HISTORY_CONTROL_UNAVAILABLE";
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
            int version, int historyRows, boolean fixtureCreated, boolean fixtureCreationAttempted,
            boolean frontendArticleConfirmed, boolean adminListTextContainsTitle, int articleManagerTitleMatchCount,
            boolean articleEditorOpened, boolean versionFieldRead, boolean historyRowsObserved,
            String saveHistorySetting,
            String cleanupOutcome, String optionsRoutePath, String optionsPageTitle,
            String optionsContext, boolean optionsFormVisible, int saveHistoryRadioCount,
            String currentStage, String exceptionClass, String browserReachabilityAtFailure) throws Exception {
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
                + "  \"fixtureCreationAttempted\": " + fixtureCreationAttempted + ",\n"
                + "  \"frontendArticleConfirmed\": " + frontendArticleConfirmed + ",\n"
                + "  \"articleManagerExactTitleRowCount\": " + articleManagerTitleMatchCount + ",\n"
                + "  \"adminListTextContainsExactTitle\": " + adminListTextContainsTitle + ",\n"
                + "  \"versionFieldRead\": " + versionFieldRead + ",\n"
                + "  \"initialHistoryRowsObserved\": " + historyRowsObserved + ",\n"
                + "  \"articleEditorOpened\": " + articleEditorOpened + ",\n"
                + "  \"fixtureCleanupOutcome\": \"" + cleanupOutcome + "\",\n"
                + "  \"currentStage\": \"" + currentStage + "\",\n"
                + "  \"exceptionClass\": \"" + exceptionClass + "\",\n"
                + "  \"browserReachabilityAtFailure\": \"" + browserReachabilityAtFailure + "\",\n"
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
