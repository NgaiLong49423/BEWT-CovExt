package base;

import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;
import java.util.concurrent.TimeUnit;


public class Installer {

        protected WebDriver driver;
        protected final static String app_url = ExperimentConfig.installUrl();

        public void setupRemoteWebdriver() {
                ChromeOptions chromeOptions = new ChromeOptions();
                chromeOptions.addArguments("--no-sandbox", "--headless=new", "--disable-gpu", "--screen-info={1920x1080}", "--lang=en");
                try {
                        driver = new RemoteWebDriver(new URL(ExperimentConfig.webdriverUrl()), chromeOptions);
                } catch (MalformedURLException e) { throw new IllegalArgumentException("BEWT_WEBDRIVER_URL must be a valid URL", e); }
        }

        @Test
        public void install() throws InterruptedException {
                setupRemoteWebdriver();
                driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(60));
                driver.manage().window().maximize();
                driver.get(app_url);
                Thread.sleep(5000);
                driver.findElement(By.id("jform_language_chzn")).click();
                driver.findElement(By.xpath("//*[@id=\"jform_language_chzn\"]/div/div/input")).sendKeys("English (United States)");
                driver.findElement(By.xpath("//*[@id=\"jform_language_chzn\"]/div/div/input")).sendKeys(Keys.ENTER);
                Thread.sleep(1000);
                driver.findElement(By.id("jform_site_name")).sendKeys("BEWT E2E site");
                driver.findElement(By.id("jform_admin_email")).sendKeys(ExperimentConfig.adminEmail());
                driver.findElement(By.id("jform_admin_user")).sendKeys(ExperimentConfig.adminUsername());
                driver.findElement(By.id("jform_admin_password")).sendKeys(ExperimentConfig.adminPassword());
                driver.findElement(By.id("jform_admin_password2")).sendKeys(ExperimentConfig.adminPassword());
                driver.findElement(By.xpath("//*[@id=\"container-installation\"]/div/div/a")).click();
                driver.findElement(By.id("jform_db_host")).clear();
                driver.findElement(By.id("jform_db_host")).sendKeys(ExperimentConfig.databaseHost());
                driver.findElement(By.id("jform_db_user")).sendKeys(ExperimentConfig.databaseUser());
                driver.findElement(By.id("jform_db_pass")).sendKeys(ExperimentConfig.databasePassword());
                driver.findElement(By.id("jform_db_name")).sendKeys(ExperimentConfig.databaseName());
                driver.findElement(By.xpath("//*[@id=\"adminForm\"]/div[1]/div/a[2]")).click();
                driver.findElement(By.id("jform_sample_file1")).click();
                driver.findElement(By.xpath("//*[@id=\"adminForm\"]/div[1]/div/a[2]")).click();
                try {
                    driver.findElement(By.xpath("//*[@id=\"adminForm\"]/div[4]/div/input")).click();
                } catch (Exception ignored) {
                    // Installation folder cleanup is handled by runner via docker exec
                }

                System.out.println("Setup complete. Remember to close the popup and hide the received messages.");
                driver.quit();
        }

}
