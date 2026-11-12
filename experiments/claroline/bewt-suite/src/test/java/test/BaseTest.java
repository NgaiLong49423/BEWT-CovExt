package test;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;

import org.junit.After;
import org.junit.Before;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

public class BaseTest {

	protected WebDriver driver;
	protected static String requiredRuntimeCredential(String name) {
		String value = System.getProperty(name);
		if (value == null || value.isBlank()) {
			value = System.getenv(name);
		}
		if (value == null || value.isBlank()) {
			throw new IllegalStateException("Required runtime credential is not configured: " + name);
		}
		return value;
	}

	protected static String requiredDifferentCredential(String expectedName, String rejectedName) {
		String expected = requiredRuntimeCredential(expectedName);
		String rejected = requiredRuntimeCredential(rejectedName);
		if (expected.equals(rejected)) {
			throw new IllegalStateException(rejectedName + " must differ from " + expectedName);
		}
		return rejected;
	}

	@Before
	public void setUp() {
		setupRemoteWebdriver();
		driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(30));
		driver.get(requiredProperty("app.url"));
	}

	private static String requiredProperty(String name) {
		String value = System.getProperty(name);
		if (value == null || value.isBlank()) {
			throw new IllegalStateException("Required JVM property is missing: " + name);
		}
		return value;
	}

	private void setupRemoteWebdriver() {
		System.out.println("Setting up remote web driver...");
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--headless=new", "--disable-gpu", "--window-size=1920,1080");
		try {
			URL remoteUrl = new URL(requiredProperty("webdriver.remote.url"));
			driver = new RemoteWebDriver(remoteUrl, options);
		} catch (MalformedURLException e) {
			throw new IllegalArgumentException("webdriver.remote.url must be an absolute URL", e);
		}
	}

	@After
	public void tearDown() {
		if (driver != null) {
			driver.quit();
		}
	}
}