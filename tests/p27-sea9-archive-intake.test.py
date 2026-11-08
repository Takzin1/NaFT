#!/usr/bin/env python3
"""SEA-9 source intake tests, no 3.7MB original ZIP or 17MB NetCDF in CI."""
import importlib.util
import io
import json
from pathlib import Path
import struct
import tempfile
import unittest
import zipfile

ROOT=Path(__file__).resolve().parent.parent
SCRIPT=ROOT/"scripts/p27-sea9-archive-intake.py"
spec=importlib.util.spec_from_file_location("p27_sea9",SCRIPT)
sea9=importlib.util.module_from_spec(spec)
spec.loader.exec_module(sea9)

def fake_npy(values):
    header="{'descr': '<f8', 'fortran_order': False, 'shape': (2000,), }"
    padding=(16-(10+len(header)+1)%16)%16
    h=(header+" "*padding+"\n").encode("ascii")
    return b"\x93NUMPY"+bytes((1,0))+struct.pack("<H",len(h))+h+struct.pack("<2000d",*values)

def fake_npz(data):
    with io.BytesIO() as stream:
        with zipfile.ZipFile(stream,"w") as z:
            z.writestr("sea_total_Tg.npy",fake_npy(data))
        return stream.getvalue()

class Sea9Tests(unittest.TestCase):
    def test_source_pin_and_file_inventory(self):
        m=json.loads((ROOT/"research/sea9-rice-ch4-2026-11-08/source-register-v1.json").read_text())
        self.assertEqual(sea9.SHA,m["source"]["archive_sha256"])
        self.assertEqual(sea9.BYTES,m["source"]["archive_bytes"])
        self.assertEqual(sea9.FILES,m["source"]["total_regular_files"])
        self.assertEqual(sea9.UNPACKED,m["source"]["extracted_bytes"])
        self.assertEqual(m["source"]["code_license"],"MIT")
        self.assertEqual(m["source"]["data_license"],"CC-BY-4.0")
        self.assertIn("UNDER_REVIEW",m["source"]["manuscript_status_as_stated_in_package"])
        self.assertFalse(m["github_integration"]["binary_netcdf_and_npz_committed"])
        self.assertFalse(m["github_integration"]["web3_mint_authorized"])
    def test_local_zip_digest_refuses_changed_source(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/"test.zip"
            path.write_bytes(b"not original zip")
            with self.assertRaisesRegex(ValueError,"SOURCE_SHA256_OR_SIZE_MISMATCH"):
                sea9.validate(path)
    def test_numeric_npz_decodes_2000_doubles_without_pickle(self):
        with io.BytesIO() as buffer:
            with zipfile.ZipFile(buffer,"w") as z:
                z.writestr("zenodo_package/data/ch4_mc_sea_total.npz",
                           fake_npz([2.5]*2000))
            with zipfile.ZipFile(buffer) as z:
                values=sea9.npy_samples(z)
                self.assertEqual(len(values),2000)
                self.assertEqual(sea9.q(values,.05),2.5)
                self.assertEqual(sea9.q(values,.95),2.5)
    def test_nan_mc_samples_are_rejected(self):
        with io.BytesIO() as buffer:
            with zipfile.ZipFile(buffer,"w") as z:
                z.writestr("zenodo_package/data/ch4_mc_sea_total.npz",
                           fake_npz([float("nan")]+[1.]*1999))
            with zipfile.ZipFile(buffer) as z:
                with self.assertRaisesRegex(ValueError,"NPY_NONFINITE"):
                    sea9.npy_samples(z)
    def test_country_total_uses_admin_mask_not_full_grid(self):
        import csv
        from decimal import Decimal
        with (ROOT/"data/sea9-rice-ch4-2026-11-08/ch4_country_comparison.csv").open() as f:
            rows=list(csv.DictReader(f))
        self.assertEqual([x["country"] for x in rows[:-1]],sea9.COUNTRIES)
        self.assertEqual(len(rows),10)
        total=Decimal(rows[-1]["OpenSEA_Gg_CH4_yr"])
        self.assertLess(abs(sum(Decimal(x["OpenSEA_Gg_CH4_yr"]) for x in rows[:-1])-total),Decimal("1e-6"))
        inv=json.loads((ROOT/"data/sea9-rice-ch4-2026-11-08/04_inventory_summary.json").read_text())
        self.assertAlmostEqual(float(total/1000),6.61379599873184)
        self.assertAlmostEqual(float(Decimal(str(inv["sea_total_Gg_CH4_yr"]))/1000),6.745447945582598)
        self.assertGreater(inv["sea_total_Gg_CH4_yr"],float(total))
    def test_mc_statistics_are_snapshot_not_certified_credit(self):
        m=json.loads((ROOT/"research/sea9-rice-ch4-2026-11-08/source-register-v1.json").read_text())
        d=json.loads((ROOT/"data/sea9-rice-ch4-2026-11-08/ch4_mc_diagnostics.json").read_text())
        self.assertEqual(d["N_MC"],2000)
        self.assertAlmostEqual(d["E_mean_Tg"],7.229279330705696)
        self.assertAlmostEqual(d["E_p05_Tg"],3.855539397332934)
        self.assertAlmostEqual(d["E_p95_Tg"],12.308781053231414)
        self.assertAlmostEqual(d["E_std_Tg"],2.6342806422280782)
        self.assertFalse(m["github_integration"]["carbon_credits_issued"])
        self.assertIsNone(m["github_integration"]["certified_tco2e"])
        self.assertFalse(m["github_integration"]["full_local_member_sha_manifest_generated"] is False)
    def test_numpy_percentile_linear_interpolation(self):
        self.assertAlmostEqual(sea9.q([1,2,3,4,5],.05),1.2)
        self.assertAlmostEqual(sea9.q([1,2,3,4,5],.50),3)

if __name__=="__main__":
    unittest.main(verbosity=2)
