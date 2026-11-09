package tests;

import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;

public class Installer {

        protected WebDriver driver;

        public void getRemoteWebdriver() {
                ChromeOptions chromeOptions = new ChromeOptions();
                chromeOptions.addArguments("--no-sandbox", "--headless=new", "--disable-gpu","--lang=it", "--screen-info={1920x1080}");
                try {
                        driver = new RemoteWebDriver(new URL(ExperimentConfig.webdriverUrl()), chromeOptions);
                } catch (MalformedURLException e) { throw new IllegalArgumentException("BEWT_WEBDRIVER_URL must be a valid URL", e); }
        }

        protected static final String install_url = ExperimentConfig.installUrl();
        @Test
        public void install() throws InterruptedException {
                getRemoteWebdriver();
                driver.manage().window().maximize();
                driver.get(install_url);
                new Select(driver.findElement(By.id("langList"))).selectByVisibleText("English (English)");
                driver.findElement(By.id("btNext")).click();
                Thread.sleep(1000);
                driver.findElement(By.id("set_license")).click();
                driver.findElement(By.id("btNext")).click();
                Thread.sleep(1000);
                driver.findElement(By.id("infosShop")).sendKeys("E2E Web Testing store");
                driver.findElement(By.id("infosActivity_chosen")).click();
                driver.findElement(By.xpath("//*[@id=\"infosActivity_chosen\"]/div/div/input")).sendKeys("Computer");
                driver.findElement(By.xpath("//*[@id=\"infosActivity_chosen\"]/div/div/input")).sendKeys(Keys.ENTER);
                driver.findElement(By.id("infosFirstname")).sendKeys("BEWT");
                driver.findElement(By.id("infosName")).sendKeys("Automation");
                driver.findElement(By.id("infosEmail")).sendKeys(ExperimentConfig.adminEmail());
                driver.findElement(By.id("infosPassword")).sendKeys(ExperimentConfig.adminPassword());
                driver.findElement(By.id("infosPasswordRepeat")).sendKeys(ExperimentConfig.adminPassword());
                driver.findElement(By.id("btNext")).click();
                Thread.sleep(1000);
                driver.findElement(By.id("dbServer")).clear();
                driver.findElement(By.id("dbServer")).sendKeys(ExperimentConfig.databaseHost());
                driver.findElement(By.id("dbPassword")).sendKeys(ExperimentConfig.databasePassword());
                driver.findElement(By.id("btTestDB")).click();
                Thread.sleep(5000);
                driver.findElement(By.id("btCreateDB")).click();
                Thread.sleep(5000);
                driver.findElement(By.id("btNext")).click();
                boolean success = new WebDriverWait(driver, Duration.ofSeconds(180)).until(ExpectedConditions.textToBe(By.xpath("//*[@id=\"install_process_success\"]/div[1]/h2"), "Your installation is finished!"));
                if(success) {
        System.out.println("Post-install file changes require an ownership-verified runtime adapter.");
                }
                else {
                        System.out.println("!! POSSIBLY an error occurred during the installation. Check you application");
                }
                driver.quit();
        }

}
