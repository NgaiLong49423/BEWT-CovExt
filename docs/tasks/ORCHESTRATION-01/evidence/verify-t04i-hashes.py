import subprocess,hashlib,json
sha='34812340917c6bf6d37c48535ce55c828f990dff'; root='docs/tasks/T04-I/evidence/'
lines=subprocess.check_output(['git','show',f'{sha}:{root}SHA256SUMS.txt']).decode().splitlines(); bad=[]
for line in lines:
 digest,name=line.split('  ',1); data=subprocess.check_output(['git','show',f'{sha}:{root}{name}'])
 if hashlib.sha256(data).hexdigest()!=digest:bad.append(name)
print(json.dumps({'commit':sha,'files':len(lines),'mismatches':bad}))
if bad:raise SystemExit(1)
