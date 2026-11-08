#!/usr/bin/env python3
"""Offline J-Credit/J-VER project-registration workbook intake (P26).

Sources are official-looking historical registration/application lists, NOT
the live J-Credit credit ledger: projected amounts are NOT issued supply.
Original XLSX bytes and full row data are never committed by this program.
Only stdlib is required; SHA-pinned inputs fail closed by default.
"""
import argparse
from collections import Counter
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/"research/registry-source-intake-2026-11-08/jcredit-project-registration-sources.json"
NS="{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RID="{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
KEYS=["project_id","application_excel_serial","review_committee",
      "operator_or_manager","joint_party_or_expected_acquirer","project_description",
      "location","region","methodology_version","period_end_excel_serial",
      "estimated_tco2_per_method_row"]

def blocked(code):
    raise ValueError("JLIST_BLOCKED:"+code)

def sha256(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(1048576),b""):
            h.update(block)
    return h.hexdigest()

def exact_decimal(value):
    if value is None or not re.fullmatch(r"\+?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?",str(value)):
        blocked("INVALID_ESTIMATED_AMOUNT")
    try:
        d=Decimal(str(value))
        if not d.is_finite() or d<0:blocked("INVALID_ESTIMATED_AMOUNT")
        return d
    except InvalidOperation:blocked("INVALID_ESTIMATED_AMOUNT")

def iso_date(value):
    if value is None or str(value).strip() in ("","-","‐","－"):
        return None
    try:
        num=Decimal(str(value))
        if not num.is_finite() or num!=num.to_integral_value():blocked("INVALID_DATE_SERIAL")
        dt=datetime(1899,12,30)+timedelta(days=int(num))
        if dt.year<1900 or dt.year>2200:blocked("DATE_OUT_OF_RANGE")
        return dt.date().isoformat()
    except (ValueError,OverflowError,InvalidOperation):blocked("INVALID_DATE_SERIAL")

def get_cell(cell,shared):
    raw=cell.find(NS+"v")
    inline=cell.find(NS+"is")
    val=raw.text if raw is not None else (
        "".join(inline.itertext()) if inline is not None else None)
    if val is None:return None
    if cell.get("t")=="s":
        try:
            i=int(val)
            if not 0<=i<len(shared):blocked("SHARED_STRING_INDEX")
            return shared[i]
        except (ValueError,TypeError):blocked("SHARED_STRING_INDEX")
    return val

def zip_parts(z):
    infos=z.infolist()
    if sum(i.file_size for i in infos)>140*1024*1024:blocked("ZIP_UNCOMPRESSED_LIMIT")
    names=set(z.namelist())
    if "xl/workbook.xml" not in names or "xl/_rels/workbook.xml.rels" not in names:
        blocked("MISSING_WORKBOOK_XML")
    book=ET.fromstring(z.read("xl/workbook.xml"))
    rel=ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    links={x.get("Id"):x.get("Target") for x in rel}
    parts={}
    for sheet in book.find(NS+"sheets"):
        name=sheet.get("name")
        target=links.get(sheet.get(RID),"")
        path=target.lstrip("/")
        if not path.startswith("xl/"):path="xl/"+path
        if not re.fullmatch(r"xl/worksheets/sheet[0-9]+\.xml",path) or path not in names:
            blocked("UNSAFE_OR_MISSING_SHEET")
        if name in parts:blocked("DUPLICATE_SHEET")
        parts[name]=path
    shared=[]
    if "xl/sharedStrings.xml" in names:
        with z.open("xl/sharedStrings.xml") as fh:
            for _,x in ET.iterparse(fh,events=("end",)):
                if x.tag==NS+"si":
                    shared.append("".join(x.itertext()))
                    x.clear()
                    if len(shared)>300000:blocked("SHARED_STRINGS_TOO_LARGE")
    return parts,shared

def sheet_records(z,path,shared):
    with z.open(path) as stream:
        for _,row in ET.iterparse(stream,events=("end",)):
            if row.tag!=NS+"row":continue
            r=int(row.get("r","0"))
            if not 1<=r<=25000:blocked("ROW_NUMBER_RANGE")
            values=[None]*11
            for cell in row.findall(NS+"c"):
                addr=cell.get("r","")
                match=re.fullmatch(r"([A-Z]+)[0-9]+",addr)
                if match is None:blocked("CELL_ADDRESS_INVALID")
                letters=match.group(1)
                if len(letters)==1 and "A"<=letters<="K":
                    values[ord(letters)-65]=get_cell(cell,shared)
            row.clear()
            yield r,values

def main(argv=None):
    parser=argparse.ArgumentParser(description="Offline registration list intake; NOT a live credit registry")
    parser.add_argument("--jcdm-jver",required=True,type=Path)
    parser.add_argument("--jcre",required=True,type=Path)
    parser.add_argument("--out",type=Path,default=ROOT/".naft-local/jcredit-registration")
    parser.add_argument("--synthetic-fixture",action="store_true")
    args=parser.parse_args(argv)
    manifest=json.loads(MANIFEST.read_text(encoding="utf-8"))
    inputs={"JCDM_JVER_REGISTRATION_LIST":args.jcdm_jver,
            "J_CREDIT_REGISTRATION_LIST":args.jcre}
    if args.synthetic_fixture and not all(p.name.startswith("synthetic-registration-list-") for p in inputs.values()):
        blocked("SYNTHETIC_FIXTURE_NAME_REQUIRED")
    specs=manifest["sheet_specs"]
    args.out.mkdir(parents=True,exist_ok=True)
    output=args.out/"project-method-registration.ndjson"
    file_provenance=[]
    summaries=[]
    row_total=0
    with output.open("w",encoding="utf-8") as target:
        for src in manifest["sources"]:
            path=inputs[src["id"]]
            if not path.is_file():blocked("ORIGINAL_FILE_MISSING")
            if path.stat().st_size>32*1024*1024:blocked("ORIGINAL_EXCEEDS_SIZE")
            digest=sha256(path)
            if not args.synthetic_fixture and (
                path.stat().st_size!=src["bytes"] or digest!=src["sha256"]):
                blocked("ORIGINAL_SHA256_OR_BYTES_MISMATCH:"+src["id"])
            file_provenance.append({"source_id":src["id"],"sha256":digest,
                "byte_size":path.stat().st_size,
                "matches_registered_original":digest==src["sha256"]})
            with zipfile.ZipFile(path) as z:
                parts,shared=zip_parts(z)
                source_specs=[s for s in specs if s["source_id"]==src["id"]]
                if set(parts)!=set(s["sheet"] for s in source_specs):
                    blocked("SHEET_SET_MISMATCH:"+src["id"])
                for sheet in source_specs:
                    count=0
                    project_ids=set()
                    regions=Counter()
                    methods=Counter()
                    estimate_sum=Decimal("0")
                    header_seen=False
                    for row_number,cols in sheet_records(z,parts[sheet["sheet"]],shared):
                        if row_number==2:
                            if "プロジェクト" not in str(cols[0]) or "見込み量" not in str(cols[10]):
                                blocked("HEADER_MISMATCH:"+sheet["scope"])
                            header_seen=True
                        if row_number<3 or cols[0] in (None,""):continue
                        if any(cols[i] in (None,"") for i in [0,7,8,10]):
                            blocked("REQUIRED_CELL_MISSING:"+sheet["scope"])
                        amount=exact_decimal(cols[10])
                        project_id=str(cols[0]).strip()
                        method=str(cols[8]).strip()
                        if not project_id or not method:blocked("PROJECT_OR_METHOD_REQUIRED")
                        row_value={k:cols[i] for i,k in enumerate(KEYS)}
                        row_value["project_id"]=project_id
                        row_value["estimated_tco2_per_method_row"]=format(amount,"f")
                        for key in ["application_excel_serial","period_end_excel_serial"]:
                            row_value[key.replace("_excel_serial","_date")]=iso_date(row_value[key])
                        row_value.update({"scope":sheet["scope"],"source_id":src["id"],
                            "source_sha256":digest,"source_sheet":sheet["sheet"],
                            "excel_row":row_number,"unit":"tCO2_estimate_not_issued",
                            "actual_issued_tco2":None,"serials":None,
                            "holder_rights_verified":False,"production_mint_authorized":False})
                        target.write(json.dumps(row_value,ensure_ascii=False,separators=(",",":"))+"\n")
                        count+=1
                        if count>3000:blocked("SHEET_ROW_LIMIT")
                        project_ids.add(project_id)
                        methods[method]+=1
                        regions[str(cols[7])]+=1
                        estimate_sum+=amount
                    if not header_seen:blocked("HEADER_NOT_FOUND")
                    if not args.synthetic_fixture and (
                        count!=sheet["data_rows"] or len(project_ids)!=sheet["unique_project_ids"]
                        or estimate_sum!=Decimal(sheet["estimated_line_sum_tco2"])):
                        blocked("SHEET_COUNT_OR_ESTIMATE_DRIFT:"+sheet["scope"])
                    summaries.append({"scope":sheet["scope"],"source_id":src["id"],
                        "sheet":sheet["sheet"],"method_rows":count,
                        "unique_project_ids":len(project_ids),
                        "estimated_line_sum_tco2":format(estimate_sum,"f"),
                        "method_rows_by_version":dict(sorted(methods.items())),
                        "method_rows_by_region":dict(sorted(regions.items()))})
                    row_total+=count
    if not args.synthetic_fixture and row_total!=manifest["total_registration_method_rows"]:
        blocked("TOTAL_METHOD_ROWS_DRIFT")
    report={"schema":"naft-p26-jcredit-registration-local-report/1",
        "classification":"SYNTHETIC_TEST" if args.synthetic_fixture else "HISTORICAL_REGISTRATION_LIST",
        "input_provenance":file_provenance,"sheets":summaries,
        "total_project_method_rows":row_total,
        "local_output_sha256":sha256(output),"credit_issuance_verified":False,
        "registry_serials_queried":False,"rights_verified":False,
        "certified_tco2e":None,"production_mint_authorized":False,
        "warning":"Estimated registration volume is NOT issuance, custody, retirement or market supply."}
    (args.out/"intake-report.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"rows":row_total,"sheets":len(summaries),
        "source_files":len(file_provenance),"classification":report["classification"],
        "issued_credits":None,"mint_authorized":False},ensure_ascii=False))

if __name__=="__main__":
    try:main()
    except (ValueError,KeyError,zipfile.BadZipFile,ET.ParseError,OverflowError) as e:
        print(str(e) if str(e).startswith("JLIST_BLOCKED:") else
              "JLIST_BLOCKED:INPUT_INVALID",file=sys.stderr)
        sys.exit(1)
