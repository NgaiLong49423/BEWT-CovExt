import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const APPS = ['bludit', 'claroline', 'expresscart', 'joomla', 'mantisbt', 'mediawiki', 'prestashop'];
export const BEWT_PIN = '0501249ff3e9a5ea83a06155cd2971dc36197056';
const HASH40 = /^[0-9a-f]{40}$/;
const LINE_RANGES = /^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/;

function validSourcePath(value) {
  return typeof value === 'string' && value.length > 0 && !value.startsWith('/') &&
    !value.includes('\\') && value.split('/').every(part => part !== '' && part !== '.' && part !== '..');
}

function validLineRanges(value) {
  if (typeof value !== 'string' || !LINE_RANGES.test(value)) return false;
  return value.split(',').every(part => {
    const [start, end = start] = part.split('-').map(Number);
    return start > 0 && end >= start;
  });
}

export function validateBundle(datasets, sourceIndex, shortlists) {
  const errors = [];
  const allIds = new Set();
  const normalizedTitles = new Set();
  for (const app of APPS) {
    const data = datasets[app];
    const indexed = sourceIndex?.apps?.[app];
    const shortlist = shortlists[app];
    if (!data || !indexed || !shortlist) { errors.push(`${app}: required dataset/index/shortlist is missing`); continue; }
    const pin = data.sourcePin || {};
    if (data.application !== app || indexed.sourceRepository !== pin.repository) errors.push(`${app}: app/source repository mismatch`);
    if (!HASH40.test(pin.commit || '') || !HASH40.test(pin.treeSha || '')) errors.push(`${app}: malformed source pin`);
    if (pin.commit !== indexed.sourceCommit || pin.treeSha !== indexed.sourceTreeSha) errors.push(`${app}: mixed source pin`);
    if (data.baselinePin?.commit !== BEWT_PIN || indexed.baselinePin?.commit !== BEWT_PIN) errors.push(`${app}: baseline pin mismatch`);
    if (data.candidateCount !== data.candidates?.length) errors.push(`${app}: candidate count mismatch`);
    if (!Array.isArray(data.candidates) || data.candidates.length === 0) errors.push(`${app}: insufficient candidate data`);

    const refs = indexed.sourceReferences || {};
    for (const [id, ref] of Object.entries(refs)) {
      const expectedUrl = `https://github.com/${pin.repository}/blob/${pin.commit}/${ref.path}`;
      if (ref.id !== id || ref.repository !== pin.repository || ref.commit !== pin.commit || ref.treeSha !== pin.treeSha ||
          !validSourcePath(ref.path) || !HASH40.test(ref.blobSha || '') || !validLineRanges(ref.lineRanges) || ref.permalink !== expectedUrl) {
        errors.push(`${app}: invalid source-index pin/path/range/hash/permalink: ${id}`);
      }
    }

    for (const c of data.candidates || []) {
      if (!c.candidateId || !c.title || !c.actor || !c.role || !c.preconditions || !c.fixture || !c.action || !c.oracle?.observable || !c.novelty?.rationale || !c.baselineOverlap?.assessment || !c.negativeControl || !c.testabilityRisk || !c.uncertainty) errors.push(`${app}: incomplete candidate fields: ${c.candidateId || '(no id)'}`);
      if (allIds.has(c.candidateId)) errors.push(`duplicate candidate ID: ${c.candidateId}`);
      allIds.add(c.candidateId);
      const titleKey = c.title?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (normalizedTitles.has(`${app}:${titleKey}`)) errors.push(`${app}: duplicate normalized title: ${c.title}`);
      normalizedTitles.add(`${app}:${titleKey}`);
      if (c.noveltyStatus !== 'NOT_VERIFIED' || c.novelty?.status !== 'NOT_VERIFIED') errors.push(`${app}: false novelty promotion: ${c.candidateId}`);
      if (c.humanDecision !== null || c.novelty?.humanDecision !== null || c.novelty?.decisionOwner !== 'Team Lead / human reviewer') errors.push(`${app}: human decision field is invalid: ${c.candidateId}`);
      const candidateRefs = c.sourceRefs;
      const oracleRefs = c.oracle?.sourceRefs;
      if (!Array.isArray(candidateRefs) || candidateRefs.length === 0 || candidateRefs.some(id => !refs[id])) errors.push(`${app}: invalid source reference: ${c.candidateId}`);
      if (!Array.isArray(oracleRefs) || oracleRefs.length === 0 || oracleRefs.some(id => !candidateRefs?.includes(id) || !refs[id])) errors.push(`${app}: oracle references are not a supported candidate source subset: ${c.candidateId}`);
      for (const id of candidateRefs || []) {
        const ref = refs[id];
        if (ref && (ref.repository !== pin.repository || ref.commit !== pin.commit || ref.treeSha !== pin.treeSha || !HASH40.test(ref.blobSha || '') || ref.permalink !== `https://github.com/${pin.repository}/blob/${pin.commit}/${ref.path}`)) errors.push(`${app}: source hash/pin/permalink mismatch: ${c.candidateId}/${id}`);
      }
      if (c.baselineOverlap?.comparisonBasis?.includes('heuristic')) errors.push(`${app}: heuristic tags used as behavioral proof: ${c.candidateId}`);
    }

    const picked = shortlist.topCandidates;
    if (shortlist.application !== app || shortlist.sourcePin?.repository !== pin.repository || shortlist.sourcePin?.commit !== pin.commit || shortlist.sourcePin?.treeSha !== pin.treeSha) errors.push(`${app}: shortlist pin mismatch`);
    if (!Array.isArray(picked)) errors.push(`${app}: shortlist candidates must be an array`);
    const pickedList = Array.isArray(picked) ? picked : [];
    if (pickedList.length > 5) errors.push(`${app}: shortlist exceeds five candidates`);
    const pickedIds = new Set();
    const pickedOrders = new Set();
    for (const [position, item] of pickedList.entries()) {
      const candidate = data.candidates.find(c => c.candidateId === item.candidateId);
      if (!candidate) errors.push(`${app}: shortlist references unknown candidate: ${item.candidateId}`);
      if (pickedIds.has(item.candidateId)) errors.push(`${app}: duplicate shortlist candidate: ${item.candidateId}`);
      pickedIds.add(item.candidateId);
      if (!Number.isInteger(item.priorityOrder) || item.priorityOrder !== position + 1 || item.priorityOrder > 5 || pickedOrders.has(item.priorityOrder)) errors.push(`${app}: invalid/duplicate shortlist priority: ${item.candidateId}`);
      pickedOrders.add(item.priorityOrder);
      if (candidate && candidate.priorityReviewOrder !== item.priorityOrder) errors.push(`${app}: shortlist/candidate order mismatch: ${item.candidateId}`);
    }
    if (shortlist.humanDecisionStatus !== 'NOT_REVIEWED' || shortlist.decisionLedger !== 'UNCHANGED') errors.push(`${app}: shortlist represents a human decision`);
  }
  return errors;
}

function readBundle(root) {
  const datasets = {}, shortlists = {};
  for (const app of APPS) {
    datasets[app] = JSON.parse(fs.readFileSync(path.join(root, 'data/coverage', app, 'source-backed-gap-proposals.json'), 'utf8'));
    shortlists[app] = JSON.parse(fs.readFileSync(path.join(root, 'data/coverage', app, 'source-backed-gap-shortlist.json'), 'utf8'));
  }
  const index = JSON.parse(fs.readFileSync(path.join(root, 'docs/tasks/T04-E/source-reference-index.json'), 'utf8'));
  return { datasets, shortlists, index };
}

const thisFile = fileURLToPath(import.meta.url);
const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile);
if (isCli) {
  try {
    const rootFlag = process.argv.indexOf('--root');
    const root = rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1] || '') : path.resolve(path.dirname(thisFile), '../../../../');
    const { datasets, shortlists, index } = readBundle(root);
    const errors = validateBundle(datasets, index, shortlists);
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('PASS: seven pinned app datasets, source references, ranges, oracle links, counts, duplicates, novelty and shortlist consistency.');
    }
  } catch (error) {
    console.error(`FAIL: unable to load/validate bundle: ${error.message}`);
    process.exitCode = 1;
  }
}
