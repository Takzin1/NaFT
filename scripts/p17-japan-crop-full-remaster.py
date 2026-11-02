#!/usr/bin/env python3
"""Rebuild all six public NaFT P17 remastered CSVs from the user-supplied original.

Three original metric records become one geography × crop × year record,
preserving the exact numeric lexemes and each metric's source attribution.
Only the quality_flag is our own annotation. No statistical imputation occurs.

P16's pinned archive verification runs before any conversion.
Requires Python 3.10+ stdlib; never fetches or uploads data over network.
"""
import argparse
from collections import Counter, OrderedDict, defaultdict
import csv
import hashlib
import importlib.util
import io
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
P16 = ROOT / "scripts/p16-japan-six-crop-original-zip-audit.py"
MANIFEST = ROOT / "data/japan-crops-1883-2022/remastered-v1/MANIFEST.json"
CROPS = ("Barley", "Potato", "Rice", "Soybean", "SweetPotato", "Wheat")
ZERO_YEARS = {1885, 1886, 1888, 1889, 1890, 1891, 1893}
COLUMNS = (
    "crop", "year", "era", "region_code", "region", "prefecture_code",
    "prefecture", "production_tonnes", "area_ha", "reported_yield_t_ha",
    "production_source", "area_source", "yield_source", "quality_flag")
MAP = {
    "production": ("production_tonnes", "production_source", "tonnes"),
    "surface": ("area_ha", "area_source", "ha"),
    "yield": ("reported_yield_t_ha", "yield_source", "tonnes/ha"),
}
ORIGINAL_HEADER = (
    "crop","code_reg","region","code_pref","prefecture","year",
    "JapaneseCalender","var","unit","value","source"
)
SCHEMA = "naft-p17-remastered-1883-2022-v1"

def require(condition, reason):
    if not condition:
        raise ValueError("NAFT_P17_REMASTER_BLOCKED:" + reason)

def digest(blob):
    return hashlib.sha256(blob).hexdigest()

def git_blob_sha1(blob):
    return hashlib.sha1(b"blob " + str(len(blob)).encode("ascii") +
                        b"\0" + blob).hexdigest()

def numeric(value, reason):
    try:
        num = float(value)
    except (ValueError, TypeError, OverflowError):
        raise ValueError("NAFT_P17_REMASTER_BLOCKED:" + reason)
    require(math.isfinite(num) and num >= 0, reason)
    return num

def qc_flag(row):
    crop = row["crop"]
    year = int(row["year"])
    p = numeric(row["production_tonnes"], "INVALID_PRODUCTION")
    a = numeric(row["area_ha"], "INVALID_AREA")
    y = numeric(row["reported_yield_t_ha"], "INVALID_YIELD")
    if crop in ("Potato", "Soybean", "SweetPotato") and year in ZERO_YEARS:
        return "SOURCE_COVERAGE_GAP_SUSPECTED"
    if p > 0 and a == 0:
        return "POSITIVE_PRODUCTION_ZERO_REPORTED_AREA"
    if (crop == "SweetPotato" and year == 2022 and
            row["prefecture_code"] not in ("p98", "p99") and p == 0):
        return "PREFECTURE_ZERO_MEANING_UNVERIFIED"
    if p == a == y == 0:
        return "ALL_ZERO_SOURCE_VALUE_UNVERIFIED"
    return "SOURCE_REPORTED_NOT_INDEPENDENTLY_QCED"

def load_original(archive):
    spec = importlib.util.spec_from_file_location("naft_p16_source_gate", P16)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    originals = m.require_original(archive)  # ZIP, member SHA, path and size gate
    return originals

