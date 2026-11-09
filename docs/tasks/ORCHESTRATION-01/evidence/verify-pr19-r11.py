import subprocess,json,hashlib
head='6379d3ddbaf509b91b9d49cad969ff46045015b4'; base='docs/tasks/T03-A1/evidence/offline-compile-20261110-r11/'
read=lambda spec:subprocess.check_output(['git','show',spec])
m=json.loads(read(head+':'+base+'sha256-lf.json'));bad=[]
for p,h in m['files'].items():
 if hashlib.sha256(read(head+':'+p).replace(b'\r\n',b'\n')).hexdigest()!=h:bad.append(p)
data=json.loads(read(head+':'+base+'input-hashes.json')); tested=data['testedCommit']; tree=subprocess.check_output(['git','ls-tree','-r',tested],text=True).splitlines();lookup={x.split('\t',1)[1]:x.split('\t',1)[0].split()[2] for x in tree}
wrong=[x['path'] for x in data['files'] if lookup.get(x['path'])!=x['gitBlob'] or x['copyGitBlobLf']!=x['gitBlob']]
print(json.dumps({'evidenceCommit':head,'evidenceFiles':len(m['files']),'evidenceMismatches':bad,'testedCommit':tested,'inputFiles':len(data['files']),'inputMismatches':wrong}))
if bad or wrong:raise SystemExit(1)
