#!/usr/bin/env python3
"""P8 offline Gimje native ZIP + Excel field metadata -> NaFT P7 candidate CSV.

Original bytes are never committed or transmitted by this script. Known MD5s
are from the cited Zenodo file listing, not signatures or publisher attestation.
Default download requires explicit CLI action. No credits, certification or
automatic scientific validation.
"""
import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

DOI = "10.5281/zenodo.17111992"
SRC = "KR_GIMJE_DAILY_2022_2024"
REMOTE = {
    "ch4.zip": ("https://zenodo.org/records/17111992/files/ch4.zip?download=1",
                "b9ada3a76a2bce1dbd3c9c77f51424f7", 66312),
    "input_fields_meta.xlsx": (
       "https://zenodo.org/records/17111992/files/input_fields_meta.xlsx?download=1",
       "ba661a41238697b7ac1915c0d3890aa2", 16705)
}
N = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
MAX_EXTRACT = 32 * 1024 * 1024
MAX_CSV_FILES = 500
P7_HEADER = [
 "source_record_id", "field_id", "observation_date", "flux_value",
 "flux_unit", "water_management", "measurement_method", "qc_flag"
]


def require(ok, label):
    if not ok:
        raise ValueError("NAFT_P8_NATIVE_DOCK_BLOCKED:" + label)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_bytes(path, max_bytes=8 * 1024 * 1024):
    p = Path(path)
    require(p.is_file() and not p.is_symlink(), "FILE_NOT_REGULAR")
    require(0 < p.stat().st_size <= max_bytes, "FILE_SIZE")
    raw = p.read_bytes()
    require(len(raw) == p.stat().st_size, "FILE_CHANGED_WHILE_READING")
    return raw


def pinned(path, filename):
    raw = safe_bytes(path)
    url, md5, size = REMOTE[filename]
    require(len(raw) == size, "ZENODO_SIZE_MISMATCH:" + filename)
    require(hashlib.md5(raw).hexdigest() == md5, "ZENODO_MD5_MISMATCH:" + filename)
    return raw


def secure_zip(raw, max_entries=MAX_CSV_FILES + 16):
    z = zipfile.ZipFile(io.BytesIO(raw))
    infos = z.infolist()
    require(0 < len(infos) <= max_entries, "ARCHIVE_ENTRY_COUNT")
    used = 0
    for entry in infos:
        name = PurePosixPath(entry.filename)
        require(not name.is_absolute() and not any(x in ("..", ".", "") for x in name.parts)
                and "\\" not in entry.filename, "ARCHIVE_TRAVERSAL")
        require(not (entry.external_attr >> 16) & 0o170000 == 0o120000,
                "ARCHIVE_SYMLINK")
        require(entry.file_size <= MAX_EXTRACT and entry.compress_size <= MAX_EXTRACT,
                "ARCHIVE_ENTRY_TOO_LARGE")
        used += entry.file_size
        require(used <= MAX_EXTRACT, "ARCHIVE_EXPANDED_TOO_LARGE")
    return z


def spreadsheet_rows(raw):
    with secure_zip(raw, 1024) as z:
        members = z.namelist()
        require("xl/workbook.xml" in members, "XLSX_WORKBOOK_MISSING")
        strings = []
        if "xl/sharedStrings.xml" in members:
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("x:si", N):
                strings.append("".join(x.text or "" for x in si.findall(".//x:t", N)))
        worksheets = [m for m in members if re.fullmatch(r"xl/worksheets/sheet[0-9]+\.xml", m)]
        require(0 < len(worksheets) <= 20, "XLSX_SHEETS")
        all_sheets = []
        for sheet in worksheets:
            root = ET.fromstring(z.read(sheet))
            rows = []
            for row in root.findall(".//x:sheetData/x:row", N):
                cols = {}
                for cell in row.findall("x:c", N):
                    ref = cell.get("r", "")
                    match = re.match(r"^([A-Z]{1,3})[0-9]+$", ref)
                    require(bool(match), "XLSX_CELL_REF")
                    i = 0
                    for char in match.group(1):
                        i = i * 26 + ord(char) - 64
                    require(i <= 150 and i not in cols, "XLSX_COLUMNS")
                    t = cell.get("t")
                    v = cell.find("x:v", N)
                    inline = cell.find("x:is", N)
                    value = v.text if v is not None else ""
                    if t == "s":
                        require(value is not None and value.isdigit()
                                and int(value) < len(strings), "XLSX_SHARED_STRING")
                        value = strings[int(value)]
                    elif t == "inlineStr" and inline is not None:
                        value = "".join(x.text or "" for x in inline.findall(".//x:t", N))
                    cols[i - 1] = value or ""
                if cols:
                    rows.append([cols.get(i, "") for i in range(max(cols) + 1)])
                require(len(rows) <= 20000, "XLSX_ROW_LIMIT")
            all_sheets.append((sheet, rows))
    return all_sheets