def convert(originals):
    raw = originals["CropProduction_JP_1883-2022.csv"]
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8"), newline=""))
    require(tuple(reader.fieldnames or ()) == ORIGINAL_HEADER, "HEADER")
    seen = set()
    triplets = OrderedDict()
    count = 0
    for r in reader:
        count += 1
        require(count <= 146160, "EXCESS_ORIGINAL_ROWS")
        require(None not in r and set(r) == set(ORIGINAL_HEADER), "ORIGINAL_COLUMN_SHAPE")
        require(r["crop"] in CROPS, "UNKNOWN_CROP")
        require(r["year"].isdigit() and 1883 <= int(r["year"]) <= 2022,
                "ORIGINAL_YEAR")
        require(r["var"] in MAP, "ORIGINAL_METRIC")
        metric, lineage, unit = MAP[r["var"]]
        require(r["unit"] == unit, "UNIT_CONFLICT")
        numeric(r["value"], "NUMERIC_SOURCE_VALUE")
        key = (r["crop"], r["year"], r["code_reg"], r["code_pref"])
        mkey = (key, metric)
        require(mkey not in seen, "DUPLICATE_ORIGINAL_METRIC")
        seen.add(mkey)
        if key not in triplets:
            triplets[key] = {
                "crop": r["crop"], "year": r["year"],
                "era": r["JapaneseCalender"],
                "region_code": r["code_reg"], "region": r["region"],
                "prefecture_code": r["code_pref"], "prefecture": r["prefecture"]
            }
        item = triplets[key]
        require(item["era"] == r["JapaneseCalender"] and
                item["region"] == r["region"] and
                item["prefecture"] == r["prefecture"], "KEY_LABEL_DRIFT")
        item[metric] = r["value"]  # Preserve the source string, not a recomputed float.
        item[lineage] = r["source"]
    require(count == 146160 and len(triplets) == 48720 and
            len(seen) == 146160, "SIX_CROP_140_YEAR_DATA_CUBE")
    flags = Counter()
    per_crop = defaultdict(list)
    years = defaultdict(set)
    region_prefs = defaultdict(set)
    for key, row in triplets.items():
        require(len(row) == 13 and all(name in row for name in COLUMNS[:-1]),
                "MISSING_ORIGINAL_METRIC")
        row["quality_flag"] = qc_flag(row)
        flags[row["quality_flag"]] += 1
        per_crop[row["crop"]].append(row)
        years[row["crop"]].add(row["year"])
        region_prefs[(row["crop"], row["year"])].add(row["prefecture_code"])
    require(all(len(per_crop[c]) == 8120 and len(years[c]) == 140 for c in CROPS),
            "INCOMPLETE_CROP_OR_YEAR")
    require(all(len(v) == 58 for v in region_prefs.values()), "GEO_COVERAGE")
    require(flags["POSITIVE_PRODUCTION_ZERO_REPORTED_AREA"] == 59 and
            flags["PREFECTURE_ZERO_MEANING_UNVERIFIED"] == 41 and
            flags["SOURCE_COVERAGE_GAP_SUSPECTED"] == 1218,
            "SOURCE_QC_COUNTS_CHANGED")
    return per_crop, flags, count

def remaster(archive, out, verify_only=False):
    originals = load_original(archive)
    registry = json.loads(MANIFEST.read_text(encoding="utf-8"))
    require(registry["schema"] == SCHEMA and
            registry["source_original_zip_sha256"] == digest(Path(archive).read_bytes()) and
            registry["source_original_csv_sha256"] ==
                digest(originals["CropProduction_JP_1883-2022.csv"]),
            "REGISTRY_ORIGINAL_DIGEST")
    by_crop, flags, count = convert(originals)
    require(dict(flags) == registry["flag_counts"], "AGGREGATE_QC_FLAGS_CHANGED")
    require(list(COLUMNS) == registry["columns"], "CANONICAL_COLUMN_ORDER_CHANGED")
    if not verify_only:
        require(out is not None and out.is_dir() and not out.is_symlink(),
                "EXISTING_SAFE_OUTPUT_DIR_REQUIRED")
    for crop in CROPS:
        stream = io.StringIO(newline="")
        writer = csv.DictWriter(stream, fieldnames=COLUMNS,
                                quoting=csv.QUOTE_ALL, lineterminator="\n")
        writer.writeheader()
        writer.writerows(by_crop[crop])
        output = stream.getvalue().encode("utf-8")
        expected = registry["files"][crop]
        require(len(output) == expected["size"] and
                digest(output) == expected["sha256"] and
                git_blob_sha1(output) == expected["git_blob_sha1"] and
                len(by_crop[crop]) == expected["records"],
                "REMASTER_CONTENT_SHA_OR_ROW_COUNT_CHANGED:" + crop)
        if verify_only:
            committed = ROOT / expected["path"]
            require(committed.is_file() and committed.read_bytes() == output,
                    "COMMITTED_DATA_NOT_REPRODUCIBLE:" + crop)
        else:
            path = out / (crop.lower() + ".csv")
            require(not path.exists(), "OUTPUT_ALREADY_EXISTS:" + str(path))
            path.write_bytes(output)
    return {
        "status": "REMASTER_VERIFIED_BYTE_EXACT_6_CROPS",
        "original_raw_rows": count,
        "remastered_triplets": sum(len(x) for x in by_crop.values()),
        "crop_csv_count": len(CROPS),
        "flag_counts": dict(flags),
        "original_redistribution_license_verified": False,
        "issued_carbon_credits": None
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_zip", help="User-held original source ZIP")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--out", type=Path, help="An existing empty private output directory")
    group.add_argument("--verify-committed", action="store_true",
                       help="Check that all six committed public CSV bytes match the original")
    args = parser.parse_args()
    print(json.dumps(remaster(args.source_zip, args.out, args.verify_committed),
                     ensure_ascii=False, sort_keys=True))

if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, UnicodeError, OverflowError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
