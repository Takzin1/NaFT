#!/usr/bin/env python3
"""Offline fixture-only P8 tests; no Zenodo traffic, no real field data."""
import csv
import datetime as dt
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("p8", ROOT / "scripts/p8-gimje-native-dock.py")
p8 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p8)


def make_xlsx(entries):
    ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    def cells(row, idx):
        return '<row r="' + str(idx) + '">' + ''.join(
            '<c r="' + chr(65 + c) + str(idx) + '" t="inlineStr"><is><t>' +
            str(v) + '</t></is></c>' for c, v in enumerate(row)) + '</row>'
    root = '<worksheet xmlns="' + ns + '"><sheetData>' + ''.join(
        cells(row, idx) for idx, row in enumerate(entries, start=1)) + '</sheetData></worksheet>'
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('xl/workbook.xml', '<workbook/>')
        z.writestr('xl/worksheets/sheet1.xml', root)
    return buf.getvalue()


def make_native(files):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, rows in files.items():
            z.writestr(name, rows)
    return buf.getvalue()


def sources():
    meta = make_xlsx([['field_id','planting_date'], ['F01','2024-05-21'],
                      ['F02','2024-05-30']])
    raw = make_native({
      'ch4/F01.csv':'DAT,ch4_flux,course_type,rain_mm\n0,0.10,AWD,1.5\n1,NA,CF,\n2,-0.01,MID,1.0\n',
      'ch4/F02.csv':'DAT,ch4_flux,course_type\n0,1.25,CF\n1,2.2,AWD\n'
    })
    return raw, meta


