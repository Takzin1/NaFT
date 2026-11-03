import importlib.util,json,pathlib,tempfile,unittest
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("p23",root/"scripts/p23-jaxa-lulc-batch03-verifier.py")
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
class TestBatch03(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.m=json.loads((root/"research/p23-jaxa-lulc-2024-v25-04-batch03.json").read_text())
 def test_register(self):
  rasters=v.validate_manifest(self.m)
  self.assertEqual(len(rasters),6)
  self.assertEqual(sum(t["paddy_pixels"] for t in rasters),23625316)
 def test_fail_on_unearned_credit_and_license(self):
  for name,value in [("certified_credits_tco2e",1),("source_raster_redistribution_permission_verified",True),("national_coverage_complete",True)]:
   m=json.loads(json.dumps(self.m));m[name]=value
   with self.assertRaisesRegex(v.Reject,"RESEARCH_BOUNDARY"):v.validate_manifest(m)
 def test_fail_on_tampered_class_counts(self):
  m=json.loads(json.dumps(self.m));m["rasters"][0]["count_by_class"][2]+=1
  with self.assertRaisesRegex(v.Reject,"TILE_CATEGORY_COUNTS"):v.validate_manifest(m)
 def test_fail_on_wrong_source_sha(self):
  m=json.loads(json.dumps(self.m));m["rasters"][1]["sha256"]="f"*64
  with self.assertRaisesRegex(v.Reject,"TILE_IDENTITY"):v.validate_manifest(m)
 def test_fail_on_bad_original_without_raster_dependencies(self):
  with tempfile.TemporaryDirectory() as d:
   f=pathlib.Path(d)/"bad.tif";f.write_bytes(b"bad-data")
   with self.assertRaisesRegex(v.Reject,"LOCAL_FILE_TYPE_OR_SIZE"):
    v.file_digest(pathlib.Path(d)/"not-there.tif")
   self.assertNotEqual(v.file_digest(f),v.FIXED["LC_N38E139"][:2])
if __name__=="__main__":unittest.main()
