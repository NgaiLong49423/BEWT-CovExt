import subprocess,json
sha='35452b416c86a3688b5cb63f804ea58282cd87c4'
rows=json.loads(subprocess.check_output(['git','show',f'59df094130eadc9d6634d04b70e3b4906bb55bd0:docs/tasks/T03-A1/evidence/offline-verification-20261110-r6/source-test-hashes.json']))
tree=subprocess.check_output(['git','ls-tree','-r',sha],text=True).splitlines()
lookup={p.split('\t',1)[1]:p.split('\t',1)[0].split()[2] for p in tree}
wrong=[r['path'] for r in rows if lookup.get(r['path'])!=r['commitBlob']]
print(json.dumps({'commit':sha,'files':len(rows),'mismatches':wrong}))
if wrong:raise SystemExit(1)
