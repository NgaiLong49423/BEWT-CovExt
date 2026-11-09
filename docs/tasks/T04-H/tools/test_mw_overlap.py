"""Regression checks for the bounded MediaWiki evidence extractor."""
import json
import pathlib
import subprocess
import sys

script = pathlib.Path(__file__).with_name('check_mw_overlap.py')
if len(sys.argv) != 2:
    raise SystemExit('Usage: python test_mw_overlap.py <BEWT git root>')
command = [sys.executable, str(script), sys.argv[1]]
a = subprocess.run(command, capture_output=True, check=True)
b = subprocess.run(command, capture_output=True, check=True)
assert a.stdout == b.stdout, 'same pinned blobs must yield identical output'
result = json.loads(a.stdout)
assert result['featuresScanned'] == 27
assert [row['case'][:2] for row in result['selectedComparisons']] == ['06', '15', '16']
assert result['suite']['adjacentEntryLines'][1] == result['suite']['adjacentEntryLines'][0] + 1
assert result['novelty'] == 'NOT_VERIFIED' and result['humanDecision'] is None
assert result['runtime'] == 'NOT_RUN'
assert b'Password' not in a.stdout and b'Username' not in a.stdout
failed = subprocess.run([sys.executable, str(script), str(script / 'not-a-repository')], capture_output=True)
assert failed.returncode != 0, 'missing source must fail closed'
print('PASS: reproducibility, scoped comparison, status boundary, secret-free output and missing-source rejection')
