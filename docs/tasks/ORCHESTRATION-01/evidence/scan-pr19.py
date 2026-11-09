import subprocess,re,json
sha='6379d3ddbaf509b91b9d49cad969ff46045015b4'
paths=subprocess.check_output(['git','diff','--name-only','origin/main...'+sha],text=True).splitlines(); pat=re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
matched=[]
for p in paths:
 try:data=subprocess.check_output(['git','show',sha+':'+p],stderr=subprocess.DEVNULL)
 except subprocess.CalledProcessError:continue
 if pat.search(data):matched.append(p)
print(json.dumps({'filesScanned':len(paths),'patternMatchedPaths':matched}))
if matched:raise SystemExit(1)
