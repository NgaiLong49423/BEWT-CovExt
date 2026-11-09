import pathlib,subprocess,tempfile,json,hashlib,os
commit='5e09e93407f3abd622e73af40c367eabb1a0dd5f'
source=pathlib.Path('bewt-original').resolve()
tmp=pathlib.Path(tempfile.mkdtemp(prefix='bewt-mw-review-', dir=os.environ.get('BEWT_REVIEW_TMP')))
for name in ('check_mw_overlap.py','test_mw_overlap.py'):
    data=subprocess.check_output(['git','show',f'{commit}:docs/tasks/T04-H/tools/{name}'])
    (tmp/name).write_bytes(data)
test=subprocess.run(['python',str(tmp/'test_mw_overlap.py'),str(source)],capture_output=True,text=True)
actual=subprocess.check_output(['python',str(tmp/'check_mw_overlap.py'),str(source)])
expected=subprocess.check_output(['git','show',f'{commit}:docs/tasks/T04-H/evidence/mw-bounded-screen.json'])
print(json.dumps({'commit':commit,'testExit':test.returncode,'testOutput':test.stdout.strip(),'evidenceMatches':json.loads(actual)==json.loads(expected),'sha256':hashlib.sha256(actual).hexdigest()}))
if test.returncode or json.loads(actual)!=json.loads(expected): raise SystemExit(1)
