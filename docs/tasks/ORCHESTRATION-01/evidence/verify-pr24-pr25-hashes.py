import subprocess,hashlib,json
items=[('5e09e93407f3abd622e73af40c367eabb1a0dd5f','docs/tasks/T04-H/evidence/'),('ea28d3093dab173d8e93d42a7cf31cec95a1f898','docs/tasks/G2-BUDGET-LEDGER/evidence/')]
out=[]
for sha,root in items:
    manifest=subprocess.check_output(['git','show',f'{sha}:{root}SHA256SUMS.txt']).decode().splitlines()
    wrong=[]
    for line in manifest:
        digest,name=line.split('  ',1)
        content=subprocess.check_output(['git','show',f'{sha}:{root}{name}'])
        if hashlib.sha256(content).hexdigest()!=digest: wrong.append(name)
    out.append({'commit':sha,'files':len(manifest),'mismatches':wrong})
print(json.dumps(out))
if any(x['mismatches'] for x in out):raise SystemExit(1)
