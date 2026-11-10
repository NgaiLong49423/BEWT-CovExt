import test from "node:test";
import assert from "node:assert/strict";
import { assertAntiTrivialJavaContract, validateGeneratedJavaContract, getAppPageObjectsSummary } from "../../src/runtime/model-provider.js";
import { getAppTestPackage } from "../../src/runtime/java-class.js";
import { verifyAllRevision2 } from "../../src/runtime/verify-revision2.js";

test("Anti-Trivial Quality Gate — Rejects trivial and tautological assertions", () => {
  // 1. currentUrl.length() >= 0
  const trivialUrlLength = `
    package tests;
    public class TestSample extends BaseTest {
      @Test public void testCase() {
        driver.get(appUrl);
        String currentUrl = driver.getCurrentUrl();
        Assert.assertTrue("url check", currentUrl.length() >= 0);
      }
    }
  `;
  assert.throws(
    () => assertAntiTrivialJavaContract(trivialUrlLength),
    /TRIVIAL_TEST_PATTERN_REJECTED: currentUrl\.length\(\) >= 0/
  );

  // 2. Assert.assertTrue(true)
  const assertTrueConstant = `
    package tests;
    public class TestSample extends BaseTest {
      @Test public void testCase() {
        driver.get(appUrl);
        Assert.assertTrue(true);
      }
    }
  `;
  assert.throws(
    () => assertAntiTrivialJavaContract(assertTrueConstant),
    /TRIVIAL_TEST_PATTERN_REJECTED: Assert\.assertTrue\(true\)/
  );

  // 3. Assert.assertFalse(false)
  const assertFalseConstant = `
    package tests;
    public class TestSample extends BaseTest {
      @Test public void testCase() {
        driver.get(appUrl);
        Assert.assertFalse("failed", false);
      }
    }
  `;
  assert.throws(
    () => assertAntiTrivialJavaContract(assertFalseConstant),
    /TRIVIAL_TEST_PATTERN_REJECTED: Assert\.assertFalse\(false\)/
  );

  // 4. Swallowed assertion catch block
  const swallowedAssertion = `
    package tests;
    public class TestSample extends BaseTest {
      @Test public void testCase() {
        driver.get(appUrl);
        try {
          Assert.assertEquals("expected", driver.getTitle());
        } catch (AssertionError e) {
          // swallowed!
        }
      }
    }
  `;
  assert.throws(
    () => assertAntiTrivialJavaContract(swallowedAssertion),
    /TRIVIAL_TEST_PATTERN_REJECTED: catch block swallows assertion failures/
  );

  // 5. Missing browser interaction
  const missingInteraction = `
    package tests;
    public class TestSample extends BaseTest {
      @Test public void testCase() {
        String title = "Expected";
        Assert.assertEquals("Expected", title);
      }
    }
  `;
  assert.throws(
    () => assertAntiTrivialJavaContract(missingInteraction),
    /TRIVIAL_TEST_PATTERN_REJECTED: test method lacks browser or PageObject interaction/
  );
});

test("Anti-Trivial Quality Gate — Accepts valid Selenium test with actions and business assertions", () => {
  const validTest = `
    package tests;
    import org.junit.Test;
    import org.junit.Assert;
    import org.openqa.selenium.By;
    import org.openqa.selenium.WebElement;

    public class TestSample extends BaseTest {
      @Test public void testCase() {
        driver.get(appUrl + "/cart");
        WebElement input = driver.findElement(By.name("quantity"));
        input.clear();
        input.sendKeys("2");
        driver.findElement(By.id("update-btn")).click();
        WebElement error = driver.findElement(By.className("alert-danger"));
        Assert.assertTrue("Must display out of stock alert", error.getText().contains("There is not enough stock"));
      }
    }
  `;
  assert.doesNotThrow(() => assertAntiTrivialJavaContract(validTest));
});

test("App Test Package & Page Objects Injection — Resolves all 8 apps correctly", () => {
  assert.equal(getAppTestPackage("bludit"), "tests");
  assert.equal(getAppTestPackage("claroline"), "test");
  assert.equal(getAppTestPackage("expresscart"), "tests");
  assert.equal(getAppTestPackage("joomla"), "base");
  assert.equal(getAppTestPackage("kanboard"), "tests");
  assert.equal(getAppTestPackage("mantisbt"), "base");
  assert.equal(getAppTestPackage("mediawiki"), "mediawiki");
  assert.equal(getAppTestPackage("prestashop"), "tests");

  // Verify Page Object injection summary for an app
  const poSummary = getAppPageObjectsSummary("bludit");
  assert.ok(poSummary.includes("AdminLogin"));
  assert.ok(poSummary.includes("AdminHome"));
});

test("Anti-Trivial Quality Gate — Verifies 40/40 Revision-2 Tests Pass Gate with Zero Trivial Assertions", () => {
  const { totalScanned, results, trivialCount } = verifyAllRevision2();
  assert.equal(totalScanned, 40, "All 40 candidates must be scanned");
  assert.equal(trivialCount, 0, "Zero trivial assertions must be detected");
  const failedGate = results.filter(r => !r.gatePassed);
  assert.equal(failedGate.length, 0, "All 40 revision-2 test classes must satisfy the quality gate");
  for (const r of results) {
    assert.ok(r.hasRegistration, `Candidate ${r.candidateId} must have registration.json`);
    assert.ok(r.hasProvenance, `Candidate ${r.candidateId} must have provenance.json`);
  }
});
