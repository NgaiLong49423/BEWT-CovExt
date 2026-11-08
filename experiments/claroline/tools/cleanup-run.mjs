import { readFileSync, writeFileSync } from 'node:fs';
import { runCleanupWithExitCode } from './cleanup-claroline-g0.mjs';

const [recordPath, baselinePath, resultPath] = process.argv.slice(2);
const newline = String.fromCharCode(10);
const readJson = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const save = value => writeFileSync(resultPath, JSON.stringify(value, null, 2) + newline, { flag: 'wx' });

if (!recordPath || !baselinePath || !resultPath) {
  console.error('usage: cleanup-run.mjs <owned-resources.json> <docker-before.json> <cleanup-result.json>');
  process.exitCode = 2;
} else {
  try {
    const result = runCleanupWithExitCode({ record: readJson(recordPath), baseline: readJson(baselinePath) });
    save(result.outcome === 'PASS' ? result.result : { outcome: 'BLOCKED', reason: result.reason });
    if (result.outcome === 'BLOCKED') console.error('[BLOCKED] ' + result.reason);
    else console.log(JSON.stringify(result.result));
  } catch (error) {
    process.exitCode = 1;
    const result = { outcome: 'BLOCKED', reason: error?.message || String(error) };
    try { save(result); } catch { /* retain the first result if already written */ }
    console.error('[BLOCKED] ' + result.reason);
  }
}