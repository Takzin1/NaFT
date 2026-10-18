#!/usr/bin/env python3
"""Synthetic-only adversarial tests: no copyrighted measurements in Git."""
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from contextlib import redirect_stderr

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('jp_hrt',ROOT/'scripts/inspect-japanflux-jp-hrt-v200.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

HH='TIMESTAMP_START,TIMESTAMP_END,CH4_1_1_1,FCH4_1_1_1,FCH4\n'
DD='TIMESTAMP,CH4_1_1_1,FCH4_1_1_1,FCH4\n'
PDF='A20241210-020_v200.pdf'
def fixture(hh=None,dd=None,extra=None):
    hh=hh if hh is not None else HH + '201301010000,201301010030,2,-9999.0,-9999.0\n201301010030,201301010100,2,1.250,1.250\n'
    dd=dd if dd is not None else DD + '20130101,2,-9999.0,-9999.0\n'
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w',compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('A20241210-020/DATA/ALLVARS/'+module.FILES['HH']['name'],hh)
        z.writestr('A20241210-020/DATA/ALLVARS/'+module.FILES['DD']['name'],dd)
        z.writestr('A20241210-020/PDF/'+PDF,'synthetic PDF bytes, not original')
        if extra:
            z.writestr(extra,'mock')
    return stream.getvalue()

class Tests(unittest.TestCase):
    def run_fixture(self,data,synthetic=True):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'fixture.zip'
            p.write_bytes(data)
            return module.inspect_archive(p,synthetic=synthetic)

    def test_synthetic_safe_classification(self):
        x=self.run_fixture(fixture())
        self.assertEqual(x['status'],'JP_HRT_NATIVE_STRUCTURE_ONLY_REPLAY_BLOCKED')
        self.assertEqual(x['archive_type'],'SYNTHETIC_TEST_ONLY')
        self.assertEqual(x['hourly_half_hourly']['row_count'],2)
        self.assertEqual(x['hourly_half_hourly']['fch4_numeric_qc_unclassified_rows'],1)
        self.assertEqual(x['hourly_half_hourly']['fch4_missing_rows'],1)
        self.assertEqual(x['hourly_half_hourly']['ch4_concentration_numeric_rows_NOT_FLUX'],2)
        self.assertEqual(x['daily']['fch4_numeric_qc_unclassified_rows'],0)
        self.assertIsNone(x['scientific_integral'])
        self.assertIsNone(x['certified_tco2e'])
        self.assertFalse(x['time_zone_utc_mapping_verified'])
        self.assertFalse(x['per_reading_qc_mapping_approved'])
        self.assertFalse(x['source_method_to_FCH4_field_mapping_verified'])
        self.assertEqual(x['hourly_half_hourly']['flux_present_percent'],'50.000')

    def test_unsigned_synthetic_cannot_claim_uploaded_original(self):
        with self.assertRaisesRegex(module.Blocked,'ARCHIVE_SHA_MISMATCH'):
            self.run_fixture(fixture(),synthetic=False)

    def test_mismatched_mirror(self):
        hh=HH+'201301010000,201301010030,2,1,2\n'
        with self.assertRaisesRegex(module.Blocked,'DUPLICATED_FLUX_COLUMNS_CONFLICT'):
            self.run_fixture(fixture(hh=hh))

    def test_overlap(self):
        hh=HH+'201301010000,201301010030,2,-9999,-9999\n201301010015,201301010045,2,1,1\n'
        with self.assertRaisesRegex(module.Blocked,'INTERVAL_GAP_OR_OVERLAP'):
            self.run_fixture(fixture(hh=hh))

    def test_improper_half_hour(self):
        hh=HH+'201301010000,201301010045,2,1,1\n'
        with self.assertRaisesRegex(module.Blocked,'INTERVAL_NOT_30_MIN'):
            self.run_fixture(fixture(hh=hh))

    def test_bad_date(self):
        hh=HH+'201302300000,201302300030,2,1,1\n'
        with self.assertRaisesRegex(module.Blocked,'TIMESTAMP_INVALID'):
            self.run_fixture(fixture(hh=hh))

    def test_header_duplication(self):
        hh='TIMESTAMP_START,TIMESTAMP_END,FCH4,FCH4,CH4_1_1_1,FCH4_1_1_1\n201301010000,201301010030,2,2,3,2\n'
        with self.assertRaisesRegex(module.Blocked,'DUPLICATE_HEADER'):
            self.run_fixture(fixture(hh=hh))

    def test_unsafe_zip(self):
        with self.assertRaisesRegex(module.Blocked,'UNSAFE_ZIP_PATH'):
            self.run_fixture(fixture(extra='../escape.txt'))

    def test_infinity(self):
        hh=HH+'201301010000,201301010030,2,inf,inf\n'
        with self.assertRaisesRegex(module.Blocked,'NONFINITE_FLUX'):
            self.run_fixture(fixture(hh=hh))

    def test_qc_unknown_not_observed(self):
        hh=HH+'201301010000,201301010030,2,12,12\n'
        x=self.run_fixture(fixture(hh=hh))
        self.assertEqual(x['hourly_half_hourly']['fch4_numeric_qc_unclassified_rows'],1)
        self.assertEqual(x['hourly_half_hourly']['readings_accepted_as_verified_observations'],0)
        self.assertIsNone(x['hourly_half_hourly']['annual_emissions_mg_ch4_m2'])

    def test_real_metadata_is_pinned_without_data(self):
        evidence=json.loads((ROOT/'research/japanflux-jp-hrt-v200/selected-native-source-coverage.json').read_text('utf8'))
        self.assertEqual(evidence['archive_sha256'],module.ORIGINAL_ARCHIVE_SHA256)
        self.assertEqual(evidence['source_metadata_pdf_sha256'],module.META_PDF['sha256'])
        self.assertEqual(evidence['hourly_half_hourly']['source_csv_sha256'],module.FILES['HH']['sha256'])
        self.assertEqual(evidence['daily']['source_csv_sha256'],module.FILES['DD']['sha256'])
        self.assertEqual(evidence['hourly_half_hourly']['fch4_numeric_qc_unclassified_rows'],1915)
        self.assertEqual(evidence['hourly_half_hourly']['fch4_missing_rows'],15605)
        self.assertEqual(evidence['daily']['fch4_numeric_qc_unclassified_rows'],0)
        self.assertEqual(evidence['hourly_half_hourly']['readings_accepted_as_verified_observations'],0)
        self.assertIsNone(evidence['scientific_integral'])
        self.assertIsNone(evidence['certified_tco2e'])
        self.assertEqual(evidence['status'],'JP_HRT_NATIVE_STRUCTURE_ONLY_REPLAY_BLOCKED')

if __name__ == '__main__':
    unittest.main(verbosity=2)
