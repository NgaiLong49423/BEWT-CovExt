package tests;

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

public class BaseTest {

        protected static final String adminPsw = ExperimentConfig.adminPassword();
        protected static final String adminMail = ExperimentConfig.adminEmail();
        protected static final String app_url = ExperimentConfig.appUrl();
        protected WebDriver driver;

        @Before
        public void setUp() {
                setupRemoteWebdriver();
                driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(30));
                driver.manage().window().maximize();
                driver.get(app_url);
        }

        public void setupRemoteWebdriver() {
                ChromeOptions chromeOptions = new ChromeOptions();
                chromeOptions.addArguments("--no-sandbox", "--headless=new", "--disable-gpu","--lang=en", "--screen-info={1920x1080}");
                try {
                        driver = new RemoteWebDriver(new URL(ExperimentConfig.webdriverUrl()), chromeOptions);
                } catch (MalformedURLException e) { throw new IllegalArgumentException("BEWT_WEBDRIVER_URL must be a valid URL", e); }
        }

        @After
        public void tearDown() {
                driver.quit();
        }

}
