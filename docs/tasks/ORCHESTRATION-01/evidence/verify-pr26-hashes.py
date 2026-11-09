import subprocess,hashlib,json
sha='90289e103dde97d3ce70680fa8c16194e64dd0da'
manifest=json.loads(subprocess.check_output(['git','show',f'{sha}:docs/tasks/T03-KANBOARD-RERUN/evidence/sha256-lf.json']))
wrong=[]
for name,digest in manifest['files'].items():
    data=subprocess.check_output(['git','show',f'{sha}:{name}']).replace(b'\r\n',b'\n')
    if hashlib.sha256(data).hexdigest()!=digest:wrong.append(name)
print(json.dumps({'commit':sha,'files':len(manifest['files']),'mismatches':wrong}))
if wrong:raise SystemExit(1)
