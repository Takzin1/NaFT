import importlib.util,json,pathlib,tempfile,unittest
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("p24",root/"scripts/p24-jaxa-lulc-batch04-verifier.py")
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
class TestP24(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.m=json.loads((root/"research/p24-jaxa-lulc-2024-v25-04-batch04.json").read_text(encoding="utf-8"))
 def test_manifest(self):
  self.assertEqual(len(v.validate_manifest(self.m)),6)
  self.assertEqual([t["paddy_pixels"] for t in self.m["rasters"]],[398614,8173654,345,276,2660132,2655618])
  self.assertEqual([t["nodata"] for t in self.m["rasters"]],[0,None,0,0,None,0])
 def test_denies_fabricated_certification_or_rights(self):
  for key,val in [("national_coverage_complete",True),("certified_tco2e",2),
                  ("source_publisher_byte_authentication_verified",True),
                  ("source_geotiff_redistribution_permission_verified",True),
                  ("field_area_ha",123)]:
   m=json.loads(json.dumps(self.m));m[key]=val
   with self.assertRaisesRegex(v.Reject,"BOUNDARY"):v.validate_manifest(m)
 def test_denies_bad_pixel_totals_and_bytes(self):
  m=json.loads(json.dumps(self.m));m["rasters"][2]["count_by_class"][2]+=1
  with self.assertRaisesRegex(v.Reject,"PIXEL_CLASSES"):v.validate_manifest(m)
  m=json.loads(json.dumps(self.m));m["rasters"][0]["sha256"]="0"*64
  with self.assertRaisesRegex(v.Reject,"TILE_METADATA"):v.validate_manifest(m)
 def test_rejects_missing_and_tampered_source(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaisesRegex(v.Reject,"FILE_MISSING_OR_UNSAFE"):
    v.digest(pathlib.Path(d)/"missing.tif")
   (pathlib.Path(d)/"LC_N42E142.tif").write_bytes(b"not-a-real-tiff")
   with self.assertRaisesRegex(v.Reject,"ORIGINAL_SHA256"):v.replay(d,root/"research/p24-jaxa-lulc-2024-v25-04-batch04.json")
if __name__=="__main__":unittest.main()
