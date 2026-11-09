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
  const inventory=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'),'utf8'));
  const gaps=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/gap-candidates.json'),'utf8'));
  const provenance=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/provenance-index.json'),'utf8'));
  const upstream=new Map(dataset.evidenceProvenanceIndex.filter(x=>x.type==='KANBOARD_UPSTREAM_SOURCE').map(x=>[x.path,x.sha256]));
  const expectedIds=['KB-GAP-001','KB-GAP-002','KB-GAP-003','KB-GAP-004','KB-GAP-008'];
  assert.deepEqual(dataset.candidates.map(x=>x.id),expectedIds);
  for(const c of dataset.candidates){
    assert.equal(c.status,'PROPOSED'); assert.equal(c.reviewDecision,'PENDING');
    for(const value of Object.values(c.humanDecision)) assert.equal(value,null);
    assert.deepEqual(Object.keys(c.rubricAssessment).sort(),['behavioralNovelty','evidenceSufficiency','fixtureFeasibility','historicalOverlap','isolationAndCleanup','oracleClarity','sourceValidity','uiAutomationFeasibility'].sort());
    assert.ok(c.technicalReview.unresolvedQuestions.length); assert.ok(c.technicalReview.implementationConditions.length);
    assert.equal(c.technicalReview.proposedDecision,c.technicalRecommendation);
    const accepted=gaps.items.find(x=>x.id===c.id); assert.ok(accepted);
    assert.equal(c.candidateVersionSha256,hash(JSON.stringify(accepted)));
    assert.match(c.candidateVersionSha256Input,/gap-candidates\.json/);
    assert.ok(c.sourceEvidence.length); for(const e of c.sourceEvidence){assert.equal(e.commit,dataset.sourcePins.kanboardCommit);assert.equal(e.sha256,upstream.get(e.path));assert.match(e.sha256,/^[a-f0-9]{64}$/);assert.ok(e.permalink.includes(e.commit));assert.ok(!path.isAbsolute(e.path));}
    assert.deepEqual(c.baselineComparisonCaseIds,c.technicalReview.baselineComparisonCaseIds);
    assert.ok(['RECOMMEND_ACCEPT','RECOMMEND_REVISE','RECOMMEND_REJECT','INSUFFICIENT_EVIDENCE'].includes(c.technicalRecommendation));
    assert.equal(c.qualificationStages.staticSourceVerification,'STATIC_SOURCE_VERIFIED');
    assert.equal(c.qualificationStages.engineeringReview,'ENGINEERING_REVIEW_COMPLETE');
    assert.equal(c.qualificationStages.humanReview,'HUMAN_REVIEW_PENDING');
    assert.equal(c.qualificationStages.humanReviewComplete,false);
    assert.equal(c.qualificationStages.g1ReadyForTeamLeadAcceptance,false);
    assert.equal(c.qualificationStages.overallG1Qualification,'NOT_VERIFIED');
    assert.equal(c.oracleAssessment.runtimeStatus,'NOT_RUN');
    assert.equal(c.fixtureAssessment.executionStatus,'NOT_RUN');
    assert.ok(c.fixtureAssessment.fixture&&c.fixtureAssessment.reset&&c.fixtureAssessment.cleanup);
  }
  assert.equal(dataset.sourcePins.bewtCommit,inventory.bewtBenchmarkCommit);
  assert.equal(dataset.sourcePins.kanboardCommit,gaps.upstreamCommit);
  assert.equal(dataset.evidenceProvenanceIndex.length, new Set(dataset.evidenceProvenanceIndex.map(x=>`${x.type}:${x.path}`)).size);
  for(const ref of dataset.evidenceProvenanceIndex){assert.match(ref.sha256,/^[a-f0-9]{64}$/);assert.match(ref.commit,/^[a-f0-9]{40}$/);assert.ok(ref.permalink.startsWith('https://'));assert.ok(!path.isAbsolute(ref.path));assert.ok(!ref.path.split('/').includes('..'));}
  assert.equal(dataset.globalAcceptance.g1,'NOT_VERIFIED');
  assert.equal(dataset.classificationCounts.PARTIAL_SEMANTIC_OVERLAP,8);
  assert.ok(dataset.riskRegister.length>=5);
  for(const risk of dataset.riskRegister){assert.equal(risk.status,'NOT_RUNTIME_VERIFIED');assert.ok(risk.mitigation);}
});
test('assignee forged-owner boundary remains unproven; KB-023/026 use observed behavior',()=>{
  const c=dataset.candidates.find(x=>x.id==='KB-GAP-004');
  assert.match(c.technicalRecommendationBasis,/INSUFFICIENT_EVIDENCE/);
  const inv=JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'),'utf8'));
  for(const id of ['KB-023','KB-026']) assert.ok(inv.cases.find(x=>x.caseId===id).behaviorInterpretation);
});
test('all pair records carry oracle, assertions and evidence references',()=>{
  const ids=new Set(JSON.parse(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'),'utf8')).cases.map(x=>x.caseId));
  const index=new Map(dataset.evidenceProvenanceIndex.map(x=>[`${x.type}:${x.path}`,x]));
  for(const p of dataset.pairwiseComparisons){assert.ok(ids.has(p.baselineCaseId));assert.ok(p.baselineTitle);assert.ok(p.baselineAction.length);assert.ok(p.baselineOracle.length);assert.ok(p.baselineJavaAssertions.length);assert.ok(p.candidateBehavior);assert.ok(p.candidateOracle);assert.ok(p.evidence.length);assert.ok(p.rationale);assert.ok(['DISTINCT_BEHAVIOR_SUPPORTED','PARTIAL_SEMANTIC_OVERLAP','DUPLICATE_BEHAVIOR','INSUFFICIENT_EVIDENCE'].includes(p.classification));for(const ref of p.evidence){assert.match(ref.sha256,/^[a-f0-9]{64}$/);assert.match(ref.commit,/^[a-f0-9]{40}$/);assert.ok(ref.permalink.includes(ref.commit));assert.equal(ref.sha256,index.get(`${ref.type}:${ref.path}`)?.sha256);}}
});
test('accepted input hashes are present and valid',()=>{
  assert.match(dataset.sourcePins.bewtCommit,/^[a-f0-9]{40}$/); assert.match(dataset.sourcePins.kanboardCommit,/^[a-f0-9]{40}$/);
  assert.match(dataset.sourcePins.acceptedInventorySha256,/^[a-f0-9]{64}$/);
  assert.equal(dataset.sourcePins.acceptedInventorySha256,hash(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'))));
});
test('schema and review packet set define all five decisions without filling them',()=>{
  const schema=JSON.parse(fs.readFileSync(path.join(root,'data/reviews/kanboard/t04b-review-dataset.schema.json'),'utf8'));
  assert.ok(schema.required.includes('evidenceProvenanceIndex'));
  const rubric=fs.readFileSync(path.join(root,'docs/tasks/T04-B/HUMAN-REVIEW-RUBRIC.md'),'utf8');
  for(const dimension of ['Source validity','Behavioral novelty','Oracle clarity','Fixture feasibility','UI automation feasibility','Isolation and cleanup','Historical overlap','Evidence sufficiency']) assert.ok(rubric.includes(dimension));
  const packets=path.join(root,'docs/tasks/T04-B/review-packets');
  assert.deepEqual(fs.readdirSync(packets).sort(),['KB-GAP-001.md','KB-GAP-002.md','KB-GAP-003.md','KB-GAP-004.md','KB-GAP-008.md'].sort());
  for(const id of ['KB-GAP-001','KB-GAP-002','KB-GAP-003','KB-GAP-004','KB-GAP-008']){
    const content=fs.readFileSync(path.join(packets,`${id}.md`),'utf8');
    for(const heading of ['Technical review','Fixture, reset and cleanup','Rubric assessment','Human decision record']) assert.ok(content.includes(heading));
    for(const field of ['Reviewer identity: null','Review date: null','Commit reviewed: null','Decision: null','Rationale: null','Oracle confirmation: null','Novelty assessment: null','Conditions for implementation: null','Reviewer evidence: null']) assert.ok(content.includes(field),`${id} missing ${field}`);
  }
});
