import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const suitePath = resolve(testDirectory, '../../joomla/bewt-suite/src/test/java/base/JO_GAP_004_G3_Suite.java');
const suiteSource = readFileSync(suitePath, 'utf8');

test('missing history blocks R3 and created fixtures use independently verified exact-title cleanup', () => {
  assert.match(suiteSource, /String saveHistorySetting = "NOT_READ_UI";/);
  assert.match(suiteSource, /ARTICLE_TITLE\.equals\(home\.getFirstArticleTitle\(\)\)[\s\S]*?home\.getFirstArticleBody\(\)\.contains\(INITIAL_BODY\)/);
  assert.match(suiteSource, /#articleList tbody tr/);
  assert.match(suiteSource, /reason = "EXPECTED_ONE_INITIAL_HISTORY_ROW";[\s\S]*?throw new IllegalStateException\("Fixture setup requires one initial history snapshot"\);/);
  assert.match(suiteSource, /if \(fixtureCreationAttempted && !fixtureVerified\) \{\s*cleanupOutcome = cleanupCreatedFixture\(driver, adminWindow\);/);
  assert.match(suiteSource, /articleManagerExactTitleRowCount/);
  assert.match(suiteSource, /articleEditorOpened/);
  assert.match(suiteSource, /currentStage/);
  assert.match(suiteSource, /exceptionClass/);
  assert.match(suiteSource, /browserReachabilityAtFailure/);
  assert.match(suiteSource, /catch \(RuntimeException e\) \{\s*exceptionClass = e\.getClass\(\)\.getSimpleName\(\);\s*currentStage = "FRONTEND_VERIFY";\s*throw e;/);

  const cleanupStart = suiteSource.indexOf('private static String cleanupCreatedFixture');
  assert.notEqual(cleanupStart, -1);
  const cleanup = suiteSource.slice(cleanupStart);
  assert.match(cleanup, /new ManageArticlesPage\(driver\)\.containsArticle\(ARTICLE_TITLE\)/);
  assert.match(cleanup, /PASS_EXACT_ARTICLE_ABSENT_VERIFIED_BY_ROWS_AND_LIST_TEXT/);
  assert.match(cleanup, /FAILED_EXACT_TITLE_MATCH_COUNT_/);
  assert.match(cleanup, /new ManageArticlesPage\(currentDriver\)\.containsArticle\(ARTICLE_TITLE\)/);
  assert.match(suiteSource, /row -> row\.findElements\(By\.linkText\(ARTICLE_TITLE\)\)\.size\(\) == 1/);
});

test('Joomla G3 has a bounded longer timeout while other apps retain the runner default', () => {
  const runnerSource = readFileSync(resolve(testDirectory, '../../tools/unified-g0-runner.mjs'), 'utf8');
  const wrapperSource = readFileSync(resolve(testDirectory, '../../joomla/tools/run-jo-gap-004-g3.mjs'), 'utf8');
  assert.match(runnerSource, /timeout: options\.testTimeoutMs \?\? 300000/);
  assert.match(wrapperSource, /testTimeoutMs: 600000/);
});
