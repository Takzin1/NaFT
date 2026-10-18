#!/usr/bin/env python3
"""JP-Hrt JapanFlux2024 v2.00: offline native ZIP structure + CH4 coverage gate.
DO NOT derive emission totals, infer units, QC, measured status or UTC offsets.
User-supplied original archive is read locally only, never redistributed.
"""
import argparse
import csv
import hashlib
import io
import json
import math
import re
import stat
import sys
import zipfile
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

ORIGINAL_ARCHIVE_SHA256 = "bffad17bd7acf962eb1af9fa4f2092c038a813291b9fc4c79e548674101d40eb"
FILES = {
    "HH": {
        "name": "FLX_JP-Hrt_JapanFLUX2024_ALLVARS_HH_2013-2014_1-4.csv",
        "sha256": "3692a7b3d4da4b8fb19eade724f785289c74e94a63de4742e62d9e08c01d2e95",
        "header_sha256": "084e87f52f933c3422a56fbef12d23098c38798e64e2ea9eb62695d4b53713bd",
        "bytes": 16207032,
        "columns": 85,
        "rows": 17520,
    },
    "DD": {
        "name": "FLX_JP-Hrt_JapanFLUX2024_ALLVARS_DD_2013-2014_1-4.csv",
        "sha256": "447f5f97fa45c9f3ff9339c1a574210d51077e115c096b159a5b4e55a61ed9dc",
        "header_sha256": "5ad12b99743c14ad1e4c9842459fc5f013d4cc1361c08a2c861bbfbfdba2178a",
        "bytes": 401610,
        "columns": 89,
        "rows": 365,
    }
}
META_PDF = {
    "name": "A20241210-020_v200.pdf",
    "sha256": "855100367b84c856801119571fe0b3bd98a9a6782d7de8acfbb9818352f408ed",
}
MAX_ARCHIVE_BYTES = 180_000_000
MAX_MEMBER_BYTES = 125_000_000
MAX_TOTAL_BYTES = 180_000_000

class Blocked(ValueError):
    pass

