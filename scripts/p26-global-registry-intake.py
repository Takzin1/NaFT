#!/usr/bin/env python3
"""P26 offline ingestion for the four user-provided VROD/J-Blue source files.

Stdlib-only streaming XLSX reader; no network calls, PDF text redistribution,
credential use, official credit issuance, token minting, or legal-rights inference.

Usage:
  python3 scripts/p26-global-registry-intake.py \
    --vrod /path/Voluntary-Registry-Offsets-Database--v2026-08.xlsx \
    --registry /path/VROD-registry-files--2026-08.xlsx \
    --jblue-ledger /path/ブルーカーボン.pdf \
    --jblue-fees /path/BlueCarbon2026:6:29.pdf \
    --out .naft-local/registry-intake

The full ~6MB normalized PROJECTS JSONL is generated LOCALLY, not committed
automatically. Public upstream registry-source workbook and copyrighted PDF
bytes are not republished. No live serial/custody status is authenticated.
"""
import argparse
import collections
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/"research/registry-source-intake-2026-11-08/sources.json"
INVENTORY=ROOT/"research/registry-source-intake-2026-11-08/registry-sheets.json"
NS="{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL="{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
FIELDS={
    "A":"project_id","B":"project_name","C":"registry","F":"scope",
    "G":"project_type","H":"reduction_or_removal","I":"methodology",
    "J":"methodology_version","K":"region","L":"country","M":"state",
    "P":"total_issued_tco2e","Q":"total_retired_tco2e",
    "R":"total_remaining_tco2e","W":"first_vintage",
}
NUMBERS=["total_issued_tco2e","total_retired_tco2e","total_remaining_tco2e"]
EXPECTED_PROJECTS=11856

def sha_file(path):
    h=hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda:stream.read(1024*1024),b""):
            h.update(block)
    return h.hexdigest()

def require_verified_file(path, ref, allow_fixture=False):
    if path is None:
        return None
    path=Path(path)
    if not path.is_file():
        raise ValueError("INPUT_FILE_NOT_FOUND:"+str(path))
    if path.stat().st_size>128*1024*1024:
        raise ValueError("INPUT_EXCEEDS_128M_LIMIT")
    digest=sha_file(path)
    if not allow_fixture and (digest!=ref["sha256"] or path.stat().st_size!=ref["bytes"]):
        raise ValueError("SOURCE_SHA256_OR_SIZE_MISMATCH:"+ref["id"])
    return {"source_id":ref["id"],"sha256":digest,"bytes":path.stat().st_size,
            "matches_uploaded_original":digest==ref["sha256"]}

def load_shared_strings(archive):
    # The 16MB licensed BERKELEY_VROD workbook contains ~48k short strings.
    names=set(archive.namelist())
    if "xl/sharedStrings.xml" not in names:
        return []
    strings=[]
    with archive.open("xl/sharedStrings.xml") as stream:
        for _,node in ET.iterparse(stream,events=("end",)):
            if node.tag==NS+"si":
                strings.append("".join(node.itertext()))
                node.clear()
                if len(strings)>250000:
                    raise ValueError("SHARED_STRING_LIMIT")
    return strings

def workbook_sheets(archive):
    book=ET.fromstring(archive.read("xl/workbook.xml"))
    relroot=ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    relations={node.get("Id"):node.get("Target") for node in relroot}
    sheets={}
    for node in book.find(NS+"sheets"):
        name=node.get("name")
        target=relations[node.get(REL+"id")].lstrip("/")
        part=target if target.startswith("xl/") else "xl/"+target
        if not re.fullmatch(r"xl/worksheets/sheet[0-9]+\.xml",part):
            raise ValueError("UNSAFE_WORKSHEET_TARGET")
        if part not in archive.namelist():
            raise ValueError("WORKSHEET_NOT_FOUND")
        sheets[name]=part
    return sheets

def cell_value(cell,shared):
    v=cell.find(NS+"v")
    inline=cell.find(NS+"is")
    raw=(v.text or "") if v is not None else (
        "".join(inline.itertext()) if inline is not None else ""
    )
    if cell.get("t")=="s" and raw:
        idx=int(raw)
        if idx<0 or idx>=len(shared):
            raise ValueError("SHARED_STRING_INDEX_INVALID")
        return shared[idx]
    return raw or None

