import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("p25_verifier",ROOT/"scripts/p25-jaxa-lulc-batch05-verifier.py")
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
class TestP25(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m=json.loads((ROOT/"research/p25-jaxa-lulc-2024-v25-04-batch05.json").read_text(encoding="utf-8"))
    def test_manifest_and_pins(self):
        self.assertEqual(len(v.validate_manifest(self.m)),6)
        self.assertEqual([t["paddy_pixels"] for t in self.m["rasters"]],[0,680166,0,903110,7551974,3101175])
        self.assertEqual([t["nodata"] for t in self.m["rasters"]],[None,None,None,0,None,None])
    def test_block_unverified_licensing_credits_coverage(self):
        for key,val in [("national_coverage_complete",True),
            ("source_geotiff_redistribution_permission_verified",True),
            ("source_publisher_byte_authentication_verified",True),
            ("certified_tco2e",1),("field_area_ha",123)]:
            m=json.loads(json.dumps(self.m));m[key]=val
            with self.assertRaisesRegex(v.Reject,"RESEARCH_BOUNDARY"):v.validate_manifest(m)
    def test_histogram_tamper_rejected(self):
        m=json.loads(json.dumps(self.m))
        m["rasters"][4]["count_by_class"][2]+=1
        with self.assertRaisesRegex(v.Reject,"CLASS_HISTOGRAM"):v.validate_manifest(m)
    def test_sha_tamper_rejected(self):
        m=json.loads(json.dumps(self.m))
        m["rasters"][4]["sha256"]="f"*64
        with self.assertRaisesRegex(v.Reject,"SOURCE_IDENTITY"):v.validate_manifest(m)
    def test_missing_or_tampered_original_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            f=Path(folder)/"LC_N31E140.tif"
            f.write_bytes(b"not-original")
            with self.assertRaisesRegex(v.Reject,"FILE_MISSING_OR_UNSAFE"):
                v.local_sha256(Path(folder)/"missing.tif")
            with self.assertRaisesRegex(v.Reject,"ORIGINAL_BYTES"):
                v.replay(folder,ROOT/"research/p25-jaxa-lulc-2024-v25-04-batch05.json")
if __name__=="__main__":
    unittest.main()
