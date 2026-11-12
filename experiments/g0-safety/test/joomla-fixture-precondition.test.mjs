import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const suitePath = resolve(testDirectory, '../../joomla/bewt-suite/src/test/java/base/JO_GAP_004_G3_Suite.java');
const suiteSource = readFileSync(suitePath, 'utf8');

test('a missing initial history row blocks R3 and routes a created fixture through exact-title cleanup', () => {
  assert.match(suiteSource, /String saveHistorySetting = "NOT_READ_UI";/);
  assert.match(suiteSource, /reason = "EXPECTED_ONE_INITIAL_HISTORY_ROW";[\s\S]*?throw new IllegalStateException\("Fixture setup requires one initial history snapshot"\);/);
  assert.match(suiteSource, /if \(fixtureCreated && !fixtureVerified\) \{\s*cleanupOutcome = cleanupCreatedFixture\(driver, adminWindow\);/);

  const cleanupStart = suiteSource.indexOf('private static String cleanupCreatedFixture');
  assert.notEqual(cleanupStart, -1);
  const cleanup = suiteSource.slice(cleanupStart);
  assert.match(cleanup, /if \(matching\.isEmpty\(\)\) return "PASS_EXACT_ARTICLE_ABSENT";/);
  assert.match(cleanup, /if \(matching\.size\(\) != 1\) return "FAILED_EXACT_TITLE_MATCH_COUNT_" \+ matching\.size\(\);/);
  assert.match(cleanup, /currentDriver -> articleTitleLinks\(currentDriver\)\.isEmpty\(\)/);
  assert.match(suiteSource, /ARTICLE_TITLE\.equals\(link\.getText\(\)\.trim\(\)\)/);
});