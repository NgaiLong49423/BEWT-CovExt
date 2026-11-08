import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EXPECTED, safeJoin, build, verifyGitCommit } from '../coverage-inventory.mjs';

const root=path.resolve('data/coverage/kanboard');
test('pinned BEWT commit and tree are fixed to verified task inputs',()=>{
 assert.equal(EXPECTED.bewtCommit,'0501249ff3e9a5ea83a06155cd2971dc36197056');
 assert.equal(EXPECTED.bewtTree,'d38fcc0eae8073023c48bb46998741c8c19d4d06');
 assert.equal(EXPECTED.upstreamCommit,'00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b');
});
test('safeJoin rejects traversal and symlink escape',t=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'kb-inventory-')); t.after(()=>fs.rmSync(d,{recursive:true,force:true}));
 const outside=fs.mkdtempSync(path.join(os.tmpdir(),'kb-outside-')); t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));
 fs.writeFileSync(path.join(outside,'secret'),'x'); assert.throws(()=>safeJoin(d,'../'+path.basename(outside)+'/secret'),/escapes/);
 try {fs.symlinkSync(outside,path.join(d,'escape'),'junction'); assert.throws(()=>safeJoin(d,'escape/secret'),/escapes/);} catch(e) {if(e.code!=='EPERM'&&!/escapes/.test(e.message))throw e;}
});
test('generator rejects a caller-supplied SHA that is not the pinned value',()=>{
 assert.throws(()=>build({featureRoot:'.',javaRoot:'.',poRoot:'.',suiteRoot:'.',upstreamRoot:'.',bewtRepoRoot:'.',upstreamRepoRoot:'.',bewtCommit:'wrong',upstreamCommit:EXPECTED.upstreamCommit}),/Pinned source/);
});
test('actual repository HEAD is checked instead of trusting caller metadata',()=>assert.equal(verifyGitCommit(process.cwd(),EXPECTED.bewtCommit),false));
test('verified inventory maps all baseline cases and records assertions, imports and hashes',()=>{
 const inv=JSON.parse(fs.readFileSync(path.join(root,'inventory.json'),'utf8'));
 const prov=JSON.parse(fs.readFileSync(path.join(root,'provenance-index.json'),'utf8'));
 assert.equal(inv.sourceStatus,'STATIC_VERIFIED'); assert.equal(inv.bewtBenchmarkCommit,EXPECTED.bewtCommit);
 assert.deepEqual(inv.counts,{gherkinFiles:30,javaTestDirectoryFiles:32,javaSuiteCases:30,pageObjectClasses:27,behaviorGroups:6});
 assert.equal(inv.cases.length,30); assert.equal(new Set(inv.cases.map(x=>x.caseId)).size,30);
 assert.ok(inv.cases.every(x=>x.java.assertions.length>0&&x.pageObjects.length>0&&x.expectedOracle.length>0));
 assert.equal(Object.keys(prov.javaClassHashes).length,30); assert.equal(Object.keys(prov.pageObjectHashes).length,27);
 assert.equal(prov.baselineSupportHashes.testSuite.length,64); assert.equal(prov.baselineSupportHashes.baseTest.length,64);
 assert.equal(prov.sourceCommits.bewtTree,EXPECTED.bewtTree);
 assert.ok(inv.cases.every(x=>x.gherkin.scenarioTitle&&x.gherkin.scenarioTitle!=='UNPARSED'));
 assert.ok(inv.cases.every(x=>x.gherkin.cleanupSteps.length>0&&x.gherkin.cleanupSteps.some(step=>step.text.includes('Logout'))));
 assert.ok(inv.cases.every(x=>!x.expectedOracle.some(step=>step.includes('Logout'))));
 assert.ok(inv.cases.some(x=>x.reviewFlags.includes('SCENARIO_TITLE_CONFLICTS_WITH_JAVA_REMOVE_USER_ASSERTION')));
 assert.match(fs.readFileSync(path.resolve('docs/tasks/T04-A/KANBOARD-BASELINE-MAPPING.md'),'utf8'),/\| Given \| When \| Then \| Cleanup \|/);
});
test('candidate proposals are source-pinned, complete, unique and never self-approved',()=>{
 const taxonomy=JSON.parse(fs.readFileSync(path.join(root,'behavior-taxonomy.json'),'utf8'));
 const taxonomyCases=taxonomy.groups.flatMap(g=>g.caseIds); assert.equal(taxonomy.groups.length,6); assert.equal(taxonomyCases.length,30); assert.equal(new Set(taxonomyCases).size,30);
 const gaps=JSON.parse(fs.readFileSync(path.join(root,'gap-candidates.json'),'utf8'));
 const shortlist=JSON.parse(fs.readFileSync(path.join(root,'shortlist.json'),'utf8'));
 assert.equal(gaps.items.length,10); assert.equal(new Set(gaps.items.map(x=>x.id)).size,10);
 assert.ok(gaps.items.every(x=>x.status==='PROPOSED'&&x.reviewDecision==='PENDING'&&x.preconditions.length&&x.expectedObservableResult&&x.sourceEvidence.length));
 const knownSources=new Set(JSON.parse(fs.readFileSync(path.join(root,'provenance-index.json'),'utf8')).upstreamReferences.map(x=>x.path));
 assert.ok(gaps.items.flatMap(x=>x.sourceEvidence).every(x=>x.commit===EXPECTED.upstreamCommit&&x.url.includes(EXPECTED.upstreamCommit)&&knownSources.has(x.path)));
 assert.equal(shortlist.items.length,5); assert.ok(shortlist.items.every(x=>gaps.items.some(g=>g.id===x.candidateId)));
 assert.ok(!JSON.stringify(gaps).includes('ACCEPTED_FOR_IMPLEMENTATION'));
});
test('published dataset redacts credentials and email fixture literals',()=>{
 const raw=fs.readFileSync(path.join(root,'inventory.json'),'utf8');
 assert.doesNotMatch(raw,/test123|admin" in the "Password|[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i);
});
