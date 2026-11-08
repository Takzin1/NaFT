#!/usr/bin/env python3
"""P26 MAFF R7 adaptation PDF provenance verifier and section-index exporter.

Without --verify-originals, validates only the public catalog: this is NOT
source-byte verification. Full report Part 1/3 is deliberately missing.
It never produces an emission factor, a certified credit, or token rights.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "research/registry-source-intake-2026-11-08/maff-r7-adaptation-parts-2-3.json"
CASES = ROOT / "data/registry-source-intake-2026-11-08/maff-r7-adaptation-curated-cases.json"

class IntakeError(ValueError):
    pass

def reject(message):
    raise IntakeError("MAFF_R7_BLOCKED:" + message)

def load_and_check():
    m = json.loads(MANIFEST.read_text(encoding="utf8"))
    c = json.loads(CASES.read_text(encoding="utf8"))
    if m.get("schema") != "naft-p26-maff-r7-adaptation-split-pdfs/1":
        reject("MANIFEST_SCHEMA")
    if m.get("part_1_3_received") is not False or m.get("complete_3_part_detailed_report") is not False:
        reject("PART_ONE_MUST_REMAIN_UNVERIFIED")
    if m.get("production_mint_authorized") is not False or c.get("production_mint_authorized") is not False:
        reject("MINT_MUST_BE_DISABLED")
    sources = m.get("sources", [])
    if len(sources) != 2 or [s["id"] for s in sources] != [
        "MAFF_R7_ADAPTATION_PART_2_3", "MAFF_R7_ADAPTATION_PART_3_3"
    ]:
        reject("TWO_PARTS_REQUIRED")
    for s in sources:
        if len(s["sha256"]) != 64 or not all(ch in "0123456789abcdef" for ch in s["sha256"]):
            reject("INVALID_SHA256")
        expected_page = s["report_first_page"]
        for section in s["sections"]:
            if section["report_start"] != expected_page or section["report_end"] < expected_page:
                reject("REPORT_PAGE_RANGE_GAP")
            if section["pdf_start"] != section["report_start"]-s["report_first_page"]+1:
                reject("PDF_MAPPING_OFFSET")
            if section["pdf_end"] != section["report_end"]-s["report_first_page"]+1:
                reject("PDF_MAPPING_OFFSET")
            expected_page = section["report_end"] + 1
        if expected_page-1 != s["report_last_numbered_page"]:
            reject("REPORT_END_PAGE")
        expected_pdf_pages = s["report_last_numbered_page"]-s["report_first_page"]+1
        # Final document includes one unnumbered contact page.
        if s["pdf_pages"] != expected_pdf_pages + (1 if s["id"].endswith("3_3") else 0):
            reject("SOURCE_PAGE_COUNT")
    if sources[0]["report_last_numbered_page"]+1 != sources[1]["report_first_page"]:
        reject("CROSS_PART_PAGE_GAP")
    mapping = {s["id"]:s for s in sources}
    for rec in c["records"]+c["other_observations"]:
        s = mapping.get(rec.get("source_id"))
        if not s:
            reject("CURATED_UNKNOWN_SOURCE")
        if rec["report_page"] != s["report_first_page"]+rec["pdf_page"]-1:
            reject("CURATED_PAGE_MISMATCH")
        if not s["report_first_page"] <= rec["report_page"] <= s["report_last_numbered_page"]:
            reject("CURATED_PAGE_OUT_OF_RANGE")
        if rec.get("production_mint_authorized") is True or rec.get("carbon_quantification_allowed") is True:
            reject("CURATED_NO_MINT")
    return m,c

def sha_and_size(path):
    if not path.is_file():
        reject("ORIGINAL_MISSING")
    if path.stat().st_size > 32*1024*1024:
        reject("PDF_TOO_LARGE")
    h = hashlib.sha256()
    with path.open("rb") as f:
        if f.read(5) != b"%PDF-":
            reject("NOT_A_PDF")
        f.seek(0)
        for part in iter(lambda:f.read(1024*1024),b""):
            h.update(part)
    return path.stat().st_size,h.hexdigest()

def run(part2=None,part3=None):
    m,c=load_and_check()
    given=[part2,part3]
    if any(x is not None for x in given) and not all(x is not None for x in given):
        reject("BOTH_PDF_PATHS_REQUIRED")
    provenance=[]
    for i,src in enumerate(m["sources"]):
        result={"source_id":src["id"],"expected_sha256":src["sha256"],
                "pdf_pages_indexed":src["pdf_pages"],
                "verified_uploaded_bytes":False}
        if all(x is not None for x in given):
            size,digest=sha_and_size(Path(given[i]))
            if size != src["bytes"] or digest != src["sha256"]:
                reject("ORIGINAL_SHA_OR_SIZE_MISMATCH:"+src["id"])
            result["verified_uploaded_bytes"]=True
        provenance.append(result)
    return {
      "schema":"naft-p26-maff-r7-adaptation-local-receipt/1",
      "mode":"VERIFIED_LOCAL_PDFS" if all(x is not None for x in given) else "CATALOG_ONLY_NO_ORIGINAL_BYTES",
      "sources":provenance,
      "indexed_sections":sum(len(src["sections"]) for src in m["sources"]),
      "indexed_pdf_pages":sum(src["pdf_pages"] for src in m["sources"]),
      "curated_case_examples":len(c["records"]),
      "curated_context_observations":len(c["other_observations"]),
      "source_pdf_page_references_present":True,
      "part_1_3_missing":True,
      "all_three_parts_integrated":False,
      "adaptation_efficacy_independently_validated":False,
      "carbon_savings_calculated":False,
      "certified_tco2e":None,
      "registry_custody_verified":False,
      "production_mint_authorized":False
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--part-2",type=Path)
    p.add_argument("--part-3",type=Path)
    p.add_argument("--out",type=Path,help="Optional local receipt JSON")
    args=p.parse_args()
    try:
        output=run(args.part_2,args.part_3)
    except (IntakeError,OSError,KeyError,TypeError,ValueError,json.JSONDecodeError) as e:
        print(str(e) if str(e).startswith("MAFF_R7_BLOCKED:") else "MAFF_R7_BLOCKED:INVALID_SOURCE",file=sys.stderr)
        sys.exit(1)
    data=json.dumps(output,ensure_ascii=False,indent=2)+"\n"
    if args.out:
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(data,encoding="utf8")
    print(data,end="")

if __name__=="__main__":
    main()
