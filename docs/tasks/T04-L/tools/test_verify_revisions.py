import copy
import importlib.util
import json
import pathlib
import unittest
spec=importlib.util.spec_from_file_location('rev',pathlib.Path(__file__).with_name('verify_revisions.py'))
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
manifest=json.loads((m.TASK/'REVISIONS.json').read_text(encoding='utf-8-sig'))
receipt=(m.ROOT/manifest['receiptPath']).read_bytes()
read=lambda p:(m.ROOT/p).read_bytes()
class RevisionTests(unittest.TestCase):
    def test_current_inputs(self): self.assertEqual(m.validate(manifest,receipt,read)['v2FeaturesBound'],3)
    def test_modified_receipt_rejected(self):
        with self.assertRaisesRegex(ValueError,'receipt hash mismatch'): m.validate(manifest,receipt+b' ',read)
    def test_changed_feature_rejected(self):
        with self.assertRaisesRegex(ValueError,'feature hash'): m.validate(manifest,receipt,lambda p:read(p)+b' ')
    def test_unauthorized_approval_rejected(self):
        bad=copy.deepcopy(manifest); bad['records'][0]['oracleApproval']='ACCEPTED'
        with self.assertRaisesRegex(ValueError,'review boundary'): m.validate(bad,receipt,read)
    def test_wrong_v1_hash_rejected(self):
        bad=copy.deepcopy(manifest); bad['records'][0]['supersedes']['canonicalSha256']='0'*64
        with self.assertRaisesRegex(ValueError,'receipt mismatch'): m.validate(bad,receipt,read)
    def test_changed_source_pin_rejected(self):
        bad=copy.deepcopy(manifest); bad['records'][0]['appSourceCommit']='0'*40
        with self.assertRaisesRegex(ValueError,'source pin'): m.validate(bad,receipt,read)
if __name__=='__main__': unittest.main(verbosity=2)
