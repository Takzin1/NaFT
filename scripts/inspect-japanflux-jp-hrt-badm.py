#!/usr/bin/env python3
"""Offline JP-Hrt 2.00 BADM evidence extraction. Only whitelisted non-personal facts.

User original is read into memory briefly; no source workbook, row-level flux,
free-text contacts or raw measurement lines are emitted or redistributed.
This is a descriptive research preflight, not a certified calculation.
"""
import argparse
import csv
import hashlib
import io
import json
import re
import stat
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET

PINNED_ARCHIVE = "bffad17bd7acf962eb1af9fa4f2092c038a813291b9fc4c79e548674101d40eb"
PINNED_HH = "3692a7b3d4da4b8fb19eade724f785289c74e94a63de4742e62d9e08c01d2e95"
BADM = {
    "Site_General_Info": "ed2c231a290eab9aa297b491104e8c0977a986152f4a1658cfe913bad4e7f847",
    "Instrument": "dca1e8ca1d1c5572ca83a0363385a982af9972185da719615c20b86e960d1d95",
    "Instrument_Ops": "eaca9bc2aa28ba9ee139a20f72220852c5d4af5d1128631b8e89f3ea105693ca",
    "Disturbance_and_Management": "3bcf6b6a55dbaf5e9841b442064485ebbc8af6e658042d8108fb68a0516d4ac3",
    "Soil": "2b7ae9266ce49825d5f88bfdc1dced755c4eef5dc55ca58a5bab0c344e0ceb33",
    "VegCover": "68583d5e04dbf77b0d7bd665791edda663383a823ea8a39acffd92ffad2256fa",
}
HH_NAME = "FLX_JP-Hrt_JapanFLUX2024_ALLVARS_HH_2013-2014_1-4.csv"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
MAX_XLSX = 100_000
MAX_XML = 600_000


class Blocked(ValueError):
    pass


def check(ok, message):
    if not ok:
        raise Blocked(message)


def digest(buf):
    return hashlib.sha256(buf).hexdigest()


def member(z, basename, max_size):
    hits = [p for p in z.namelist() if p.split("/")[-1] == basename]
    check(len(hits) == 1, "BADM_MEMBER_NOT_UNIQUE:" + basename)
    item = z.getinfo(hits[0])
    check(item.file_size > 0 and item.file_size <= max_size and not item.flag_bits & 1,
          "BADM_MEMBER_SIZE_OR_ENCRYPTION")
    with z.open(item) as f:
        data = f.read(max_size + 1)
    check(len(data) == item.file_size and len(data) <= max_size, "BADM_MEMBER_BOUNDS")
    return data


def workbook_rows(xlsx_bytes):
    check(len(xlsx_bytes) < MAX_XLSX, "BADM_XLSX_TOO_LARGE")
    try:
        with zipfile.ZipFile(io.BytesIO(xlsx_bytes)) as z:
            entries = z.infolist()
            check(0 < len(entries) <= 40, "BADM_XLSX_MEMBER_COUNT")
            for ent in entries:
                check(not ent.filename.startswith("/") and ".." not in ent.filename.split("/")
                      and ent.file_size <= MAX_XML and not ent.flag_bits & 1
                      and stat.S_IFMT(ent.external_attr >> 16) != stat.S_IFLNK,
                      "BADM_XLSX_MEMBER_UNSAFE")
            shared_data = z.read("xl/sharedStrings.xml")
            sheet_data = z.read("xl/worksheets/sheet1.xml")
    except (zipfile.BadZipFile, KeyError, OSError) as exc:
        raise Blocked("BADM_XLSX_MISSING_XML") from exc
    check(len(shared_data) < MAX_XML and len(sheet_data) < MAX_XML
          and b"<!DOCTYPE" not in shared_data.upper()
          and b"<!DOCTYPE" not in sheet_data.upper(), "BADM_XML_UNSAFE")
    shared_root = ET.fromstring(shared_data)
    shared = ["".join(t.text or "" for t in si.iter(NS + "t"))
              for si in shared_root.findall(NS + "si")]
    root = ET.fromstring(sheet_data)
    output = {}
    for row in root.findall(".//" + NS + "sheetData/" + NS + "row"):
        cols = {}
        for cell in row.findall(NS + "c"):
            match = re.fullmatch(r"([A-Z]{1,3})[1-9][0-9]*", cell.attrib.get("r", ""))
            check(match is not None, "BADM_CELL_REFERENCE_INVALID")
            column = match.group(1)
            value = cell.find(NS + "v")
            if value is None:
                text = ""
            elif cell.attrib.get("t") == "s":
                index = int(value.text or "-1")
                check(0 <= index < len(shared), "BADM_SHARED_STRING_INVALID")
                text = shared[index]
            else:
                text = value.text or ""
            cols[column] = text.strip()
        key = cols.get("A", "")
        if key and re.fullmatch(r"[A-Z_]+", key):
            check(key not in output, "BADM_DUPLICATE_VARIABLE")
            output[key] = [cols.get(chr(x), "") for x in range(ord("D"), ord("T") + 1)]
    return output


def getdata(table, key):
    check(key in table, "BADM_REQUIRED_VARIABLE_MISSING:" + key)
    return [v for v in table[key] if v != ""]


