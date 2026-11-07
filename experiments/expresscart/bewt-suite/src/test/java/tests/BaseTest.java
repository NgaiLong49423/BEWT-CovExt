package tests;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.TestWatcher;
import org.junit.runner.Description;
import java.nio.file.Files;
import java.nio.file.Path;
import java.net.URI;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.remote.RemoteWebDriver;

public class BaseTest {

	@Rule
	public TestWatcher captureScreenshotOnFailure = new TestWatcher() {
		@Override
		protected void failed(Throwable error, Description description) {
			if (!(driver instanceof TakesScreenshot)) {
				return;
			}
			try {
				Path evidenceDir = Path.of(System.getProperty("experiment.evidence.dir", "../evidence"));
				Path screenshotDir = evidenceDir.resolve("screenshots");
				Files.createDirectories(screenshotDir);
				Path screenshot = screenshotDir.resolve(description.getMethodName() + ".png");
				Files.copy(((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE).toPath(), screenshot,
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				String path = URI.create(driver.getCurrentUrl()).getPath();
				boolean userAdminLink = !driver.findElements(org.openqa.selenium.By.cssSelector("a[href='/admin/user/new']")).isEmpty();
				Files.writeString(screenshotDir.resolve(description.getMethodName() + "-context.txt"),
						"urlPath=" + path + System.lineSeparator() + "title=" + driver.getTitle()
						+ System.lineSeparator() + "userAdminLinkPresent=" + userAdminLink + System.lineSeparator());
			} catch (Exception ignored) {
				System.err.println("Could not capture failure screenshot in experiment evidence directory.");
			}
		}

		@Override
		protected void finished(Description description) {
			if (driver != null) {
				driver.quit();
			}
		}
	};
	
	public WebDriver driver;
	public String appUrl = System.getProperty("expresscart.baseUrl", "http://127.0.0.1:3111");
	
	@Before
	public void setUp() {
		setupNativeBrowser();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(30));
        driver.manage().window().maximize();
	}

	public void setupRemoteWebdriver() {
		ChromeOptions chromeOptions = new ChromeOptions();
		chromeOptions.addArguments("--no-sandbox", "--headless=new", "--disable-gpu", "--screen-info={1920x1080}");
		try {
			driver = new RemoteWebDriver(new URL("http://localhost:4444/wd/hub"), chromeOptions);
		} catch (MalformedURLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	public void setupNativeBrowser() {
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--disable-search-engine-choice-screen", "--headless=new", "--disable-gpu", "--screen-info={1920x1080}");
		// Let Selenium Manager resolve the driver for the installed Chrome version.
		driver = new ChromeDriver(options);
	}

	public void setupNativeBrowserNoSeleniumManager() {
		System.setProperty("webdriver.chrome.driver", "C:/Users/User/Downloads/chromedriver-win64-chrome127/chromedriver-win64/chromedriver.exe");
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--disable-search-engine-choice-screen", "--headless=new", "--disable-gpu", "--screen-info={1920x1080}", "--lang=en");
		options.setBinary("C:\\Users\\User\\chrome\\win64-127.0.6533.119\\chrome-win64\\chrome.exe");
		driver = new ChromeDriver(options);
	}
	
	public void goToHome() {
		driver.get(appUrl);
	}
	
	public void goToAdminHome() {
		driver.get(appUrl+"/admin");
	}
	
}
