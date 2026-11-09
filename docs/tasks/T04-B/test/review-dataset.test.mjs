import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendHumanDecision, getCandidateReviewState, validateDecisionLedger, validateDecisionPayload } from '../tools/human-review-decisions.mjs';

const root=process.cwd();
const datasetPath=path.join(root,'data/reviews/kanboard/t04b-review-dataset.json');
const ledgerPath=path.join(root,'data/reviews/kanboard/human-review-decisions.jsonl');
const dataset=JSON.parse(fs.readFileSync(datasetPath,'utf8'));
const hash=(s)=>crypto.createHash('sha256').update(s).digest('hex');
const ids=['KB-GAP-001','KB-GAP-002','KB-GAP-003','KB-GAP-004','KB-GAP-008'];
const overlapFlags=new Set(['KB-GAP-001:KB-017','KB-GAP-001:KB-018','KB-GAP-001:KB-027','KB-GAP-003:KB-003','KB-GAP-003:KB-004','KB-GAP-004:KB-013','KB-GAP-008:KB-006','KB-GAP-008:KB-007']);

function reviewerFixture(candidateId='KB-GAP-002', decision='REVISE') {
  const candidate=dataset.candidates.find((item)=>item.id===candidateId);
  const evidence=dataset.evidenceProvenanceIndex[0];
  return {
    candidateId,
    candidateVersionSha256:candidate.candidateVersionSha256,
    reviewedDatasetSha256:hash(fs.readFileSync(datasetPath)),
    reviewedCommitSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    reviewerIdentity:'TEST_FIXTURE_ONLY_NOT_A_REAL_REVIEWER',
    decisionDate:'2026-11-09T12:00:00.000Z',
    decision,
    rationale:'Synthetic validator fixture; this is not a human review decision.',
    oracleConfirmation:{status:'CONDITIONED',rationale:'Synthetic test data only.'},
    noveltyAssessment:{status:'INCONCLUSIVE',rationale:'Synthetic test data only.'},
    conditionsForImplementation:['Keep this synthetic fixture out of the official review ledger.'],
    reviewerEvidence:[{path:evidence.path,sha256:evidence.sha256,description:'Synthetic test reference to a pinned source; not reviewer evidence.'}],
  };
}

test('keeps the exact five candidates and 150 candidate-baseline records',()=>{
  assert.deepEqual(dataset.candidates.map((x)=>x.id),ids);
  assert.equal(dataset.baselineCaseCount,30); assert.equal(dataset.pairCount,150);
  assert.equal(new Set(dataset.pairwiseComparisons.map((x)=>`${x.candidateId}:${x.baselineCaseId}`)).size,150);
  for(const id of ids) assert.equal(dataset.pairwiseComparisons.filter((x)=>x.candidateId===id).length,30);
});

test('preserves all eight explicit overlap flags and their pair evidence',()=>{
  const overlaps=dataset.pairwiseComparisons.filter((x)=>x.classification==='PARTIAL_SEMANTIC_OVERLAP');
  assert.equal(overlaps.length,8);
  assert.deepEqual(new Set(overlaps.map((x)=>`${x.candidateId}:${x.baselineCaseId}`)),overlapFlags);
  for(const pair of overlaps){assert.ok(pair.rationale.length>40);assert.ok(pair.baselineAction.length);assert.ok(pair.baselineOracle.length);assert.ok(pair.baselineJavaAssertions.length);assert.ok(pair.evidence.some(x=>x.type==='BEWT_JAVA_ASSERTION'));assert.ok(pair.evidence.some(x=>x.type==='KANBOARD_UPSTREAM_SOURCE'));}
});

test('unflagged pairs remain screening results and never claim semantic novelty',()=>{
  const unflagged=dataset.pairwiseComparisons.filter((x)=>x.classification==='NO_DIRECT_OVERLAP_FLAGGED');
  assert.equal(unflagged.length,142);
  for(const pair of unflagged){assert.equal(pair.screeningMethod,'RULE_BASED_SCREENING');assert.equal(pair.screeningRuleId,'NO_DIRECT_OVERLAP_RULE_MATCH');assert.equal(pair.semanticReviewStatus,'PENDING_INDEPENDENT_REVIEW');assert.equal(pair.humanNoveltyDecision,null);assert.match(pair.rationale,/not a finding of distinct behavior/i);}
  assert.ok(!dataset.pairwiseComparisons.some((x)=>x.classification==='DISTINCT_BEHAVIOR_SUPPORTED'));
  assert.equal(dataset.semanticReviewStatus,'PENDING_INDEPENDENT_REVIEW');
  assert.equal(dataset.globalAcceptance.g1,'NOT_VERIFIED');
});

test('screening counts exactly match the 150 records',()=>{
  const counts=dataset.pairwiseComparisons.reduce((out,p)=>(out[p.classification]=(out[p.classification]??0)+1,out),{});
  assert.deepEqual(dataset.screeningCounts,counts);
  assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),150);
});

