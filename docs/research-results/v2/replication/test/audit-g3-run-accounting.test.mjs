import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRunAccounting } from '../audit-g3-run-accounting.mjs';

test('separates the primary 79 run IDs from supplementary G3 attempts 6–8', () => {
  const accounting = buildRunAccounting(process.cwd());
  assert.equal(accounting.summary.runIds, 79);
  assert.equal(accounting.artifacts.uniqueRunRecordIds, 87);
  assert.equal(accounting.artifacts.runRecordFiles, 87);
  assert.equal(accounting.artifacts.junitXmlFiles, 87);
  assert.equal(accounting.artifacts.summaryRunIdsMissingRunRecord.length, 0);
  assert.equal(accounting.artifacts.unlistedRunRecords.length, 8);
  assert.equal(accounting.artifacts.junitExecutionIdsWithoutRunRecord.length, 1);
  assert.deepEqual(
    accounting.artifacts.unlistedRunRecords.map((run) => run.runId),
    [
      'g3-ecgap005-20261110184936',
      'g3-ecgap005-r1-20261110184936',
      'g3-ecgap005-r2-20261110184936',
      'g3-ecgap005-r3-20261110184936',
      'g3-jogap004-r3-20261113-initial6',
      'g3-jogap004-r3-20261113-initial7',
      'g3-jogap004-r3-20261113-initial8',
      'g3-kbgap001-20261110184802',
    ],
  );
  const attempt6 = accounting.artifacts.unlistedRunRecords.find((run) => run.runId === 'g3-jogap004-r3-20261113-initial6');
  assert.equal(attempt6.classification, 'SUPPLEMENTARY_PRELIMINARY_FIXTURE_BLOCKED; candidate NOT_RUN before oracle; fixture absence NOT_INDEPENDENTLY_VERIFIED; runner cleanup PASS');
  const attempt7 = accounting.artifacts.unlistedRunRecords.find((run) => run.runId === 'g3-jogap004-r3-20261113-initial7');
  assert.equal(attempt7.classification, 'SUPPLEMENTARY_PRELIMINARY_FIXTURE_BLOCKED; candidate NOT_RUN before oracle; fixture absence NOT_INDEPENDENTLY_VERIFIED; JUnit XML NOT_AVAILABLE; Maven exit 143; runner cleanup PASS');
  assert.equal(attempt7.junit.length, 0);
  const attempt8 = accounting.artifacts.unlistedRunRecords.find((run) => run.runId === 'g3-jogap004-r3-20261113-initial8');
  assert.equal(attempt8.classification, 'SUPPLEMENTARY_PRELIMINARY_FIXTURE_SETUP_FAILED; candidate NOT_RUN before oracle; fixture absence VERIFIED_BY_EXACT_ADMIN_TABLE_AND_DISPOSABLE_DB_TEARDOWN; runner cleanup PASS');
  assert.equal(accounting.accounting.primarySummaryRunIds, 79);
  assert.equal(accounting.accounting.additionalRunRecordIds, 8);
  assert.equal(accounting.accounting.additionalJunitExecutionIds, 8);
  assert.equal(accounting.accounting.unregisteredExecutionArtifacts, 1);
});

test('reports JO-GAP-003 rerun and all-run failure denominators separately', () => {
  const accounting = buildRunAccounting(process.cwd());
  assert.equal(accounting.joGap003.rerunFailureRate, 2 / 3);
  assert.equal(accounting.joGap003.allRunFailureRate, 2 / 4);
});

test('attributes Bludit residual volumes only by their Kanboard run-name evidence', () => {
  const accounting = buildRunAccounting(process.cwd());
  assert.equal(accounting.blGap001Cleanup.zeroResidualVerified, false);
  assert.deepEqual(accounting.blGap001Cleanup.residualKanboardNamedVolumes, [
    'bewt-covext-kanboard-data-g3-kbgap001-20261110190120',
    'bewt-covext-kanboard-plugins-g3-kbgap001-20261110190120',
  ]);
  assert.equal(accounting.blGap001Cleanup.unclassifiedResidualResourceCount, 4);
});
