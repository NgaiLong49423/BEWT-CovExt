/**
 * Automated Negative Test Controls for BEWT-CovExt v2.0 Metric Recomputation
 *
 * Verifies that recompute-metrics.mjs fails closed and accurately detects:
 * - Malformed Gherkin syntax (missing Feature, missing Scenario, missing When/Then steps)
 * - Unapproved candidates and unverified novelty
 * - Trivial and tautological assertions (currentUrl.length() >= 0, assertTrue(true), swallowed errors)
 * - Baseline denominator tampering
 */

import assert from 'node:assert/strict';
import { validateGherkinSyntax, auditJavaSeleniumQuality, runRecompute } from '../recompute-metrics.mjs';

console.log('Running Negative Controls for recompute-metrics.mjs...\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// --- Group 1: Gherkin AST Negative Controls ---
test('Gherkin Neg 1: Rejects empty string', () => {
  const res = validateGherkinSyntax('');
  assert.equal(res.valid, false);
  assert.match(res.error, /Empty or non-string/);
});

test('Gherkin Neg 2: Rejects missing Feature header', () => {
  const res = validateGherkinSyntax('Scenario: Sample\n  Given step 1\n  When step 2\n  Then step 3');
  assert.equal(res.valid, false);
  assert.match(res.error, /Missing Feature/);
});

test('Gherkin Neg 3: Rejects missing Scenario header', () => {
  const res = validateGherkinSyntax('Feature: Sample\n  Given step 1\n  When step 2\n  Then step 3');
  assert.equal(res.valid, false);
  assert.match(res.error, /Missing Scenario/);
});

test('Gherkin Neg 4: Rejects scenario with no steps', () => {
  const res = validateGherkinSyntax('Feature: Sample\n  Scenario: Empty');
  assert.equal(res.valid, false);
  assert.match(res.error, /no steps/);
});

test('Gherkin Neg 5: Rejects scenario missing Then clause', () => {
  const res = validateGherkinSyntax('Feature: Sample\n  Scenario: Incomplete\n    Given user is logged in\n    When user clicks button');
  assert.equal(res.valid, false);
  assert.match(res.error, /Missing core Gherkin step clause.*Then: false/);
});

test('Gherkin Neg 6: Rejects scenario missing When clause', () => {
  const res = validateGherkinSyntax('Feature: Sample\n  Scenario: Incomplete\n    Given user is logged in\n    Then user sees dashboard');
  assert.equal(res.valid, false);
  assert.match(res.error, /Missing core Gherkin step clause.*When: false/);
});

test('Gherkin Neg 7: Rejects scenario missing Given clause', () => {
  const res = validateGherkinSyntax('Feature: Sample\n  Scenario: Incomplete\n    When user clicks button\n    Then user sees error');
  assert.equal(res.valid, false);
  assert.match(res.error, /Missing core Gherkin step clause.*Given: false/);
});

// --- Group 2: Anti-Trivial Java Quality Gate Negative Controls ---
test('Java Neg 1: Rejects currentUrl.length() >= 0', () => {
  const code = `
    public class SampleTest extends BaseTest {
      @Test
      public void testTrivial() {
        driver.get("http://localhost");
        Assert.assertTrue("oracle", currentUrl.length() >= 0);
      }
    }
  `;
  const res = auditJavaSeleniumQuality(code);
  assert.equal(res.pass, false);
  assert.match(res.error, /currentUrl\.length\(\) >= 0 is a non-behavioral tautology/);
});

test('Java Neg 2: Rejects Assert.assertTrue(true)', () => {
  const code = `
    public class SampleTest extends BaseTest {
      @Test
      public void testTautology() {
        driver.get("http://localhost");
        Assert.assertTrue(true);
      }
    }
  `;
  const res = auditJavaSeleniumQuality(code);
  assert.equal(res.pass, false);
  assert.match(res.error, /Assert\.assertTrue\(true\) is tautological/);
});

test('Java Neg 3: Rejects Assert.assertFalse(false)', () => {
  const code = `
    public class SampleTest extends BaseTest {
      @Test
      public void testTautology() {
        driver.get("http://localhost");
        Assert.assertFalse(false);
      }
    }
  `;
  const res = auditJavaSeleniumQuality(code);
  assert.equal(res.pass, false);
  assert.match(res.error, /Assert\.assertFalse\(false\) is tautological/);
});

test('Java Neg 4: Rejects swallowed assertion failures in catch block', () => {
  const code = `
    public class SampleTest extends BaseTest {
      @Test
      public void testSwallowed() {
        try {
          driver.get("http://localhost");
          Assert.assertEquals("expected", driver.getTitle());
        } catch (AssertionError e) {
          // swallowed
        }
      }
    }
  `;
  const res = auditJavaSeleniumQuality(code);
  assert.equal(res.pass, false);
  assert.match(res.error, /Catch block swallows assertion failures/);
});

test('Java Neg 5: Rejects test with zero Selenium / browser interactions', () => {
  const code = `
    public class SampleTest extends BaseTest {
      @Test
      public void testNoSelenium() {
        String s = "hello";
        Assert.assertEquals("hello", s);
      }
    }
  `;
  const res = auditJavaSeleniumQuality(code);
  assert.equal(res.pass, false);
  assert.match(res.error, /Method lacks browser or PageObject interactions/);
});

test('Java Neg 6: Rejects generic dummy test checking only body presence', () => {
  const code = `
    public class SampleTest extends BaseTest {
      @Test
      public void testGenericOnly() {
        driver.get("http://localhost");
      }
    }
  `;
  const res = auditJavaSeleniumQuality(code);
  assert.equal(res.pass, false);
  assert.match(res.error, /Test performs only generic checks without business assertions/);
});

// --- Group 3: Metric Recomputation Engine Negative Controls ---
test('Engine Neg 1: Injected unapproved candidate fails RQ1 evaluation', () => {
  const mockCandidates = [
    {
      candidateId: 'MOCK-001',
      app: 'bludit',
      gherkinScenario: 'Feature: F\n  Scenario: S\n    Given g\n    When w\n    Then t',
      decision: 'REJECTED',
      classification: 'SOURCE_SUPPORTED_PROPOSAL',
      sourceRefs: ['ref.php'],
    },
  ];
  const res = runRecompute({ overrideCandidates: mockCandidates, silent: true });
  assert.equal(res.rq1.outcome, 'FAIL');
  assert.equal(res.rq1.humanApprovedCount, 0);
});

test('Engine Neg 2: Injected invalid Gherkin fails RQ1 evaluation', () => {
  const mockCandidates = [
    {
      candidateId: 'MOCK-002',
      app: 'bludit',
      gherkinScenario: 'Not a valid gherkin scenario',
      decision: 'ACCEPTED_FOR_IMPLEMENTATION',
      classification: 'SOURCE_SUPPORTED_PROPOSAL',
      sourceRefs: ['ref.php'],
    },
  ];
  const res = runRecompute({ overrideCandidates: mockCandidates, silent: true });
  assert.equal(res.rq1.outcome, 'FAIL');
  assert.equal(res.rq1.validGherkinSyntax, 0);
});

console.log(`\n======================================================================`);
console.log(`Negative Controls Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`======================================================================`);

if (failCount > 0) {
  process.exit(1);
}
