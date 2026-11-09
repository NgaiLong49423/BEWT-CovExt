import base64
import hashlib
import importlib.util
import pathlib
import unittest

spec=importlib.util.spec_from_file_location('review',pathlib.Path(__file__).with_name('check_cl_group.py'))
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

def blob(raw):
    oid=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    return {'sha':oid,'content':base64.b64encode(raw).decode()},oid

class CheckGroupTests(unittest.TestCase):
    def test_git_blob_hash_and_tamper(self):
        record,oid=blob(b'fixture\n'); self.assertEqual(m.verify_blob(record,oid),b'fixture\n')
        record['content']=base64.b64encode(b'tampered').decode()
        with self.assertRaisesRegex(ValueError,'blob ID mismatch'): m.verify_blob(record,oid)
    def test_locate_retains_all_hits_and_rejects_missing(self):
        self.assertEqual(m.locate(b'alpha\nbeta alpha\n',['alpha'])[0]['lines'],[1,2])
        with self.assertRaisesRegex(ValueError,'Missing source anchor'): m.locate(b'alpha',['missing'])
    def test_wrong_commit_tree_fails_closed(self):
        old=m.api; m.api=lambda path:{'tree':{'sha':'wrong'}}
        try:
            with self.assertRaisesRegex(ValueError,'Unexpected source tree'): m.main()
        finally: m.api=old
    def test_truncated_tree_fails_closed(self):
        old=m.api; m.api=lambda path: {'tree':{'sha':m.TREE}} if '/commits/' in path else {'truncated':True}
        try:
            with self.assertRaisesRegex(ValueError,'truncated'): m.main()
        finally: m.api=old
    def test_path_blob_mismatch_fails_closed(self):
        old=m.api; m.api=lambda path: {'tree':{'sha':m.TREE}} if '/commits/' in path else {'tree':[],'truncated':False}
        try:
            with self.assertRaisesRegex(ValueError,'Tree/path blob mismatch'): m.main()
        finally: m.api=old

if __name__=='__main__': unittest.main(verbosity=2)
