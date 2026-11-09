import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const dataset=JSON.parse(fs.readFileSync(path.join(root,'data/reviews/kanboard/t04b-review-dataset.json'),'utf8'));
const hash=(s)=>crypto.createHash('sha256').update(s).digest('hex');
test('contains exact shortlist and every baseline pairing once',()=>{
  assert.deepEqual(dataset.candidates.map(x=>x.id),['KB-GAP-001','KB-GAP-002','KB-GAP-003','KB-GAP-004','KB-GAP-008']);
  assert.equal(dataset.baselineCaseCount,30); assert.equal(dataset.pairCount,150);
  assert.equal(new Set(dataset.pairwiseComparisons.map(x=>`${x.candidateId}:${x.baselineCaseId}`)).size,150);
  for(const c of dataset.candidates) assert.equal(dataset.pairwiseComparisons.filter(x=>x.candidateId===c.id).length,30);
  const shortlist=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/shortlist.json'),'utf8'));
  const listed=shortlist.items?.map(x=>x.candidateId) ?? shortlist.shortlist?.map(x=>x.candidateId);
  assert.deepEqual(listed,['KB-GAP-001','KB-GAP-002','KB-GAP-003','KB-GAP-004','KB-GAP-008']);
});
test('pinned evidence, proposal state and human review fields are explicit',()=>{
  for(const c of dataset.candidates){
    assert.equal(c.status,'PROPOSED'); assert.equal(c.reviewDecision,'PENDING');
    assert.equal(c.humanDecision.decision,null); assert.equal(c.humanDecision.reviewerIdentity,null);
    assert.ok(c.sourceEvidence.length); for(const e of c.sourceEvidence){assert.equal(e.commit,dataset.sourcePins.kanboardCommit);assert.match(e.sha256,/^[a-f0-9]{64}$/);assert.ok(e.permalink.includes(e.commit));}
  }
  assert.equal(dataset.globalAcceptance.g1,'NOT_VERIFIED');
});
test('assignee forged-owner boundary remains unproven; KB-023/026 use observed behavior',()=>{
  const c=dataset.candidates.find(x=>x.id==='KB-GAP-004');
  assert.match(c.technicalRecommendationBasis,/INSUFFICIENT_EVIDENCE/);
  const inv=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'),'utf8'));
  for(const id of ['KB-023','KB-026']) assert.ok(inv.cases.find(x=>x.caseId===id).behaviorInterpretation);
});
test('all pair records carry oracle, assertions and evidence references',()=>{
  for(const p of dataset.pairwiseComparisons){assert.ok(p.baselineOracle.length);assert.ok(p.baselineJavaAssertions.length);assert.ok(p.evidence.length);assert.ok(['DISTINCT_BEHAVIOR_SUPPORTED','PARTIAL_SEMANTIC_OVERLAP','DUPLICATE_BEHAVIOR','INSUFFICIENT_EVIDENCE'].includes(p.classification));}
});
test('accepted input hashes are present and valid',()=>{
  assert.match(dataset.sourcePins.bewtCommit,/^[a-f0-9]{40}$/); assert.match(dataset.sourcePins.kanboardCommit,/^[a-f0-9]{40}$/);
  assert.match(dataset.sourcePins.acceptedInventorySha256,/^[a-f0-9]{64}$/);
  assert.equal(dataset.sourcePins.acceptedInventorySha256,hash(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'))));
});