test('static candidate and provenance records remain pinned and human fields blank',()=>{
  const inventory=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'),'utf8'));
  const gaps=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/gap-candidates.json'),'utf8'));
  const provenance=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/provenance-index.json'),'utf8'));
  const sourceHashes=new Map(dataset.evidenceProvenanceIndex.filter(x=>x.type==='KANBOARD_UPSTREAM_SOURCE').map(x=>[x.path,x.sha256]));
  for(const candidate of dataset.candidates){
    assert.equal(candidate.status,'PROPOSED');assert.equal(candidate.reviewDecision,'PENDING');
    for(const value of Object.values(candidate.humanDecision)) assert.equal(value,null);
    const sourceCandidate=gaps.items.find(x=>x.id===candidate.id);assert.ok(sourceCandidate);
    assert.equal(candidate.candidateVersionSha256,hash(JSON.stringify(sourceCandidate)));
    for(const source of candidate.sourceEvidence){assert.equal(source.commit,dataset.sourcePins.kanboardCommit);assert.equal(source.sha256,sourceHashes.get(source.path));}
  }
  assert.equal(dataset.sourcePins.bewtCommit,inventory.bewtBenchmarkCommit);
  assert.equal(dataset.sourcePins.kanboardCommit,gaps.upstreamCommit);
  for(const item of dataset.evidenceProvenanceIndex){assert.match(item.sha256,/^[a-f0-9]{64}$/);assert.match(item.commit,/^[a-f0-9]{40}$/);assert.ok(item.permalink.includes(item.commit));}
  assert.ok(provenance.workingCopyComparison.mismatches===0);
});

