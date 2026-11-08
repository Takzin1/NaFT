#!/usr/bin/env python3
"""No-private-source CI: P26 J-Credit/J-VER historical registration-list tests."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile
from xml.sax.saxutils import escape

ROOT=Path(__file__).resolve().parent.parent
SCRIPT=ROOT/"scripts/p26-jcredit-registration-intake.py"
SOURCE=ROOT/"research/registry-source-intake-2026-11-08/jcredit-project-registration-sources.json"
SUMMARY=ROOT/"data/registry-source-intake-2026-11-08/jcredit-registration-summary.json"

def fake_workbook(path,sheets):
    workbook=('<?xml version="1.0" encoding="UTF-8"?>'
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      '<sheets>'+''.join('<sheet name="%s" sheetId="%d" r:id="rId%d"/>'%
      (escape(sheet),i,i) for i,sheet in enumerate(sheets,1))+'</sheets></workbook>')
    rels=('<?xml version="1.0" encoding="UTF-8"?>'
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      ''.join('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/'
      'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/>'%
      (i,i) for i in range(1,len(sheets)+1))+'</Relationships>')
    with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('xl/workbook.xml',workbook)
        z.writestr('xl/_rels/workbook.xml.rels',rels)
        for i,sheet_name in enumerate(sheets,1):
            def text(cell,val):
                return '<c r="%s" t="inlineStr"><is><t>%s</t></is></c>'%(cell,escape(val))
            def num(cell,val):
                return '<c r="%s"><v>%s</v></c>'%(cell,val)
            header='<row r="2">'+text('A2','プロジェクト番号')+text('K2','認証見込み量（t-CO2）')+'</row>'
            def body(n,method,amount):
                proj='SYN-KC-A' if i<=3 else '101'
                return ('<row r="%d">'%n+text('A'+str(n),proj)+num('B'+str(n),'41555')+
                  num('C'+str(n),'4')+text('D'+str(n),'架空実施者')+
                  text('F'+str(n),'合成試験')+text('G'+str(n),'全国')+
                  text('H'+str(n),'全国')+text('I'+str(n),method)+
                  num('J'+str(n),'46029')+num('K'+str(n),amount)+'</row>')
            rows=header+body(3,'AG-005 Ver. 3.0','100.5')+body(4,'AG-005 Ver. 3.1','20')
            xml=('<?xml version="1.0" encoding="UTF-8"?>'
              '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
              '<sheetData>'+rows+'</sheetData></worksheet>')
            z.writestr('xl/worksheets/sheet%d.xml'%i,xml)

class TestJCreditRegistrationIntake(unittest.TestCase):
    def test_manifest_is_project_registration_not_issued_credits(self):
        src=json.loads(SOURCE.read_text(encoding='utf8'))
        self.assertEqual([s['sha256'] for s in src['sources']],[
          'cee1b3e867d642b188a813bcb756445026bfa4f82bb85216d3ea3b8d7bf81828',
          '7eacbfe6742506d8345ea06b1a2afb14ba084a5b69742fccff5c5e127cc58ce7'])
        self.assertEqual([s['bytes'] for s in src['sources']],[86420,187898])
        self.assertEqual(len(src['sheet_specs']),5)
        self.assertEqual(sum(x['data_rows'] for x in src['sheet_specs']),1537)
        self.assertEqual(sum(x['unique_project_ids'] for x in src['sheet_specs']),1430)
        self.assertFalse(src['actual_issued_credit_quantity_available'])
        self.assertFalse(src['registry_serials_available'])
        self.assertFalse(src['tokenization_rights_verified'])
        self.assertFalse(src['raw_workbooks_committed'])
        self.assertFalse(src['full_normalized_project_records_committed'])
        self.assertTrue(all(s['redistribute_original'] is False for s in src['sources']))
        self.assertEqual(src['actual_credit_registry_access'],
                         'DEFERRED_TO_WEEKDAY_PER_USER')

    def test_aggregates_match_sources_and_ag005_is_versioned(self):
        src=json.loads(SOURCE.read_text(encoding='utf8'))
        d=json.loads(SUMMARY.read_text(encoding='utf8'))
        from decimal import Decimal
        total=sum((Decimal(s['estimated_line_sum_tco2']) for s in src['sheet_specs']),
                  Decimal('0'))
        self.assertEqual(total,Decimal('107661501.6'))
        self.assertEqual(Decimal(d['line_sum_of_projected_tco2']),total)
        self.assertEqual(sum(x['method_rows'] for x in d['summary_by_sheet']),1537)
        self.assertEqual(sum(x['unique_project_ids'] for x in d['summary_by_sheet']),1430)
        for s in d['summary_by_sheet']:
            self.assertEqual(sum(s['region_counts'].values()),s['method_rows'])
        ag=d['agriculture_methodologies']
        self.assertEqual(ag['ag005_method_rows'],26)
        self.assertEqual(sum(x['rows'] for x in ag['ag005_version_counts']),26)
        self.assertEqual(sum(ag['full_agriculture_method_row_counts'].values()),50)
        self.assertFalse(d['no_registry_holdings_or_serials_loaded'] is False)
        self.assertFalse(d['production_mint_authorized'])
        self.assertTrue(d['line_sum_is_not_credit_issuance'])

    def test_synthetic_multi_method_rows_are_preserved_and_no_rights_created(self):
        src=json.loads(SOURCE.read_text(encoding='utf8'))
        by_id={id:[x['sheet'] for x in src['sheet_specs'] if x['source_id']==id]
          for id in ['JCDM_JVER_REGISTRATION_LIST','J_CREDIT_REGISTRATION_LIST']}
        with tempfile.TemporaryDirectory() as tmp:
            t=Path(tmp)
            one=t/'synthetic-registration-list-jcdm.xlsx'
            two=t/'synthetic-registration-list-jcre.xlsx'
            fake_workbook(one,by_id['JCDM_JVER_REGISTRATION_LIST'])
            fake_workbook(two,by_id['J_CREDIT_REGISTRATION_LIST'])
            cmd=[sys.executable,str(SCRIPT),'--jcdm-jver',str(one),
                 '--jcre',str(two),'--out',str(t/'out')]
            blocked=subprocess.run(cmd,capture_output=True,text=True)
            self.assertNotEqual(blocked.returncode,0)
            self.assertIn('ORIGINAL_SHA256_OR_BYTES_MISMATCH',blocked.stderr)
            normal=subprocess.run(cmd+['--synthetic-fixture'],
                                  capture_output=True,text=True)
            self.assertEqual(normal.returncode,0,normal.stderr)
            report=json.loads((t/'out/intake-report.json').read_text(encoding='utf8'))
            self.assertEqual(report['total_project_method_rows'],10)
            self.assertEqual(len(report['sheets']),5)
            self.assertEqual(report['classification'],'SYNTHETIC_TEST')
            self.assertFalse(report['credit_issuance_verified'])
            self.assertFalse(report['registry_serials_queried'])
            self.assertFalse(report['production_mint_authorized'])
            rows=[json.loads(x) for x in (t/'out/project-method-registration.ndjson').
                  read_text(encoding='utf8').splitlines()]
            self.assertEqual(len(rows),10)
            self.assertEqual([x['methodology_version'] for x in rows[:2]],
                             ['AG-005 Ver. 3.0','AG-005 Ver. 3.1'])
            self.assertEqual([x['project_id'] for x in rows[:2]],['SYN-KC-A','SYN-KC-A'])
            self.assertEqual(rows[0]['application_date'],'2013-10-08')
            self.assertEqual(rows[0]['estimated_tco2_per_method_row'],'100.5')
            self.assertIsNone(rows[0]['actual_issued_tco2'])
            self.assertIsNone(rows[0]['serials'])
            self.assertFalse(rows[0]['production_mint_authorized'])
            copied=t/'renamed-source.xlsx'
            copied.write_bytes(one.read_bytes())
            denied=subprocess.run(cmd[:3]+[str(copied)]+cmd[4:]+['--synthetic-fixture'],
                                  capture_output=True,text=True)
            self.assertNotEqual(denied.returncode,0)
            self.assertIn('SYNTHETIC_FIXTURE_NAME_REQUIRED',denied.stderr)

if __name__=='__main__':
    unittest.main(verbosity=2)
