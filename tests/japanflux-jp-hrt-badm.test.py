"""Deterministic synthetic-only BADM XLSX parser and protocol conflict tests."""
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from datetime import datetime, timedelta

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('jp_badm', ROOT/'scripts/inspect-japanflux-jp-hrt-badm.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def small_xlsx():
    shared='''<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>SITE_ID</t></si><si><t>JP-Hrt</t></si></sst>'''
    rows='''<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="D1" t="s"><v>1</v></c></row>
    </sheetData></worksheet>'''
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,'w',compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('xl/sharedStrings.xml',shared)
        z.writestr('xl/worksheets/sheet1.xml',rows)
    return buf.getvalue()

def tables():
    return {
      'Site_General_Info':{
        'SITE_ID':['JP-Hrt'],
        'FLUX_MEASUREMENTS_METHOD':['Eddy Covariance']*3,
        'FLUX_MEASUREMENTS_VARIABLE':['CO2','H2O','CH4'],
        'FLUX_MEASUREMENTS_DATE_START':['20130831']*3,
        'UTC_OFFSET':['9']},
      'Instrument':{'INST_MODEL':['GA_OP-Campbell EC150','GA_CP-Picarro G2301-f','SA-Campbell CSAT-3A']},
      'Instrument_Ops':{'INSTOM_TYPE':['Installation']},
      'Disturbance_and_Management':{'DM_WATER':['Irrigation']},
    }

def fake_hh():
    header='TIMESTAMP_START,FCH4\n'
    # Unique synthetic date labels are shape-valid; values are NOT real flux.
    # Synthetic ISO-valid dates, not original observation values.
    pre=[(datetime(2013,6,1,7)+timedelta(minutes=30*i)).strftime('%Y%m%d%H%M')+',1.0\n' for i in range(1689)]
    post=[(datetime(2013,9,20)+timedelta(minutes=30*i)).strftime('%Y%m%d%H%M')+',0.5\n' for i in range(226)]
    return (header+''.join(pre)+''.join(post)+('201301010000,-9999\n'*15605)).encode()

class Cases(unittest.TestCase):
    def test_source_xml_shared_strings(self):
        parsed=mod.workbook_rows(small_xlsx())
        self.assertEqual(parsed['SITE_ID'][0],'JP-Hrt')

    def test_xml_member_bounds(self):
        with self.assertRaisesRegex(mod.Blocked,'BADM_XLSX_TOO_LARGE'):
            mod.workbook_rows(b'A'*100000)

    def test_bad_zip(self):
        with self.assertRaisesRegex(mod.Blocked,'BADM_XLSX_MISSING_XML'):
            mod.workbook_rows(b'not-a-workbook')

    def test_data_vectors_are_required(self):
        with self.assertRaisesRegex(mod.Blocked,'BADM_REQUIRED_VARIABLE_MISSING'):
            mod.getdata({},'UTC_OFFSET')

    def test_real_evidence_registry_does_not_store_measurements(self):
        facts=json.loads((ROOT/'research/japanflux-jp-hrt-v200/badm-concordance-2026-10-19.json').read_text())
        self.assertEqual(facts['badm_sha256'],mod.BADM)
        self.assertEqual(facts['archive_sha256'],mod.PINNED_ARCHIVE)
        self.assertEqual(facts['hh_numeric_before_badm_start'],1689)
        self.assertFalse(facts['source_FCH4_native_unit_verified'])
        self.assertFalse(facts['timezone_column_mapping_independently_validated'])
        self.assertTrue(facts['method_disagreement'])
        self.assertIsNone(facts['emission_integral'])
        self.assertIsNone(facts['certified_tco2e'])

    def test_original_pinned_archive_required(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'fake.zip'
            p.write_bytes(b'fake original')
            with self.assertRaisesRegex(mod.Blocked,'BADM_ARCHIVE_SHA256_MISMATCH'):
                mod.inspect(p)

    def test_semantic_bad_start_rejected(self):
        x=tables()
        x['Site_General_Info']['FLUX_MEASUREMENTS_DATE_START']=['20130601']*3
        with self.assertRaisesRegex(mod.Blocked,'BADM_DATE_MAPPING_CHANGED'):
            mod.summarize(x,fake_hh(),mod.BADM)

    def test_bad_method_rejected(self):
        x=tables()
        x['Site_General_Info']['FLUX_MEASUREMENTS_METHOD'][2]='HREA'
        with self.assertRaisesRegex(mod.Blocked,'BADM_METHOD_MAPPING_CHANGED'):
            mod.summarize(x,fake_hh(),mod.BADM)

    def test_bad_offset_rejected(self):
        x=tables()
        x['Site_General_Info']['UTC_OFFSET']=['0']
        with self.assertRaisesRegex(mod.Blocked,'BADM_OFFSET_UNEXPECTED'):
            mod.summarize(x,fake_hh(),mod.BADM)

    def test_mock_counts_only_no_flux_replay(self):
        out=mod.summarize(tables(),fake_hh(),mod.BADM)
        self.assertEqual(out['status'],'BADM_METHOD_AND_START_DATE_CONFLICT_REVIEW_REQUIRED')
        self.assertEqual(out['hh_numeric_candidate_count'],1915)
        self.assertEqual(out['hh_numeric_before_badm_start'],1689)
        self.assertEqual(out['hh_missing_count'],15605)
        self.assertFalse(out['timezone_column_mapping_independently_validated'])
        self.assertIsNone(out['emission_integral'])
        self.assertIsNone(out['certified_tco2e'])

if __name__=='__main__':
    unittest.main(verbosity=2)
