import json,pathlib,sys,re
root=pathlib.Path('.'); base=root/'docs/tasks/T04-F'; apps=['bludit','claroline','expresscart','joomla','mantisbt','mediawiki','prestashop']
errs=[]; proposals={}; shortlist={}; ids=[]
for app in apps:
 p=json.loads((root/f'data/coverage/{app}/source-backed-gap-proposals.json').read_text()); proposals[app]=p
 s=json.loads((root/f'data/coverage/{app}/source-backed-gap-shortlist.json').read_text()); shortlist[app]={x['candidateId'] for x in s['topCandidates']}
 ids += [x['candidateId'] for x in p['candidates']]
pack=json.loads((base/'HUMAN-REVIEW-PACKETS.json').read_text()); rec=pack['records']; byid={r['candidateId']:r for r in rec}
if len(rec)!=27: errs.append(f'packets={len(rec)} !=27')
if len(byid)!=len(rec): errs.append('duplicate candidate IDs')
if len(set().union(*shortlist.values()))!=20: errs.append('input shortlist count !=20')
if set(byid)!=set(ids): errs.append('packet IDs mismatch proposals')
idx=json.loads((root/'docs/tasks/T04-E/source-reference-index.json').read_text())
for app in apps:
 for c in proposals[app]['candidates']:
  r=byid.get(c['candidateId'])
  if not r: continue
  if r['sourcePin']!=proposals[app]['sourcePin'] or r['baselinePin']!=proposals[app]['baselinePin']: errs.append(c['candidateId']+' pin mismatch')
  if r['shortlisted']!=(c['candidateId'] in shortlist[app]): errs.append(c['candidateId']+' shortlist mismatch')
  if r['humanDecision'] is not None or r['noveltyStatus']!='NOT_VERIFIED' or r['runtimeStatus']!='NOT_RUN': errs.append(c['candidateId']+' status escalation')
  for sr in r['sourceReferences']:
   if sr['id'] not in idx['apps'][app]['sourceReferences']: errs.append(c['candidateId']+' missing source ref '+sr['id'])
  for cmp in r['baselineCaseComparisons']:
   for ln in cmp['gherkinThenLineRefs']+cmp['javaAssertionLineRefs']:
    if not isinstance(ln.get('line'),int) or ln['line']<1: errs.append(c['candidateId']+' invalid line anchor')
  if r['suggestedDisposition'] not in {'RECOMMEND_FOR_HUMAN_REVIEW','RECOMMEND_REVISION','RECOMMEND_REJECTION_REVIEW','NEEDS_MORE_EVIDENCE'}: errs.append(c['candidateId']+' invalid disposition')
# Ensure only allowed workspace diff
import subprocess
changed=subprocess.check_output(['git','status','--porcelain'],text=True).splitlines()
for line in changed:
 path=line[3:]
 if not path.startswith('docs/tasks/T04-F/'): errs.append('out-of-scope change '+path)
# Basic secret-like scan over generated text (avoid generic word password in fixture descriptions)
for f in base.rglob('*'):
 if f.is_file() and f.suffix.lower() in {'.json','.md','.mjs','.py'}:
  txt=f.read_text(encoding='utf-8')
  if re.search(r'(?i)(gh[pousr]_[A-Za-z0-9]{25,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)',txt): errs.append('possible credential marker in '+str(f))
print(f'Candidates: {len(rec)}; unique: {len(byid)}; shortlisted input: {len(set().union(*shortlist.values()))}; source ref links: valid; candidate status: unapproved/NOT_RUN')
print('Changed paths:',len(changed),'(all T04-F)' if all(x[3:].startswith('docs/tasks/T04-F/') for x in changed) else 'scope error')
if errs:
 print('FAIL'); print('\n'.join(errs)); sys.exit(1)
print('PASS')
