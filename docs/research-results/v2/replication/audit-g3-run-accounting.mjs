#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function listFiles(root, predicate, output = []) {
  if (!existsSync(root)) return output;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) listFiles(path, predicate, output);
    else if (predicate(entry.name, path)) output.push(path);
  }
  return output;
}

function runIdsFromSummary(summary) {
  const runs = new Map();
  for (const candidate of summary.results ?? []) {
    for (const run of [candidate.initialRun, ...(candidate.reruns ?? [])]) {
      if (!run?.runId) continue;
      runs.set(run.runId, {
        candidateId: candidate.candidateId,
        application: candidate.application,
        role: run.rerunIndex ? `rerun-${run.rerunIndex}` : 'initial',
      });
    }
  }
  return runs;
}

function junitSummary(path) {
  const xml = readFileSync(path, 'utf8');
  const suite = xml.match(/<testsuite\b([^>]*)>/)?.[1] ?? '';
  const attr = (name) => Number(suite.match(new RegExp(`\\b${name}="(\\d+)"`))?.[1] ?? 0);
  return {
    tests: attr('tests'),
    failures: attr('failures'),
    errors: attr('errors'),
    skipped: attr('skipped'),
    outcome: attr('failures') + attr('errors') > 0 ? 'FAIL' : 'PASS',
  };
}

