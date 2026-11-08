import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseApplicationManifest } from '../../../../framework/src/contracts.ts';
import { labelsForRun, promoteBluditDraft } from '../bludit-g0.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const draft = JSON.parse(fs.readFileSync(path.join(root, 'docs/tasks/T02/manifests/bludit.draft.json'), 'utf8'));
test('active Bludit runtime manifest parses and preserves verified source and registry digest', () => {
 const raw = JSON.parse(fs.readFileSync(path.join(root, 'config/apps/bludit.json'), 'utf8'));
 const parsed = parseApplicationManifest(raw);
 assert.equal(parsed.appId, 'bludit');
 assert.equal(parsed.source.commit, '44de235a5eedda9b80d9f0babd9fd5cb8c6943bd');
 assert.equal(parsed.runtime.imageDigest, 'sha256:fa1bfd57ced7638676cef221907cc43d14ec37aa2393e57f2ddd925df3f4fae9');
 assert.equal(Object.hasOwn(raw, 'manifestType'), false);
});
test('promotion rejects missing draft marker and unverified or malformed image digests', () => {
 assert.equal(promoteBluditDraft(draft, 'sha256:' + 'a'.repeat(64)).appId, 'bludit');
 assert.throws(() => promoteBluditDraft(draft, 'NOT_PULLED_STATIC_AUDIT'), /verified sha256 image digest/);
 assert.throws(() => promoteBluditDraft({ ...draft, manifestType: undefined }, 'sha256:' + 'a'.repeat(64)), /draft marker/);
 assert.throws(() => parseApplicationManifest(draft), /unsupported fields/);
});
test('run IDs produce the complete Bludit ownership tuple', () => {
 assert.deepEqual(labelsForRun('t03b1-a-20261108-r1'), {project:'bewt-covext',owner:'bewt-covext','managed-by':'bewt-covext-agent',app:'bludit',task:'t03b1-g0',runId:'t03b1-a-20261108-r1'});
 assert.throws(() => labelsForRun('Bad Run'), /runId/);
});
