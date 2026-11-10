"""Verify revision lineage and unapproved status, never write a decision."""
import hashlib
import json
import pathlib
import subprocess

ROOT=pathlib.Path(__file__).resolve().parents[4]
TASK=ROOT/'docs/tasks/T04-L'

def sha(data): return hashlib.sha256(data).hexdigest()
def git_show(spec): return subprocess.check_output(['git','-C',str(ROOT),'show',spec])
def validate(manifest,receipt_bytes,read_feature,read_old=git_show):
    receipt=json.loads(receipt_bytes)
    if sha(receipt_bytes)!=manifest['receiptSha256']: raise ValueError('receipt hash mismatch')
    if receipt['recordType']!='TEAM_LEAD_REVISION_DIRECTION_RECEIPT': raise ValueError('not direction receipt')
    directions={r['candidateId']:r for r in receipt['decisions']}
    rows=manifest['records']
    if len(rows)!=3 or set(directions)!=set(r['candidateId'] for r in rows): raise ValueError('revision set')
    for row in rows:
        cid=row['candidateId']; direction=directions[cid]
        if row['version']!=2 or row['supersedes']['version']!=1 or direction['decision']!='REVISE': raise ValueError(cid+' lineage')
        if row['supersedes']['canonicalSha256']!=direction['candidateSha256'] or row['directionReceiptSha256']!=sha(receipt_bytes): raise ValueError(cid+' receipt mismatch')
        source=read_old(receipt['baselineCommit']+':data/coverage/'+row['app']+'/source-backed-gap-proposals.json')
        old=[x for x in json.loads(source)['candidates'] if x['candidateId']==cid]
        if len(old)!=1: raise ValueError(cid+' old candidate set')
        canonical=json.dumps(old[0],ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
        if sha(canonical)!=row['supersedes']['canonicalSha256']: raise ValueError(cid+' old candidate hash')
        if sha(read_feature(row['featurePath']))!=row['featureSha256']: raise ValueError(cid+' feature hash')
        if row['status']!='PROPOSED' or row['implementationApproval']!='NOT_GRANTED' or row['oracleApproval']!='NOT_GRANTED' or row['novelty']!='NOT_VERIFIED' or row['reviewerDecisions'] or row['runtime']!='NOT_RUN': raise ValueError(cid+' review boundary')
        if not row['sourceRefs'] or not all(row['appSourceCommit'] in link for link in row['sourceRefs']): raise ValueError(cid+' source pin')
        if not row['fixture'] or not row['cleanup'] or not row['blockers'] or not row['reviewQuestions']: raise ValueError(cid+' missing review data')
    return {'result':'PASS','v1CandidatesBound':3,'v2FeaturesBound':3,'humanApprovalsAdded':0,'runtime':'NOT_RUN'}

if __name__=='__main__':
    manifest=json.loads((TASK/'REVISIONS.json').read_text(encoding='utf-8-sig'))
    receipt=(ROOT/manifest['receiptPath']).read_bytes()
    print(json.dumps(validate(manifest,receipt,lambda p:(ROOT/p).read_bytes()),indent=2))
