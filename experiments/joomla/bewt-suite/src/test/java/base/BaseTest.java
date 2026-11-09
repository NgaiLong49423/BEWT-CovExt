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
import po.BaseNavBar;
import po.EditProfilePage;

public class BaseTest {

        protected static final String adminUser = ExperimentConfig.adminUsername();
        protected static final String adminPsw = ExperimentConfig.adminPassword();
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
                chromeOptions.addArguments("--no-sandbox", "--headless=new", "--disable-gpu", "--screen-info={1920x1080}", "--lang=en");
                try {
                        driver = new RemoteWebDriver(new URL(ExperimentConfig.webdriverUrl()), chromeOptions);
                } catch (MalformedURLException e) { throw new IllegalArgumentException("BEWT_WEBDRIVER_URL must be a valid URL", e); }
        }

        protected EditProfilePage loginAsAdmin() {
                return new BaseNavBar(driver)
                        .authorLogin()
                        .setUsername(adminUser)
                        .setPassword(adminPsw)
                        .login();
        }

        @After
        public void tearDown() {
                driver.quit();
        }

}
