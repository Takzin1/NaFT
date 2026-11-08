#!/usr/bin/env python3
"""Synthetic-only source compliance tests; original GMW/CSV bytes stay local."""
from collections import Counter
import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parent.parent
SRC=ROOT/"scripts/p27-gmw-isotope-intake.py"
spec=importlib.util.spec_from_file_location("p27_gmw_iso",SRC)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def make_synthetic_csv():
    meta=mod.read_manifest()[1]
    out=io.StringIO()
    w=csv.DictWriter(out,fieldnames=meta["columns"],lineterminator="\n")
    w.writeheader()
    entries=[]
    scheme={"Japan":{"landfill":45,"sewage":6,"rice paddies":2,"gas leak":1},
            "Thailand":{"landfill":10,"sewage":2},
            "Bangladesh":{"rice paddies":2,"gas leak":1,"crop":1}}
    for country,cats in scheme.items():
        for category,count in cats.items():
            for n in range(count):
                entries.append({"COUNTRY":country,"STATE_REGION":"SYNTHETIC",
                    "GROUP_TYPE":"microbial","GROUP":"agriculture" if category=="rice paddies" else "waste",
                    "CATEGORY":category,"SUB_CATEGORY":"","LONGITUDE":"100.0","LATITUDE":"14.0",
                    "SAMPLING_DATE":"2021/11/16–17" if n==0 else "2022/09/07",
                    "d13C_CH4":"-62.0","Unc_d13C_CH4":"0.5",
                    "C2C1_ratio":"","Unc_C2C1_ratio":"","N_AirSample":"1",
                    "AirSample_ID":"SYNTHETIC_ROW_"+str(len(entries)),
                    "COMMENTS":"Synthetic only, no real coordinates"})
    assert len(entries)==70
    entries[0]["N_AirSample"]=str(314)
    for row in entries[:3]:
        row["C2C1_ratio"]="0.0732"
    for row in entries:w.writerow(row)
    for _ in range(25):w.writerow({k:"" for k in meta["columns"]})
    return out.getvalue()

