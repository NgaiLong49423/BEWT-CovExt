import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPS, runG0Workflow, snapshotInventory } from './unified-g0-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

const ALL_APPS = ['kanboard', 'bludit', 'claroline', 'expresscart', 'joomla', 'mantisbt', 'mediawiki', 'prestashop'];

export async function runAllG0(targetApps = ALL_APPS) {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const evidenceBase = resolve(REPO_ROOT, 'docs/tasks/g0-evidence');
  mkdirSync(evidenceBase, { recursive: true });

  console.log('================================================================');
  console.log(`BEWT-CovExt G0 Baseline Verification Across ${targetApps.length} Applications`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  const baselineInventory = snapshotInventory();
  console.log(`Initial Docker inventory: ${baselineInventory.containers.length} containers, ${baselineInventory.volumes.length} volumes, ${baselineInventory.networks.length} networks`);

  const results = [];
  let totalPass = 0;
  let totalFail = 0;

  for (const appId of targetApps) {
    if (!APPS[appId]) {
      console.error(`UNKNOWN_APP_ID: '${appId}', skipping`);
      continue;
    }

    const runId = `g0-${appId}-${timestamp}`;
    console.log(`\n----------------------------------------------------------------`);
    console.log(`Starting G0 Verification for [${appId.toUpperCase()}] (runId: ${runId})`);
    console.log(`----------------------------------------------------------------`);

    const startMs = Date.now();
    try {
      const outcome = await runG0Workflow(appId, runId);
      const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);

      // Read junit-result.json and cleanup-result.json from evidence
      const appEvidenceDir = resolve(REPO_ROOT, `docs/tasks/g0-evidence/${appId}/${runId}`);
      let junitSummary = null;
      let cleanupSummary = null;

      try {
        const junitRaw = readFileSync(join(appEvidenceDir, 'junit-result.json'), 'utf8');
        junitSummary = JSON.parse(junitRaw);
      } catch {}

      try {
        const cleanupRaw = readFileSync(join(appEvidenceDir, 'cleanup-result.json'), 'utf8');
        cleanupSummary = JSON.parse(cleanupRaw);
      } catch {}

      const record = {
        appId,
        runId,
        durationSeconds: Number(durationSec),
        exitCode: outcome.exitCode,
        outcome: outcome.outcome,
        testClass: APPS[appId].testClass,
        testsRun: junitSummary?.summary?.tests ?? 0,
        failures: junitSummary?.summary?.failures ?? 0,
        errors: junitSummary?.summary?.errors ?? 0,
        junitOutcome: junitSummary?.outcome ?? 'UNKNOWN',
        zeroResidualVerified: cleanupSummary?.zeroResidualVerified ?? false,
        evidenceDir: outcome.evidenceDir,
      };

      results.push(record);

      if (record.outcome === 'PASS' && record.junitOutcome === 'PASS' && record.zeroResidualVerified) {
        totalPass++;
        console.log(`>>> [${appId.toUpperCase()}] RESULT: PASS (Duration: ${durationSec}s, Tests: ${record.testsRun}, Zero Residual: YES)`);
      } else {
        totalFail++;
        console.log(`>>> [${appId.toUpperCase()}] RESULT: FAIL (exit: ${record.exitCode}, junit: ${record.junitOutcome}, zeroResidual: ${record.zeroResidualVerified})`);
      }
    } catch (err) {
      const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);
      console.error(`>>> [${appId.toUpperCase()}] EXCEPTION: ${err.message}`);
      totalFail++;
      results.push({
        appId,
        runId,
        durationSeconds: Number(durationSec),
        exitCode: 1,
        outcome: 'ERROR',
        error: err.message,
        testClass: APPS[appId].testClass,
        testsRun: 0,
        failures: 0,
        errors: 1,
        junitOutcome: 'ERROR',
        zeroResidualVerified: false,
      });
    }
  }

  // Final inventory verification
  const finalInventory = snapshotInventory();
  const residualContainers = finalInventory.containers.filter(c => !baselineInventory.containers.includes(c));
  const residualVolumes = finalInventory.volumes.filter(v => !baselineInventory.volumes.includes(v));
  const residualNetworks = finalInventory.networks.filter(n => !baselineInventory.networks.includes(n));

  const allResidualsClean = (
    residualContainers.length === 0 &&
    residualVolumes.length === 0 &&
    residualNetworks.length === 0
  );

  const summary = {
    executedAtUtc: new Date().toISOString(),
    totalApps: targetApps.length,
    passedApps: totalPass,
    failedApps: totalFail,
    overallG0Outcome: (totalPass === targetApps.length && allResidualsClean) ? 'PASS' : 'FAIL',
    globalZeroResidualVerified: allResidualsClean,
    residualDetails: {
      residualContainers,
      residualVolumes,
      residualNetworks,
    },
    results,
  };

  const summaryPath = resolve(evidenceBase, 'all-apps-g0-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('\n================================================================');
  console.log(`FINAL G0 BASELINE EXECUTION SUMMARY`);
  console.log('================================================================');
  console.log(`Total Applications Evaluated: ${targetApps.length}`);
  console.log(`PASSED: ${totalPass} / ${targetApps.length}`);
  console.log(`FAILED: ${totalFail} / ${targetApps.length}`);
  console.log(`Global Zero Residual Verified: ${allResidualsClean ? 'YES (PASS)' : 'NO (FAIL)'}`);
  console.log(`Overall G0 Status: ${summary.overallG0Outcome}`);
  console.log(`Summary Written to: ${summaryPath}\n`);

  console.log('| Application | Test Class | Tests | Failures | Errors | JUnit | Zero Residual | G0 Status |');
  console.log('|-------------|------------|-------|----------|--------|-------|---------------|-----------|');
  for (const r of results) {
    console.log(`| ${r.appId.padEnd(11)} | ${r.testClass.padEnd(28)} | ${String(r.testsRun).padEnd(5)} | ${String(r.failures).padEnd(8)} | ${String(r.errors).padEnd(6)} | ${r.junitOutcome.padEnd(5)} | ${String(r.zeroResidualVerified).padEnd(13)} | ${r.outcome.padEnd(9)} |`);
  }
  console.log('================================================================\n');

  return summary;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  const requestedApps = process.argv.slice(2).filter(Boolean);
  const appsToRun = requestedApps.length > 0 ? requestedApps : ALL_APPS;

  try {
    const summary = await runAllG0(appsToRun);
    process.exit(summary.overallG0Outcome === 'PASS' ? 0 : 1);
  } catch (err) {
    console.error('Fatal error during G0 execution:', err);
    process.exit(1);
  }
}
