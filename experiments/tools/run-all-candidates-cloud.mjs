import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPS, runG0Workflow, snapshotInventory } from './unified-g0-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

const DATASET_PATH = resolve(REPO_ROOT, 'docs/research-results/v2/dataset/40-candidate-dataset.json');

export async function runCandidates(options = {}) {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const evidenceBase = resolve(REPO_ROOT, 'docs/tasks/g3-evidence');
  mkdirSync(evidenceBase, { recursive: true });

  const datasetRaw = readFileSync(DATASET_PATH, 'utf8');
  const dataset = JSON.parse(datasetRaw);

  let candidates = dataset.candidates || [];
  if (options.app) {
    candidates = candidates.filter((c) => c.application === options.app);
  }
  if (options.candidateId) {
    candidates = candidates.filter((c) => c.candidateId === options.candidateId);
  }

  const numReruns = options.reruns !== undefined ? Number(options.reruns) : 3;

  console.log('================================================================');
  console.log(`BEWT-CovExt Milestone M4: Live E2E Candidate Execution (Gate G3)`);
  console.log(`Candidates to Evaluate: ${candidates.length}`);
  console.log(`Reruns for Passed Tests: ${numReruns}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  const baselineInventory = snapshotInventory();
  console.log(`Initial Docker inventory: ${baselineInventory.containers.length} containers, ${baselineInventory.volumes.length} volumes, ${baselineInventory.networks.length} networks`);

  const results = [];
  let passedCandidates = 0;
  let failedCandidates = 0;

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    const candIdxStr = `[${i + 1}/${candidates.length}]`;
    const candTag = `${cand.candidateId} (${cand.application} - ${cand.javaClass})`;
    console.log(`\n----------------------------------------------------------------`);
    console.log(`${candIdxStr} Starting Evaluation for ${candTag}`);
    console.log(`----------------------------------------------------------------`);

    const candRunId = `g3-${cand.candidateId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${timestamp}`;
    const candEvidenceDir = resolve(evidenceBase, cand.application, cand.candidateId, candRunId);
    mkdirSync(candEvidenceDir, { recursive: true });

    const startMs = Date.now();
    let initialOutcome = null;
    let initialJunit = null;
    let initialCleanup = null;

    try {
      initialOutcome = await runG0Workflow(cand.application, candRunId, {
        testClass: cand.javaClass,
        evidenceDir: `docs/tasks/g3-evidence/${cand.application}/${cand.candidateId}/${candRunId}`,
      });

      try {
        initialJunit = JSON.parse(readFileSync(join(candEvidenceDir, 'junit-result.json'), 'utf8'));
      } catch {}
      try {
        initialCleanup = JSON.parse(readFileSync(join(candEvidenceDir, 'cleanup-result.json'), 'utf8'));
      } catch {}
    } catch (err) {
      console.error(`Initial execution exception: ${err.message}`);
      initialOutcome = { exitCode: 1, outcome: 'ERROR', error: err.message };
    }

    const initialPass = initialOutcome?.exitCode === 0 && initialJunit?.outcome === 'PASS' && initialCleanup?.zeroResidualVerified;
    const initialDurationSec = ((Date.now() - startMs) / 1000).toFixed(1);

    console.log(`>>> ${cand.candidateId} Initial Run: ${initialPass ? 'PASS' : 'FAIL'} (exit: ${initialOutcome?.exitCode}, junit: ${initialJunit?.outcome || 'NONE'}, zeroResidual: ${initialCleanup?.zeroResidualVerified || false}, duration: ${initialDurationSec}s)`);

    const rerunResults = [];
    if (initialPass && numReruns > 0) {
      console.log(`>>> Executing ${numReruns} independent clean-state reruns for ${cand.candidateId}...`);
      for (let r = 1; r <= numReruns; r++) {
        const rerunRunId = `g3-${cand.candidateId.toLowerCase().replace(/[^a-z0-9]/g, '')}-r${r}-${timestamp}`;
        const rerunEvidenceDir = resolve(evidenceBase, cand.application, cand.candidateId, rerunRunId);
        mkdirSync(rerunEvidenceDir, { recursive: true });

        const rStartMs = Date.now();
        let rOutcome = null;
        let rJunit = null;
        let rCleanup = null;

        try {
          rOutcome = await runG0Workflow(cand.application, rerunRunId, {
            testClass: cand.javaClass,
            evidenceDir: `docs/tasks/g3-evidence/${cand.application}/${cand.candidateId}/${rerunRunId}`,
          });

          try {
            rJunit = JSON.parse(readFileSync(join(rerunEvidenceDir, 'junit-result.json'), 'utf8'));
          } catch {}
          try {
            rCleanup = JSON.parse(readFileSync(join(rerunEvidenceDir, 'cleanup-result.json'), 'utf8'));
          } catch {}
        } catch (err) {
          console.error(`Rerun ${r} exception: ${err.message}`);
          rOutcome = { exitCode: 1, outcome: 'ERROR', error: err.message };
        }

        const rPass = rOutcome?.exitCode === 0 && rJunit?.outcome === 'PASS' && rCleanup?.zeroResidualVerified;
        const rDurationSec = ((Date.now() - rStartMs) / 1000).toFixed(1);
        console.log(`    Rerun ${r}/${numReruns}: ${rPass ? 'PASS' : 'FAIL'} (${rDurationSec}s)`);

        rerunResults.push({
          rerunIndex: r,
          runId: rerunRunId,
          durationSeconds: Number(rDurationSec),
          exitCode: rOutcome?.exitCode ?? 1,
          outcome: rPass ? 'PASS' : 'FAIL',
          junitOutcome: rJunit?.outcome || 'NONE',
          zeroResidualVerified: rCleanup?.zeroResidualVerified || false,
        });
      }
    }

    const passedReruns = rerunResults.filter((r) => r.outcome === 'PASS').length;
    const flakinessRate = rerunResults.length > 0
      ? (rerunResults.length - passedReruns) / rerunResults.length
      : (initialPass ? 0 : 1.0);

    const overallCandidateOutcome = (initialPass && passedReruns === numReruns) ? 'VALIDATED' : (initialPass ? 'FLAKY' : 'FAILED');

    if (overallCandidateOutcome === 'VALIDATED') {
      passedCandidates++;
    } else {
      failedCandidates++;
    }

    const candidateRecord = {
      candidateId: cand.candidateId,
      application: cand.application,
      javaClass: cand.javaClass,
      initialRun: {
        runId: candRunId,
        durationSeconds: Number(initialDurationSec),
        exitCode: initialOutcome?.exitCode ?? 1,
        outcome: initialPass ? 'PASS' : 'FAIL',
        junitOutcome: initialJunit?.outcome || 'NONE',
        testsRun: initialJunit?.summary?.tests ?? 0,
        failures: initialJunit?.summary?.failures ?? 0,
        errors: initialJunit?.summary?.errors ?? 0,
        zeroResidualVerified: initialCleanup?.zeroResidualVerified || false,
        evidenceDir: `docs/tasks/g3-evidence/${cand.application}/${cand.candidateId}/${candRunId}`,
      },
      reruns: rerunResults,
      totalRuns: 1 + rerunResults.length,
      passedRuns: (initialPass ? 1 : 0) + passedReruns,
      flakinessRate: Number(flakinessRate.toFixed(3)),
      overallOutcome: overallCandidateOutcome,
    };

    results.push(candidateRecord);

    // Save individual candidate result
    const indPath = resolve(evidenceBase, `${cand.candidateId}-result.json`);
    writeFileSync(indPath, JSON.stringify(candidateRecord, null, 2));
  }

  // Final inventory verification
  const finalInventory = snapshotInventory();
  const residualContainers = finalInventory.containers.filter((c) => !baselineInventory.containers.includes(c));
  const residualVolumes = finalInventory.volumes.filter((v) => !baselineInventory.volumes.includes(v));
  const residualNetworks = finalInventory.networks.filter((n) => !baselineInventory.networks.includes(n));

  const allResidualsClean = (
    residualContainers.length === 0 &&
    residualVolumes.length === 0 &&
    residualNetworks.length === 0
  );

  const summary = {
    executedAtUtc: new Date().toISOString(),
    totalCandidates: candidates.length,
    validatedCandidates: passedCandidates,
    failedOrFlakyCandidates: failedCandidates,
    validationRate: candidates.length > 0 ? Number((passedCandidates / candidates.length).toFixed(3)) : 0,
    globalZeroResidualVerified: allResidualsClean,
    residualDetails: {
      residualContainers,
      residualVolumes,
      residualNetworks,
    },
    results,
  };

  const summaryPath = resolve(evidenceBase, 'all-candidates-summary.json');
  const g3SummaryPath = resolve(evidenceBase, 'all-candidates-g3-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  writeFileSync(g3SummaryPath, JSON.stringify(summary, null, 2));

  console.log('\n================================================================');
  console.log(`FINAL G3 CANDIDATE E2E EXECUTION SUMMARY`);
  console.log('================================================================');
  console.log(`Total Candidates Evaluated: ${candidates.length}`);
  console.log(`FULLY VALIDATED (Initial PASS + ${numReruns}/${numReruns} Reruns): ${passedCandidates} / ${candidates.length}`);
  console.log(`FAILED / FLAKY: ${failedCandidates} / ${candidates.length}`);
  console.log(`Global Zero Residual Verified: ${allResidualsClean ? 'YES (PASS)' : 'NO (FAIL)'}`);
  console.log(`Summary Written to: ${summaryPath}\n`);

  console.log('| Candidate ID | Application | Initial | Rerun 1 | Rerun 2 | Rerun 3 | Flakiness | Status    |');
  console.log('|--------------|-------------|---------|---------|---------|---------|-----------|-----------|');
  for (const r of results) {
    const r1 = r.reruns[0]?.outcome || '-';
    const r2 = r.reruns[1]?.outcome || '-';
    const r3 = r.reruns[2]?.outcome || '-';
    const flk = r.initialRun.outcome === 'PASS' ? `${(r.flakinessRate * 100).toFixed(0)}%` : 'N/A';
    console.log(`| ${r.candidateId.padEnd(12)} | ${r.application.padEnd(11)} | ${r.initialRun.outcome.padEnd(7)} | ${r1.padEnd(7)} | ${r2.padEnd(7)} | ${r3.padEnd(7)} | ${flk.padEnd(9)} | ${r.overallOutcome.padEnd(9)} |`);
  }
  console.log('================================================================\n');

  return summary;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  const args = process.argv.slice(2);
  const opts = {};
  for (const arg of args) {
    if (arg.startsWith('--app=')) opts.app = arg.slice(6);
    else if (arg.startsWith('--candidate=')) opts.candidateId = arg.slice(12);
    else if (arg.startsWith('--reruns=')) opts.reruns = Number(arg.slice(9));
    else if (APPS[arg]) opts.app = arg;
  }

  runCandidates(opts)
    .then((summary) => {
      process.exit(summary.validatedCandidates > 0 ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during candidate execution:', err);
      process.exit(1);
    });
}