class TestP8(unittest.TestCase):
    def test_research_dock(self):
        raw, meta = sources()
        csv_bytes, lineage, unknown, sheet = p8.normalize(raw, meta)
        self.assertEqual(sheet, 'xl/worksheets/sheet1.xml')
        self.assertEqual(len(lineage), 2)
        self.assertEqual([x['native_rows'] for x in lineage], [3, 2])
        self.assertEqual(unknown, ['MID'])
        d = list(csv.DictReader(io.StringIO(csv_bytes.decode())))
        self.assertEqual(len(d), 5)
        self.assertEqual([x['observation_date'] for x in d],
             ['2024-05-21','2024-05-22','2024-05-23','2024-05-30','2024-05-31'])
        self.assertEqual(d[0]['flux_value'], '0.10')
        self.assertEqual(d[1]['water_management'], 'CONTINUOUS_FLOOD')
        self.assertEqual(d[2]['water_management'], 'UNKNOWN')
        self.assertEqual(d[2]['qc_flag'], 'UNKNOWN')
        self.assertEqual(d[4]['flux_unit'], 'g_CH4_m2_day')
        self.assertEqual(len({x['source_record_id'] for x in d}), 5)
        p7 = p8.run_p7(csv_bytes)
        self.assertEqual(p7['row_count'], 5)
        self.assertEqual(p7['missing_flux_count'], 1)
        self.assertFalse(p7['measurement_qc_independently_verified'])
        self.assertIsNone(p7['validated_co2e_result'])
        csv2, report = p8.build(raw,meta)
        self.assertEqual(csv_bytes, csv2)
        self.assertEqual(report['p7_qc_receipt_sha256'], p7['report_sha256'])
        self.assertEqual(report['native_row_count'], 5)
        self.assertFalse(report['native_field_to_project_verified'])
        self.assertFalse(report['independent_chamber_qc_approved'])
        self.assertIsNone(report['certified_tco2e'])
        self.assertEqual(report, p8.build(raw, meta)[1])

    def test_explicit_date_excel_serial(self):
        d = (dt.date(2023, 6, 2) - dt.date(1899,12,30)).days
        self.assertEqual(p8.parse_date(str(d)), dt.date(2023,6,2))
        self.assertEqual(p8.parse_date('2024/02/29'),dt.date(2024,2,29))
        with self.assertRaisesRegex(ValueError,'UNRECOGNIZED_PLANTING_DATE'):
            p8.parse_date('2024-02-30')

    def test_schema_and_lineage_fail_closed(self):
        raw,meta=sources()
        tests=[
            (make_native({'ch4/XX.csv':'DAT,ch4_flux\n0,1\n'}),meta,'MISSING_PLANTING_DATE'),
            (make_native({'ch4/F01.csv':'DAT,wrong\n0,1\n'}),meta,'NATIVE_CSV_HEADER'),
            (make_native({'ch4/F01.csv':'DAT,ch4_flux\n-1,1\n'}),meta,'DAT_NOT_INT'),
            (make_native({'ch4/F01.csv':'DAT,ch4_flux\n367,1\n'}),meta,'DAT_NOT_INT'),
            (make_native({'../F01.csv':'DAT,ch4_flux\n1,1\n'}),meta,'ARCHIVE_TRAVERSAL'),
            (raw,make_xlsx([['wrong','planting_date'],['F01','2024-05-21']]),
                'XLSX_FIELD_ID_AND_PLANTING_DATE_SHEET_REQUIRED'),
            (raw,make_xlsx([['field_id','planting_date'],['F01','2024-05-21'],
                            ['F01','2024-05-22']]),'DUPLICATE_FIELD_META'),
        ]
        for archive, m, error in tests:
            with self.subTest(error=error):
                with self.assertRaisesRegex(ValueError,error):
                    p8.normalize(archive,m)

    def test_offline_cli_and_tamper(self):
        raw,meta=sources()
        with tempfile.TemporaryDirectory() as td:
            folder=Path(td)
            pzip=folder/'ch4.zip'
            pxlsx=folder/'input_fields_meta.xlsx'
            pzip.write_bytes(raw)
            pxlsx.write_bytes(meta)
            out=folder/'data.csv'
            receipt=folder/'receipt.json'
            fake_remote={
              'ch4.zip': ('https://zenodo.org/fake',hashlib.md5(raw).hexdigest(),len(raw)),
              'input_fields_meta.xlsx':('https://zenodo.org/fake',hashlib.md5(meta).hexdigest(),len(meta))
            }
            with patch.dict(p8.REMOTE,fake_remote,clear=True):
                p8.main(type('Args',(),dict(command='dock',zip_file=str(pzip),
                  metadata_xlsx=str(pxlsx),canonical_out=str(out),receipt_out=str(receipt)))())
                self.assertTrue(out.is_file())
                self.assertTrue(receipt.is_file())
                self.assertEqual(out.stat().st_mode & 0o777,0o600)
                p8.main(type('Args',(),dict(command='verify',zip_file=str(pzip),
                  metadata_xlsx=str(pxlsx),canonical_csv=str(out),receipt_json=str(receipt)))())
                with self.assertRaisesRegex(ValueError,'OUTPUT_EXISTS'):
                    p8.main(type('Args',(),dict(command='dock',zip_file=str(pzip),
                      metadata_xlsx=str(pxlsx),canonical_out=str(out),receipt_out=str(receipt)))())
                out.write_bytes(out.read_bytes()+b'\n')
                with self.assertRaisesRegex(ValueError,'DETERMINISTIC_REPLAY_MISMATCH'):
                    p8.main(type('Args',(),dict(command='verify',zip_file=str(pzip),
                      metadata_xlsx=str(pxlsx),canonical_csv=str(out),receipt_json=str(receipt)))())
            with self.assertRaisesRegex(ValueError,'ZENODO_SIZE_MISMATCH'):
                p8.pinned(str(pzip),'ch4.zip')

    def test_no_network_by_default(self):
        args=['python3',str(ROOT/'scripts/p8-gimje-native-dock.py'),'--help']
        p=subprocess.run(args, capture_output=True,text=True)
        self.assertEqual(p.returncode,0)
        self.assertIn('acquire',p.stdout)
        self.assertIn('dock',p.stdout)
        self.assertIn('verify',p.stdout)


if __name__=='__main__':
    unittest.main(verbosity=2)
    print('NAFT_P8_GIMJE_DOCK_PASS: 5 suites; synthetic native ZIP/XLSX-to-P7 replay, publisher checksums required for real input, no live measurements in CI')
