import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runG0Workflow } from '../../tools/unified-g0-runner.mjs';

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const runId = process.argv[2] || '';
  if (!runId) {
    console.error('Usage: node run-mantisbt-g0.mjs <runId>');
    process.exit(1);
  }
  runG0Workflow('mantisbt', runId)
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
