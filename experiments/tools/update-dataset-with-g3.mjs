import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const g3SummaryPath = resolve('docs/tasks/g3-evidence/all-40-candidates-g3-consolidated-summary.json');
const datasetJsonPath = resolve('docs/research-results/v2/dataset/40-candidate-dataset.json');
const datasetCsvPath = resolve('docs/research-results/v2/dataset/40-candidate-dataset.csv');

const g3Summary = JSON.parse(readFileSync(g3SummaryPath, 'utf8'));
const dataset = JSON.parse(readFileSync(datasetJsonPath, 'utf8'));

const resultMap = new Map(g3Summary.results.map(r => [r.candidateId, r]));

// Update dataset JSON
for (const cand of dataset.candidates) {
  const g3 = resultMap.get(cand.candidateId);
  if (g3) {
    cand.compileStatus = 'PASS';
    cand.e2eInitialOutcome = g3.initialRun.outcome;
    cand.e2eRerunsPassed = g3.reruns.filter(r => r.outcome === 'PASS').length;
    cand.e2eTotalReruns = g3.reruns.length;
    cand.e2eFlakinessRate = g3.flakinessRate;
    cand.e2eOutcome = g3.overallOutcome; // VALIDATED | FLAKY | FAILED
    cand.e2eEvidenceDir = g3.initialRun.evidenceDir;
  }
}

dataset.empiricalExecutionSummary = {
  executedAtUtc: g3Summary.executedAtUtc,
  totalCandidates: g3Summary.totalCandidates,
  validatedCandidates: g3Summary.validatedCandidates,
  flakyCandidates: g3Summary.flakyCandidates,
  failedCandidates: g3Summary.failedCandidates,
  validationRate: g3Summary.validationRate,
  initialPassRate: g3Summary.initialPassRate,
  totalIndividualRuns: g3Summary.totalIndividualRuns,
  totalPassedRuns: g3Summary.totalPassedRuns,
  runPassRate: g3Summary.runPassRate,
  perAppSummary: g3Summary.perAppSummary,
};

writeFileSync(datasetJsonPath, JSON.stringify(dataset, null, 2));
console.log('✓ Updated 40-candidate-dataset.json with verified G3 empirical execution outcomes');

// Update dataset CSV
const csvHeader = [
  'candidateId',
  'application',
  'applicationVersion',
  'title',
  'actor',
  'noveltyGapClass',
  'humanDecision',
  'humanReviewer',
  'javaClass',
  'compileStatus',
  'e2eInitialOutcome',
  'e2eRerunsPassed',
  'e2eFlakinessRate',
  'e2eOutcome',
  'e2eEvidenceDir',
].join(',');

const csvRows = [csvHeader];
for (const c of dataset.candidates) {
  const row = [
    c.candidateId,
    c.application,
    c.applicationVersion,
    `"${(c.title || '').replaceAll('"', '""')}"`,
    `"${(c.actor || '').replaceAll('"', '""')}"`,
    c.noveltyGapClass,
    c.humanDecision,
    `"${c.humanReviewer}"`,
    c.javaClass,
    c.compileStatus,
    c.e2eInitialOutcome || 'NOT_RUN',
    c.e2eRerunsPassed ?? 0,
    c.e2eFlakinessRate ?? 'N/A',
    c.e2eOutcome || 'NOT_EVALUATED',
    `"${c.e2eEvidenceDir || ''}"`,
  ].join(',');
  csvRows.push(row);
}

writeFileSync(datasetCsvPath, csvRows.join('\n'));
console.log('✓ Updated 40-candidate-dataset.csv with verified G3 empirical execution outcomes');
