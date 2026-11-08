import { readFileSync, writeFileSync } from 'node:fs';
import { runCleanupWithExitCode } from './cleanup-bludit-g0.mjs';
const [recordPath, baselinePath, resultPath] = process.argv.slice(2);
if (!recordPath || !baselinePath || !resultPath) { console.error('[BLOCKED] Usage: node cleanup-run.mjs <record.json> <baseline.json> <result.json>'); process.exitCode=1; }
else {
 const loadJson=(p)=>JSON.parse(readFileSync(p,'utf8').replace(String.fromCharCode(0xfeff),'')); const outcome=runCleanupWithExitCode({record:loadJson(recordPath),baseline:loadJson(baselinePath)});
 if(outcome.outcome==='BLOCKED') console.error('[BLOCKED] '+outcome.reason);
 else { writeFileSync(resultPath,JSON.stringify(outcome.result,null,2)+String.fromCharCode(10)); console.log(JSON.stringify(outcome.result)); }
}
