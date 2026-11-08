import { readFileSync, writeFileSync } from 'node:fs';
import { runCleanupWithExitCode } from './cleanup-bludit-g0.mjs';

const [recordPath, baselinePath, resultPath] = process.argv.slice(2);
const newline = String.fromCharCode(10);
const loadJson = path => JSON.parse(readFileSync(path, 'utf8').replace(String.fromCharCode(0xfeff), ''));
function save(value) { writeFileSync(resultPath, JSON.stringify(value, null, 2) + newline); }

if (!recordPath || !baselinePath || !resultPath) {
  console.error('usage: cleanup-run.mjs <owned-resources.json> <docker-before.json> <cleanup-result.json>');
  process.exitCode = 2;
} else {
  try {
    const result = runCleanupWithExitCode({ record: loadJson(recordPath), baseline: loadJson(baselinePath) });
    if (result.outcome === 'BLOCKED') {
      save({ outcome: 'BLOCKED', reason: result.reason });
      console.error('[BLOCKED] ' + result.reason);
    } else {
      save(result.result);
      console.log(JSON.stringify(result.result));
    }
  } catch (error) {
    process.exitCode = 1;
    const result = { outcome: 'BLOCKED', reason: error?.message || String(error) };
    try { save(result); } catch { /* preserve the original CLI failure */ }
    console.error('[BLOCKED] ' + result.reason);
  }
}