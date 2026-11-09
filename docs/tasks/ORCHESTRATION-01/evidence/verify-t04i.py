import pathlib,subprocess,tempfile,json,hashlib,os
commit='34812340917c6bf6d37c48535ce55c828f990dff'
source=pathlib.Path('experiments/expresscart/source').resolve()
tmp=pathlib.Path(tempfile.mkdtemp(prefix='bewt-ec-review-',dir=os.environ.get('BEWT_REVIEW_TMP')))
for name in ('check_ec_address.py','test_ec_address.py'):
 (tmp/name).write_bytes(subprocess.check_output(['git','show',f'{commit}:docs/tasks/T04-I/tools/{name}']))
test=subprocess.run(['python',str(tmp/'test_ec_address.py'),str(source)],capture_output=True,text=True)
actual=subprocess.check_output(['python',str(tmp/'check_ec_address.py'),str(source)])
expected=subprocess.check_output(['git','show',f'{commit}:docs/tasks/T04-I/evidence/source-anchors.json'])
print(json.dumps({'commit':commit,'testExit':test.returncode,'testOutput':test.stdout.strip(),'evidenceMatches':json.loads(actual)==json.loads(expected),'sha256':hashlib.sha256(actual).hexdigest()}))
if test.returncode or json.loads(actual)!=json.loads(expected):raise SystemExit(1)
