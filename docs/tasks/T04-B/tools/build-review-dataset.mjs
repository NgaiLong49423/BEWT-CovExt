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
const supplementalPinnedSources = [
  {path:'app/Model/TaskStatusModel.php',line:'L59-L61',sha256:'3762118a118b0829b5f0134d858dda70e4e917de093ca80e8994a95de0721c21'},
  {path:'app/Model/CommentModel.php',line:'L56-L76',sha256:'e0d108970059f54813ccda3df018446f312807a503cbbad240cf07d4e008dda9'},
  {path:'app/Model/CommentModel.php',line:'L130-L140',sha256:'e0d108970059f54813ccda3df018446f312807a503cbbad240cf07d4e008dda9'},
  {path:'app/Template/task/show.php',line:'L45-L51',sha256:'02468fe0c39ea66e78189903853bab1c70b36879ec4a14cf788150078af946f8'},
  {path:'app/Template/task_comments/show.php',line:'L14-L23',sha256:'7eaf3d3a0e314594fff9a6d41dced23fb6f3f4afb2dad153ee26ab20a51f434d'},
  {path:'app/Model/SubtaskModel.php',line:'L117-L123',sha256:'d5caa19e6d29c115428a154ad1f67869a4991240b5bac2fcf00f1596efad9c61'},
  {path:'app/Template/task/show.php',line:'L13-L18',sha256:'02468fe0c39ea66e78189903853bab1c70b36879ec4a14cf788150078af946f8'},
  {path:'app/Template/subtask/show.php',line:'L1-L8',sha256:'37f905a21ac023a9df0d222adb6b80eb12a48464de986f162c13e06339c374c8'},
].map((x)=>({...x,commit:upstreamCommit,permalink:`https://github.com/kanboard/kanboard/blob/${upstreamCommit}/${x.path}#L${x.line.match(/\d+/)[0]}`}));
const allUpstreamRefs = new Map([...refs.values(),...supplementalPinnedSources].map((x)=>[x.path,x]));
const overlapCases = {
  'KB-GAP-001': new Set(['KB-017', 'KB-018', 'KB-027']),
  'KB-GAP-003': new Set(['KB-003', 'KB-004']),
  'KB-GAP-004': new Set(['KB-013']),
  'KB-GAP-008': new Set(['KB-006', 'KB-007']),
};
const overlapRationales = {
  'KB-GAP-001:KB-017':'Both involve the open-task filter; baseline KB-017 asserts search results, while the proposal must assert the closed-to-open state transition.',
  'KB-GAP-001:KB-018':'Both exercise task status lifecycle in opposite directions; baseline closes a task, while the proposal opens a previously closed task.',
  'KB-GAP-001:KB-027':'Both involve closed/open status filtering; baseline searches closed tasks, while the proposed primary behavior is reopening the entity.',
  'KB-GAP-003:KB-003':'Both create a task-like title; baseline creates a top-level task, while the candidate must assert a child-to-parent relationship.',
  'KB-GAP-003:KB-004':'Both touch task title entry/required-title validation; baseline checks blank top-level task rejection, not parent-scoped child creation.',
  'KB-GAP-004:KB-013':'Both involve project membership/roles; KB-013 checks the authorized-user list, while the proposal changes and verifies an existing task assignee.',
  'KB-GAP-008:KB-006':'Both concern columns and titles; baseline creates a new column, while the candidate updates the title of the same existing column identity.',
  'KB-GAP-008:KB-007':'Both concern column title validation; baseline rejects a blank title on creation, while the candidate updates an existing column.',
};
const recommendations = {
  'KB-GAP-001': ['RECOMMEND_REVISE', 'The state transition is distinct, but status:open search overlaps the already exercised filter facility; make reopen-and-observe-state the primary oracle.'],
  'KB-GAP-002': ['RECOMMEND_ACCEPT', 'Comment creation and task-scoped rendered history have no matching action/oracle in the 30 mapped cases.'],
  'KB-GAP-003': ['RECOMMEND_ACCEPT', 'Top-level task creation overlaps generic title entry, while parent-child identity and subtask listing are distinct assertions.'],
  'KB-GAP-004': ['RECOMMEND_REVISE', 'Keep one assignee behavior with actor/target project-role controls; forged non-member owner rejection remains INSUFFICIENT_EVIDENCE.'],
  'KB-GAP-008': ['RECOMMEND_ACCEPT', 'Editing an existing column is distinct from the baseline create-column and blank-create validation behavior.'],
};
const reviewDetails = {
  'KB-GAP-001': {baselineCases:['KB-017','KB-018','KB-027'],oracle:'Start from a known closed task; verify the same task changes to Open after the explicit Open action. status:open search is corroborative only because the filter capability is already exercised.',conditions:['Seed and record one closed task ID in an isolated project.','Verify actor can change task status and handle any confirmation/CSRF-protected UI path.','Assert status on the same task before and after; optionally corroborate with status:open.','Use a fresh instance/database or restore the task state for each run.'],questions:['Does the visible status update immediately after redirect for the pinned Kanboard build?','Which stable locator identifies the task-specific Open action?'],reviewEvidence:[]},
  'KB-GAP-002': {baselineCases:[],oracle:'Submit a unique synthetic comment to a known task, reload the task view, and assert exact text appears in that task comment history; confirm it does not appear in a second control task.',conditions:['Seed two tasks and retain their IDs.','Use unique synthetic comment text per invocation; do not use personal data.','Verify the submitter is authenticated and comment creation is permitted.','Reload the task view before asserting persistence; reset with a fresh isolated database/volume or verified task-scoped cleanup.'],questions:['Are comment timestamps/ordering stable enough to locate the new entry?','Is a fresh database the only acceptable cleanup path for comments?'],reviewEvidence:[]},
  'KB-GAP-003': {baselineCases:['KB-003','KB-004'],oracle:'Create one uniquely named child from a pinned parent task and verify the child is listed under that exact parent and linked to the expected parent ID.',conditions:['Seed and record the parent task ID.','Use a unique child title and capture the created child ID.','Assert parent-child association, not just title presence in a global task list.','Cleanup only the created child after ownership and parent association are verified, or reset the isolated database.'],questions:['Does the pinned UI expose a stable parent-scoped subtask list after redirect?','Can cleanup delete only the new child without cascading to unrelated tasks?'],reviewEvidence:[]},
  'KB-GAP-004': {baselineCases:['KB-013'],oracle:'With an authorized actor, assign one active same-project Manager/Member target and verify that exact assignee remains selected after save and reload; separately assert a role without change permission cannot perform the update.',conditions:['Seed stable project, task, actor and one active direct same-project Manager/Member target.','Verify the actor role permits both task update and assignee change.','Keep target membership and role stable across repeats; do not treat Viewer as eligible.','Include unauthorized-role negative control.','Do not claim forged non-member owner_id rejection without a focused runtime test.'],questions:['Does the UI save path enforce the proposed actor/target constraints under the pinned build?','Does the unauthorized-role control fail at the UI boundary consistently?','Is server-side rejection of forged non-member owner_id implemented? This remains INSUFFICIENT_EVIDENCE.'],reviewEvidence:[]},
  'KB-GAP-008': {baselineCases:['KB-006','KB-007'],oracle:'Edit a pre-existing column, save, reload the same project board and assert the same column ID displays the unique replacement title.',conditions:['Seed and record project and existing column IDs.','Use a unique replacement title and preserve the column ID in the assertion.','Verify the actor can edit project columns.','Reset by isolated database/volume or restore the original title only after ownership is proven.'],questions:['Which stable UI route/locator opens edit for the intended column?','Does the board view reflect the rename after reload without stale client state?'],reviewEvidence:[]},
};
const rubricKeys = ['sourceValidity','behavioralNovelty','oracleClarity','fixtureFeasibility','uiAutomationFeasibility','isolationAndCleanup','historicalOverlap','evidenceSufficiency'];
const rubricNotes = {
  sourceValidity:['PINNED_SOURCE_SUPPORTED','Source and hash references are tied to the exact Kanboard upstream pin; static source only.'],
  behavioralNovelty:['REQUIRES_HUMAN_SEMANTIC_REVIEW','Pairwise matrix is evidence for review, not a novelty verdict.'],
  oracleClarity:['PROVISIONAL_REVIEW_REQUIRED','See the candidate-specific oracle review; runtime observability is unverified.'],
  fixtureFeasibility:['PROPOSED_NOT_RUN','Seed/reset plan is described but has not been executed in T04-B.'],
  uiAutomationFeasibility:['NOT_RUNTIME_VERIFIED','No Selenium/browser interaction or locator stability test was run.'],
  isolationAndCleanup:['PROPOSED_NOT_RUN','Ownership-scoped cleanup/reset approach requires separate runtime verification.'],
  historicalOverlap:['LIMITED_CORPUS_SEARCH','Only the inspected Sprint 01–05/final corpus was searched; absence is not proof.'],
  evidenceSufficiency:['STATIC_PROVENANCE_LINKED','Pinned paths, hashes, assertions and source links are recorded; human confirmation remains pending.'],
};
const fixtureAssessments = {
  'KB-GAP-001':{fixture:'Seed one closed task in an isolated project; record project/task IDs and an actor allowed to change status.',reset:'Fresh isolated DB/volume per invocation, or restore the same owned task to CLOSED before each run.',cleanup:'Teardown only the owned experiment instance after verifying its run ownership.',executionStatus:'NOT_RUN'},
  'KB-GAP-002':{fixture:'Seed two tasks and an authenticated commenter; generate unique synthetic comment text and retain both task IDs.',reset:'Prefer fresh isolated DB/volume because comments are append-like test data.',cleanup:'Use owner-verified task-scoped comment cleanup only if independently demonstrated; otherwise teardown the isolated instance.',executionStatus:'NOT_RUN'},
  'KB-GAP-003':{fixture:'Seed one parent task and capture the child ID created by this invocation.',reset:'Fresh isolated DB/volume or return the parent to a verified empty-subtask state.',cleanup:'Delete only the child after verifying its ID and parent_id; never delete the parent as cleanup.',executionStatus:'NOT_RUN'},
  'KB-GAP-004':{fixture:'Seed project/task/actor and one active direct same-project Manager/Member target; retain an unauthorized actor control.',reset:'Fresh isolated DB/volume with membership and roles restored from the same fixture seed.',cleanup:'Teardown only the owned instance; preserve no assumptions about forged owner_id server rejection.',executionStatus:'NOT_RUN'},
  'KB-GAP-008':{fixture:'Seed project and existing column; record their IDs and original title.',reset:'Fresh isolated DB/volume or restore the original title on the exact owned column.',cleanup:'Only restore/delete after verifying project and column IDs belong to the invocation.',executionStatus:'NOT_RUN'},
};
const bewtUrl = (p, line) => `https://github.com/OlianasD/BEWT/blob/${inventory.bewtBenchmarkCommit}/${p}#L${line ?? 1}`;
const sourceUrl = (p, line) => `https://github.com/kanboard/kanboard/blob/${upstreamCommit}/${p}#${line?.replace('L','') ?? '1'}`;
if (JSON.stringify(shortlist.items.map((x)=>x.candidateId)) !== JSON.stringify(selectedIds)) throw new Error('Shortlist differs from the T04-B reviewed IDs');
const evidenceIndex = new Map();
for (const c of inventory.cases) {
  const gherkinFile = path.posix.basename(c.gherkin.path);
  const baseRefs = [
    {type:'BEWT_GHERKIN',path:c.gherkin.path,line:c.expectedOracle[0]?.line ?? 1,sha256:c.gherkin.sha256,commit:inventory.bewtBenchmarkCommit,permalink:bewtUrl(c.gherkin.path,c.expectedOracle[0]?.line)},
    {type:'BEWT_JAVA_ASSERTION',path:c.java.path,line:c.java.assertions[0]?.line ?? 1,sha256:c.java.sha256,commit:inventory.bewtBenchmarkCommit,permalink:bewtUrl(c.java.path,c.java.assertions[0]?.line)},
  ];
  for (const ref of baseRefs) evidenceIndex.set(`${ref.type}:${ref.path}`,ref);
  if (!provenance.gherkinHashes[gherkinFile] || provenance.gherkinHashes[gherkinFile] !== c.gherkin.sha256) throw new Error(`Baseline Gherkin hash mismatch: ${c.caseId}`);
  if (!provenance.javaClassHashes[c.java.className] || provenance.javaClassHashes[c.java.className] !== c.java.sha256) throw new Error(`Baseline Java hash mismatch: ${c.caseId}`);
}
const candidatesOut = candidates.map((c) => {
  const supplemental = supplementalPinnedSources.filter((s)=>(c.id==='KB-GAP-001'&&s.path==='app/Model/TaskStatusModel.php')||(c.id==='KB-GAP-002'&&['app/Model/CommentModel.php','app/Template/task_comments/show.php'].includes(s.path))||(c.id==='KB-GAP-002'&&s.path==='app/Template/task/show.php'&&s.line==='L45-L51')||(c.id==='KB-GAP-003'&&s.path==='app/Model/SubtaskModel.php')||(c.id==='KB-GAP-003'&&s.path==='app/Template/task/show.php'&&s.line==='L13-L18')||(c.id==='KB-GAP-003'&&s.path==='app/Template/subtask/show.php'));
  const ev = [...c.sourceEvidence,...supplemental].map((e) => {
    const r = allUpstreamRefs.get(e.path);
    if (!r) throw new Error(`No pinned hash for candidate source ${e.path}`);
    const ref = { type:'KANBOARD_UPSTREAM_SOURCE', path:e.path, line:e.line, commit:upstreamCommit, sha256:r.sha256, permalink:e.url ?? e.permalink ?? sourceUrl(e.path,e.line) };
    evidenceIndex.set(`${ref.type}:${ref.path}`,ref);
    return ref;
  });
  const [recommendation, basis] = recommendations[c.id];
  const detail = reviewDetails[c.id];
  return {
    id:c.id, title:c.title, description:c.description, category:c.category,
    status:'PROPOSED', reviewDecision:'PENDING', technicalRecommendation:recommendation, technicalRecommendationBasis:basis,
    candidateVersionSha256:hash(JSON.stringify(c)),candidateVersionSha256Input:'Canonical JSON serialization of this candidate record in data/coverage/kanboard/gap-candidates.json.', expectedObservableResult:c.expectedObservableResult,
    preconditions:c.preconditions, sourceEvidence:ev,
    baselineComparisonCaseIds:detail.baselineCases,
    technicalReview:{sourceEvidence:ev,baselineComparisonCaseIds:detail.baselineCases,oracleReview:detail.oracle,knownRisks:c.risks??[],unresolvedQuestions:detail.questions,proposedDecision:recommendation,decisionRationale:basis,implementationConditions:detail.conditions,reviewerEvidence:detail.reviewEvidence},
    oracleAssessment:{proposedOracle:detail.oracle,entityIdentityRequired:true,postReloadRequired:['KB-GAP-002','KB-GAP-004','KB-GAP-008'].includes(c.id),runtimeStatus:'NOT_RUN'},
    fixtureAssessment:fixtureAssessments[c.id],
    rubricAssessment:Object.fromEntries(rubricKeys.map((d)=>[d,{assessment:rubricNotes[d][0],notes:rubricNotes[d][1]}])),
    humanDecision:{reviewerIdentity:null,decisionDate:null,reviewedCommitSha:null,decision:null,rationale:null,oracleConfirmation:null,noveltyAssessment:null,conditionsForImplementation:null,reviewerEvidence:null},
    stages:{staticSourceReview:'COMPLETE',engineeringRecommendation:'COMPLETE',humanReview:'PENDING',humanReviewRuntime:'NOT_RUN',g1Ready:false},
    qualificationStages:{staticSourceVerification:'STATIC_SOURCE_VERIFIED',engineeringReview:'ENGINEERING_REVIEW_COMPLETE',humanReview:'HUMAN_REVIEW_PENDING',humanReviewComplete:false,g1ReadyForTeamLeadAcceptance:false,overallG1Qualification:'NOT_VERIFIED'},
    riskNotes:c.risks ?? [],
  };
});
const pairs = candidates.flatMap((candidate) => inventory.cases.map((base) => {
  const behavior = base.behaviorInterpretation || base.expectedOracle.map((x)=>x.text).join(' ');
  const overlapFlagged = overlapCases[candidate.id]?.has(base.caseId) ?? false;
  const screeningLabel = overlapFlagged ? 'PARTIAL_SEMANTIC_OVERLAP' : 'NO_DIRECT_OVERLAP_FLAGGED';
  const sources = [
    {type:'BEWT_GHERKIN',path:base.gherkin.path,line:base.expectedOracle[0]?.line??1,commit:inventory.bewtBenchmarkCommit,sha256:base.gherkin.sha256,permalink:bewtUrl(base.gherkin.path,base.expectedOracle[0]?.line)},
    {type:'BEWT_JAVA_ASSERTION',path:base.java.path,line:base.java.assertions[0]?.line??1,commit:inventory.bewtBenchmarkCommit,sha256:base.java.sha256,permalink:bewtUrl(base.java.path,base.java.assertions[0]?.line)},
    ...candidatesOut.find((c)=>c.id===candidate.id).sourceEvidence.map((s)=>({type:'KANBOARD_UPSTREAM_SOURCE',path:s.path,line:s.line,commit:upstreamCommit,sha256:s.sha256,permalink:s.permalink})),
  ];
  return {candidateId:candidate.id,baselineCaseId:base.caseId,baselineTitle:base.gherkin.scenarioTitle,baselineObservedBehavior:behavior,baselineAction:base.testAction.map((s)=>s.text),baselineOracle:base.expectedOracle.map((s)=>s.text),baselineJavaAssertions:base.java.assertions.map((a)=>a.text),candidateBehavior:candidate.description,candidateOracle:candidate.expectedObservableResult,classification:screeningLabel,screeningMethod:'RULE_BASED_SCREENING',screeningRuleId:overlapFlagged?'EXPLICIT_OVERLAP_REVIEW_LIST':'NO_DIRECT_OVERLAP_RULE_MATCH',semanticReviewStatus:'PENDING_INDEPENDENT_REVIEW',humanNoveltyDecision:null,rationale:overlapFlagged?overlapRationales[`${candidate.id}:${base.caseId}`]:'No explicit overlap rule flagged this pair. This is not a finding of distinct behavior: independent semantic review is pending. Review the paired baseline action, oracle, Java assertion and pinned sources before assigning any novelty result.',evidence:sources};
}));
const out = {schemaVersion:'1.1',application:'Kanboard',reviewScope:'T04-B rule-based overlap screening; independent semantic review pending',screeningMethod:'RULE_BASED_SCREENING',sourcePins:{bewtCommit:inventory.bewtBenchmarkCommit,kanboardCommit:upstreamCommit,acceptedInventorySha256:hash(fs.readFileSync(path.join(root,'data/coverage/kanboard/inventory.json'))),gapCandidatesSha256:hash(fs.readFileSync(path.join(root,'data/coverage/kanboard/gap-candidates.json')))},shortlistSource:'data/coverage/kanboard/shortlist.json',candidateCount:5,baselineCaseCount:30,pairCount:pairs.length,screeningCounts:pairs.reduce((a,p)=>(a[p.classification]=(a[p.classification]||0)+1,a),{}),semanticReviewStatus:'PENDING_INDEPENDENT_REVIEW',candidates:candidatesOut,pairwiseComparisons:pairs,evidenceProvenanceIndex:[...evidenceIndex.values()],globalAcceptance:{researchAcceptance:'PENDING_TEAM_LEAD',g1:'NOT_VERIFIED',humanReviewComplete:false}};
out.riskRegister = candidatesOut.flatMap((c)=>c.riskNotes.map((risk,index)=>({candidateId:c.id,riskId:`${c.id}-R${index+1}`,risk,status:'NOT_RUNTIME_VERIFIED',mitigation:c.technicalReview.implementationConditions[0]??'Resolve during human review and runtime planning.'})));
const dest=path.join(root,'data/reviews/kanboard/t04b-review-dataset.json'); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,`${JSON.stringify(out,null,2)}\n`);
const packetDir=path.join(root,'docs/tasks/T04-B/review-packets'); fs.mkdirSync(packetDir,{recursive:true});
for (const c of candidatesOut) {
  const related=pairs.filter((p)=>p.candidateId===c.id&&p.classification==='PARTIAL_SEMANTIC_OVERLAP');
  const packet=`# ${c.id} — ${c.title}\n\n`+
`## Scope and evidence\n\nStatus: \`PROPOSED\`; official human decision: \`PENDING\`. Candidate definition SHA-256: \`${c.candidateVersionSha256}\` (canonical record from \`data/coverage/kanboard/gap-candidates.json\`). Kanboard source pin: \`${upstreamCommit}\`.\n\n`+
`Expected observable result: ${c.expectedObservableResult}\n\n`+
`Preconditions:\n${c.preconditions.map((x)=>`- ${x}`).join('\n')}\n\n`+
`Source evidence:\n${c.sourceEvidence.map((e)=>`- [\`${e.path}\` ${e.line}](${e.permalink}) — SHA-256 \`${e.sha256}\``).join('\n')}\n\n`+
`## Technical review\n\n**Baseline cases reviewed:** ${c.technicalReview.baselineComparisonCaseIds.length?c.technicalReview.baselineComparisonCaseIds.join(', '):'No directly related baseline action/oracle identified; all 30 pair rows remain available.'}\n\n**Oracle review:** ${c.technicalReview.oracleReview}\n\n**Implementation conditions:**\n${c.technicalReview.implementationConditions.map((x)=>`- ${x}`).join('\n')}\n\n**Known risks:**\n${c.technicalReview.knownRisks.map((x)=>`- ${x}`).join('\n')||'- No additional static risk recorded.'}\n\n**Unresolved questions:**\n${c.technicalReview.unresolvedQuestions.map((x)=>`- ${x}`).join('\n')}\n\n**Evidence for reviewer:** see pinned links above and pairwise entries for all 30 baseline cases. No live execution evidence was created.\n\n`+
`## Fixture, reset and cleanup\n\n- Fixture: ${c.fixtureAssessment.fixture}\n- Reset: ${c.fixtureAssessment.reset}\n- Cleanup: ${c.fixtureAssessment.cleanup}\n- Runtime status: ${c.fixtureAssessment.executionStatus}\n\n`+
`## Rubric assessment\n\nSee [T04-B Human Review Rubric](../HUMAN-REVIEW-RUBRIC.md). These qualitative statuses do not aggregate into acceptance.\n\n`+
`## Baseline comparison\n\nAll 30 baseline cases were compared by rule-based screening; see the machine-readable 150-row dataset. Overlap flags: ${related.length?related.map((p)=>`${p.baselineCaseId} (${p.baselineTitle})`).join('; '):'none flagged by the configured rule list'}. Pairs labeled NO_DIRECT_OVERLAP_FLAGGED have not received independent semantic review and are not novelty findings.\n\n`+
`## Technical recommendation\n\n**${c.technicalRecommendation}** — ${c.technicalRecommendationBasis}\n\nThis is not a Team Lead decision.\n\n`+
`## Human decision record — intentionally blank\n\n- Reviewer identity: null\n- Review date: null\n- Commit reviewed: null\n- Decision: null\n- Rationale: null\n- Oracle confirmation: null\n- Novelty assessment: null\n\n`+
`- Conditions for implementation: null (human reviewer to complete)\n- Reviewer evidence: null (human reviewer to attach)\n\n`+
`G1 readiness: false. Runtime behavior, selectors, fixture/reset, and cleanup are not verified by this static review.\n`;
  fs.writeFileSync(path.join(packetDir,`${c.id}.md`),packet);
}
console.log(`Generated ${out.candidateCount} candidates × ${out.baselineCaseCount} baselines = ${pairs.length} pairs`);
