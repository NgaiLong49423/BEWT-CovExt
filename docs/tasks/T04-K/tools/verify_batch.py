"""Check immutable candidate hashes and referenced review packets; records no decisions."""
import hashlib
import json
import pathlib
import subprocess

BASE=pathlib.Path(__file__).resolve().parent.parent

def git(*args): return subprocess.check_output(['git',*args])
def validate(manifest, read_git=git):
    if manifest['reviewPolicy']!='PENDING_HUMAN_REVIEW_NO_DECISIONS': raise ValueError('review policy')
    rows=manifest['candidates']
    if [r['id'] for r in rows]!=['MW-GAP-004','EC-GAP-003','CL-GAP-002']: raise ValueError('candidate set')
    for row in rows:
        if row['humanDecision'] is not None: raise ValueError('decision must remain null')
        p='data/coverage/'+row['app']+'/source-backed-gap-proposals.json'
        raw=read_git('show',manifest['baselineCommit']+':'+p)
        if hashlib.sha256(raw).hexdigest()!=row['fileSha256']: raise ValueError(row['id']+' file hash')
        candidates=json.loads(raw)['candidates']; selected=[c for c in candidates if c['candidateId']==row['id']]
        if len(selected)!=1: raise ValueError(row['id']+' candidate missing or duplicated')
        candidate=selected[0]
        canon=json.dumps(candidate,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
        if hashlib.sha256(canon).hexdigest()!=row['candidateSha256']: raise ValueError(row['id']+' revision hash')
        if candidate['version']!=row['version'] or candidate['scenarioStatus']!='PROPOSED' or candidate['humanDecision'] is not None: raise ValueError(row['id']+' status')
        read_git('cat-file','-e',row['packetCommit']+':'+row['packetPath'])
    return {'result':'PASS','candidateCount':len(rows),'decisionCount':0,'baselineCommit':manifest['baselineCommit'], 'scope':'inputs and refs only; no semantic, engineering or human approval'}

if __name__=='__main__': print(json.dumps(validate(json.loads((BASE/'BATCH-INPUTS.json').read_text(encoding='utf-8-sig'))),indent=2))
