package po;

import java.net.URI;
import java.time.Duration;
import java.util.regex.Pattern;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Adapter-owned page object for the source-pinned customer reset-token flow. */
public final class CustomerPasswordResetPage extends PageObject {
    private static final Pattern SAFE_TOKEN = Pattern.compile("[A-Za-z0-9_-]{1,256}");
    private final String baseUrl;

    public CustomerPasswordResetPage(WebDriver driver, String baseUrl) {
        super(driver);
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalArgumentException("baseUrl is required");
        }
        this.baseUrl = baseUrl.replaceAll("/+$", "");
    }

    public void openResetLink(String token) {
        if (token == null || !SAFE_TOKEN.matcher(token).matches()) {
            throw new IllegalArgumentException("reset token must be a bounded path-safe test value");
        }
        driver.get(baseUrl + "/customer/reset/" + token);
    }

    public boolean redirectedToForgotPage() {
        return "/forgot".equals(URI.create(driver.getCurrentUrl()).getPath());
    }

    public String notificationMessage() {
        return new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.visibilityOfElementLocated(By.id("notify_message")))
                .getText().trim();
    }
}
