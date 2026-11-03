import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"scripts/p22-jaxa-lulc-batch02-verifier.py"
REG=ROOT/"research/p22-jaxa-lulc-2024-v25-04-batch02.json"
spec=importlib.util.spec_from_file_location("p22_jaxa",SCRIPT)
v=importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)

class Batch02Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(REG.read_text(encoding="utf-8"))
    def test_manifest_has_one_new_tile(self):
        t=v.validate_manifest(self.manifest)
        self.assertEqual((t["id"],t["paddy_pixels"],t["water_pixels"]),
                         ("LC_N30E129",0,143766652))
        self.assertEqual(sum(t["count_by_class"]),144000000)
    def test_wrong_count_fails_closed(self):
        m=json.loads(json.dumps(self.manifest))
        m["rasters"][0]["count_by_class"][2]=1
        with self.assertRaisesRegex(v.InvalidSource,"PIXEL_CLASS_MISMATCH"):
            v.validate_manifest(m)
    def test_forbidden_credit_or_rights_fails_closed(self):
        m=json.loads(json.dumps(self.manifest));m["official_credit_tco2e"]=2
        with self.assertRaisesRegex(v.InvalidSource,"INCOMPATIBLE_SCOPE"):
            v.validate_manifest(m)
        m=json.loads(json.dumps(self.manifest));m["original_geotiff_redistribution_permission_verified"]=True
        with self.assertRaisesRegex(v.InvalidSource,"INCOMPATIBLE_SCOPE"):
            v.validate_manifest(m)
    def test_bad_upload_rejected_before_native_import(self):
        with tempfile.TemporaryDirectory() as folder:
            f=Path(folder)/"LC_N30E129.tif"
            f.write_bytes(b"not a geotiff")
            with self.assertRaisesRegex(v.InvalidSource,"ORIGINAL_BYTES_MISMATCH"):
                v.verify_one(f,REG)

if __name__=="__main__":
    unittest.main()