def parse_date(value):
    s = str(value).strip()
    if re.fullmatch(r"[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2}(?:[ T].*)?", s):
        s = re.split(r"[ T]", s)[0]
        parts = re.split(r"[-/.]", s)
        try:
            return dt.date(*map(int, parts))
        except ValueError as exc:
            raise ValueError("NAFT_P8_NATIVE_DOCK_BLOCKED:UNRECOGNIZED_PLANTING_DATE") from exc
    if re.fullmatch(r"[0-9]+(?:\.0+)?", s):
        day = int(float(s))
        require(20000 <= day <= 70000, "EXCEL_DATE_RANGE")
        return (dt.datetime(1899, 12, 30) + dt.timedelta(days=day)).date()
    raise ValueError("NAFT_P8_NATIVE_DOCK_BLOCKED:UNRECOGNIZED_PLANTING_DATE")


def field_dates(meta):
    candidates = []
    for sheet, rows in spreadsheet_rows(meta):
        for index, line in enumerate(rows[:12]):
            heads = [str(x).strip().lower() for x in line]
            if "field_id" in heads and "planting_date" in heads:
                id_idx, day_idx = heads.index("field_id"), heads.index("planting_date")
                dates = {}
                for row in rows[index + 1:]:
                    key = str(row[id_idx] if id_idx < len(row) else "").strip()
                    date_value = row[day_idx] if day_idx < len(row) else ""
                    if not key:
                        continue
                    require(key not in dates, "DUPLICATE_FIELD_META")
                    dates[key] = parse_date(date_value)
                candidates.append((sheet, dates))
    require(len(candidates) == 1, "XLSX_FIELD_ID_AND_PLANTING_DATE_SHEET_REQUIRED")
    require(len(candidates[0][1]) > 0, "NO_FIELD_META")
    return candidates[0]


def water_class(x):
    s = str(x or "").strip().upper().replace(" ", "_").replace("-", "_")
    return {"AWD": "AWD", "CF": "CONTINUOUS_FLOOD",
            "CONTINUOUS_FLOODING": "CONTINUOUS_FLOOD",
            "CONTINUOUS_FLOOD": "CONTINUOUS_FLOOD",
            "SINGLE_DRAINAGE": "SINGLE_DRAINAGE"}.get(s, "UNKNOWN")


