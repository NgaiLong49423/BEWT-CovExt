import json
import pathlib
import subprocess
import sys

script=pathlib.Path(__file__).with_name('check_ec_address.py')
if len(sys.argv)!=2: raise SystemExit('Usage: test_ec_address.py <ExpressCart git root>')
command=[sys.executable,str(script),sys.argv[1]]
a=subprocess.run(command,check=True,capture_output=True)
b=subprocess.run(command,check=True,capture_output=True)
assert a.stdout==b.stdout
value=json.loads(a.stdout)
assert len(value['files'])==6 and len({x['path'] for x in value['files']})==6
assert value['decision'] is None and value['novelty']=='NOT_VERIFIED' and value['runtime']=='NOT_RUN'
assert all(len(x['gitBlob'])==40 and len(x['sha256'])==64 for x in value['files'])
assert all(y['lines'] for x in value['files'] for y in x['anchors'])
invalid=subprocess.run([sys.executable,str(script),str(script/'not-a-repo')],capture_output=True)
assert invalid.returncode!=0
print('PASS: deterministic output, six pinned source files, anchor presence, status boundary, missing-source rejection')
