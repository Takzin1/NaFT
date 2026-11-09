#!/usr/bin/env python3
"""P41: offline integrity replay of user-uploaded Chiba soil Shapefile ZIP.
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
REGISTER = ROOT / "research/p41-chiba-soil-shapefile-source-v1.json"
LANDUSE = ("田", "普通畑", "牧草地", "樹園地")
REQUIRED_FIELDS = ("地目区分", "包括_統群", "統群コード", "亜群コード",
                   "群コード", "JCODE", "KEN_1", "SICHO", "GUN", "SIKUCHOSON")

def require(ok, code):
    if not ok:
        raise ValueError("P41_CHIBA_SOURCE_BLOCKED:" + code)

def load_register():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def audit_register(g):
    src, geo = g["source"], g["geometry"]
    require(g["schema"] == "naft-p41-chiba-soil-shapefile-v1", "SCHEMA")
    require(src["zip_entries"] == len(src["members"]) == 7, "ZIP_ENTRIES")
    require(sum(x["bytes"] for x in src["members"]) == src["uncompressed_bytes"] == 23460976, "SOURCE_BYTES")
    require(src["zip_bytes"] == 15034521 and len(src["source_zip_sha256"]) == 64, "SOURCE_ARCHIVE")
    require(geo["type"] == "POLYGON" and geo["crs"] == "GCS_JGD_2000", "GEOMETRY")
    require(geo["shape_count"] == 1907 and geo["municipality_name_count"] == 57 and geo["unique_jcodes"] == 63 and geo["administrative_code_name_pairs"] == 179, "FEATURE_COUNT")
    require(geo["sicho_unique_values"] == [""], "SICHO")
    gun = {"":1514,"印旛郡":22,"夷隅郡":36,"安房郡":24,"山武郡":92,"猿島郡":1,"長生郡":153,"香取郡":65}
    require(geo["gun_counts"] == gun and sum(gun.values()) == 1907, "GUN_COUNTS")
    gun_info = g["chiba_gun_integrity"]
    require(gun_info["gun_feature_counts"] == gun, "GUN_REGISTER_PARITY")
    suspect = [{"jcode":"08542","municipality_name":"野田市","gun":"猿島郡","landuse":"普通畑"}]
    require(gun_info["suspected_foreign_gun_name"] == "猿島郡" and gun_info["suspected_foreign_gun_records"] == suspect, "FOREIGN_GUN")
    require(gun_info["status"] == "UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN", "GUN_JOIN_BLOCK")
    require(g["fields"] == list(REQUIRED_FIELDS), "FIELDS")
    require(g["soil_group_code_categories"] == 13 and g["soil_fine_class_categories"] == 55, "SOIL_CLASS")
    totals = g["feature_counts_by_landuse"]
    require(totals == {"田":806,"普通畑":726,"牧草地":120,"樹園地":255} and sum(totals.values()) == 1907, "LANDUSE_TOTAL")
    pairs = g["jcode_name_pairs_counts_by_landuse"]
    require(len(pairs) == 179 and len({(r[0],r[1]) for r in pairs}) == 179, "PAIR_LENGTH")
    require(all(len(r) == 6 and r[0][:2] in ("08","11","12") and len(r[0]) == 5 for r in pairs), "CODE")
    require([sum(r[2+i] for r in pairs) for i in range(4)] == [totals[k] for k in LANDUSE], "CITY_TOTAL")
    require(len({r[0] for r in pairs}) == 63 and len({r[1] for r in pairs}) == 57, "CODE_NAME_COUNTS")
    require(src["original_zip_committed"] is False and src["raw_geometry_committed"] is False, "RAW_NOT_PUBLISHED")
    require(src["redistribution_rights"] == "NOT_VERIFIED" and src["publisher_authentication"] == "NOT_VERIFIED", "LICENSE_PENDING")
    require(src["source_match"] == "CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON", "OFFICIAL_SOURCE_NOT_MATCHED")
    bounds = g["scientific_boundaries"]
    require(bounds["official_credit_tco2e"] is None and bounds["jcode_name_conflict_detected"] is True and bounds["municipality_level_aggregations_pending_reconciliation"] is True, "SCIENTIFIC_GUARD")
    anomalies = g["source_code_name_anomalies"]
    foreign = [r for r in pairs if not r[0].startswith("12")]
    require(foreign == anomalies["foreign_prefecture_code_pairs"], "FOREIGN_PAIRS")
    require(len(foreign) == 6 and sum(sum(r[2:]) for r in foreign) == anomalies["foreign_prefecture_code_feature_count"] == 8, "FOREIGN_COUNT")
    require(anomalies["foreign_prefixes"] == ["08","11"] and anomalies["foreign_code_prefix_totals"] == {"08":7,"11":1}, "FOREIGN_DISTRIBUTION")
    require(anomalies["historical_place_names_as_source"] == ["大網白里町"] and anomalies["historical_place_name_polygon_counts"] == {"大網白里町":72}, "HISTORIC_NAME")
    require(sum(sum(r[2:]) for r in pairs if r[1]=="大網白里町") == 72, "HISTORIC_PARITY")
    require(anomalies["status"] == "UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN" and anomalies["one_to_one_code_name_mapping"] is False, "JOIN_BLOCK")
    cn, nc = defaultdict(set), defaultdict(set)
    for code,name,*_ in pairs:
        cn[code].add(name)
        nc[name].add(code)
    require({k:sorted(v) for k,v in cn.items() if len(v)>1} == anomalies["codes_with_multiple_names"], "CODE_MAP")
    require({k:sorted(v) for k,v in nc.items() if len(v)>1} == anomalies["names_with_multiple_codes"], "NAME_MAP")
    require(sum(len(v)>1 for v in cn.values()) == 42 and sum(len(v)>1 for v in nc.values()) == 49, "MULTI_CODE_NAME_COUNTS")
    return True

def read_dbf(blob):
    require(len(blob) >= 353, "DBF_SHORT")
    n, header_length, record_length = struct.unpack_from("<IHH", blob, 4)
    require(n == 1907 and header_length == 353 and record_length == 1098, "DBF_HEADER")
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
    groups, fine, seen_cities = set(), set(), set()
    sicho, gun, suspect_gun = Counter(), Counter(), []
    for i in range(n):
        b = blob[header_length + i*record_length:header_length + (i+1)*record_length]
        require(len(b) == record_length and b[:1] == b" ", "DBF_DELETED_ROW")
        def get(k):
            lo, hi = offsets[k]
            return b[lo:hi].decode("cp932").strip(" \0\t")
        landuse = get("地目区分")
        require(landuse in LANDUSE, "UNKNOWN_LANDUSE")
        code, name = get("JCODE"), get("SIKUCHOSON")
        require(code[:2] in ("08","11","12") and len(code) == 5 and name, "CITY_IDENTIFIER")
        require(get("KEN_1") == "千葉県", "NOT_CHIBA")
        land[landuse] += 1
        city[(code, name)][landuse] += 1
        groups.add(get("群コード"))
        fine.add(get("包括_統群"))
        seen_cities.add(code)
        sicho[get("SICHO")] += 1
        gun[get("GUN")] += 1
        if get("GUN") == "猿島郡": suspect_gun.append({"jcode":code,"municipality_name":name,"gun":get("GUN"),"landuse":landuse})
    return land, city, len(groups), len(fine), len(seen_cities), sicho, gun, suspect_gun

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
    shp, shx, dbf = (source["k12千葉県." + suffix] for suffix in ("shp", "shx", "dbf"))
    require(struct.unpack_from(">I", shp, 0)[0] == 9994, "SHP_MAGIC")
    require(struct.unpack_from(">I", shp, 24)[0]*2 == len(shp), "SHP_LENGTH")
    require(struct.unpack_from("<II", shp, 28) == (1000,5), "SHP_POLYGON")
    require((len(shx)-100)//8 == geo["shape_count"], "SHX_RECORD_COUNT")
    bounds = struct.unpack_from("<4d", shp, 36)
    require(all(abs(a-b) < 1e-9 for a,b in zip(bounds, geo["bounds_lon_lat"])), "SHP_EXTENT")
    require("GCS_JGD_2000" in source["k12千葉県.prj"].decode("ascii"), "PRJ")
    require("<CreaDate>20170117</CreaDate>" in source["k12千葉県.shp.xml"].decode("utf-8"), "XML_DATE")
    land, cities, group, fine, municipal_count, sicho, gun, suspect_gun = read_dbf(dbf)
    require(dict(land) == g["feature_counts_by_landuse"], "LANDUSE_PARITY")
    require(group == g["soil_group_code_categories"] and fine == g["soil_fine_class_categories"], "SOIL_PARITY")
    require(municipal_count == geo["unique_jcodes"], "CITY_CODE_COUNT")
    require(dict(sicho) == {"":1907} and dict(gun) == geo["gun_counts"], "GUN_SOURCE")
    require(suspect_gun == g["chiba_gun_integrity"]["suspected_foreign_gun_records"], "SUSPECT_GUN_SOURCE")
    declared = g["jcode_name_pairs_counts_by_landuse"]
    got = [[code,name]+[cities[(code,name)][cat] for cat in LANDUSE] for (code,name) in sorted(cities)]
    require(got == declared, "CODE_NAME_PAIR_AGGREGATE")
    require(len(cities) == 179 and len({name for code,name in cities}) == 57, "CODE_NAME_PAIR_COUNT")
    foreign = [[code,name]+[cities[(code,name)][cat] for cat in LANDUSE] for code,name in sorted(cities) if not code.startswith("12")]
    require(foreign == g["source_code_name_anomalies"]["foreign_prefecture_code_pairs"], "FOREIGN_PREFIX_SOURCE")
    require(sum(sum(r[2:]) for r in declared if r[1] == "大網白里町") == 72, "HISTORIC_NAME_SOURCE")
    require(sum(sum(r[2:]) for r in foreign) == 8, "FOREIGN_PREFIX_ROW_COUNT")
    code_names, name_codes = defaultdict(set), defaultdict(set)
    for code,name in cities:
        code_names[code].add(name)
        name_codes[name].add(code)
    require({k:sorted(v) for k,v in code_names.items() if len(v)>1} == g["source_code_name_anomalies"]["codes_with_multiple_names"], "MULTI_NAME_CODE_SOURCE")
    require({k:sorted(v) for k,v in name_codes.items() if len(v)>1} == g["source_code_name_anomalies"]["names_with_multiple_codes"], "MULTI_CODE_NAME_SOURCE")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"千葉県",
            "polygons":1907,"municipality_names":57,"jcode_name_pairs":179,"official_credit_tco2e":None}

def main(argv):
    g = load_register()
    audit_register(g)
    if argv == ["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED",
                "polygons":1907,"municipality_names":57,"jcode_name_pairs":179,"raw_original_verified_in_ci":False}
    elif len(argv) == 2 and argv[0] == "verify":
        result=verify_zip(argv[1],g)
    else:
        raise ValueError("USAGE: python3 scripts/p41-chiba-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result, ensure_ascii=False))

if __name__=="__main__":
    try:
        main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