export function buildRunAccounting(rootDir = '.') {
  const root = resolve(rootDir);
  const evidenceRoot = join(root, 'docs', 'tasks', 'g3-evidence');
  const summaryPath = join(evidenceRoot, 'all-40-candidates-g3-consolidated-summary.json');
  if (!existsSync(summaryPath)) throw new Error(`MISSING_G3_SUMMARY: ${relative(root, summaryPath)}`);
  const summary = readJson(summaryPath);
  const summaryRuns = runIdsFromSummary(summary);
  const recordFiles = listFiles(evidenceRoot, (name) => name === 'run-record.json');
  const junitFiles = listFiles(evidenceRoot, (name) => name.startsWith('TEST-') && name.endsWith('.xml'));
  const records = new Map(recordFiles.map((path) => {
    const record = readJson(path);
    return [record.runId, { path: relative(root, path).replaceAll('\\', '/'), appId: record.appId, task: record.labels?.task }];
  }));
  const junitByRunId = new Map();
  for (const path of junitFiles) {
    const runId = basename(dirname(path));
    const summaries = junitByRunId.get(runId) ?? [];
    summaries.push({ path: relative(root, path).replaceAll('\\', '/'), ...junitSummary(path) });
    junitByRunId.set(runId, summaries);
  }
  const extras = [...records.entries()]
    .filter(([runId]) => !summaryRuns.has(runId))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([runId, record]) => ({
      runId,
      ...record,
      inSummary: false,
      junit: junitByRunId.get(runId) ?? [],
      cleanupFiles: listFiles(evidenceRoot, (name, path) => name === 'cleanup-result.json' && basename(dirname(path)) === runId)
        .map((path) => relative(root, path).replaceAll('\\', '/')),
      classification: /g3-ecgap005-.*20261110184936/.test(runId)
        ? 'UNLISTED_DUPLICATE_EC_GAP_005_BATCH; purpose not recorded in run metadata'
        : runId === 'g3-kbgap001-20261110184802'
          ? 'UNLISTED_KB_GAP_001_INITIAL_FAILURE; purpose not recorded in run metadata'
          : 'UNLISTED_RUN_RECORD; purpose not established',
    }));
  const orphanJUnit = [...junitByRunId.entries()]
    .filter(([runId]) => !records.has(runId))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([runId, junit]) => ({
      runId,
      junit,
      mavenExitFiles: listFiles(evidenceRoot, (name, path) => name === 'maven-exit.json' && basename(dirname(path)) === runId)
        .map((path) => ({ path: relative(root, path).replaceAll('\\', '/'), ...readJson(path) })),
      hasRunRecord: false,
      hasCleanupResult: listFiles(evidenceRoot, (name, path) => name === 'cleanup-result.json' && basename(dirname(path)) === runId).length > 0,
      classification: 'UNREGISTERED_TEST_EXECUTION_ARTIFACTS; run-record and cleanup evidence absent',
    }));

  const jo = summary.results?.find((candidate) => candidate.candidateId === 'JO-GAP-003');
  const joReruns = jo?.reruns ?? [];
  const joRerunFailures = joReruns.filter((run) => run.outcome === 'FAIL').length;
  const joAllRuns = [jo?.initialRun, ...joReruns].filter(Boolean);
  const joAllFailures = joAllRuns.filter((run) => run.outcome === 'FAIL').length;
  const blCleanupPath = join(evidenceRoot, 'bludit', 'BL-GAP-001', 'g3-blgap001-r1-20261110190053', 'cleanup-result.json');
  const blCleanup = existsSync(blCleanupPath) ? readJson(blCleanupPath) : null;
  const residualNames = [
    ...(blCleanup?.residualContainers ?? []),
    ...(blCleanup?.residualNetworks ?? []),
    ...(blCleanup?.residualVolumes ?? []),
  ];
  const kanboardNamedVolumes = residualNames.filter((name) => typeof name === 'string' && /^bewt-covext-kanboard-(?:data|plugins)-g3-kbgap001-/.test(name));

  return {
    schemaVersion: '1.0.0',
    source: relative(root, summaryPath).replaceAll('\\', '/'),
    summary: {
      candidateCount: summary.results?.length ?? null,
      runIds: summaryRuns.size,
      reportedIndividualRuns: summary.totalIndividualRuns ?? null,
      reportedInitialPassCandidates: summary.results?.filter((candidate) => candidate.initialRun?.outcome === 'PASS').length ?? null,
      reportedThreeRerunPassCandidates: summary.validatedCandidates ?? null,
    },
    artifacts: {
      uniqueRunRecordIds: records.size,
      runRecordFiles: recordFiles.length,
      junitXmlFiles: junitFiles.length,
      uniqueJunitRunIds: junitByRunId.size,
      summaryRunIdsMissingRunRecord: [...summaryRuns.keys()].filter((id) => !records.has(id)).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)),
      unlistedRunRecords: extras,
      junitExecutionIdsWithoutRunRecord: orphanJUnit,
    },
    accounting: {
      primarySummaryRunIds: summaryRuns.size,
      additionalRunRecordIds: extras.length,
      additionalJunitExecutionIds: [...junitByRunId.keys()].filter((id) => !summaryRuns.has(id)).length,
      allJunitExecutionIds: junitByRunId.size,
      unregisteredExecutionArtifacts: orphanJUnit.length,
      interpretation: 'The consolidated experiment denominator remains the 79 explicitly listed run IDs. Additional records/JUnit artifacts are preserved as supplementary, unclassified historical attempts and are not silently added to that denominator.',
    },
    joGap003: {
      candidateId: 'JO-GAP-003',
      initialOutcome: jo?.initialRun?.outcome ?? null,
      rerunOutcomes: joReruns.map((run) => run.outcome),
      rerunFailures: joRerunFailures,
      rerunCount: joReruns.length,
      rerunFailureRate: joReruns.length ? joRerunFailures / joReruns.length : null,
      allRunFailures: joAllFailures,
      allRunCount: joAllRuns.length,
      allRunFailureRate: joAllRuns.length ? joAllFailures / joAllRuns.length : null,
      definition: 'Use failures / 3 reruns when reporting rerun instability (2/3 = 66.7%). For overall execution reliability include initial run plus reruns (2/4 = 50%). Do not label the 2/3 rerun ratio as the all-run failure rate.',
    },
    blGap001Cleanup: {
      runId: blCleanup?.runId ?? null,
      zeroResidualVerified: blCleanup?.zeroResidualVerified ?? null,
      residualKanboardNamedVolumes: kanboardNamedVolumes,
      unclassifiedResidualResourceCount: residualNames.length - kanboardNamedVolumes.length,
      interpretation: 'Two residual volume names include the exact Kanboard KB-GAP-001 run ID g3-kbgap001-20261110190120 and are attributed by name to that Kanboard attempt, not to Bludit. The remaining opaque container/network/volume IDs lack saved inspect labels here and stay unattributed. This records a global residual check failure; it does not prove the Bludit cleanup routine deleted or owned Kanboard resources.',
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${JSON.stringify(buildRunAccounting(resolve('.')), null, 2)}\n`);
  } catch (error) {
    console.error('G3_ACCOUNTING_BLOCKED:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  }
}
