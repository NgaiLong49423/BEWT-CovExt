"""Verify selected Claroline release blobs and locate review anchors via read-only gh API."""
import base64
import hashlib
import json
import subprocess

COMMIT='22d852f93081bc36b1d08b93f5e0c14b49a573f6'
TREE='f10d5b9747f13e0256b3f52f7663a1475340bfe4'
SPECS={
 'claroline/group/group_space.php':('825d811e822c687968fc0c48c59dad7b8fae2261',[
   'claro_is_group_allowed()', "isset( $_REQUEST['selfReg'] )", "$_groupProperties ['registrationAllowed']", 'groupMemberQuotaExceeded', 'userGroupQuotaExceeded', 'claro_is_course_member()', '$is_allowedToDocAccess', "isset($_REQUEST['registration'])", "isset($_REQUEST['doReg'])"]),
 'claroline/group/group.php':('f0832ad118f454b3cff38564c76075ba9c708b06', ["$_groupProperties['private']", "group_space.php?registration=1&selfReg=1&gidReq="]),
 'claroline/group/group_properties.php':('22f6d1a4e1b045f673c8a7c1aa3429a387de395c',["claro_get_main_group_properties", "$_groupProperties ['registrationAllowed']", "$_groupProperties ['private']"]),
}

def verify_blob(record,expected):
    raw=base64.b64decode(record['content'],validate=False)
    actual=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    if actual!=expected or record['sha']!=expected: raise ValueError('Git blob ID mismatch')
    return raw

def locate(raw,anchors):
    lines=raw.decode('utf-8').splitlines(); out=[]
    for anchor in anchors:
        hits=[i for i,line in enumerate(lines,1) if anchor in line]
        if not hits: raise ValueError('Missing source anchor: '+anchor)
        out.append({'anchor':anchor,'lines':hits})
    return out

def api(path):
    return json.loads(subprocess.check_output(['gh','api',path]))

def main():
    commit=api('repos/zefredz/claroline/git/commits/'+COMMIT)
    if commit['tree']['sha']!=TREE: raise ValueError('Unexpected source tree')
    tree=api('repos/zefredz/claroline/git/trees/'+TREE+'?recursive=1')
    if tree.get('truncated'): raise ValueError('Source tree response truncated')
    entries={x['path']:x['sha'] for x in tree['tree'] if x['type']=='blob'}
    files=[]
    for path,(oid,anchors) in SPECS.items():
        if entries.get(path)!=oid: raise ValueError('Tree/path blob mismatch: '+path)
        raw=verify_blob(api('repos/zefredz/claroline/git/blobs/'+oid),oid)
        files.append({'path':path,'gitBlob':oid,'sha256':hashlib.sha256(raw).hexdigest(),'anchors':locate(raw,anchors)})
    return {'commit':COMMIT,'tree':TREE,'files':files,'scope':'Static upstream blobs, not runtime or policy approval',
            'candidate':'CL-GAP-002','decision':None,'novelty':'NOT_VERIFIED','runtime':'NOT_RUN'}

if __name__=='__main__': print(json.dumps(main(),indent=2))
