import copy
import importlib.util
import json
import pathlib
import unittest
spec=importlib.util.spec_from_file_location('review',pathlib.Path(__file__).with_name('verify_review_inputs.py'))
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
manifest=json.loads((m.TASK/'REVIEW-INPUTS.json').read_text(encoding='utf-8-sig'))
read=lambda p:(m.ROOT/p).read_bytes()
class ReviewInputsTests(unittest.TestCase):
 def test_valid(self):
  result=m.validate(manifest,read); self.assertEqual((result['candidateCount'],result['blankReviewerSlots'],result['humanDecisionsAdded']),(3,6,0))
 def test_filled_reviewer_rejected(self):
  bad=copy.deepcopy(manifest); bad['revisions'][0]['reviewSlots'][0]['decision']='ACCEPTED_FOR_IMPLEMENTATION'
  with self.assertRaisesRegex(ValueError,'review slots'): m.validate(bad,read)
 def test_stale_metadata_rejected(self):
  bad=copy.deepcopy(manifest); bad['revisions'][0]['revisionRecordCanonicalSha256']='0'*64
  with self.assertRaisesRegex(ValueError,'metadata hash'): m.validate(bad,read)
 def test_tampered_feature_rejected(self):
  target=manifest['inputCommit']+':'+manifest['revisions'][0]['featurePath']
  def fake(spec): return m.git_show(spec)+(b' ' if spec==target else b'')
  with self.assertRaisesRegex(ValueError,'feature hash'): m.validate(manifest,read,fake)
 def test_packet_without_hash_rejected(self):
  with self.assertRaisesRegex(ValueError,'packet binding'): m.validate(manifest,lambda p:b'wrong packet')
 def test_extra_reviewer_fields_rejected(self):
  bad=copy.deepcopy(manifest); bad['revisions'][0]['reviewSlots'][0]['rationale']='unreviewed assertion'
  with self.assertRaisesRegex(ValueError,'review slots'): m.validate(bad,read)
 def test_missing_candidate_rejected(self):
  bad=copy.deepcopy(manifest); bad['revisions'].pop()
  with self.assertRaisesRegex(ValueError,'revision set'): m.validate(bad,read)
if __name__=='__main__': unittest.main(verbosity=2)
