package base;

import org.junit.Test;
import org.openqa.selenium.By;

public class RemoveMessages extends BaseTest {

    @Test
    public void removeMessages() throws InterruptedException {
        loginAsAdmin()
                .siteAdmin()
                .setUsername(adminUser)
                .setPassword(adminPsw)
                .login();
        Thread.sleep(2000);
        driver.findElement(By.xpath("//*[@id=\"system-message-container\"]/div[3]/p[3]/a[3]")).click();
        Thread.sleep(2000);
        driver.findElement(By.xpath("//*[@id=\"content\"]/div/div/div[2]/div[2]/div[1]/div/p[3]/a")).click();
        Thread.sleep(2000);
        driver.findElement(By.xpath("//*[@id=\"toolbar-unpublish\"]/button")).click();
    }
}
