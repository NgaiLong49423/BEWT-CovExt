package mediawiki;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.junit.After;
import org.junit.Before;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.remote.RemoteWebDriver;
import po.MainPage;

public class BaseTest {

        public static WebDriver driver;
        public static final String app_url = ExperimentConfig.appUrl();

        @Before
        public void setup() {
                setupRemoteWebDriver();
                driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(30));
                driver.manage().window().maximize();
                driver.get(app_url);
        }


        protected void setupRemoteWebDriver() {
                ChromeOptions options = new ChromeOptions();
                options.addArguments("--no-sandbox", "--headless=new", "--disable-gpu", "--screen-info={1920x1080}", "--lang=en");
                try {
                        driver = new RemoteWebDriver(new URL(ExperimentConfig.webdriverUrl()), options);
                } catch (MalformedURLException e) { throw new IllegalArgumentException("BEWT_WEBDRIVER_URL must be a valid URL", e); }
        }

        protected MainPage loginAsAdmin() {
                return new MainPage(driver)
                                .login()
                                .setUsername(ExperimentConfig.adminUsername())
                                .setPassword(ExperimentConfig.adminPassword())
                                .login();
        }

        protected MainPage loginAsUser() {
                return new MainPage(driver)
                                .login()
                                .setUsername("User001")
                                .setPassword(ExperimentConfig.adminPassword())
                                .login();
        }

        @After
        public void tearDown() {
                driver.quit();
        }
}