def normalize(zip_raw, meta_raw):
    sheet, dates = field_dates(meta_raw)
    result = []
    lineage = []
    unknown_courses = set()
    with secure_zip(zip_raw) as z:
        csv_entries = [i for i in z.infolist() if not i.is_dir()
                       and i.filename.lower().endswith(".csv")
                       and not PurePosixPath(i.filename).name.startswith(".")]
        require(0 < len(csv_entries) <= MAX_CSV_FILES, "NO_NATIVE_CSV")
        seen_fields = set()
        for entry in sorted(csv_entries, key=lambda v: v.filename):
            field = PurePosixPath(entry.filename).stem
            require(field in dates, "MISSING_PLANTING_DATE_FOR_NATIVE_FIELD")
            require(field not in seen_fields, "DUPLICATE_FIELD_CSV")
            seen_fields.add(field)
            raw = z.read(entry)
            try:
                text = raw.decode("utf-8-sig")
            except UnicodeDecodeError as exc:
                raise ValueError("NAFT_P8_NATIVE_DOCK_BLOCKED:NATIVE_CSV_ENCODING") from exc
            reader = csv.DictReader(io.StringIO(text, newline=""))
            cols = reader.fieldnames or []
            require(len(cols) == len(set(cols))
                    and "DAT" in cols and "ch4_flux" in cols, "NATIVE_CSV_HEADER")
            rows_count = 0
            for line_no, row in enumerate(reader, start=2):
                require(None not in row, "NATIVE_CSV_COLUMN_MISMATCH")
                value = str(row["DAT"] or "").strip()
                require(bool(re.fullmatch(r"[0-9]{1,3}", value)), "DAT_NOT_INT")
                dat = int(value)
                require(dat <= 366, "DAT_OUT_OF_RANGE")
                day = dates[field] + dt.timedelta(days=dat)  # Matches public author R script: planting_date + DAT
                flux = str(row["ch4_flux"] or "").strip()
                if not flux:
                    flux = "NA"
                course = str(row.get("course_type") or "").strip()
                managed = water_class(course)
                if managed == "UNKNOWN" and course:
                    unknown_courses.add(course[:32])
                rid = "GIMJE_" + sha(entry.filename.encode())[:12] + "_" + str(line_no).zfill(6)
                result.append([rid, field, day.isoformat(), flux, "g_CH4_m2_day",
                               managed, "STATIC_CHAMBER", "UNKNOWN"])
                rows_count += 1
                require(len(result) <= 100000, "NATIVE_ROW_LIMIT")
            lineage.append({"native_member": entry.filename,
                            "native_csv_sha256": sha(raw),
                            "source_field_id": field,
                            "planting_date_from_sheet": dates[field].isoformat(),
                            "native_rows": rows_count,
                            "date_derivation": "planting_date_plus_DAT_as_author_R_script"})
    require(len(result) > 0, "NO_NATIVE_OBSERVATIONS")
    buf = io.StringIO(newline="")
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(P7_HEADER)
    writer.writerows(result)
    csv_bytes = buf.getvalue().encode("utf-8")
    return csv_bytes, lineage, sorted(unknown_courses), sheet


def run_p7(data):
    from tempfile import TemporaryDirectory
    with TemporaryDirectory(prefix="naft-p8-p7-") as folder:
        path = Path(folder) / "canonical.csv"
        path.write_bytes(data)
        root = Path(__file__).resolve().parent.parent
        command = ["node", str(root / "scripts/p7-offline-observation-qc.mjs"),
                   "analyze", SRC, str(path)]
        task = subprocess.run(command, capture_output=True, text=True, timeout=60)
        require(task.returncode == 0, "P7_ADAPTER_REFUSED:" + task.stderr[:120])
        return json.loads(task.stdout)