test('all 150 records retain both baseline and candidate action/oracle/assertion evidence',()=>{
  const cases=new Set(JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'),'utf8')).cases.map(x=>x.caseId));
  const refs=new Map(dataset.evidenceProvenanceIndex.map(x=>[`${x.type}:${x.path}`,x.sha256]));
  for(const pair of dataset.pairwiseComparisons){
    assert.ok(cases.has(pair.baselineCaseId));assert.ok(pair.baselineAction.length);assert.ok(pair.baselineOracle.length);assert.ok(pair.baselineJavaAssertions.length);assert.ok(pair.candidateBehavior);assert.ok(pair.candidateOracle);
    assert.ok(pair.evidence.some(x=>x.type==='BEWT_GHERKIN'));assert.ok(pair.evidence.some(x=>x.type==='BEWT_JAVA_ASSERTION'));
    for(const ref of pair.evidence) assert.equal(ref.sha256,refs.get(`${ref.type}:${ref.path}`));
  }
});

test('review packet set and machine schemas are valid, and official decision ledger remains empty',()=>{
  const staticSchema=JSON.parse(fs.readFileSync(path.join(root,'data/reviews/kanboard/t04b-review-dataset.schema.json'),'utf8'));
  const decisionSchema=JSON.parse(fs.readFileSync(path.join(root,'data/reviews/kanboard/human-review-decision.schema.json'),'utf8'));
  assert.equal(staticSchema.properties.screeningMethod.const,'RULE_BASED_SCREENING');
  assert.deepEqual(decisionSchema.properties.decision.enum,['ACCEPT','REVISE','REJECT']);
  assert.ok(decisionSchema.required.includes('candidateVersionSha256'));assert.ok(decisionSchema.required.includes('reviewedDatasetSha256'));assert.ok(decisionSchema.required.includes('reviewedCommitSha'));assert.ok(decisionSchema.required.includes('reviewerEvidence'));
  const rubric=fs.readFileSync(path.join(root,'docs/tasks/T04-B/HUMAN-REVIEW-RUBRIC.md'),'utf8');
  for(const dimension of ['Source validity','Behavioral novelty','Oracle clarity','Fixture feasibility','UI automation feasibility','Isolation and cleanup','Historical overlap','Evidence sufficiency']) assert.ok(rubric.includes(dimension));
  const packets=path.join(root,'docs/tasks/T04-B/review-packets');
  assert.deepEqual(fs.readdirSync(packets).sort(),ids.map((x)=>`${x}.md`).sort());
  for(const id of ids){const packet=fs.readFileSync(path.join(packets,`${id}.md`),'utf8');assert.match(packet,/NO_DIRECT_OVERLAP_FLAGGED/);assert.match(packet,/independent semantic review/i);for(const field of ['Reviewer identity: null','Review date: null','Commit reviewed: null','Decision: null','Rationale: null','Oracle confirmation: null','Novelty assessment: null','Conditions for implementation: null','Reviewer evidence: null']) assert.ok(packet.includes(field));}
  assert.equal(fs.readFileSync(ledgerPath,'utf8'),'');
});

test('custom decision validator accepts a complete reviewer payload and rejects missing reviewer/evidence fields',()=>{
  const good=reviewerFixture();
  assert.equal(validateDecisionPayload(good,{root}).candidateId,good.candidateId);
  for(const field of ['reviewerIdentity','decisionDate','rationale','reviewerEvidence','reviewedCommitSha','reviewedDatasetSha256','candidateVersionSha256']){
    const bad={...good};delete bad[field];assert.throws(()=>validateDecisionPayload(bad,{root}),new RegExp(field));
  }
  const noEvidence={...good,reviewerEvidence:[]};assert.throws(()=>validateDecisionPayload(noEvidence,{root}),/reviewerEvidence/);
});

test('candidate-version or dataset-hash mismatch rejects a decision for stale review input',()=>{
  const wrongCandidate={...reviewerFixture(),candidateVersionSha256:'0'.repeat(64)};
  assert.throws(()=>validateDecisionPayload(wrongCandidate,{root}),/candidate hash mismatch/i);
  const wrongDataset={...reviewerFixture(),reviewedDatasetSha256:'0'.repeat(64)};
  assert.throws(()=>validateDecisionPayload(wrongDataset,{root}),/reviewedDatasetSha256 mismatch/i);
});

test('append-only history preserves decisions, links revisions and flags stale candidate versions',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'t04b-review-ledger-test-'));
  const tempLedger=path.join(temp,'human-review-decisions.jsonl');
  try{
    const first=appendHumanDecision(reviewerFixture('KB-GAP-002','REVISE'),{root,ledgerPath:tempLedger,allowExternalLedger:true});
    const prefix=fs.readFileSync(tempLedger,'utf8');
    const second=appendHumanDecision(reviewerFixture('KB-GAP-002','ACCEPT'),{root,ledgerPath:tempLedger,allowExternalLedger:true});
    const content=fs.readFileSync(tempLedger,'utf8');
    assert.ok(content.startsWith(prefix));
    const records=validateDecisionLedger(content);assert.equal(records.length,2);assert.equal(records[0].recordId,first.recordId);assert.equal(records[1].recordId,second.recordId);
    assert.equal(records[0].recordSequence,1);assert.equal(records[1].recordSequence,2);assert.equal(records[1].supersedesRecordId,records[0].recordId);
    assert.equal(validateDecisionLedger(`${JSON.stringify(records[0])}\n`).length,1);
    const missingReviewer={...records[0]};delete missingReviewer.reviewerIdentity;
    assert.throws(()=>validateDecisionLedger(`${JSON.stringify(missingReviewer)}\n`),/reviewerIdentity/);
    const missingEvidence={...records[0]};delete missingEvidence.reviewerEvidence;
    assert.throws(()=>validateDecisionLedger(`${JSON.stringify(missingEvidence)}\n`),/reviewerEvidence/);
    const invalidDecision={...records[0],decision:'APPROVED'};
    assert.throws(()=>validateDecisionLedger(`${JSON.stringify(invalidDecision)}\n`),/unsupported candidate or decision/);
    assert.equal(getCandidateReviewState('KB-GAP-002',content,{root}).status,'ACCEPT');
    const stale={...records[1],recordSequence:1,previousRecordHash:null,supersedesRecordId:null,candidateVersionSha256:'0'.repeat(64)};
    assert.equal(getCandidateReviewState('KB-GAP-002',`${JSON.stringify(stale)}\n`,{root}).status,'REVIEW_REQUIRED_CANDIDATE_VERSION_CHANGED');
    const staleDataset={...records[1],recordSequence:1,previousRecordHash:null,supersedesRecordId:null,reviewedDatasetSha256:'0'.repeat(64)};
    assert.equal(getCandidateReviewState('KB-GAP-002',`${JSON.stringify(staleDataset)}\n`,{root}).status,'REVIEW_REQUIRED_DATASET_VERSION_CHANGED');
    assert.throws(()=>validateDecisionLedger(content.replace(records[0].rationale,'tampered history')),/hash chain mismatch|canonical compact JSON/);
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});

test('regenerating static review data leaves the separate official decision ledger unchanged',()=>{
  const ledgerBefore=fs.readFileSync(ledgerPath);
  const hashesBefore=dataset.candidates.map(x=>x.candidateVersionSha256);
  const build=spawnSync(process.execPath,[path.join(root,'docs/tasks/T04-B/tools/build-review-dataset.mjs')],{cwd:root,encoding:'utf8'});
  assert.equal(build.status,0,build.stderr);
  assert.deepEqual(fs.readFileSync(ledgerPath),ledgerBefore);
  const after=JSON.parse(fs.readFileSync(datasetPath,'utf8'));
  assert.deepEqual(after.candidates.map(x=>x.candidateVersionSha256),hashesBefore);
  assert.deepEqual(fs.readFileSync(ledgerPath),Buffer.alloc(0));
});

test('pinned T04-A oracle corrections remain in the accepted inventory',()=>{
  const inv=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'),'utf8'));
  for(const id of ['KB-023','KB-026']) assert.ok(inv.cases.find(x=>x.caseId===id).behaviorInterpretation);
});
