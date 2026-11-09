import copy
import importlib.util
import json
import pathlib
import unittest

spec=importlib.util.spec_from_file_location('batch',pathlib.Path(__file__).with_name('verify_batch.py'))
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
manifest=json.loads((m.BASE/'BATCH-INPUTS.json').read_text(encoding='utf-8-sig'))
class BatchTests(unittest.TestCase):
    def test_valid_manifest(self):
        result=m.validate(manifest); self.assertEqual(result['candidateCount'],3); self.assertEqual(result['decisionCount'],0)
    def test_reject_decision(self):
        bad=copy.deepcopy(manifest); bad['candidates'][0]['humanDecision']='ACCEPTED_FOR_IMPLEMENTATION'
        with self.assertRaisesRegex(ValueError,'decision must remain null'): m.validate(bad)
    def test_reject_stale_revision(self):
        bad=copy.deepcopy(manifest); bad['candidates'][0]['candidateSha256']='0'*64
        with self.assertRaisesRegex(ValueError,'revision hash'): m.validate(bad)
    def test_reject_missing_packet(self):
        bad=copy.deepcopy(manifest); bad['candidates'][0]['packetPath']='missing-packet.md'
        with self.assertRaises(Exception): m.validate(bad)
    def test_reject_missing_candidate(self):
        bad=copy.deepcopy(manifest); bad['candidates'].pop()
        with self.assertRaisesRegex(ValueError,'candidate set'): m.validate(bad)
if __name__=='__main__': unittest.main(verbosity=2)
