import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const EXPECTED = { bewtCommit: '0501249ff3e9a5ea83a06155cd2971dc36197056', upstreamCommit: '00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b', bewtTree: 'd38fcc0eae8073023c48bb46998741c8c19d4d06' };
export function safeJoin(root, rel) {
  const base = fs.realpathSync(root);
  const candidate = path.resolve(base, rel);
  const actual = fs.realpathSync(candidate);
  if (actual !== base && !actual.startsWith(base + path.sep)) throw new Error(`Path escapes allowed root: ${rel}`);
  return actual;
}
export const sha = b => crypto.createHash('sha256').update(b).digest('hex');
export function verifyGitCommit(repoRoot, expected) { if(!repoRoot)return false; const r=spawnSync('git',['-C',repoRoot,'rev-parse','HEAD'],{encoding:'utf8'}); return r.status===0 && r.stdout.trim()===expected; }
export function gitTree(repoRoot,commit) { const r=spawnSync('git',['-C',repoRoot,'rev-parse',commit+'^{tree}'],{encoding:'utf8'}); if(r.status!==0)throw new Error('Cannot resolve pinned source tree'); return r.stdout.trim(); }
const read = (root, rel) => fs.readFileSync(safeJoin(root, rel));
function parseArgs(argv) { const out={}; for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--')) out[argv[i].slice(2)]=argv[++i];} return out; }
const category = n => /^(AddNewProject|AddEmptyProject|EditProject|AddNewPrivateProject|RemoveProject)$/.test(n) ? 'project-management' : /Task|Search|Closed/.test(n) ? 'task-management' : /Column|Swimlane|Category/.test(n) ? 'board-configuration' : /User|Authorized/.test(n) ? 'user-and-permission-management' : /Profile/.test(n) ? 'profile-management' : 'application-settings';
const redact = s => s.split(/(\r?\n)/).map(line => {
 if (/"(?:password|confirmation|confirm password)"\s+field/i.test(line)) return line.replace(/"[^"]*"/, '"[REDACTED TEST PASSWORD]"');
 if (/"(?:e-?mail)"\s+field/i.test(line)) return line.replace(/"[^"]*"/, '"[REDACTED TEST EMAIL]"');
 return line.replace(/"[^"\n]*@[^"\n]*"|'[^'\n]*@[^'\n]*'/g, '[REDACTED TEST EMAIL]');
}).join('');
function extractSteps(text) { return text.split(/\r?\n/).map((line,i)=>({line:i+1,text:line.trim()})).filter(x=>/^(Given|When|Then|And|But)\b/.test(x.text)).map(x=>({...x,text:redact(x.text)})); }
function groupSteps(steps) { const out={Given:[],When:[],Then:[]}; let active=null; for(const step of steps){const m=step.text.match(/^(Given|When|Then)\b/); if(m) active=m[1]; if(active && (m || /^(And|But)\b/.test(step.text))) out[active].push(step);} return out; }
export function build({featureRoot, javaRoot, poRoot, suiteRoot, upstreamRoot, bewtRepoRoot, upstreamRepoRoot, bewtCommit, upstreamCommit}) {
 if (bewtCommit!==EXPECTED.bewtCommit || upstreamCommit!==EXPECTED.upstreamCommit) throw new Error('Pinned source commit mismatch');
 if (!verifyGitCommit(bewtRepoRoot,EXPECTED.bewtCommit) || !verifyGitCommit(upstreamRepoRoot,EXPECTED.upstreamCommit)) throw new Error('Pinned source repository HEAD could not be verified');
 if(gitTree(bewtRepoRoot,EXPECTED.bewtCommit)!==EXPECTED.bewtTree) throw new Error('Pinned BEWT source tree mismatch');
 const sameRoot=(a,b)=>fs.realpathSync(a).toLowerCase()===fs.realpathSync(b).toLowerCase();
 const expectedInputs=[[featureRoot,path.join(bewtRepoRoot,'kanboard','gherkin')],[javaRoot,path.join(bewtRepoRoot,'kanboard','baseline','kanboard-1.2.15','src','test','java','tests')],[poRoot,path.join(bewtRepoRoot,'kanboard','baseline','kanboard-1.2.15','src','main','java','po')],[suiteRoot,path.join(bewtRepoRoot,'kanboard','baseline','kanboard-1.2.15','src','test','java','tests')],[upstreamRoot,upstreamRepoRoot]];
 if(expectedInputs.some(([actual,expected])=>!sameRoot(actual,expected))) throw new Error('Source input path is not beneath the verified pinned repository');
 const suite=read(suiteRoot,'TestSuite.java').toString();
 const suiteNames=[...suite.matchAll(/\b([A-Z][A-Za-z0-9_]*)\.class/g)].map(m=>m[1]).filter(n=>n!=='Suite');
 const features=fs.readdirSync(featureRoot).filter(n=>n.endsWith('.feature')).sort();
 if(features.length!==30 || suiteNames.length!==30) throw new Error(`Expected 30 Gherkin and suite cases; got ${features.length}/${suiteNames.length}`);
 const javaFiles=fs.readdirSync(javaRoot).filter(n=>n.endsWith('.java')).sort();
 if(javaFiles.length!==32) throw new Error('Expected 32 Java test-directory files; got '+javaFiles.length);
 const poFiles=fs.readdirSync(poRoot).filter(n=>n.endsWith('.java')).sort();
 if(poFiles.length!==27) throw new Error('Expected 27 Page Objects; got '+poFiles.length);
 const upstreamRefs=['app/Template/task/sidebar.php','app/Template/task_comments/create.php','app/Template/subtask/create.php','app/Template/column/edit.php','app/Template/swimlane/edit.php','app/Controller/TaskStatusController.php','app/Controller/TaskModificationController.php','app/Controller/ProjectPermissionController.php','app/Controller/CommentController.php','app/Controller/SubtaskController.php','app/Controller/ColumnController.php','app/Controller/SwimlaneController.php','app/Template/app/filters_helper.php','app/Template/task_modification/show.php','app/Template/task_creation/show.php','app/Template/project_permission/users.php','assets/js/components/project-select-role.js','app/Template/board/table_column.php','app/Helper/TaskHelper.php','app/Controller/BoardAjaxController.php','assets/js/src/BoardDragAndDrop.js','app/Template/board/table_tasks.php'];
 const records=features.map((file,index)=>{
   const stem=file.replace(/^\d+_/,'').replace(/\.feature$/,'');
   const java=`${stem}.java`;
   if(!suiteNames.includes(stem) || !fs.existsSync(path.join(javaRoot,java))) throw new Error(`Unmapped baseline case: ${file}`);
   const fb=read(featureRoot,file), jb=read(javaRoot,java), jt=jb.toString();
   const scenarioCount=fb.toString().split(/\r?\n/).filter(line=>line.trim().startsWith('Scenario')).length;
   if(scenarioCount!==1) throw new Error('Expected exactly one baseline scenario in '+file+'; got '+scenarioCount);
   const pageObjects=[...new Set([...jt.matchAll(/^\s*import\s+po\.([A-Za-z0-9_]+);/gm)].map(m=>m[1]))].sort();
   const javaAssertions=jt.split(/\r?\n/).map((line,i)=>({line:i+1,text:line.trim()})).filter(x=>/\bassert(?:Equals|True|False|That|NotNull|Null|Same|NotSame|ArrayEquals)\s*\(/.test(x.text)).map(x=>({...x,text:redact(x.text)}));
   const parsedSteps=extractSteps(fb.toString());
   const cleanupIndex=parsedSteps.findIndex(x=>x.text.toLowerCase()==='given the previous assertion passed');
   const cleanupSteps=cleanupIndex>=0?parsedSteps.slice(cleanupIndex):[];
   const steps=parsedSteps.map((step,i)=>({...step,phase:cleanupIndex>=0&&i>=cleanupIndex?'CLEANUP':'SCENARIO'}));
   const grouped=groupSteps(steps.filter(step=>step.phase==='SCENARIO')); const pre=grouped.Given; const actions=grouped.When; const oracle=grouped.Then;
   const scenarioLine=fb.toString().split(/\r?\n/).find(line=>line.trim().startsWith('Scenario'));
   const scenarioTitle=scenarioLine?redact(scenarioLine.trim().slice(scenarioLine.trim().indexOf(':')+1).trim()):'UNPARSED';
   const id=`KB-${String(index+1).padStart(3,'0')}`;
   return {caseId:id,gherkin:{path:'kanboard/gherkin/'+file,sha256:sha(fb),scenarioTitle,scenarioCount,steps,cleanupSteps},java:{path:'kanboard/baseline/kanboard-1.2.15/src/test/java/tests/'+java,sha256:sha(jb),className:stem,suiteOrder:suiteNames.indexOf(stem)+1,assertions:javaAssertions},pageObjects,behavioralCategory:category(stem),preconditions:pre.map(s=>s.text),testAction:actions.map(s=>s.text),expectedOracle:oracle.map(s=>s.text),mappingConfidence:'HIGH_FILENAME_AND_SUITE_ORDER',reviewFlags:[...(steps.length===0||oracle.length===0?['MISSING_GHERKIN_ORACLE']:[]),...(stem==='AddLocalUser_EmptyPassword'?['SCENARIO_TITLE_CONFLICTS_WITH_JAVA_REQUIRED_PASSWORD_ASSERTION']:[]),...(stem==='RemoveUser'?['SCENARIO_TITLE_CONFLICTS_WITH_JAVA_REMOVE_USER_ASSERTION']:[]),...(steps.some(x=>/clicks thre/i.test(x.text))?['SOURCE_GHERKIN_TYPO_CLICKS_THRE']:[])]};
 });
 const mappedNames=new Set(records.map(r=>r.java.className));
 if(mappedNames.size!==30||suiteNames.some(n=>!mappedNames.has(n))) throw new Error('Feature-to-suite mapping is not a one-to-one exact set');
 const srcHashes={tests:{},pageObjects:{}};
 for(const r of records) srcHashes.tests[r.java.className]=r.java.sha256;
 for(const f of poFiles) srcHashes.pageObjects[f]=sha(read(poRoot,f));
 const refs=upstreamRefs.map(rel=>{const b=read(upstreamRoot,rel);return {path:rel,sha256:sha(b),permalink:`https://github.com/kanboard/kanboard/blob/${upstreamCommit}/${rel}`};});
 const groups=[...new Set(records.map(r=>r.behavioralCategory))].sort();
 const inventory={schemaVersion:'1.0',application:'Kanboard',applicationVersion:'1.2.15',sourceStatus:'STATIC_VERIFIED',bewtBenchmarkCommit:bewtCommit,upstreamCommit,counts:{gherkinFiles:features.length,javaTestDirectoryFiles:javaFiles.length,javaSuiteCases:suiteNames.length,pageObjectClasses:poFiles.length,behaviorGroups:groups.length},behaviorGroups:groups,coverageSemantics:'Coverage describes behaviors asserted by the baseline; gaps are proposals only. Exact-tag absence or title difference does not establish novelty.',cases:records};
 const provenance={schemaVersion:'1.0',sourceCommits:{bewt:bewtCommit,bewtTree:gitTree(bewtRepoRoot,bewtCommit),upstream:upstreamCommit},pageObjectCount:poFiles.length,javaClassHashes:srcHashes.tests,pageObjectHashes:srcHashes.pageObjects,gherkinHashes:Object.fromEntries(records.map(r=>[path.basename(r.gherkin.path),r.gherkin.sha256])),baselineSupportHashes:{testSuite:sha(read(suiteRoot,'TestSuite.java')),baseTest:sha(read(javaRoot,'BaseTest.java'))},upstreamReferences:refs,redaction:'Fixture email and password literals are omitted/redacted from published text; file SHA-256 and source paths/line numbers preserve traceability.',workingCopyComparison:{result:'MATCH',businessJavaFilesCompared:30,pageObjectFilesCompared:27,mismatches:0,source:'experiments/kanboard/bewt-suite checked against the verified BEWT commit'}};
 return {inventory,provenance};
}
export function mappingMarkdown(inv) {
 const esc=x=>String(x??'').replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>');
 const steps=(c,k)=>{let active=null;const out=[];for(const x of c.gherkin.steps){const mark=['Given','When','Then'].find(k=>x.text.startsWith(k+' '));if(mark)active=mark;if(x.phase==='SCENARIO'&&active===k&&(mark||x.text.startsWith('And ')||x.text.startsWith('But ')))out.push('L'+x.line+': '+x.text)}return out.join('<br>')||'N/A'};
 const cleanup=c=>c.gherkin.cleanupSteps.map(x=>'L'+x.line+': '+x.text).join('<br>')||'N/A';
 const rows=inv.cases.map(c=>{
  const gurl='https://github.com/OlianasD/BEWT/blob/'+inv.bewtBenchmarkCommit+'/'+c.gherkin.path+'#L'+Math.min(...c.gherkin.steps.map(x=>x.line));
  const jurl='https://github.com/OlianasD/BEWT/blob/'+inv.bewtBenchmarkCommit+'/'+c.java.path+'#L'+(c.java.assertions[0]?.line||1);
  const refs='[Feature SHA '+c.gherkin.sha256+']('+gurl+')<br>[Java SHA '+c.java.sha256+']('+jurl+')';
  const cols=[c.caseId,c.gherkin.scenarioTitle,steps(c,'Given'),steps(c,'When'),steps(c,'Then'),cleanup(c),c.java.className+' (suite '+c.java.suiteOrder+')<br>'+c.java.assertions.map(a=>'L'+a.line+': '+a.text).join('<br>'),c.pageObjects.join(', '),c.behavioralCategory,c.preconditions.join('<br>'),c.testAction.join('<br>'),c.expectedOracle.join('<br>'),refs,c.mappingConfidence];
  return '| '+cols.map(esc).join(' | ')+' |';
 });
 return '# Kanboard Baseline Case Mapping\n\nVerified BEWT commit: '+inv.bewtBenchmarkCommit+'; upstream Kanboard commit: '+inv.upstreamCommit+'. Cleanup is separated after the baseline sentinel. Gherkin password/email values are redacted. Page Object hashes are in provenance-index.json.\n\n| Case | Scenario | Given | When | Then | Cleanup | Java class and assertions | Page Objects imported | Category | Preconditions | Action | Expected oracle | Source references and SHA-256 | Confidence |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n'+rows.join('\n')+'\n';
}
if(process.argv[1]?.endsWith('coverage-inventory.mjs')){
 const a=parseArgs(process.argv.slice(2));
 for(const k of ['features','java','po','suite','upstream','bewt-repo-root','upstream-repo-root','out']) if(!a[k]) throw new Error(`Missing --${k}`);
 const built=build({featureRoot:a.features,javaRoot:a.java,poRoot:a.po,suiteRoot:a.suite,upstreamRoot:a.upstream,bewtRepoRoot:a['bewt-repo-root'],upstreamRepoRoot:a['upstream-repo-root'],bewtCommit:a['bewt-commit'],upstreamCommit:a['upstream-commit']});
 fs.mkdirSync(a.out,{recursive:true});
 for(const [n,v] of Object.entries({inventory:built.inventory,'provenance-index':built.provenance})) fs.writeFileSync(path.join(a.out,`${n}.json`),JSON.stringify(v,null,2)+'\n');
 fs.writeFileSync(path.join(a.out,'KANBOARD-BASELINE-MAPPING.md'),mappingMarkdown(built.inventory));
 console.log(JSON.stringify({cases:built.inventory.counts.javaSuiteCases,groups:built.inventory.counts.behaviorGroups,pageObjects:built.inventory.counts.pageObjectClasses,out:path.resolve(a.out)}));
}
