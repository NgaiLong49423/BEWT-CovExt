import subprocess,json,re
sha='59df094130eadc9d6634d04b70e3b4906bb55bd0'
meta=json.loads(subprocess.check_output(['git','show',f'{sha}:docs/tasks/T03-A1/evidence/offline-verification-20261110-r2/baseline-source-provenance.json']))
pin=meta['benchmarkSourceCommit']; groups={}
for app in meta['applications']:
 changes=[]
 for f in app['files']:
  p=f['path']; src=f"{app['sourceVersionDirectory']}/{p}"; dst=f"experiments/{app['app']}/bewt-suite/{p}"
  original=subprocess.check_output(['git','-C','bewt-original','show',f'{pin}:{src}'])
  copy=subprocess.check_output(['git','show',f'{sha}:{dst}'])
  if re.sub(rb'\s+',b'',original)!=re.sub(rb'\s+',b'',copy): changes.append(p)
 groups[app['app']]=changes
print(json.dumps(groups,indent=2))
