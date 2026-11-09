"""Reproduce bounded MW-GAP-004 baseline comparison from immutable Git blobs.

Reads only. Run: python docs/tasks/T04-H/tools/check_mw_overlap.py <BEWT git root>
No source text or credentials are emitted.
"""
import hashlib
import json
import subprocess
import sys

PIN = '0501249ff3e9a5ea83a06155cd2971dc36197056'
TREE = 'd38fcc0eae8073023c48bb46998741c8c19d4d06'
FEATURES = 'mediawiki/gherkin/'
JAVA = 'mediawiki/baseline/mediawiki-1.40.0/src/test/java/mediawiki/'
SELECTED = {
    '06_EditPageTest': ('EditPageTest.java', ['getTitle()', 'getBody()']),
    '15_EditProtectedPage_NewAdmin_SuccessTest': ('EditProtectedPage_NewAdmin_SuccessTest.java', ['getTitle()', 'getBody()']),
    '16_RevertLastCommitTest': ('RevertLastCommitTest.java', ['rollbackLastEdit()', 'getMessage()', 'getTitle()', 'getBody()']),
}

def main(root):
    def git(*args):
        return subprocess.check_output(['git', '-C', root, *args])
    if git('rev-parse', PIN + '^{tree}').decode().strip() != TREE:
        raise ValueError('Unexpected BEWT source tree')
    paths = git('ls-tree', '-r', '--name-only', PIN, FEATURES).decode().splitlines()
    features = sorted(p for p in paths if p.endswith('.feature'))
    if len(features) != 27:
        raise ValueError('Expected exactly 27 MediaWiki feature blobs at the pin')
    def blob(path):
        contents = git('show', PIN + ':' + path)
        blob_id = git('rev-parse', PIN + ':' + path).decode().strip()
        return contents.decode('utf-8'), blob_id, hashlib.sha256(contents).hexdigest()
    rows=[]
    for stem, (java_name, expected) in SELECTED.items():
        fpath = FEATURES + stem + '.feature'
        jpath = JAVA + java_name
        feature, fid, fsha = blob(fpath)
        java, jid, jsha = blob(jpath)
        if fpath not in features or not all(x in java for x in expected):
            raise ValueError('Selected comparison source or assertions changed: ' + stem)
        rows.append({'case': stem, 'feature': {'path': fpath, 'gitBlob': fid, 'sha256': fsha},
                     'java': {'path': jpath, 'gitBlob': jid, 'sha256': jsha},
                     'expectedAnchors': expected,
                     'assertLines': [i for i,line in enumerate(java.splitlines(),1) if 'assertEquals(' in line]})
    suite, sid, ssha = blob(JAVA + 'TestSuite.java')
    names = ['EditProtectedPage_NewAdmin_SuccessTest.class', 'RevertLastCommitTest.class']
    lines = suite.splitlines()
    positions = [next(i for i, line in enumerate(lines,1) if name in line) for name in names]
    if positions[1] != positions[0] + 1:
        raise ValueError('Selected suite entries are not adjacent in pinned source')
    terms=('revision','history','rollback','revert','old version','comparison')
    hits=[]
    for path in features:
        text, _, _ = blob(path)
        match=[i for i, line in enumerate(text.splitlines(),1) if any(term in line.lower() for term in terms)]
        if match:
            hits.append({'path':path,'lineNumbers':match})
    return {'sourceCommit':PIN,'sourceTree':TREE,'scope':'27 feature blobs; bounded keyword screen is not semantic proof',
            'featuresScanned':len(features),'keywordHitFiles':hits,'selectedComparisons':rows,
            'suite':{'path':JAVA+'TestSuite.java','gitBlob':sid,'sha256':ssha,'adjacentEntryLines':positions},
            'novelty':'NOT_VERIFIED','runtime':'NOT_RUN','humanDecision':None}

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: check_mw_overlap.py <BEWT git root>')
    print(json.dumps(main(sys.argv[1]), indent=2))
