"""Verify blank v2 review inputs and immutable Git provenance. Does not record decisions."""
import hashlib
import json
import pathlib
import subprocess

ROOT=pathlib.Path(__file__).resolve().parents[4]
TASK=ROOT/'docs/tasks/T04-M'
EXPECTED=['MW-GAP-004','EC-GAP-003','CL-GAP-002']

def digest(raw): return hashlib.sha256(raw).hexdigest()
def git_show(spec): return subprocess.check_output(['git','-C',str(ROOT),'show',spec])
def validate(manifest,read_packet,read_git=git_show):
    if manifest['purpose']!='DRAFT_REVIEW_WORKSHEETS_NOT_DECISION_LEDGER' or manifest['humanDecisionsAdded']!=0: raise ValueError('decision boundary')
    rows=manifest['revisions']
    if [r['candidateId'] for r in rows]!=EXPECTED: raise ValueError('revision set')
    raw=read_git(manifest['inputCommit']+':'+manifest['inputManifestPath'])
    if digest(raw)!=manifest['inputManifestSha256']: raise ValueError('input manifest hash')
    source=json.loads(raw); source_rows={r['candidateId']:r for r in source['records']}
    for row in rows:
        cid=row['candidateId']; original=source_rows[cid]
        canonical=json.dumps(original,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
        if digest(canonical)!=row['revisionRecordCanonicalSha256']: raise ValueError(cid+' metadata hash')
        if row['version']!=2 or original['version']!=2 or original['status']!='PROPOSED' or original['implementationApproval']!='NOT_GRANTED' or original['oracleApproval']!='NOT_GRANTED' or original['novelty']!='NOT_VERIFIED' or original['reviewerDecisions']: raise ValueError(cid+' source status')
        if row['featurePath']!=original['featurePath'] or row['featureSha256']!=original['featureSha256']: raise ValueError(cid+' feature binding')
        if digest(read_git(manifest['inputCommit']+':'+row['featurePath']))!=row['featureSha256']: raise ValueError(cid+' feature hash')
        slots=row['reviewSlots']
        if len(slots)!=2 or [s.get('slot') for s in slots]!=['reviewer-1','reviewer-2'] or any(set(s)!={'slot','reviewerIdentity','decision','reviewedAt'} or s['reviewerIdentity'] is not None or s['decision'] is not None or s['reviewedAt'] is not None for s in slots): raise ValueError(cid+' review slots')
        packet=read_packet(row['packetPath']).decode('utf-8')
        if cid not in packet or row['featureSha256'] not in packet or row['revisionRecordCanonicalSha256'] not in packet: raise ValueError(cid+' packet binding')
    return {'result':'PASS','candidateCount':3,'blankReviewerSlots':6,'humanDecisionsAdded':0,'scope':'binding and blank slots only; no scientific or engineering acceptance'}

if __name__=='__main__':
    manifest=json.loads((TASK/'REVIEW-INPUTS.json').read_text(encoding='utf-8-sig'))
    print(json.dumps(validate(manifest,lambda p:(ROOT/p).read_bytes()),indent=2))
