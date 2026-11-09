import fs from 'node:fs';
import path from 'node:path';

export const APPS = ['bludit', 'claroline', 'expresscart', 'joomla', 'mantisbt', 'mediawiki', 'prestashop'];
export const BEWT_PIN = '0501249ff3e9a5ea83a06155cd2971dc36197056';

export function validateBundle(datasets, sourceIndex, shortlists) {
  const errors = [];
  const allIds = new Set();
  const normalizedTitles = new Set();
  for (const app of APPS) {
    const data = datasets[app];
    const indexed = sourceIndex?.apps?.[app];
    const shortlist = shortlists[app];
    if (!data || !indexed || !shortlist) { errors.push(`${app}: required dataset/index/shortlist is missing`); continue; }
    if (data.application !== app || indexed.sourceRepository !== data.sourcePin?.repository) errors.push(`${app}: app/source repository mismatch`);
    if (data.sourcePin?.commit !== indexed.sourceCommit || data.sourcePin?.treeSha !== indexed.sourceTreeSha) errors.push(`${app}: mixed source pin`);
    if (data.baselinePin?.commit !== BEWT_PIN || indexed.baselinePin?.commit !== BEWT_PIN) errors.push(`${app}: baseline pin mismatch`);
    if (data.candidateCount !== data.candidates?.length) errors.push(`${app}: candidate count mismatch`);
    if (!Array.isArray(data.candidates) || data.candidates.length === 0) errors.push(`${app}: insufficient candidate data`);
    const refs = indexed.sourceReferences || {};
    for (const c of data.candidates || []) {
      if (!c.candidateId || !c.title || !c.actor || !c.role || !c.preconditions || !c.fixture || !c.action || !c.oracle?.observable || !c.novelty?.rationale || !c.baselineOverlap?.assessment || !c.negativeControl || !c.testabilityRisk || !c.uncertainty) errors.push(`${app}: incomplete candidate fields: ${c.candidateId || '(no id)'}`);
      if (allIds.has(c.candidateId)) errors.push(`duplicate candidate ID: ${c.candidateId}`);
      allIds.add(c.candidateId);
      const titleKey = c.title?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (normalizedTitles.has(`${app}:${titleKey}`)) errors.push(`${app}: duplicate normalized title: ${c.title}`);
      normalizedTitles.add(`${app}:${titleKey}`);
      if (c.noveltyStatus !== 'NOT_VERIFIED' || c.novelty?.status !== 'NOT_VERIFIED') errors.push(`${app}: false novelty promotion: ${c.candidateId}`);
      if (c.humanDecision !== null || c.novelty?.decisionOwner !== 'Team Lead / human reviewer') errors.push(`${app}: human decision field is invalid: ${c.candidateId}`);
      if (!Array.isArray(c.sourceRefs) || c.sourceRefs.length === 0 || c.sourceRefs.some(id => !refs[id])) errors.push(`${app}: invalid source reference: ${c.candidateId}`);
      for (const id of c.sourceRefs || []) {
        const ref = refs[id];
        if (ref && (ref.commit !== data.sourcePin.commit || !/^[0-9a-f]{40}$/.test(ref.blobSha) || !ref.permalink.includes(`/${ref.commit}/${ref.path}`))) errors.push(`${app}: source hash/pin/permalink mismatch: ${c.candidateId}/${id}`);
      }
      if (c.baselineOverlap?.comparisonBasis?.includes('heuristic')) errors.push(`${app}: heuristic tags used as behavioral proof: ${c.candidateId}`);
    }
    if (shortlist.application !== app || shortlist.sourcePin?.commit !== data.sourcePin?.commit) errors.push(`${app}: shortlist pin mismatch`);
    const picked = shortlist.topCandidates || [];
    if (picked.length > 5) errors.push(`${app}: shortlist exceeds five candidates`);
    const pickedIds = new Set();
    for (const item of picked) {
      if (!data.candidates.some(c => c.candidateId === item.candidateId)) errors.push(`${app}: shortlist references unknown candidate: ${item.candidateId}`);
      if (pickedIds.has(item.candidateId)) errors.push(`${app}: duplicate shortlist candidate: ${item.candidateId}`);
      pickedIds.add(item.candidateId);
    }
    if (shortlist.humanDecisionStatus !== 'NOT_REVIEWED' || shortlist.decisionLedger !== 'UNCHANGED') errors.push(`${app}: shortlist represents a human decision`);
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\//, ''))) {
  const root = path.resolve(new URL('../../../../', import.meta.url).pathname.replace(/^\//, ''));
  const datasets = {}, shortlists = {};
  for (const app of APPS) {
    datasets[app] = JSON.parse(fs.readFileSync(path.join(root, 'data/coverage', app, 'source-backed-gap-proposals.json'), 'utf8'));
    shortlists[app] = JSON.parse(fs.readFileSync(path.join(root, 'data/coverage', app, 'source-backed-gap-shortlist.json'), 'utf8'));
  }
  const index = JSON.parse(fs.readFileSync(path.join(root, 'docs/tasks/T04-E/source-reference-index.json'), 'utf8'));
  const errors = validateBundle(datasets, index, shortlists);
  if (errors.length) { console.error(errors.join('\\n')); process.exitCode = 1; }
  else console.log('PASS: seven pinned app datasets, source references, counts, duplicate IDs, novelty and shortlist consistency.');
}
