import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');
const inventory = read('data/coverage/kanboard/inventory.json');
const gaps = read('data/coverage/kanboard/gap-candidates.json');
const provenance = read('data/coverage/kanboard/provenance-index.json');
const shortlist = read('data/coverage/kanboard/shortlist.json');
const selectedIds = ['KB-GAP-001', 'KB-GAP-002', 'KB-GAP-003', 'KB-GAP-004', 'KB-GAP-008'];
const candidates = gaps.items.filter((c) => selectedIds.includes(c.id));
if (candidates.length !== 5 || inventory.cases.length !== 30) throw new Error('Unexpected accepted T04-A inputs');
const refs = new Map((provenance.upstreamReferences ?? []).map((x) => [x.path, x]));
const upstreamCommit = gaps.upstreamCommit;
const overlapCases = {
  'KB-GAP-001': new Set(['KB-017', 'KB-018', 'KB-027']),
  'KB-GAP-003': new Set(['KB-003', 'KB-004']),
  'KB-GAP-008': new Set(['KB-006', 'KB-007']),
};
const recommendations = {
  'KB-GAP-001': ['RECOMMEND_REVISE', 'The state transition is distinct, but status:open search overlaps the already exercised filter facility; make reopen-and-observe-state the primary oracle.'],
  'KB-GAP-002': ['RECOMMEND_ACCEPT', 'Comment creation and task-scoped rendered history have no matching action/oracle in the 30 mapped cases.'],
  'KB-GAP-003': ['RECOMMEND_ACCEPT', 'Top-level task creation overlaps generic title entry, while parent-child identity and subtask listing are distinct assertions.'],
  'KB-GAP-004': ['RECOMMEND_REVISE', 'Keep one assignee behavior with actor/target project-role controls; forged non-member owner rejection remains INSUFFICIENT_EVIDENCE.'],
  'KB-GAP-008': ['RECOMMEND_ACCEPT', 'Editing an existing column is distinct from the baseline create-column and blank-create validation behavior.'],
};
const dimensions = ['sourceSupport','semanticNovelty','oracleClarity','uiObservability','fixtureStability','permissionBoundaries','repeatability','scopeCoherence'];
const sourceUrl = (p, line) => `https://github.com/kanboard/kanboard/blob/${upstreamCommit}/${p}#${line?.replace('L','L') ?? 'L1'}`;
const candidatesOut = candidates.map((c) => {
  const ev = c.sourceEvidence.map((e) => {
    const r = refs.get(e.path);
    if (!r) throw new Error(`No pinned hash for candidate source ${e.path}`);
    return { path: e.path, line: e.line, commit: upstreamCommit, sha256: r.sha256, permalink: e.url ?? sourceUrl(e.path, e.line) };
  });
  const [recommendation, basis] = recommendations[c.id];
  return {
    id:c.id, title:c.title, description:c.description, category:c.category,
    status:'PROPOSED', reviewDecision:'PENDING', technicalRecommendation:recommendation, technicalRecommendationBasis:basis,
    candidateVersionSha256:hash(JSON.stringify(c)), expectedObservableResult:c.expectedObservableResult,
    preconditions:c.preconditions, sourceEvidence:ev,
    rubricAssessment:Object.fromEntries(dimensions.map((d)=>[d,{assessment:d==='sourceSupport'?'SUPPORTED_STATIC_SOURCE':d==='semanticNovelty'?'REQUIRES_HUMAN_REVIEW':'CONDITIONAL_OR_NOT_RUNTIME_VERIFIED',notes:d==='permissionBoundaries'&&c.id==='KB-GAP-004'?'Forged non-member owner_id rejection is not established.':'Static assessment only; no UI runtime was executed.'}])),
    humanDecision:{reviewerIdentity:null,decisionDate:null,reviewedCommitSha:null,decision:null,rationale:null,oracleConfirmation:null,noveltyAssessment:null},
    stages:{staticSourceReview:'COMPLETE',engineeringRecommendation:'COMPLETE',humanReview:'PENDING',humanReviewRuntime:'NOT_RUN',g1Ready:false},
    riskNotes:c.risks ?? [],
  };
});
const pairs = candidates.flatMap((candidate) => inventory.cases.map((base) => {
  const behavior = base.behaviorInterpretation || base.expectedOracle.map((x)=>x.text).join(' ');
  const classif = overlapCases[candidate.id]?.has(base.caseId) ? 'PARTIAL_SEMANTIC_OVERLAP' : 'DISTINCT_BEHAVIOR_SUPPORTED';
  const sources = [base.java, ...candidate.sourceEvidence].map((s) => ({path:s.path, line:s.line ?? null, sha256:s.sha256 ?? refs.get(s.path)?.sha256 ?? null}));
  return {candidateId:candidate.id,baselineCaseId:base.caseId,baselineTitle:base.gherkin.scenarioTitle,baselineObservedBehavior:behavior,baselineAction:base.testAction.map((s)=>s.text),baselineOracle:base.expectedOracle.map((s)=>s.text),baselineJavaAssertions:base.java.assertions.map((a)=>a.text),candidateBehavior:candidate.description,candidateOracle:candidate.expectedObservableResult,classification:classif,rationale:classif==='PARTIAL_SEMANTIC_OVERLAP'?'Related operation or adjacent workflow exists; candidate remains distinct only if its stated state/relationship/update oracle is retained.':'No matching primary action-and-oracle pair identified in this static mapping; this is not proof of dataset-wide novelty.',evidence:sources};
}));
const out = {schemaVersion:'1.0',application:'Kanboard',reviewScope:'T04-B static semantic inventory review',sourcePins:{bewtCommit:inventory.bewtBenchmarkCommit,kanboardCommit:upstreamCommit,acceptedInventorySha256:hash(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'))),gapCandidatesSha256:hash(fs.readFileSync(path.join(root,'data/coverage/kanboard/gap-candidates.json')))},shortlistSource:'data/coverage/kanboard/shortlist.json',candidateCount:5,baselineCaseCount:30,pairCount:pairs.length,classificationCounts:pairs.reduce((a,p)=>(a[p.classification]=(a[p.classification]||0)+1,a),{}),candidates:candidatesOut,pairwiseComparisons:pairs,globalAcceptance:{researchAcceptance:'PENDING_TEAM_LEAD',g1:'NOT_VERIFIED',humanReviewComplete:false}};
const dest=path.join(root,'data/reviews/kanboard/t04b-review-dataset.json'); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,`${JSON.stringify(out,null,2)}\n`);
const packetDir=path.join(root,'docs/tasks/T04-B/review-packets'); fs.mkdirSync(packetDir,{recursive:true});
for (const c of candidatesOut) {
  const related=pairs.filter((p)=>p.candidateId===c.id&&p.classification==='PARTIAL_SEMANTIC_OVERLAP');
  const packet=`# ${c.id} — ${c.title}\n\n`+
`## Scope and evidence\n\nStatus: \`PROPOSED\`; official human decision: \`PENDING\`. Candidate version SHA-256: \`${c.candidateVersionSha256}\`. Kanboard source pin: \`${upstreamCommit}\`.\n\n`+
`Expected observable result: ${c.expectedObservableResult}\n\n`+
`Preconditions:\n${c.preconditions.map((x)=>`- ${x}`).join('\n')}\n\n`+
`Source evidence:\n${c.sourceEvidence.map((e)=>`- [\`${e.path}\` ${e.line}](${e.permalink}) — SHA-256 \`${e.sha256}\``).join('\n')}\n\n`+
`## Baseline comparison\n\nAll 30 baseline cases were compared; see the machine-readable 150-row dataset. Partial overlaps: ${related.length?related.map((p)=>`${p.baselineCaseId} (${p.baselineTitle})`).join('; '):'none identified'}. This static mapping is not proof of dataset-wide novelty.\n\n`+
`## Technical recommendation\n\n**${c.technicalRecommendation}** — ${c.technicalRecommendationBasis}\n\nThis is not a Team Lead decision.\n\n`+
`## Human decision record — intentionally blank\n\n- Reviewer identity: null\n- Review date: null\n- Commit reviewed: null\n- Decision: null\n- Rationale: null\n- Oracle confirmation: null\n- Novelty assessment: null\n\n`+
`G1 readiness: false. Runtime behavior, selectors, fixture/reset, and cleanup are not verified by this static review.\n`;
  fs.writeFileSync(path.join(packetDir,`${c.id}.md`),packet);
}
console.log(`Generated ${out.candidateCount} candidates × ${out.baselineCaseCount} baselines = ${pairs.length} pairs`);
