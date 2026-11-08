#!/usr/bin/env python3
"""P26 registry intake: small generated XLSX fixtures and public data boundaries."""
import json
from decimal import Decimal
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT=Path(__file__).resolve().parent.parent
REG=ROOT/"research/registry-source-intake-2026-11-08"
DATA=ROOT/"data/registry-source-intake-2026-11-08"
SCRIPT=ROOT/"scripts/p26-global-registry-intake.py"

def build_synthetic_xlsx(path,duplicate=False):
    # Minimal valid XLSX parts; never use unpublished third-party data in CI.
    book='''<?xml version="1.0"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <sheets><sheet name="PROJECTS" sheetId="2" r:id="rId1"/></sheets>
    </workbook>'''
    rels='''<?xml version="1.0"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1"
         Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
         Target="worksheets/sheet2.xml"/>
      </Relationships>'''
    strings='''<?xml version="1.0"?>
      <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <si><t>FIC-001</t></si><si><t>Synthetic test project A</t></si>
        <si><t>TEST_REGISTRY</t></si><si><t>FIC-002</t></si>
      </sst>'''
    second=0 if duplicate else 3
    sheet=f'''<?xml version="1.0"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
       <sheetData>
        <row r="4"><c r="A4" t="inlineStr"><is><t>Project ID</t></is></c></row>
        <row r="5">
          <c r="A5" t="s"><v>0</v></c><c r="B5" t="s"><v>1</v></c>
          <c r="C5" t="s"><v>2</v></c>
          <c r="P5"><v>13.5</v></c><c r="Q5"><v>2.5</v></c>
          <c r="R5"><v>11</v></c><c r="W5"><v>2025</v></c>
        </row>
        <row r="6">
          <c r="A6" t="s"><v>{second}</v></c><c r="C6" t="s"><v>2</v></c>
          <c r="P6"><v>3</v></c><c r="Q6"><v>1</v></c><c r="R6"><v>2</v></c>
        </row>
       </sheetData>
      </worksheet>'''
    with zipfile.ZipFile(path,"w",compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("xl/workbook.xml",book)
        z.writestr("xl/_rels/workbook.xml.rels",rels)
        z.writestr("xl/sharedStrings.xml",strings)
        z.writestr("xl/worksheets/sheet2.xml",sheet)

class P26CarbonIntakeTests(unittest.TestCase):
    def test_sources_are_snapshot_hashes_not_rights(self):
        d=json.loads((REG/"sources.json").read_text(encoding="utf8"))
        self.assertEqual(len(d["sources"]),4)
        self.assertEqual([s["bytes"] for s in d["sources"]],
                         [16668837,66816465,894009,123466])
        self.assertTrue(all(len(s["sha256"])==64 for s in d["sources"]))
        self.assertTrue(d["sources"][0]["license"].startswith("CC BY 4.0"))
        self.assertFalse(d["raw_originals_committed"])
        self.assertFalse(d["web3_mint_authorized"])
        self.assertFalse(d["registry_rights_verified"])
        self.assertFalse(d["sources"][1]["redistribute_original"])
        self.assertFalse(d["sources"][2]["redistribute_original"])
        self.assertFalse(d["sources"][3]["redistribute_original"])
        inv=json.loads((REG/"registry-sheets.json").read_text(encoding="utf8"))
        self.assertEqual(len(inv["sheets"]),31)
        self.assertIn("Verra VCS Retirements",set(x["name"] for x in inv["sheets"]))
    def test_berkeley_project_counts_and_amounts_are_summarized_only(self):
        d=json.loads((DATA/"berkeley-summary.json").read_text(encoding="utf8"))
        self.assertEqual(sum(r["projects"] for r in d["rows"]),11856)
        self.assertEqual(d["duplicate_registry_project_ids"],0)
        self.assertEqual(len(d["rows"]),6)
        self.assertEqual(sum(Decimal(r["credits_issued"]) for r in d["rows"]),
                         Decimal("2704143472.766"))
        self.assertEqual(sum(Decimal(r["credits_retired"]) for r in d["rows"]),
                         Decimal("1583820719.759"))
        self.assertFalse(d["full_normalized_data_committed"])
        self.assertFalse(d["credit_issuance_asserted"])
    def test_jblue_examples_include_serial_ranges_are_not_one_tonne_each(self):
        d=json.loads((DATA/"jblue-ledger-examples.json").read_text(encoding="utf8"))
        self.assertEqual(len(d["projects"]),3)
        for project in d["projects"]:
            count=0
            total=Decimal(0)
            denomination=Decimal(project["denomination_tco2e_per_serial_for_this_case"])
            for s in project["serial_ranges"]:
                n=int(s["to"])-int(s["from"])+1
                self.assertGreater(n,0)
                self.assertEqual(Decimal(s["quantity_tco2e"]),denomination*n)
                count+=n
                total+=Decimal(s["quantity_tco2e"])
            self.assertEqual(total,Decimal(project["issued_tco2e"]))
            self.assertEqual(total,denomination*count)
        self.assertEqual(d["projects"][0]["serial_ranges"][0]["to"],"00325")
        self.assertFalse(d["holder_custody_authenticated"])
        self.assertEqual(d["any_minted_tokens"],0)
    def test_blue_carbon_fees_are_historical_not_market_prices(self):
        d=json.loads((DATA/"jblue-fees.json").read_text(encoding="utf8"))
        self.assertEqual(d["reference_public_offering_average_price_jpy_per_tco2e"],"75900")
        fees={x["case_id"]:x for x in d["cases"]}
        self.assertEqual(fees["ISSUANCE_NOT_PUBLIC_OFFERING"]["fixed_jpy"],"110000")
        self.assertEqual(fees["OFFSET_CERTIFICATE"]["fixed_jpy"],"21780")
        # 2.5 t at reference average; illustrative, not an executable quotation.
        transfer=fees["TRANSFER_OTHER"]
        estimate=Decimal(transfer["fixed_jpy"])+(
            Decimal("75900")*Decimal("0.10")*Decimal("2.5"))
        self.assertEqual(estimate,Decimal("20075.0"))
        self.assertFalse(d["official_quote_current"])
        self.assertFalse(d["prices_are_market_quotes"])
    def test_local_streaming_fixture_and_fail_closed_guards(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            fake=root/"synthetic-small.xlsx"
            build_synthetic_xlsx(fake)
            out=root/"export"
            run=subprocess.run([sys.executable,str(SCRIPT),
                "--fixture","--vrod",str(fake),"--out",str(out)],
                text=True,capture_output=True)
            self.assertEqual(run.returncode,0,run.stderr)
            content=[json.loads(x) for x in (out/"berkeley-vrod-projects.ndjson")
                      .read_text(encoding="utf8").splitlines()]
            self.assertEqual([x["project_id"] for x in content],["FIC-001","FIC-002"])
            self.assertEqual(content[0]["total_issued_tco2e"],"13.5")
            self.assertFalse(content[0]["production_mint_authorized"])
            report=json.loads((out/"intake-report.json").read_text(encoding="utf8"))
            self.assertEqual(report["classification"],"SYNTHETIC_TEST")
            self.assertFalse(report["all_source_hashes_verified"])
            self.assertFalse(report["registry_custody_verified"])
            denied=subprocess.run([sys.executable,str(SCRIPT),
                "--vrod",str(fake),"--out",str(root/"denied")],
                text=True,capture_output=True)
            self.assertNotEqual(denied.returncode,0)
            self.assertIn("SOURCE_SHA256_OR_SIZE_MISMATCH",denied.stderr)
            build_synthetic_xlsx(fake,duplicate=True)
            conflict=subprocess.run([sys.executable,str(SCRIPT),
                "--fixture","--vrod",str(fake),"--out",str(root/"conflict")],
                text=True,capture_output=True)
            self.assertNotEqual(conflict.returncode,0)
            self.assertIn("DUPLICATE_REGISTRY_PROJECT",conflict.stderr)

if __name__=="__main__":
    unittest.main(verbosity=2)