def require(test, code):
    if not test:
        raise Blocked(code)

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def fingerprint_file(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for part in iter(lambda: f.read(2**20), b""):
            h.update(part)
    return h.hexdigest()

def validate_zip(z):
    infos = z.infolist()
    require(0 < len(infos) <= 100, "JP_HRT_ZIP_MEMBER_COUNT")
    names = set()
    total = 0
    for f in infos:
        name = f.filename
        require(name not in names and not name.startswith("/") and "\\" not in name and
                all(part not in (".", "..") for part in name.split("/") if part),
                "JP_HRT_UNSAFE_ZIP_PATH")
        require(stat.S_IFMT(f.external_attr >> 16) != stat.S_IFLNK and not (f.flag_bits & 1),
                "JP_HRT_UNSAFE_ZIP_MEMBER")
        require(f.file_size <= MAX_MEMBER_BYTES, "JP_HRT_MEMBER_TOO_LARGE")
        total += f.file_size
        require(total <= MAX_TOTAL_BYTES, "JP_HRT_ZIP_TOO_LARGE")
        names.add(name)
    return infos

def get_member(z, basename, limit):
    matches = [x for x in z.namelist() if x.rsplit("/", 1)[-1] == basename]
    require(len(matches) == 1, "JP_HRT_MISSING_OR_DUPLICATE_MEMBER:" + basename)
    info = z.getinfo(matches[0])
    require(info.file_size <= limit, "JP_HRT_SELECTED_MEMBER_TOO_BIG")
    # ZipFile verifies member CRC; cap decoded bytes separately.
    with z.open(info) as f:
        content = f.read(limit + 1)
    require(len(content) == info.file_size and len(content) <= limit,
            "JP_HRT_MEMBER_SIZE_INCONSISTENT")
    return content

def cells_and_header(data, period, synthetic):
    conf = FILES[period]
    line = data.split(b"\n", 1)[0].rstrip(b"\r")
    if not synthetic:
        require(len(data) == conf["bytes"] and sha256(data) == conf["sha256"],
                "JP_HRT_SELECTED_FILE_SHA_MISMATCH")
        require(sha256(line) == conf["header_sha256"], "JP_HRT_HEADER_HASH_MISMATCH")
    require(not data.startswith(b"\xef\xbb\xbf") and b"\0" not in data,
            "JP_HRT_ENCODING_UNSUPPORTED")
    try:
        txt = data.decode("utf-8")
    except UnicodeDecodeError as e:
        raise Blocked("JP_HRT_CSV_NOT_UTF8") from e
    require(txt.endswith("\n"), "JP_HRT_NO_FINAL_NEWLINE")
    rows = csv.reader(io.StringIO(txt, newline=""), strict=True)
    try:
        header = next(rows)
    except StopIteration as e:
        raise Blocked("JP_HRT_NO_HEADER") from e
    require(len(header) == conf["columns"] if not synthetic else
            all(x in header for x in (["TIMESTAMP_START", "TIMESTAMP_END"] if period == "HH"
                                    else ["TIMESTAMP"])),
            "JP_HRT_UNEXPECTED_HEADER")
    require(len(set(header)) == len(header), "JP_HRT_DUPLICATE_HEADER")
    require("FCH4" in header and "FCH4_1_1_1" in header and "CH4_1_1_1" in header,
            "JP_HRT_CH4_FIELD_MISSING")
    return header, rows

def classify_rate(raw):
    # A numeric flux-shaped cell is only a candidate, not source-QC-approved.
    if raw.strip() == "":
        return "MISSING"
    try:
        value = float(raw)
    except ValueError as e:
        raise Blocked("JP_HRT_INVALID_FLUX_LEXEME") from e
    if not math.isfinite(value):
        raise Blocked("JP_HRT_NONFINITE_FLUX")
    if value == -9999:
        return "MISSING"
    return "NUMERIC_UNCLASSIFIED"

def parse_clock(value, fmt):
    require(bool(re.fullmatch(r"\d{" + str(len(datetime(2013, 1, 1).strftime(fmt))) + r"}", value)),
            "JP_HRT_TIMESTAMP_SHAPE")
    try:
        d = datetime.strptime(value, fmt)
        require(d.strftime(fmt) == value, "JP_HRT_TIMESTAMP_NONCANONICAL")
    except ValueError as e:
        raise Blocked("JP_HRT_TIMESTAMP_INVALID") from e
    return d

def analyze(data, period, synthetic):
    header, reader = cells_and_header(data, period, synthetic)
    p = {v: header.index(v) for v in (["FCH4", "FCH4_1_1_1", "CH4_1_1_1"] +
           (["TIMESTAMP_START", "TIMESTAMP_END"] if period == "HH" else ["TIMESTAMP"]))}
    count = 0
    numeric = 0
    missing = 0
    ch4_concentration_numeric = 0
    last = None
    month_numeric = Counter()
    for row in reader:
        count += 1
        require(count <= 20000 and len(row) == len(header), "JP_HRT_BAD_ROW_SHAPE")
        require(row[p["FCH4"]] == row[p["FCH4_1_1_1"]],
                "JP_HRT_DUPLICATED_FLUX_COLUMNS_CONFLICT")
        status = classify_rate(row[p["FCH4"]])
        if status == "MISSING":
            missing += 1
        else:
            numeric += 1
        if classify_rate(row[p["CH4_1_1_1"]]) == "NUMERIC_UNCLASSIFIED":
            ch4_concentration_numeric += 1
        if period == "HH":
            start = parse_clock(row[p["TIMESTAMP_START"]], "%Y%m%d%H%M")
            end = parse_clock(row[p["TIMESTAMP_END"]], "%Y%m%d%H%M")
            require(end - start == timedelta(minutes=30), "JP_HRT_INTERVAL_NOT_30_MIN")
            require(last is None or start == last, "JP_HRT_INTERVAL_GAP_OR_OVERLAP")
            last = end
            if status == "NUMERIC_UNCLASSIFIED":
                month_numeric[start.strftime("%Y%m")] += 1
        else:
            day = parse_clock(row[p["TIMESTAMP"]], "%Y%m%d")
            require(last is None or day - last == timedelta(days=1),
                    "JP_HRT_DAILY_GAP_OR_OVERLAP")
            last = day
    require(count == numeric + missing, "JP_HRT_CLASS_COUNT_MISMATCH")
    if not synthetic:
        require(count == FILES[period]["rows"], "JP_HRT_ROW_COUNT_MISMATCH")
        require((numeric, missing) == ((1915, 15605) if period == "HH" else (0, 365)),
                "JP_HRT_PINNED_COVERAGE_MISMATCH")
    return {
        "source_csv_sha256": sha256(data),
        "source_csv_header_sha256": sha256(data.split(b"\n", 1)[0].rstrip(b"\r")),
        "field_count": len(header), "row_count": count,
        "fch4_numeric_qc_unclassified_rows": numeric,
        "fch4_missing_rows": missing,
        "ch4_concentration_numeric_rows_NOT_FLUX": ch4_concentration_numeric,
        "flux_present_percent": format(100 * numeric / count, ".3f") if count else None,
        "fch4_duplicate_columns_equal": True,
        "continuous_native_calendar_intervals": True,
        "native_timestamp_timezone": "UNVERIFIED_LOCAL_OR_OTHER",
        "native_flux_unit": "UNVERIFIED",
        "native_flux_measurement_qc": "UNKNOWN",
        "monthly_numeric_candidate_counts": dict(sorted(month_numeric.items())),
        "readings_accepted_as_verified_observations": 0,
        "emissions_integral_mg_ch4_m2": None,
        "annual_emissions_mg_ch4_m2": None
    }

def inspect_archive(path, synthetic=False):
    require(path.is_file() and 0 < path.stat().st_size <= MAX_ARCHIVE_BYTES,
            "JP_HRT_ARCHIVE_FILE_SIZE")
    archive_hash = fingerprint_file(path)
    if not synthetic:
        require(archive_hash == ORIGINAL_ARCHIVE_SHA256,
                "JP_HRT_ORIGINAL_ARCHIVE_SHA_MISMATCH")
    try:
        with zipfile.ZipFile(path) as z:
            validate_zip(z)
            pdf = get_member(z, META_PDF["name"], 500_000)
            if not synthetic:
                require(sha256(pdf) == META_PDF["sha256"], "JP_HRT_METADATA_PDF_SHA_MISMATCH")
            results = {
                period: analyze(get_member(z, FILES[period]["name"], 25_000_000), period, synthetic)
                for period in ("HH", "DD")
            }
    except (OSError, zipfile.BadZipFile, RuntimeError) as e:
        raise Blocked("JP_HRT_ARCHIVE_CORRUPT_OR_UNAVAILABLE") from e
    return {
        "schema": "naft-japanflux-jp-hrt-v200-native-preflight-v1",
        "site_id": "JP-Hrt",
        "source_id": "A20241210-020",
        "source_version": "2.00",
        "archive_sha256": archive_hash,
        "archive_type": "UPLOADED_ORIGINAL_SHA_MATCH" if not synthetic else "SYNTHETIC_TEST_ONLY",
        "source_metadata_pdf_sha256": sha256(pdf),
        "metadata_pdf_method": "HREA_AND_CHAMBER_FOR_CH4",
        "metadata_pdf_license_statement": "CC BY 4.0 (documentary listing; no independent legal review)",
        "dataset_publisher_bytes_independently_attested": False,
        "raw_readings_redistributed": False,
        "time_zone_utc_mapping_verified": False,
        "source_ch4_unit_independently_verified": False,
        "per_reading_qc_mapping_approved": False,
        "source_method_to_FCH4_field_mapping_verified": False,
        "gap_fill_allowed": False,
        "all_rows_research_normalization_eligible": False,
        "status": "JP_HRT_NATIVE_STRUCTURE_ONLY_REPLAY_BLOCKED",
        "hourly_half_hourly": results["HH"],
        "daily": results["DD"],
        "scientific_integral": None,
        "certified_tco2e": None,
        "required_next_checks": [
            "ORIGINAL_FCH4_UNIT_AND_MASS_BASIS",
            "NATIVE_TIMEZONE_AND_INTERVAL_SUPPORT",
            "OBSERVATION_VS_GAPFILL_AND_QC_FLAGS",
            "HREA_CHAMBER_AND_FLUX_COLUMN_METHOD_LINK",
            "FIELD_SEASON_TREATMENT_IDENTITY",
            "PUBLISHER_SOURCE_BYTE_PROVENANCE"
        ]
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True, type=Path, help="Local original archive; no upload.")
    parser.add_argument("--synthetic-fixture", action="store_true",
                        help="Test-only: disables original-byte pin but never claims authenticity.")
    args = parser.parse_args()
    try:
        report = inspect_archive(args.zip, args.synthetic_fixture)
    except (Blocked, OSError, csv.Error) as e:
        print("JP_HRT_PREFLIGHT_BLOCKED:" + str(e), file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main())
