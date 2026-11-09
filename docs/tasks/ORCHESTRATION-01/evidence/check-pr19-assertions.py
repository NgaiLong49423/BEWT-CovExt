import subprocess,json,re
sha='59df094130eadc9d6634d04b70e3b4906bb55bd0'; meta=json.loads(subprocess.check_output(['git','show',f'{sha}:docs/tasks/T03-A1/evidence/offline-verification-20261110-r2/baseline-source-provenance.json'])); result=[]
for a in meta['applications']:
 for f in a['files']:
  p=f['path']; src=f"{a['sourceVersionDirectory']}/{p}"; dst=f"experiments/{a['app']}/bewt-suite/{p}"
  if '/test/' not in p or not p.endswith('.java'):continue
  old=subprocess.check_output(['git','-C','bewt-original','show',f"{meta['benchmarkSourceCommit']}:{src}"]).decode('utf8')
  new=subprocess.check_output(['git','show',f'{sha}:{dst}']).decode('utf8')
  extract=lambda t:[re.sub(r'\s+','',x) for x in t.splitlines() if re.search(r'\bassert(?:Equals|True|False|NotNull|Null|Same)\s*\(',x)]
  if extract(old)!=extract(new):result.append({'app':a['app'],'file':p,'originalAssertionLines':len(extract(old)),'copyAssertionLines':len(extract(new))})
print(json.dumps(result,indent=2))
