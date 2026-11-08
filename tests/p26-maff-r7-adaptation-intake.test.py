#!/usr/bin/env python3
"""CI does not require redistribution of MAFF report PDFs."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parent.parent
SCRIPT=ROOT/"scripts/p26-maff-r7-adaptation-intake.py"
MANIFEST=ROOT/"research/registry-source-intake-2026-11-08/maff-r7-adaptation-parts-2-3.json"
CASES=ROOT/"data/registry-source-intake-2026-11-08/maff-r7-adaptation-curated-cases.json"
spec=importlib.util.spec_from_file_location("p26_maff_intake",SCRIPT)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class TestMaffR7SplitDocs(unittest.TestCase):
    def test_catalog_has_exact_two_uploaded_pdfs_and_missing_first_part(self):
        m,c=mod.load_and_check()
        self.assertEqual([s["sha256"] for s in m["sources"]],[
          "0a6a7906dafb677b01adb3bff2a4624045929f3dc0da3d7ac0a4f5b5b1cf1400",
          "1bda29f5c8670acb51a5fa5c17732c8bd6f50c4312dad23aa60214e3c00e201e"])
        self.assertEqual([s["bytes"] for s in m["sources"]],[1188603,4469293])
        self.assertEqual([s["pdf_pages"] for s in m["sources"]],[56,66])
        self.assertFalse(m["part_1_3_received"])
        self.assertFalse(m["complete_3_part_detailed_report"])
        self.assertFalse(m["raw_originals_committed"])

    def test_complete_page_index_54_to_174_and_unnumbered_contact_page(self):
        m,_=mod.load_and_check()
        self.assertEqual(sum(len(s["sections"]) for s in m["sources"]),48)
        self.assertEqual([(s["report_first_page"],s["report_last_numbered_page"])
                          for s in m["sources"]],[(54,109),(110,174)])
        self.assertEqual([s["sections"][0]["pdf_start"] for s in m["sources"]],[1,1])
        self.assertEqual([s["sections"][-1]["pdf_end"] for s in m["sources"]],[56,65])

    def test_curated_effectiveness_is_reported_not_numeric_experimental_proof(self):
        m,c=mod.load_and_check()
        self.assertEqual(len(c["records"]),9)
        self.assertEqual(len(c["other_observations"]),3)
        self.assertEqual({r["reported_rating"] for r in c["records"]},{"Ａ","Ｂ","Ｃ"})
        self.assertTrue(all(r.get("reported_effect_or_reason") for r in c["records"]))
        self.assertTrue(all(r["report_page"]==r["pdf_page"]+
                            (53 if r["source_id"].endswith("2_3") else 109)
                            for r in c["records"]))
        self.assertIn("DO_NOT_INFER",m["rating_policy"])
        self.assertFalse(c["production_mint_authorized"])
        self.assertIsNone(c["certified_tco2e"])

    def test_catalog_only_mode_discloses_no_hash_verification(self):
        r=mod.run()
        self.assertEqual(r["mode"],"CATALOG_ONLY_NO_ORIGINAL_BYTES")
        self.assertEqual(r["indexed_pdf_pages"],122)
        self.assertEqual(r["indexed_sections"],48)
        self.assertTrue(r["part_1_3_missing"])
        self.assertFalse(r["adaptation_efficacy_independently_validated"])
        self.assertFalse(r["carbon_savings_calculated"])
        self.assertTrue(all(s["verified_uploaded_bytes"] is False for s in r["sources"]))
        self.assertIsNone(r["certified_tco2e"])
        self.assertFalse(r["production_mint_authorized"])

    def test_one_pdf_only_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"fake.pdf"
            p.write_bytes(b"%PDF-1.4\n%%EOF")
            with self.assertRaisesRegex(mod.IntakeError,"BOTH_PDF_PATHS_REQUIRED"):
                mod.run(p,None)

    def test_wrong_pdf_sha_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"fake.pdf"
            p.write_bytes(b"%PDF-1.4\n%%EOF")
            with self.assertRaisesRegex(mod.IntakeError,"ORIGINAL_SHA_OR_SIZE_MISMATCH"):
                mod.run(p,p)
            p.write_bytes(b"not a pdf")
            with self.assertRaisesRegex(mod.IntakeError,"NOT_A_PDF"):
                mod.run(p,p)

    def test_modified_section_mapping_is_rejected(self):
        m=json.loads(MANIFEST.read_text(encoding="utf8"))
        with patch.object(mod,"MANIFEST") as _:
            # Raw input correction is not to be silently accepted by source register.
            m["sources"][0]["sections"][1]["report_start"]=58
            with tempfile.TemporaryDirectory() as tmp:
                f=Path(tmp)/"bad_manifest.json"
                f.write_text(json.dumps(m),encoding="utf8")
                mod.MANIFEST=f
                with self.assertRaisesRegex(mod.IntakeError,"REPORT_PAGE_RANGE_GAP"):
                    mod.load_and_check()
        mod.MANIFEST=MANIFEST

    def test_cli_reports_missing_source_and_never_produces_credit(self):
        result=subprocess.run([sys.executable,str(SCRIPT)],capture_output=True,text=True,check=True)
        r=json.loads(result.stdout)
        self.assertFalse(r["production_mint_authorized"])
        self.assertFalse(r["registry_custody_verified"])
        self.assertTrue(r["part_1_3_missing"])

if __name__=="__main__":
    unittest.main(verbosity=2)
