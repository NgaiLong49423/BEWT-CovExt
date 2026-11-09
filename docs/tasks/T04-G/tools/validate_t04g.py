import json, re, subprocess, sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]
PIN='0501249ff3e9a5ea83a06155cd2971dc36197056'
def validate(cat,delta,queue,source_candidates=None,source_links=None,source_nearby=None):
 errors=[]; units=cat.get('units',[]); records=delta.get('records',[]); q=queue.get('records',[])
 ids=[x.get('candidateId') for x in records]; qids=[x.get('candidateId') for x in q]
 if len(ids)!=27 or len(set(ids))!=27: errors.append('candidate count/uniqueness')
 if len(qids)!=27 or set(qids)!=set(ids): errors.append('queue membership')
 if sum(bool(x.get('shortlisted')) for x in q)!=20: errors.append('shortlist count')
 priorities={}
 for x in q:
  if x.get('shortlisted'):
   if not isinstance(x.get('priorityReviewOrder'),int) or x['priorityReviewOrder']<1: errors.append('shortlist priority missing')
   priorities.setdefault(x.get('application'),[]).append(x.get('priorityReviewOrder'))
 if any(sorted(v)!=list(range(1,len(v)+1)) for v in priorities.values()): errors.append('per-application shortlist priority')
 bycase={c:u for u in units for c in u.get('baselineCaseIds',[])}; case_ids={c for u in units for c in u.get('baselineCaseIds',[])}
 links={(x.get('candidateId'),x.get('baselineCaseId')) for x in delta.get('records',[]) for x in x.get('candidateBaselineLinks',[])}
 if len(links)!=46: errors.append('direct candidate-baseline link count')
 if len({b for _,b in links})!=35: errors.append('distinct baseline case count')
 if any(c not in ids or b not in case_ids for c,b in links): errors.append('unknown candidate/baseline link')
 if source_candidates is not None and set(ids)!={x.get('candidateId') for x in source_candidates}: errors.append('candidate IDs differ from source packets')
 if source_candidates is not None:
  expected={x['candidateId']:(bool(x.get('shortlisted')),x.get('priorityReviewOrder')) for x in source_candidates}
  actual={x['candidateId']:(bool(x.get('shortlisted')),x.get('priorityReviewOrder')) for x in q}
  if actual!=expected: errors.append('shortlist membership/priority differs from source packets')
 packet_links={(x.get('candidateId'),x.get('baselineCaseId')) for x in (source_links or [])}
 if source_links is not None and links!=packet_links: errors.append('candidate-baseline links differ from evidence index')
 packet_near={(x.get('candidateId'),x.get('baselineCaseId')) for x in (source_nearby or [])}
 actual_near={(x.get('candidateId'),x.get('baselineCaseId')) for r in records for x in r.get('nearbyScreenedLinks',[])}
 if source_nearby is not None and actual_near!=packet_near: errors.append('nearby links differ from evidence index')
 for u in units:
  if u.get('reviewStatus')!='NEEDS_REVIEW': errors.append('unit review state')
  if u.get('baselinePin',{}).get('commit')!=PIN: errors.append('unit baseline pin')
  gh=u.get('gherkinEvidence',{}); ja=u.get('javaAssertionEvidence',{})
  for ev in (gh,ja):
   if ev.get('blobSha')!=ev.get('fetchedBlobSha'): errors.append('blob SHA mismatch')
   refs=[ev.get('permalink','')]+[a.get('permalink','') for a in ev.get('assertions',[])]+[a.get('permalink','') for a in ev.get('stepEvidence',[])]
   if not any(PIN in ref for ref in refs) and not (ev is ja and u.get('mappingStatus')=='FEATURE_ONLY_NO_JAVA_MATCH_AT_PIN'): errors.append('source permalink pin')
  step_lines={x.get('line') for x in gh.get('stepEvidence',[])}
  if any(x.get('line') not in step_lines for x in gh.get('expectedThenLineRefs',[])): errors.append('Then anchor missing')
 if cat.get('counts',{}).get('officialBehavioralDenominator') is not None: errors.append('official denominator must be null')
 if any(x.get('humanDecision') is not None or x.get('noveltyStatus')!='NOT_VERIFIED' or x.get('runtimeStatus')!='NOT_RUN' for x in records): errors.append('candidate state elevated')
 if any(x.get('humanDecision') is not None for x in q): errors.append('queue decision populated')
 return errors
def main():
 cat=json.loads((R/'BEHAVIORAL-BASELINE-CATALOG.json').read_text(encoding='utf-8')); d=json.loads((R/'CANDIDATE-BASELINE-DELTA.json').read_text(encoding='utf-8')); q=json.loads((R/'HUMAN-REVIEW-QUEUE.json').read_text(encoding='utf-8'))
 src=json.loads((R/'evidence/cands.json').read_text(encoding='utf-8')); sl=json.loads((R/'evidence/comps.json').read_text(encoding='utf-8')); sn=json.loads((R/'evidence/near.json').read_text(encoding='utf-8'))
 errors=validate(cat,d,q,src,sl,sn)
 if '--negative-tests' in sys.argv:
  cases=[('candidate-id',lambda a,b,c:b['records'][0].update(candidateId='BAD')),('link',lambda a,b,c:b['records'][0]['candidateBaselineLinks'][0].update(baselineCaseId='missing')) ,('pin',lambda a,b,c:a['units'][0]['baselinePin'].update(commit='bad')),('anchor',lambda a,b,c:a['units'][0]['gherkinEvidence']['expectedThenLineRefs'][0].update(line=99999)),('status',lambda a,b,c:b['records'][0].update(humanDecision='ACCEPTED')),('shortlist',lambda a,b,c:c['records'][0].update(shortlisted=False))]
  failed=[]
  for name,mut in cases:
   a,b,c=json.loads(json.dumps(cat)),json.loads(json.dumps(d)),json.loads(json.dumps(q)); mut(a,b,c)
   if not validate(a,b,c,src,sl,sn): failed.append(name)
  if failed: errors.append('negative tests not detected: '+','.join(failed))
  print('negative_tests=6/6 detected' if not failed else 'negative_tests=FAIL '+','.join(failed))
 if errors: print('FAIL: '+'; '.join(sorted(set(errors)))); return 1
 print(f'PASS: units={len(cat["units"])} candidates={len(d["records"])} shortlist={sum(x["shortlisted"] for x in q["records"])} links=46 distinct_baseline_cases=35 nearby={sum(len(x["nearbyScreenedLinks"]) for x in d["records"])} official_denominator=null')
 return 0
if __name__=='__main__': raise SystemExit(main())
