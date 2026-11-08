import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRuntimeManifestCollection } from './verify-review-fixes.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../');
const appsDir = path.join(repoRoot, 'config/apps');
const draftDir = path.join(repoRoot, 'docs/tasks/T02/manifests');
const loadFrom = (dir) => (file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));

test('active config/apps isolation accepts multiple parser-valid runtime manifests', () => {
  const files = fs.readdirSync(appsDir).filter((file) => file.endsWith('.json'));
  const manifests = validateRuntimeManifestCollection(files, loadFrom(appsDir));
  assert.deepEqual(manifests.map(({ manifest }) => manifest.appId).sort(), ['expresscart', 'kanboard']);
});

test('active config/apps isolation rejects draft manifests even beside valid runtime manifests', () => {
  const runtime = JSON.parse(fs.readFileSync(path.join(appsDir, 'kanboard.json'), 'utf8'));
  const draft = JSON.parse(fs.readFileSync(path.join(draftDir, 'joomla.draft.json'), 'utf8'));
  assert.throws(() => validateRuntimeManifestCollection(['kanboard.json', 'joomla.json'], (file) => file === 'kanboard.json' ? runtime : draft), /draft manifest|unsupported fields/);
});

test('active config/apps isolation rejects duplicate app IDs', () => {
  const runtime = JSON.parse(fs.readFileSync(path.join(appsDir, 'kanboard.json'), 'utf8'));
  assert.throws(() => validateRuntimeManifestCollection(['one.json', 'two.json'], () => runtime), /Duplicate runtime manifest appId/);
});
