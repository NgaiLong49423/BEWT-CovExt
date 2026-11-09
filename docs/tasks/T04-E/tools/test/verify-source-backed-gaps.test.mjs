import test from 'node:test';
import assert from 'node:assert/strict';
import { APPS, validateBundle } from '../verify-source-backed-gaps.mjs';
import fs from 'node:fs';

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