def summarize(tables, hh_bytes, hashes):
    site, inst, ops, disturbance = (tables[k] for k in
        ("Site_General_Info", "Instrument", "Instrument_Ops", "Disturbance_and_Management"))
    check(getdata(site, "SITE_ID") == ["JP-Hrt"], "BADM_SITE_ID_MISMATCH")
    methods = getdata(site, "FLUX_MEASUREMENTS_METHOD")
    variables = getdata(site, "FLUX_MEASUREMENTS_VARIABLE")
    starts = getdata(site, "FLUX_MEASUREMENTS_DATE_START")
    check(len(methods) == len(variables) == len(starts) == 3,
          "BADM_FLUX_PARALLEL_VECTOR_SHAPE")
    check(variables == ["CO2", "H2O", "CH4"], "BADM_VARIABLE_MAPPING_CHANGED")
    check(methods == ["Eddy Covariance"] * 3, "BADM_METHOD_MAPPING_CHANGED")
    check(starts == ["20130831"] * 3, "BADM_DATE_MAPPING_CHANGED")
    offset = getdata(site, "UTC_OFFSET")
    check(offset == ["9"], "BADM_OFFSET_UNEXPECTED")
    models = getdata(inst, "INST_MODEL")
    check(all(x in models for x in ("GA_OP-Campbell EC150", "GA_CP-Picarro G2301-f",
                                    "SA-Campbell CSAT-3A")), "BADM_INSTRUMENTS_MISSING")
    check("Irrigation" in getdata(disturbance, "DM_WATER"),
          "BADM_WATER_MANAGEMENT_CHANGED")
    check(getdata(ops, "INSTOM_TYPE").count("Installation") >= 1,
          "BADM_INSTRUMENT_OPERATIONS_MISSING")
    first, last, before, numeric, missing = None, None, 0, 0, 0
    reader = csv.DictReader(io.StringIO(hh_bytes.decode("utf-8"), newline=""))
    check("TIMESTAMP_START" in reader.fieldnames and "FCH4" in reader.fieldnames,
          "BADM_NATIVE_CSV_COLUMNS")
    for row in reader:
        val = row["FCH4"]
        if val in ("-9999", "-9999.0", ""):
            missing += 1
            continue
        # Never interpret a numeric rate as scientifically accepted.
        check(re.fullmatch(r"-?(?:\d+(?:\.\d+)?|\.\d+)", val) is not None,
              "BADM_UNSUPPORTED_RATE_LEXEME")
        date = row["TIMESTAMP_START"]
        check(re.fullmatch(r"\d{12}", date) is not None, "BADM_NATIVE_TIMESTAMP_SHAPE")
        numeric += 1
        first = min(first, date) if first else date
        last = max(last, date) if last else date
        if date < starts[2] + "0000":
            before += 1
    check(numeric == 1915 and missing == 15605 and before == 1689,
          "BADM_CROSS_SOURCE_COVERAGE_INCONSISTENT")
    return {
        "schema": "naft-japanflux-jp-hrt-badm-protocol-v1",
        "site_id": "JP-Hrt",
        "version": "2.00",
        "archive_sha256": PINNED_ARCHIVE,
        "badm_sha256": hashes,
        "site_utc_offset_hours_declared": 9,
        "timezone_column_mapping_independently_validated": False,
        "badm_flux_variables": variables,
        "badm_flux_methods": methods,
        "badm_flux_start_dates": starts,
        "pdf_ch4_method": "HREA_AND_CHAMBER_FOR_CH4",
        "method_disagreement": True,
        "instrument_model_identifiers": [
            "GA_OP-Campbell EC150", "GA_CP-Picarro G2301-f", "SA-Campbell CSAT-3A"],
        "instrument_ch4_channel_mapping_verified": False,
        "water_management_vocabulary": "Irrigation",
        "hh_numeric_candidate_count": numeric,
        "hh_missing_count": missing,
        "hh_first_numeric_native": first,
        "hh_last_numeric_native": last,
        "hh_numeric_before_badm_start": before,
        "badm_start_inconsistent_with_hh_numeric_period": True,
        "source_FCH4_native_unit_verified": False,
        "per_row_ch4_qc_flag_available": False,
        "measured_vs_gapfilled_resolved": False,
        "emission_integral": None,
        "certified_tco2e": None,
        "status": "BADM_METHOD_AND_START_DATE_CONFLICT_REVIEW_REQUIRED",
        "required_human_review": [
            "PDF_HREA_CHAMBER_VS_BADM_EC_CH4",
            "BADM_20130831_START_VS_20130601_NUMERIC_ROWS",
            "FCH4_COLUMN_PHYSICAL_UNIT_AND_PROCESSING",
            "DECLARED_UTC_PLUS_9_VS_HH_TIME_CONVENTION",
            "PER_ROW_CH4_QC_AND_INSTRUMENT_MAPPING"
        ],
    }


def inspect(path):
    check(path.is_file() and 0 < path.stat().st_size <= 180_000_000,
          "BADM_ARCHIVE_BOUNDS")
    with path.open("rb") as f:
        sha = hashlib.file_digest(f, "sha256").hexdigest()
    check(sha == PINNED_ARCHIVE, "BADM_ARCHIVE_SHA256_MISMATCH")
    with zipfile.ZipFile(path) as z:
        check(len(z.infolist()) <= 100, "BADM_ARCHIVE_MEMBER_COUNT")
        tables, hashes = {}, {}
        for name, expected in BADM.items():
            original = member(z, "JP-Hrt_BADM-" + name + ".xlsx", MAX_XLSX)
            actual = digest(original)
            check(actual == expected, "BADM_XLSX_SHA256_MISMATCH:" + name)
            hashes[name] = actual
            tables[name] = workbook_rows(original)
        hh = member(z, HH_NAME, 17_000_000)
        check(digest(hh) == PINNED_HH, "BADM_NATIVE_HH_SHA256_MISMATCH")
        result = summarize(tables, hh, hashes)
        return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", type=Path, required=True)
    args = parser.parse_args()
    try:
        report = inspect(args.zip)
    except (Blocked, OSError, zipfile.BadZipFile, ET.ParseError, UnicodeError) as exc:
        print("JP_HRT_BADM_BLOCKED:" + str(exc), file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
