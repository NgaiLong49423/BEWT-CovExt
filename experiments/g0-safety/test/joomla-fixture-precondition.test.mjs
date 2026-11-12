import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const suitePath = resolve(testDirectory, '../../joomla/bewt-suite/src/test/java/base/JO_GAP_004_G3_Suite.java');
const suiteSource = readFileSync(suitePath, 'utf8');

test('admin table fixture preconditions gate R3 and exact table rows govern cleanup', () => {
  assert.match(suiteSource, /String saveHistorySetting = "NOT_READ_UI";/);
  assert.match(suiteSource, /#articleList tbody tr/);
  assert.match(suiteSource, /\.setBody\(INITIAL_BODY\)\s*\.save\(\);\s*\s*currentStage = "ADMIN_LIST_MATCH";/);
  assert.doesNotMatch(suiteSource, /getFirstArticleTitle|getFirstArticleBody|containsArticle\(ARTICLE_TITLE\)/);
  assert.match(suiteSource, /if \(!existing\.isEmpty\(\)\)/);
  assert.match(suiteSource, /if \(created\.size\(\) !==? 1\)/);
  assert.match(suiteSource, /fixtureCreated = true;\s*currentStage = "ARTICLE_EDITOR_NAVIGATION";/);
  assert.match(suiteSource, /reason = "EXPECTED_ONE_INITIAL_HISTORY_ROW";[\s\S]*?throw new IllegalStateException\("Fixture setup requires one initial history snapshot"\);/);
  assert.match(suiteSource, /if \(fixtureCreationAttempted && !fixtureVerified\) \{\s*cleanupOutcome = cleanupCreatedFixture\(driver, adminWindow\);/);
  assert.match(suiteSource, /articleManagerExactTitleRowCount/);
  assert.match(suiteSource, /articleEditorOpened/);
  assert.match(suiteSource, /versionCounter = "1"\.equals\(version\) \? 1 : 0;[\s\S]*?if \(!"1"\.equals\(version\)\)/);
  assert.match(suiteSource, /currentStage/);
  assert.match(suiteSource, /exceptionClass/);
  assert.match(suiteSource, /browserReachabilityAtFailure/);
  assert.match(suiteSource, /catch \(Exception \| AssertionError e\) \{[\s\S]*?if \("NONE"\.equals\(exceptionClass\)\) exceptionClass = e\.getClass\(\)\.getSimpleName\(\);[\s\S]*?throw e;/);

  const cleanupStart = suiteSource.indexOf('private static String cleanupCreatedFixture');
  assert.notEqual(cleanupStart, -1);
  const cleanup = suiteSource.slice(cleanupStart);
  assert.match(cleanup, /if \(matching\.isEmpty\(\)\) \{\s*return "PASS_EXACT_ARTICLE_ABSENT_FROM_ADMIN_TABLE";/);
  assert.match(cleanup, /return articleTitleRows\(currentDriver\)\.isEmpty\(\);/);
  assert.match(cleanup, /PASS_HISTORY_AND_EXACT_ARTICLE_REMOVED_FROM_ADMIN_TABLE/);
  assert.match(cleanup, /FAILED_EXACT_TITLE_MATCH_COUNT_/);
  assert.doesNotMatch(cleanup, /containsArticle|adminForm.*textContent|document\.body/);
  assert.match(suiteSource, /row -> row\.findElements\(By\.linkText\(ARTICLE_TITLE\)\)\.size\(\) == 1/);
});

test('Joomla G3 has a bounded longer timeout while other apps retain the runner default', () => {
  const runnerSource = readFileSync(resolve(testDirectory, '../../tools/unified-g0-runner.mjs'), 'utf8');
  const wrapperSource = readFileSync(resolve(testDirectory, '../../joomla/tools/run-jo-gap-004-g3.mjs'), 'utf8');
  assert.match(runnerSource, /timeout: options\.testTimeoutMs \?\? 300000/);
  assert.match(wrapperSource, /testTimeoutMs: 600000/);
});