def stream_projects(path,output,fixture=False):
    counts=collections.Counter()
    totals=collections.defaultdict(lambda:[Decimal(0),Decimal(0),Decimal(0)])
    seen=set()
    count=0
    with zipfile.ZipFile(path) as archive:
        if sum(i.file_size for i in archive.infolist())>750*1024*1024:
            raise ValueError("ZIP_UNCOMPRESSED_SIZE_LIMIT")
        sheets=workbook_sheets(archive)
        if "PROJECTS" not in sheets:
            raise ValueError("PROJECTS_SHEET_MISSING")
        shared=load_shared_strings(archive)
        with output.open("w",encoding="utf-8",newline="\n") as out:
            with archive.open(sheets["PROJECTS"]) as stream:
                for _,element in ET.iterparse(stream,events=("end",)):
                    if element.tag!=NS+"row":
                        continue
                    excel_row=int(element.get("r"))
                    if excel_row<5:
                        element.clear()
                        continue
                    values={}
                    for cell in element.findall(NS+"c"):
                        column=re.match(r"[A-Z]+",cell.get("r",""))
                        if column and column.group() in FIELDS:
                            values[FIELDS[column.group()]]=cell_value(cell,shared)
                    element.clear()
                    if not values.get("project_id"):
                        continue
                    if not values.get("registry"):
                        raise ValueError("REGISTRY_REQUIRED_ROW:"+str(excel_row))
                    key=(values["registry"],values["project_id"])
                    if key in seen:
                        raise ValueError("DUPLICATE_REGISTRY_PROJECT:"+repr(key))
                    seen.add(key)
                    rec={field:values.get(field) for field in FIELDS.values()}
                    rec.update({"source_id":"BERKELEY_VROD_2026_08",
                        "source_sheet":"PROJECTS","source_excel_row":excel_row,
                        "status":"RESEARCH_SUMMARY_NOT_LIVE_REGISTRY",
                        "production_mint_authorized":False})
                    out.write(json.dumps(rec,ensure_ascii=False,
                                         separators=(",",":"))+"\n")
                    count+=1
                    if count>20000:
                        raise ValueError("PROJECT_COUNT_LIMIT")
                    counts[values["registry"]]+=1
                    for n,field in enumerate(NUMBERS):
                        try:
                            totals[values["registry"]][n]+=Decimal(values[field] or "0")
                        except InvalidOperation:
                            raise ValueError("INVALID_CREDIT_QUANTITY:"+field)
    if not fixture and count!=EXPECTED_PROJECTS:
        raise ValueError("PUBLISHED_PROJECT_COUNT_MISMATCH:"+str(count))
    by_registry=[
        {"registry":registry,"projects":qty,
         **{NUMBERS[k]:str(totals[registry][k].quantize(Decimal("0.001")))
            for k in range(3)}} for registry,qty in sorted(counts.items())
    ]
    return {"rows":count,"by_registry":by_registry,
            "generated_jsonl_sha256":sha_file(output),
            "generated_jsonl_bytes":output.stat().st_size}

def sheet_inventory(path):
    with zipfile.ZipFile(path) as archive:
        if sum(i.file_size for i in archive.infolist())>800*1024*1024:
            raise ValueError("ZIP_UNCOMPRESSED_SIZE_LIMIT")
        sheets=workbook_sheets(archive)
        result=[]
        for name,part in sheets.items():
            # Excel dimensions are HINTS, not counted record rows.
            with archive.open(part) as stream:
                prefix=stream.read(4096)
            match=re.search(rb'<dimension ref="([^"]+)"',prefix)
            result.append({"name":name,"declared_range":match.group(1).decode("ascii")
                           if match else None})
        return result

def run(argv=None):
    parser=argparse.ArgumentParser()
    parser.add_argument("--vrod",required=True,type=Path)
    parser.add_argument("--registry",type=Path)
    parser.add_argument("--jblue-ledger",type=Path)
    parser.add_argument("--jblue-fees",type=Path)
    parser.add_argument("--out",type=Path,default=ROOT/".naft-local/registry-intake")
    parser.add_argument("--fixture",action="store_true",
                        help="Synthetic testing ONLY; skips uploaded-source SHA check")
    args=parser.parse_args(argv)
    if args.fixture and not args.vrod.name.startswith("synthetic-"):
        raise ValueError("FIXTURE_REQUIRES_SYNTHETIC_FILENAME")
    reg=json.loads(REGISTER.read_text(encoding="utf8"))
    lookup={s["id"]:s for s in reg["sources"]}
    verified=[]
    for path,source_id in [
        (args.vrod,"BERKELEY_VROD_2026_08"),
        (args.registry,"BERKELEY_VROD_REGISTRY_FILES_2026_08"),
        (args.jblue_ledger,"JBLUE_LEDGER_2026_10_16"),
        (args.jblue_fees,"JBLUE_FEES_2026_06_29")]:
        r=require_verified_file(path,lookup[source_id],args.fixture)
        if r:
            verified.append(r)
    args.out.mkdir(parents=True,exist_ok=True)
    out=args.out/"berkeley-vrod-projects.ndjson"
    project_report=stream_projects(args.vrod,out,args.fixture)
    if args.registry:
        actual=sheet_inventory(args.registry)
        expected=json.loads(INVENTORY.read_text(encoding="utf8"))["sheets"]
        if actual!=expected and not args.fixture:
            raise ValueError("REGISTRY_WORKBOOK_DIMENSIONS_CHANGED")
    else:
        actual=None
    report={
        "schema":"naft-p26-local-registry-intake-report/1",
        "classification":"SYNTHETIC_TEST" if args.fixture else "HISTORICAL_RESEARCH_SOURCE",
        "source_files":verified,
        "projects":project_report,
        "registry_sheet_inventory":actual,
        "all_source_hashes_verified":not args.fixture,
        "register_date":"2026-11-08",
        "rights_verified_for_tokenization":False,
        "registry_custody_verified":False,
        "official_certification_asserted":False,
        "certified_tco2e":None,
        "web3_mint_authorized":False,
        "output_is_local_only":True,
        "note":"Snapshot project summaries, NOT live serial rights or authorization. Keep original data and extracted serials out of public commits until applicable rights are reviewed."
    }
    dest=args.out/"intake-report.json"
    dest.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print(json.dumps({"project_rows":project_report["rows"],
                      "registries":len(project_report["by_registry"]),
                      "registry_sheets":len(actual) if actual else None,
                      "source_files_verified":len(verified) if not args.fixture else 0,
                      "output":str(args.out),
                      "mint_authorized":False},
                      ensure_ascii=False,sort_keys=True))

if __name__=="__main__":
    try:run()
    except (ValueError,zipfile.BadZipFile,KeyError,ET.ParseError) as err:
        print("P26_SOURCE_INTAKE_BLOCKED:"+str(err),file=sys.stderr)
        sys.exit(1)
