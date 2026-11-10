import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const evidenceDir = resolve('docs/tasks/g3-evidence');
const files = readdirSync(evidenceDir).filter(f => f.endsWith('-result.json')).sort();

console.log(`Found ${files.length} candidate result files.`);

const results = [];
let validatedCount = 0;
let flakyCount = 0;
let failedCount = 0;
let totalRuns = 0;
let totalPassedRuns = 0;

for (const f of files) {
  const content = JSON.parse(readFileSync(resolve(evidenceDir, f), 'utf8'));
  results.push(content);
  totalRuns += content.totalRuns;
  totalPassedRuns += content.passedRuns;

  if (content.overallOutcome === 'VALIDATED') validatedCount++;
  else if (content.overallOutcome === 'FLAKY') flakyCount++;
  else failedCount++;
}

// Sort results by application, candidateId
results.sort((a, b) => a.application.localeCompare(b.application) || a.candidateId.localeCompare(b.candidateId));

const consolidated = {
  executedAtUtc: new Date().toISOString(),
  totalCandidates: results.length,
  validatedCandidates: validatedCount,
  flakyCandidates: flakyCount,
  failedCandidates: failedCount,
  validationRate: Number((validatedCount / results.length).toFixed(3)),
  initialPassRate: Number(((validatedCount + flakyCount) / results.length).toFixed(3)),
  totalIndividualRuns: totalRuns,
  totalPassedRuns: totalPassedRuns,
  runPassRate: Number((totalPassedRuns / totalRuns).toFixed(3)),
  perAppSummary: {},
  results,
};

const apps = [...new Set(results.map(r => r.application))].sort();
for (const app of apps) {
  const appRes = results.filter(r => r.application === app);
  const val = appRes.filter(r => r.overallOutcome === 'VALIDATED').length;
  const flk = appRes.filter(r => r.overallOutcome === 'FLAKY').length;
  const fail = appRes.filter(r => r.overallOutcome === 'FAILED').length;
  consolidated.perAppSummary[app] = {
    total: appRes.length,
    validated: val,
    flaky: flk,
    failed: fail,
    validationRate: Number((val / appRes.length).toFixed(3)),
  };
}

const outPath = resolve(evidenceDir, 'all-40-candidates-g3-consolidated-summary.json');
writeFileSync(outPath, JSON.stringify(consolidated, null, 2));

console.log('\n========================================================================================');
console.log('BEWT-CovExt Milestone M4: Consolidated 40-Candidate E2E Empirical Results (Gate G3)');
console.log('========================================================================================');
console.log(`Total Candidates Evaluated: ${results.length}`);
console.log(`FULLY VALIDATED (Initial PASS + 3/3 Reruns): ${validatedCount} / ${results.length} (${(consolidated.validationRate * 100).toFixed(1)}%)`);
console.log(`FLAKY (Initial PASS, Rerun FAIL):           ${flakyCount} / ${results.length} (${(flakyCount / results.length * 100).toFixed(1)}%)`);
console.log(`FAILED (Initial Clean-State FAIL):           ${failedCount} / ${results.length} (${(failedCount / results.length * 100).toFixed(1)}%)`);
console.log(`Total E2E Container Executions:             ${totalRuns} (Passed: ${totalPassedRuns})`);
console.log('========================================================================================\n');

console.log('| App         | Total | Validated | Flaky | Failed | Val Rate |');
console.log('|-------------|-------|-----------|-------|--------|----------|');
for (const [app, stats] of Object.entries(consolidated.perAppSummary)) {
  console.log(`| ${app.padEnd(11)} | ${String(stats.total).padEnd(5)} | ${String(stats.validated).padEnd(9)} | ${String(stats.flaky).padEnd(5)} | ${String(stats.failed).padEnd(6)} | ${(stats.validationRate * 100).toFixed(0).padStart(7)}% |`);
}
console.log('\n----------------------------------------------------------------------------------------');
console.log('| Candidate ID | Application | Initial | Rerun 1 | Rerun 2 | Rerun 3 | Flakiness | Status    |');
console.log('|--------------|-------------|---------|---------|---------|---------|-----------|-----------|');
for (const r of results) {
  const r1 = r.reruns[0]?.outcome || '-';
  const r2 = r.reruns[1]?.outcome || '-';
  const r3 = r.reruns[2]?.outcome || '-';
  const flk = r.initialRun.outcome === 'PASS' ? `${(r.flakinessRate * 100).toFixed(0)}%` : 'N/A';
  console.log(`| ${r.candidateId.padEnd(12)} | ${r.application.padEnd(11)} | ${r.initialRun.outcome.padEnd(7)} | ${r1.padEnd(7)} | ${r2.padEnd(7)} | ${r3.padEnd(7)} | ${flk.padEnd(9)} | ${r.overallOutcome.padEnd(9)} |`);
}
console.log('========================================================================================\n');
