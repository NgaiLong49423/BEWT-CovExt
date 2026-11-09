import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tool = fileURLToPath(new URL('../../../docs/tasks/T03-A1/tools/record-baseline-provenance.mjs', import.meta.url));
test('provenance recorder refuses output inside its read-only source tree before reading Git', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bewt-provenance-safety-'));
  try {
    const source = path.join(temp, 'source');
    const nested = path.join(source, 'nested');
    fs.mkdirSync(nested, { recursive: true });
    for (const output of [path.join(source, 'evidence.json'), path.join(nested, 'evidence.json')]) {
      const result = spawnSync(process.execPath, [tool, source, output], { encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Output must be outside the read-only BEWT source tree/);
      assert.equal(fs.existsSync(output), false);
    }
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
