package tests;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.Test;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class ChromeDriverCompatibilityTest {

	@Test
	public void startsMatchingChromeAndLoadsLocalPage() {
		String driverPath = System.getProperty("chrome.driver");
		String browserPath = System.getProperty("chrome.binary");
		assertTrue("Pass -Dchrome.driver=<experiment driver path>", driverPath != null);
		assertTrue("Pass -Dchrome.binary=<Chrome path>", browserPath != null);
		Path driverBinary = Path.of(driverPath).toAbsolutePath();
		assertTrue("ChromeDriver binary must exist", Files.isRegularFile(driverBinary));

		System.setProperty("webdriver.chrome.driver", driverBinary.toString());
		ChromeOptions options = new ChromeOptions();
		options.setBinary(browserPath);
		options.addArguments("--headless=new", "--disable-gpu", "--window-size=1280,900");

		ChromeDriver driver = new ChromeDriver(options);
		try {
			String browserVersion = driver.getCapabilities().getBrowserVersion();
			System.out.println("Chrome browserVersion=" + browserVersion);
			driver.get("data:text/html,<html><title>webdriver-smoke</title><body>ready</body></html>");
			assertEquals("webdriver-smoke", driver.getTitle());
			assertEquals("ready", driver.findElement(org.openqa.selenium.By.tagName("body")).getText());
		} finally {
			driver.quit();
		}
	}
}
