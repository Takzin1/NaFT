#!/usr/bin/env python3
"""P30: offline integrity replay of user-uploaded Aomori soil Shapefile ZIP.
Only derived counts and SHA-256 values are committed; raw shapes remain private.
Requires Python standard library, no network.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / "research/p30-aomori-soil-shapefile-source-v1.json"
LANDUSE = ("田", "普通畑", "牧草地", "樹園地")
REQUIRED_FIELDS = ("地目区分", "包括_統群", "統群コード", "亜群コード",
                   "群コード", "JCODE", "KEN_1", "SICHO", "GUN", "SIKUCHOSON")

def require(ok, code):
    if not ok:
        raise ValueError("P30_AOMORI_SOURCE_BLOCKED:" + code)

def load_register():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def audit_register(g):
    s, geo = g["source"], g["geometry"]
    require(g["schema"] == "naft-p30-aomori-soil-shapefile-v1", "SCHEMA")
    require(s["zip_entries"] == len(s["members"]) == 7, "ZIP_ENTRIES")
    require(sum(m["bytes"] for m in s["members"]) == s["uncompressed_bytes"] == 14669992, "SOURCE_BYTES")
    require(s["zip_bytes"] == 9300558 and len(s["source_zip_sha256"]) == 64, "SOURCE_ARCHIVE")
    require(geo["type"] == "POLYGON" and geo["crs"] == "GCS_JGD_2000", "GEOMETRY")
    require(geo["shape_count"] == 1311 and geo["municipalities"] == 40, "FEATURE_COUNT")
    require(geo["sicho_unique_values"] == [""], "NO_SICHO")
    require(g["fields"] == list(REQUIRED_FIELDS), "FIELDS")
    require(g["soil_group_code_categories"] == 19 and g["soil_fine_class_categories"] == 69, "SOIL_CLASS")
    totals = g["feature_counts_by_landuse"]
    require(set(totals) == set(LANDUSE) and sum(totals.values()) == 1311, "LANDUSE_TOTAL")
    municipalities = g["municipalities_counts_by_landuse"]
    require(len(municipalities) == 40 and len({r[0] for r in municipalities}) == 40, "MUNICIPALITIES")
    require(all(len(r) == 6 and r[0].startswith("02") and len(r[0]) == 5 for r in municipalities), "CODE")
    require([sum(r[2+i] for r in municipalities) for i in range(4)] == [totals[k] for k in LANDUSE], "CITY_TOTAL")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False, "RAW_MUST_NOT_PUBLISH")
    require(s["redistribution_rights"] == "NOT_VERIFIED", "LICENSE")
    require(g["scientific_boundaries"]["official_credit_tco2e"] is None, "CREDIT")
    return True

def read_dbf(blob):
    require(len(blob) >= 353, "DBF_SHORT")
    n, header_length, record_length = struct.unpack_from("<IHH", blob, 4)
    require(n == 1311 and header_length == 353 and record_length == 1098, "DBF_HEADER")
    require(header_length + n * record_length <= len(blob), "DBF_TRUNCATED")
    fields, p = [], 32
    while p+32 <= header_length and blob[p] != 13:
        item = blob[p:p+32]
        name = item[:11].split(b"\0", 1)[0].decode("cp932")
        require(item[11] == ord("C"), "DBF_FIELD_NOT_TEXT")
        fields.append((name, item[16]))
        p += 32
    require(p < header_length and blob[p] == 13 and len(fields) == len(REQUIRED_FIELDS), "DBF_FIELD_LAYOUT")
    names = [name for name, _ in fields]
    require(names == list(REQUIRED_FIELDS), "DBF_COLUMNS")
    offsets, cursor = {}, 1
    for name, length in fields:
        offsets[name] = (cursor, cursor + length)
        cursor += length
    require(cursor == record_length, "DBF_ROW_LENGTH")
    land = Counter()
    city = defaultdict(Counter)
    groups, fine, seen_cities, sicho = set(), set(), set(), set()
    for i in range(n):
        b = blob[header_length + i*record_length:header_length + (i+1)*record_length]
        require(len(b) == record_length and b[:1] == b" ", "DBF_DELETED_ROW")
        def get(k):
            lo, hi = offsets[k]
            return b[lo:hi].decode("cp932").strip(" \0\t")
        landuse = get("地目区分")
        require(landuse in LANDUSE, "UNKNOWN_LANDUSE")
        code, name = get("JCODE"), get("SIKUCHOSON")
        require(code.startswith("02") and len(code) == 5 and name, "CITY_IDENTIFIER")
        require(get("KEN_1") == "青森県", "NOT_AOMORI")
        land[landuse] += 1
        city[(code, name)][landuse] += 1
        groups.add(get("群コード"))
        fine.add(get("包括_統群"))
        seen_cities.add(code)
        sicho.add(get("SICHO"))
    return land, city, len(groups), len(fine), len(seen_cities), sicho

def verify_zip(path, g):
    src, geo = g["source"], g["geometry"]
    path = Path(path)
    require(path.is_file() and path.stat().st_size == src["zip_bytes"], "ZIP_SIZE")
    require(sha256(path.read_bytes()).hexdigest() == src["source_zip_sha256"], "ZIP_HASH")
    source = {}
    with zipfile.ZipFile(path) as z:
        infos = z.infolist()
        require(len(infos) == 7, "ZIP_FILE_COUNT")
        for info, declared in zip(infos, src["members"]):
            # Original Japanese ZIP names used Shift-JIS without the Unicode name flag.
            actual = info.filename if info.flag_bits & 0x800 else info.filename.encode("cp437").decode("cp932")
            require(actual == src["member_folder"] + "/" + declared["name"], "ZIP_PATH")
            require(not info.is_dir() and info.file_size == declared["bytes"], "ZIP_MEMBER_SIZE")
            b = z.read(info)
            require(sha256(b).hexdigest() == declared["sha256"], "ZIP_MEMBER_HASH")
            source[declared["name"]] = b
    shp, shx, dbf = (source["k2青森県." + suffix] for suffix in ("shp", "shx", "dbf"))
    require(struct.unpack_from(">I", shp, 0)[0] == 9994, "SHP_MAGIC")
    require(struct.unpack_from(">I", shp, 24)[0]*2 == len(shp), "SHP_LENGTH")
    require(struct.unpack_from("<II", shp, 28) == (1000,5), "SHP_POLYGON")
    require((len(shx)-100)//8 == geo["shape_count"], "SHX_RECORD_COUNT")
    bounds = struct.unpack_from("<4d", shp, 36)
    require(all(abs(a-b) < 1e-9 for a,b in zip(bounds, geo["bounds_lon_lat"])), "SHP_EXTENT")
    require("GCS_JGD_2000" in source["k2青森県.prj"].decode("ascii"), "PRJ")
    require("<CreaDate>20170117</CreaDate>" in source["k2青森県.shp.xml"].decode("utf-8"), "XML_DATE")
    land, cities, group, fine, municipal_count, sicho = read_dbf(dbf)
    require(dict(land) == g["feature_counts_by_landuse"], "LANDUSE_PARITY")
    require(group == g["soil_group_code_categories"] and fine == g["soil_fine_class_categories"], "SOIL_PARITY")
    require(municipal_count == geo["municipalities"] and sicho == {""}, "CITY_OR_SICHO")
    declared = g["municipalities_counts_by_landuse"]
    got = [[code,name]+[cities[(code,name)][cat] for cat in LANDUSE] for (code,name) in sorted(cities)]
    require(got == declared, "MUNICIPALITY_AGGREGATE")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"青森県",
            "polygons":1311,"municipalities":40,"official_credit_tco2e":None}

def main(argv):
    g = load_register()
    audit_register(g)
    if argv == ["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED",
                "polygons":1311,"municipalities":40,"raw_original_verified_in_ci":False}
    elif len(argv) == 2 and argv[0] == "verify":
        result=verify_zip(argv[1],g)
    else:
        raise ValueError("USAGE: python3 scripts/p30-aomori-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result, ensure_ascii=False))

if __name__=="__main__":
    try:
        main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