def build(zip_raw, meta_raw):
    csv_bytes, lineage, unknown, sheet = normalize(zip_raw, meta_raw)
    p7 = run_p7(csv_bytes)
    require(p7["uploaded_csv_sha256"] == sha(csv_bytes)
            and p7["row_count"] == sum(x["native_rows"] for x in lineage),
            "P7_REPORT_NOT_MATCHED")
    report = {
        "schema": "naft-p8-gimje-zenodo-native-docking-v1",
        "status": "RESEARCH_NATIVE_BYTES_VERIFIED_MAPPING_UNDER_REVIEW",
        "source_id": SRC, "doi": DOI, "published_file_md5_verified": True,
        "native_archive_sha256": sha(zip_raw), "native_metadata_xlsx_sha256": sha(meta_raw),
        "native_archive_md5": hashlib.md5(zip_raw).hexdigest(),
        "native_metadata_xlsx_md5": hashlib.md5(meta_raw).hexdigest(),
        "native_metadata_sheet": sheet, "native_csv_files": len(lineage),
        "native_row_count": p7["row_count"], "canonical_csv_sha256": sha(csv_bytes),
        "source_files": lineage, "unmapped_course_type_values": unknown,
        "p7_qc_receipt_sha256": p7["report_sha256"],
        "p7_missing_flux": p7["missing_flux_count"],
        "p7_invalid_flux": p7["invalid_flux_count"],
        "p7_unknown_water_or_method_count": p7["unknown_measurement_or_water_state_count"],
        "author_code_reference": "https://github.com/lhs0218/gimje_ch4/blob/45525f01642c3069d03177e8801070da1dcb3450/01.train_RF_gimje.R",
        "native_field_to_project_verified": False,
        "native_flux_unit_independently_qa_approved": False,
        "independent_chamber_qc_approved": False,
        "climate_satellite_join_approved": False,
        "verra_jcredit_method_eligibility_verified": False,
        "certified_tco2e": None, "issued_credits": None
    }
    stable = json.dumps(report, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    report["receipt_sha256"] = sha(stable)
    return csv_bytes, report


def acquire(out):
    out = Path(out)
    require(out.is_dir(), "DOWNLOAD_DIR_MUST_EXIST")
    for name, (url, md5, size) in REMOTE.items():
        dest = out / name
        require(not dest.exists(), "REFUSE_OVERWRITE")
        req = urllib.request.Request(url, headers={"User-Agent": "NaFT-P8-research-byte-check/1.0"})
        with urllib.request.urlopen(req, timeout=45) as resp:
            target = urllib.parse.urlparse(resp.geturl())
            require(target.scheme == "https" and
                    (target.hostname == "zenodo.org" or
                     target.hostname.endswith(".zenodo.org")), "REMOTE_HOST_NOT_ZENODO")
            raw = resp.read(8 * 1024 * 1024 + 1)
        require(len(raw) == size and hashlib.md5(raw).hexdigest() == md5,
                "DOWNLOADED_ZENODO_CHECKSUM_MISMATCH:" + name)
        with dest.open("xb") as fh:
            os.chmod(dest, 0o600)
            fh.write(raw)
        print(json.dumps({"name": name, "sha256": sha(raw), "md5_verified": True, "bytes": len(raw)}))


def write_new(path, raw):
    path = Path(path)
    require(path.parent.is_dir() and not path.exists(), "OUTPUT_EXISTS_OR_MISSING_PARENT")
    with path.open("xb") as stream:
        os.chmod(path, 0o600)
        stream.write(raw)


def main(args):
    if args.command == "acquire":
        acquire(args.directory)
        return
    original = pinned(args.zip_file, "ch4.zip")
    meta = pinned(args.metadata_xlsx, "input_fields_meta.xlsx")
    data, report = build(original, meta)
    encoded = (json.dumps(report, indent=2, ensure_ascii=False, sort_keys=True) + "\n").encode()
    if args.command == "dock":
        require(not Path(args.canonical_out).exists() and
                not Path(args.receipt_out).exists(), "OUTPUT_EXISTS")
        write_new(args.canonical_out, data)
        write_new(args.receipt_out, encoded)
        print(json.dumps({"status": report["status"],
            "native_rows": report["native_row_count"], "native_files": report["native_csv_files"],
            "canonical_sha256": report["canonical_csv_sha256"],
            "receipt_sha256": report["receipt_sha256"]}))
    elif args.command == "verify":
        on_disk = safe_bytes(args.canonical_csv)
        receipt_raw = safe_bytes(args.receipt_json)
        receipt = json.loads(receipt_raw)
        require(on_disk == data and receipt == report, "DETERMINISTIC_REPLAY_MISMATCH")
        print(json.dumps({"status": "RAW_ORIGINAL_AND_CANONICAL_REPLAY_MATCH",
                          "receipt_sha256": report["receipt_sha256"],
                          "official_certification": None}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    a = sub.add_parser("acquire", help="Fetch Zenodo bytes to an existing PRIVATE directory")
    a.add_argument("directory")
    for cmd in ("dock", "verify"):
        p = sub.add_parser(cmd)
        p.add_argument("zip_file")
        p.add_argument("metadata_xlsx")
        if cmd == "dock":
            p.add_argument("canonical_out")
            p.add_argument("receipt_out")
        else:
            p.add_argument("canonical_csv")
            p.add_argument("receipt_json")
    try:
        main(parser.parse_args())
    except (ValueError, OSError, zipfile.BadZipFile, ET.ParseError,
            subprocess.TimeoutExpired, urllib.error.URLError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