class TestGmwIsotope(unittest.TestCase):
    def test_pinned_archive_and_member_stats(self):
        g,i=mod.read_manifest()
        self.assertEqual(g["origin"]["sha256"],
          "1eb48d7f459068c9fe6084a14cc99d8e734052a0c7204d11cd0e3847c4363fa3")
        self.assertEqual(g["origin"]["bytes"],9575342)
        self.assertEqual(g["origin"]["uncompressed_bytes"],56669093)
        self.assertEqual(g["origin"]["count"],44)
        self.assertEqual(g["observed"]["raster_band_count"],41)
        self.assertEqual(g["observed"]["geotiff_shape"],[3711,3711])
        self.assertEqual(g["observed"]["crs"],"EPSG:4326")
        self.assertEqual(g["observed"]["first_band_present_pixels"],145798)
        self.assertEqual(g["observed"]["last_band_present_pixels"],339302)
        self.assertEqual(g["observed"]["band_year_mapping"],
                         "NOT_VERIFIED_FROM_EMBEDDED_METADATA")
        self.assertTrue(g["observed"]["pixels_not_equal_area_or_carbon"])
        self.assertFalse(g["guards"]["mint_authorized"])
        self.assertFalse(g["guards"]["raster_originals_committed"])
    def test_iso_country_category_and_source_license_boundaries(self):
        g,i=mod.read_manifest()
        self.assertEqual(i["source"]["sha256"],
          "c9cd4a7191890f58171af7973ded1ce0e24e31bd7c0c7ad552481780af21152a")
        self.assertEqual(i["shape"]["country_counts"],{"Japan":54,"Thailand":12,"Bangladesh":4})
        self.assertEqual(i["shape"]["category_counts"],
            {"landfill":55,"sewage":8,"rice paddies":4,"gas leak":2,"crop":1})
        self.assertEqual(i["shape"]["non_empty_rows"],70)
        self.assertEqual(i["shape"]["empty_trailing_rows"],25)
        self.assertEqual(i["shape"]["reported_air_sample_count_sum"],383)
        self.assertEqual(i["shape"]["c2c1_values_present_in_rows"],3)
        self.assertFalse(i["source"]["full_original_rows_committed"])
        self.assertFalse(i["web3_mint_authorized"])
        self.assertIsNone(i["certified_tco2e"])
    def test_synthetic_70_valid_25_trailing_blank_rows(self):
        text=make_synthetic_csv()
        m=mod.read_manifest()[1]
        rows=mod.parse_isotope_csv(text,m)
        self.assertEqual(len(rows),70)
        self.assertEqual(rows[0]["source_line"],2)
        self.assertEqual(rows[-1]["source_line"],71)
        self.assertEqual(sum(int(x["N_AirSample"]) for x in rows),383)
        self.assertEqual(len([x for x in rows if x["CATEGORY"]=="rice paddies"]),4)
        self.assertFalse(any("CO2e" in x for x in rows))
    def test_wrong_country_or_row_count_fails_closed(self):
        m=mod.read_manifest()[1]
        text=make_synthetic_csv()
        with self.assertRaisesRegex(ValueError,"ISOTOPE_COUNTRY_OR_CATEGORY_DRIFT"):
            mod.parse_isotope_csv(text.replace("Japan","Taiwan",1),m)
        with self.assertRaisesRegex(ValueError,"ISOTOPE_SOURCE_ROW_COUNT"):
            mod.parse_isotope_csv(text.rsplit("\n",2)[0],m)
    def test_coordinate_finite_uncertainty_and_date_validation(self):
        m=mod.read_manifest()[1]
        original=make_synthetic_csv()
        for old,new,reason in [
          ("100.0","200.0","INVALID_LONGITUDE"),
          ("-62.0","nan","INVALID_D13C"),
          ("0.5","-0.5","INVALID_UNCERTAINTY"),
          ("2021/11/16–17","2021/02/30","SAMPLING_DATE_INVALID")]:
            with self.subTest(reason=reason),self.assertRaisesRegex(ValueError,reason):
                mod.parse_isotope_csv(original.replace(old,new,1),m)
    def test_reject_data_after_trailing_blank_row(self):
        m=mod.read_manifest()[1]
        text=make_synthetic_csv()
        lines=text.splitlines()
        lines[70],lines[71]=lines[71],lines[70]
        with self.assertRaisesRegex(ValueError,"ISOTOPE_NONBLANK_AFTER_TRAILING_EMPTY"):
            mod.parse_isotope_csv("\n".join(lines)+"\n",m)
    def test_path_traversal_archive_member_guard(self):
        self.assertTrue(mod.safe_member_path("GMW_N19E108_v4112_mng_ext.tif"))
        for path in ["../GMW_N19E108_v4112_mng_ext.tif",
                     "/tmp/GMW_N19E108_v4112_mng_ext.tif",
                     "inner/GMW_N19E108_v4112_mng_ext.tif",
                     "GMW_N19E108_v4112_mng_ext.tif.exe"]:
            self.assertFalse(mod.safe_member_path(path))
    def test_no_unverified_original_zip_can_pass(self):
        g,_=mod.read_manifest()
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/"fake.zip"
            f.write_bytes(b"not the exact archive")
            with self.assertRaisesRegex(ValueError,"GMW_ZIP_SHA_MISMATCH"):
                mod.verify_gmw_archive(f,g)
    def test_isotope_source_byte_mismatch_fail_closed(self):
        _,i=mod.read_manifest()
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/"fake.csv"
            f.write_text(make_synthetic_csv(),encoding="utf8")
            with self.assertRaisesRegex(ValueError,"ISOTOPE_SHA_MISMATCH"):
                mod.verify_isotope(f,i)
    def test_dates_support_documented_day_range_not_arbitrary_strings(self):
        self.assertEqual(mod.iso_date("2021/11/16–17"),2021)
        with self.assertRaisesRegex(ValueError,"SAMPLING_DATE_RANGE"):
            mod.iso_date("2021/11/16–15")
        with self.assertRaisesRegex(ValueError,"SAMPLING_DATE_FORMAT"):
            mod.iso_date("2024-08-17")
if __name__=="__main__":
    unittest.main(verbosity=2)
