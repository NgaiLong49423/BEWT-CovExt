package base;

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
import po.LoginPage;

public class BaseTest {

        public static WebDriver driver;
        public static final String app_url = ExperimentConfig.appUrl();
        @Before
        public void login() {
                setupRemoteWebdriver();
                driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(30));
                driver.manage().window().maximize();
                driver.get(app_url);
                new LoginPage(driver).setUsername(ExperimentConfig.adminUsername()).setPassword(ExperimentConfig.adminPassword()).login();
        }

        public void setupRemoteWebdriver() {
                ChromeOptions chromeOptions = new ChromeOptions();
                chromeOptions.addArguments("--no-sandbox", "--headless=new", "--lang=en", "--disable-gpu", "--lang=en", "--screen-info={1920x1080}");
                try {
                        driver = new RemoteWebDriver(new URL(ExperimentConfig.webdriverUrl()), chromeOptions);
                } catch (MalformedURLException e) { throw new IllegalArgumentException("BEWT_WEBDRIVER_URL must be a valid URL", e); }
        }

        @After
        public void tearDown() {
                driver.quit();
        }
}
