import test from 'node:test';
import assert from 'node:assert/strict';
import { APPS, validateBundle } from '../verify-source-backed-gaps.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const datasets = {}, shortlists = {};
for (const app of APPS) {
  datasets[app] = JSON.parse(fs.readFileSync(new URL(`../../../../../data/coverage/${app}/source-backed-gap-proposals.json`, import.meta.url), 'utf8'));
  shortlists[app] = JSON.parse(fs.readFileSync(new URL(`../../../../../data/coverage/${app}/source-backed-gap-shortlist.json`, import.meta.url), 'utf8'));
}
const index = JSON.parse(fs.readFileSync(new URL('../../source-reference-index.json', import.meta.url), 'utf8'));

test('all seven app bundles are internally consistent', () => {
  assert.deepEqual(validateBundle(datasets, index, shortlists), []);
});

test('mixed application source pin is rejected', () => {
  const copy = structuredClone(datasets); copy.bludit.sourcePin.commit = '0'.repeat(40);
  assert.match(validateBundle(copy, index, shortlists).join(' '), /mixed source pin/);
});

test('duplicate candidate IDs are rejected', () => {
  const copy = structuredClone(datasets); copy.joomla.candidates[0].candidateId = copy.bludit.candidates[0].candidateId;
  assert.match(validateBundle(copy, index, shortlists).join(' '), /duplicate candidate ID/);
});

test('invalid source blob or permalink is rejected', () => {
  const copy = structuredClone(index); copy.apps.mantisbt.sourceReferences['MB-S01'].blobSha = 'not-a-blob';
  assert.match(validateBundle(datasets, copy, shortlists).join(' '), /source hash\/pin\/permalink mismatch/);
});

test('false novelty verification is rejected', () => {
  const copy = structuredClone(datasets); copy.mediawiki.candidates[0].noveltyStatus = 'NOVELTY_VERIFIED';
  assert.match(validateBundle(copy, index, shortlists).join(' '), /false novelty promotion/);
});

test('insufficient candidate fields are rejected', () => {
  const copy = structuredClone(datasets); delete copy.prestashop.candidates[0].fixture;
  assert.match(validateBundle(copy, index, shortlists).join(' '), /incomplete candidate fields/);
});

test('shortlist cannot exceed five or imply human approval', () => {
  const copy = structuredClone(shortlists); copy.claroline.topCandidates = Array(6).fill(copy.claroline.topCandidates[0]);
  assert.match(validateBundle(datasets, index, copy).join(' '), /shortlist exceeds five/);
});

test('unknown source reference ID is rejected', () => {
  const copy = structuredClone(datasets); copy.expresscart.candidates[0].sourceRefs = ['EC-SRC-NOT-INDEXED'];
  assert.match(validateBundle(copy, index, shortlists).join(' '), /invalid source reference/);
});

test('source reference path, tree and line ranges must match the pinned repository', () => {
  const copy = structuredClone(index);
  copy.apps.bludit.sourceReferences['BL-S01'].path = '../outside.php';
  copy.apps.claroline.sourceReferences['CL-S01'].repository = 'unrelated/repo';
  copy.apps.joomla.sourceReferences['JO-S01'].treeSha = '0'.repeat(40);
  copy.apps.mediawiki.sourceReferences['MW-S01'].lineRanges = '12-x';
  const errors = validateBundle(datasets, copy, shortlists).join(' ');
  assert.match(errors, /invalid source-index pin\/path\/range/);
});

test('oracle source references must be a nonempty subset of candidate references', () => {
  const copy = structuredClone(datasets);
  copy.prestashop.candidates[0].oracle.sourceRefs = ['PS-S04'];
  assert.match(validateBundle(copy, index, shortlists).join(' '), /oracle references are not a supported candidate source subset/);
});

test('shortlist count and unique ordered priorities must be consistent', () => {
  const copy = structuredClone(shortlists);
  copy.joomla.topCandidates[1].priorityOrder = 1;
  const errors = validateBundle(datasets, index, copy).join(' ');
  assert.match(errors, /invalid\/duplicate shortlist priority/);
  const outOfOrder = structuredClone(shortlists);
  outOfOrder.joomla.topCandidates[1].priorityOrder = 3;
  assert.match(validateBundle(datasets, index, outOfOrder).join(' '), /invalid\/duplicate shortlist priority/);
  const malformed = structuredClone(shortlists);
  malformed.joomla.topCandidates = 'not-an-array';
  assert.match(validateBundle(datasets, index, malformed).join(' '), /shortlist candidates must be an array/);
});

test('proposal and shortlist counts must equal prioritized candidate count', () => {
  const copy = structuredClone(datasets);
  copy.expresscart.shortlistCount = 3;
  assert.match(validateBundle(copy, index, shortlists).join(' '), /expresscart: shortlist count mismatch/);

  const missingPriority = structuredClone(datasets);
  missingPriority.expresscart.candidates[1].priorityReviewOrder = null;
  assert.match(validateBundle(missingPriority, index, shortlists).join(' '), /expresscart: shortlist count mismatch/);
});

test('shortlist IDs must match proposal priority order exactly', () => {
  const copy = structuredClone(shortlists);
  copy.expresscart.topCandidates[0].candidateId = 'EC-GAP-004';
  const errors = validateBundle(datasets, index, copy).join(' ');
  assert.match(errors, /prioritized candidates do not match shortlist IDs\/order/);
});

function makeCliFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 't04e-cli-'));
  for (const app of APPS) {
    const dir = path.join(root, 'data/coverage', app);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(new URL(`../../../../../data/coverage/${app}/source-backed-gap-proposals.json`, import.meta.url), path.join(dir, 'source-backed-gap-proposals.json'));
    fs.copyFileSync(new URL(`../../../../../data/coverage/${app}/source-backed-gap-shortlist.json`, import.meta.url), path.join(dir, 'source-backed-gap-shortlist.json'));
  }
  const taskDir = path.join(root, 'docs/tasks/T04-E');
  fs.mkdirSync(taskDir, { recursive: true });
  fs.copyFileSync(new URL('../../source-reference-index.json', import.meta.url), path.join(taskDir, 'source-reference-index.json'));
  return root;
}

test('CLI validates fixture data, prints PASS, and rejects invalid data with nonzero exit', () => {
  const root = makeCliFixture();
  const cli = fileURLToPath(new URL('../verify-source-backed-gaps.mjs', import.meta.url));
  try {
    const valid = spawnSync(process.execPath, [cli, '--root', root], { encoding: 'utf8' });
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /^PASS:/);

    const badPath = path.join(root, 'data/coverage/bludit/source-backed-gap-proposals.json');
    const bad = JSON.parse(fs.readFileSync(badPath, 'utf8'));
    bad.shortlistCount += 1;
    fs.writeFileSync(badPath, JSON.stringify(bad));
    const invalid = spawnSync(process.execPath, [cli, '--root', root], { encoding: 'utf8' });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /shortlist count mismatch/);
    assert.doesNotMatch(invalid.stdout, /^PASS:/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
