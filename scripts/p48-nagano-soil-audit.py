#!/usr/bin/env python3
"""NaFT P48: reproduce Nagano soil Shapefile provenance checks offline.
Public CI validates the derived manifest; verify ORIGINAL.zip checks all source
bytes and all 2,518 DBF records. Only stdlib required; no raw GIS publication.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / "research/p48-nagano-soil-shapefile-source-v1.json"
LANDUSE = ("田", "普通畑", "牧草地", "樹園地")
FIELDS = ("地目区分", "包括_統群", "統群コード", "亜群コード", "群コード",
          "JCODE", "KEN_1", "SICHO", "GUN", "SIKUCHOSON")
LAND_COUNTS = {"田":766, "普通畑":904, "牧草地":223, "樹園地":625}
FOREIGN_CODES = {"10":3, "15":2, "19":5}
FOREIGN_GUN = {"中魚沼郡":2, "甘楽郡":2, "吾妻郡":1}
GUN_COUNTS = {
    "":1276,"下伊那郡":274,"上伊那郡":169,"東筑摩郡":115,
    "南佐久郡":110,"上水内郡":96,"木曽郡":91,"北安曇郡":72,
    "諏訪郡":71,"下高井郡":70,"北佐久郡":51,"小県郡":51,
    "上高井郡":30,"埴科郡":21,"下水内郡":16,
    "中魚沼郡":2,"甘楽郡":2,"吾妻郡":1,
}
ZIP_HASH = "1760eeddfc65c44240dbb84ee221925c38814a705b65fe97cc6aeb4068b386fd"
BOUNDS = [137.4472894680439,35.203588111443956,138.70208377936234,37.00325490200541]

def require(ok, why):
    if not ok:
        raise ValueError("P48_NAGANO_SOURCE_BLOCKED:"+why)

def load():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def countcats(pairs):
    return [sum(r[2+i] for r in pairs) for i in range(4)]

def group_pairs_by_source_rows(raw_rows, key_columns):
    grp=defaultdict(Counter)
    for r in raw_rows:
        grp[tuple(r[col] for col in key_columns)][r["地目区分"]]+=1
    return [[*key,*[values[cat] for cat in LANDUSE]] for key,values in sorted(grp.items())]

def analyze_pairs(codepairs,gunpairs):
    codes,names,seen=defaultdict(set),defaultdict(set),set()
    for code,name,*cats in codepairs:
        require(len(code)==5 and code.isdigit() and code[:2] in ("10","15","19","20")
                and name and all(type(v) is int and v>=0 for v in cats), "CODE_ROW")
        key=(code,name)
        require(key not in seen, "DUPLICATE_CODE_PAIR")
        seen.add(key)
        codes[code].add(name);names[name].add(code)
    ng=defaultdict(set)
    gun_ct=Counter()
    gun_set=set()
    for gun,name,*cats in gunpairs:
        key=(gun,name)
        require(key not in gun_set and name and all(type(v) is int and v>=0 for v in cats), "GUN_ROW")
        gun_set.add(key)
        gun_ct[gun]+=sum(cats)
        if gun:ng[name].add(gun)
    blank = [
        {"municipality_name":name,
         "empty_gun_landuse_counts":dict(zip(LANDUSE,cats)),
         "empty_gun_polygon_count":sum(cats),
         "gun_names_seen_elsewhere":sorted(ng[name])}
        for gun,name,*cats in gunpairs if not gun and name in ng
    ]
    multi_guns={k:sorted(v) for k,v in sorted(ng.items()) if len(v)>1}
    return codes,names,dict(gun_ct),blank,multi_guns

def audit_register(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p48-nagano-soil-shapefile-v1", "SCHEMA")
    require(s["provided_filename"]=="長野県.zip" and s["member_folder"]=="k16長野県", "SOURCE_NAME")
    require(s["source_zip_sha256"]==ZIP_HASH and s["zip_bytes"]==12941155, "SOURCE_ZIP")
    require(s["zip_entries"]==len(s["members"])==7, "ZIP_MEMBERS")
    require(sum(f["bytes"] for f in s["members"])==s["uncompressed_bytes"]==21293734, "ORIGINAL_BYTES")
    require(all(f["name"].startswith("k16長野県.") and len(f["sha256"])==64 for f in s["members"]), "MEMBER_SHA")
    require(s["metadata_creation_date"]=="2017-01-17" and s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON", "ORIGINAL_PROVENANCE")
    require(s["publisher_authentication"]==s["redistribution_rights"]=="NOT_VERIFIED", "LICENSE")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False, "NO_RAW_PUBLICATION")
    require(g["type"]=="POLYGON" and g["crs"]=="GCS_JGD_2000" and g["shape_count"]==2518, "GEOMETRY")
    require(g["bounds_lon_lat"]==BOUNDS and g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":2518}, "BBOX_SICHO")
    require(g["municipality_name_count"]==77 and g["unique_jcodes"]==82 and g["administrative_code_name_pairs"]==176, "GEO_COUNTS")
    require(g["gun_counts"]==GUN_COUNTS and sum(GUN_COUNTS.values())==2518, "GUN_COUNTS")
    require(m["fields"]==list(FIELDS), "FIELDS")
    require(m["soil_group_code_categories"]==19 and m["soil_fine_class_categories"]==108, "SOIL_CLASSES")
    require(m["feature_counts_by_landuse"]==LAND_COUNTS, "LANDUSE")
    cps,gps=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cps)==176 and len(gps)==116, "PAIR_COUNTS")
    require(countcats(cps)==countcats(gps)==[766,904,223,625], "PAIR_CATEGORY_TOTALS")
    codes,names,guns,blank,multi_guns=analyze_pairs(cps,gps)
    require(len(codes)==82 and len(names)==77 and guns==GUN_COUNTS, "PAIR_RECONCILIATION")
    an=m["source_code_name_anomalies"]
    foreign=[r for r in cps if not r[0].startswith("20")]
    require(foreign==an["foreign_prefecture_code_pairs"], "FOREIGN_PAIR_PARITY")
    prefix=Counter()
    for r in foreign:prefix[r[0][:2]]+=sum(r[2:])
    require(len(foreign)==6 and sum(prefix.values())==an["foreign_prefecture_code_feature_count"]==10, "FOREIGN_FEATURES")
    require(dict(prefix)==an["foreign_code_prefix_totals"]==FOREIGN_CODES and an["foreign_prefixes"]==["10","15","19"], "FOREIGN_PREFIXES")
    require(an["one_to_one_code_name_mapping"] is False and an["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN", "NO_CODE_JOIN")
    require({k:sorted(v) for k,v in codes.items() if len(v)>1}==an["codes_with_multiple_names"], "MULTINAME_CODES")
    require({k:sorted(v) for k,v in names.items() if len(v)>1}==an["names_with_multiple_codes"], "MULTICODE_NAMES")
    require(sum(len(v)>1 for v in codes.values())==42 and sum(len(v)>1 for v in names.values())==55, "AMBIGUITY_COUNTS")
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN_COUNTS and q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN", "GUN_JOIN_BLOCK")
    require(q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==blank, "GUN_BLANK_ROWS")
    require(len(blank)==33 and sum(r["empty_gun_polygon_count"] for r in blank)==q["empty_gun_features_for_names_with_nonempty_gun_elsewhere"]==290, "GUN_BLANK_TOTAL")
    require(q["municipality_names_with_multiple_nonempty_guns"]==multi_guns and len(multi_guns)==5, "MULTIGUN_TOWNS")
    require(q["foreign_prefecture_gun_name_counts"]==FOREIGN_GUN, "FOREIGN_GUN_COUNTS")
    declared=q["foreign_prefecture_gun_records"]
    require(len(declared)==5 and Counter(x["gun"] for x in declared)==Counter(FOREIGN_GUN), "FOREIGN_GUN_RECORDS")
    for x in declared:
        require(x["landuse"] in LANDUSE and x["jcode"].startswith(("10","15")) and x["municipality_name"], "FOREIGN_GUN_ATTRIBUTES")
    bounds=m["scientific_boundaries"]
    require(bounds["jcode_name_conflict_detected"] is True and bounds["gun_name_conflict_detected"] is True and bounds["municipality_level_aggregations_pending_reconciliation"] is True, "JOIN_HOLD")
    require(bounds["official_credit_tco2e"] is None and bounds["calculation_of_certified_credits_prohibited"] is True, "CREDIT_HOLD")
    return True

def read_dbf(blob):
    require(len(blob)>=353, "DBF_SHORT")
    count,header_length,row_length=struct.unpack_from("<IHH",blob,4)
    require((count,header_length,row_length)==(2518,353,1098), "DBF_LENGTH")
    require(header_length+count*row_length<=len(blob), "DBF_TRUNCATION")
    fields=[];pos=32
    while pos+32<=header_length and blob[pos]!=13:
        item=blob[pos:pos+32]
        name=item[:11].split(b"\0",1)[0].decode("cp932")
        require(item[11]==ord("C"), "DBF_NON_TEXT")
        fields.append((name,item[16]));pos+=32
    require(pos<header_length and blob[pos]==13 and [n for n,l in fields]==list(FIELDS), "DBF_SCHEMA")
    offsets={};offset=1
    for field,length in fields:
        offsets[field]=(offset,offset+length)
        offset+=length
    require(offset==row_length,"DBF_FIELD_LENGTH")
    rows=[]
    for index in range(count):
        row=blob[header_length+index*row_length:header_length+(index+1)*row_length]
        require(len(row)==row_length and row[0]==32, "DBF_DELETED_OR_SHORT")
        def get(field):
            a,b=offsets[field]
            return row[a:b].decode("cp932").strip(" \0\t")
        record={field:get(field) for field in FIELDS}
        require(record["KEN_1"]=="長野県" and record["SICHO"]=="", "FOREIGN_KEN_1")
        require(record["地目区分"] in LANDUSE, "UNKNOWN_LANDUSE")
        require(len(record["JCODE"])==5 and record["JCODE"].isdigit() and record["SIKUCHOSON"], "CODE_OR_NAME")
        rows.append(record)
    return rows

def verify_zip(path,m):
    s,g=m["source"],m["geometry"]
    path=Path(path)
    require(path.is_file() and path.stat().st_size==s["zip_bytes"], "ZIP_SIZE")
    require(sha256(path.read_bytes()).hexdigest()==s["source_zip_sha256"], "ZIP_HASH")
    parts={}
    with zipfile.ZipFile(path) as archive:
        infos=archive.infolist()
        require(len(infos)==7, "ZIP_MEMBER_COUNT")
        for info, expected in zip(infos,s["members"]):
            name=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(not info.is_dir() and name==s["member_folder"]+"/"+expected["name"], "ZIP_PATH")
            require(info.file_size==expected["bytes"], "MEMBER_BYTES")
            blob=archive.read(info)
            require(sha256(blob).hexdigest()==expected["sha256"], "MEMBER_HASH")
            parts[expected["name"]]=blob
    shp,shx,dbf=(parts["k16長野県."+e] for e in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994, "SHP_MAGIC")
    require(struct.unpack_from(">I",shp,24)[0]*2==len(shp), "SHP_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5), "SHP_POLYGON")
    require((len(shx)-100)//8==2518, "SHX_FEATURES")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),BOUNDS)), "SHP_BOUNDS")
    require("GCS_JGD_2000" in parts["k16長野県.prj"].decode("ascii"), "CRS_PRJ")
    require("<CreaDate>20170117</CreaDate>" in parts["k16長野県.shp.xml"].decode("utf-8"), "XML_DATE")
    rows=read_dbf(dbf)
    land=Counter(r["地目区分"] for r in rows)
    require(dict(land)==LAND_COUNTS, "LANDUSE_REPLAY")
    require(len({r["群コード"] for r in rows})==19 and len({r["包括_統群"] for r in rows})==108, "SOIL_REPLAY")
    cps=group_pairs_by_source_rows(rows,("JCODE","SIKUCHOSON"))
    gps=group_pairs_by_source_rows(rows,("GUN","SIKUCHOSON"))
    require(cps==m["jcode_name_pairs_counts_by_landuse"], "JCODE_PAIRS_REPLAY")
    require(gps==m["gun_name_pairs_counts_by_landuse"], "GUN_PAIRS_REPLAY")
    require(Counter(r["GUN"] for r in rows)==Counter(GUN_COUNTS), "GUN_TOTAL_REPLAY")
    prefix=Counter(r["JCODE"][:2] for r in rows if not r["JCODE"].startswith("20"))
    require(dict(prefix)==FOREIGN_CODES, "FOREIGN_CODE_REPLAY")
    suspects=sorted(
        (r["JCODE"],r["SIKUCHOSON"],r["GUN"],r["地目区分"])
        for r in rows if r["GUN"] in FOREIGN_GUN
    )
    declared=sorted(
        (r["jcode"],r["municipality_name"],r["gun"],r["landuse"])
        for r in m["source_gun_quality"]["foreign_prefecture_gun_records"]
    )
    require(suspects==declared, "FOREIGN_GUN_SOURCE_REPLAY")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"長野県",
            "polygons":2518,"jcode_name_pairs":176,"gun_name_pairs":116,
            "foreign_code_features":10,"official_credit_tco2e":None}

def main(args):
    m=load()
    audit_register(m)
    if args==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":2518,
                "jcode_name_pairs":176,"gun_name_pairs":116,"foreign_code_features":10,
                "raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        result=verify_zip(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p48-nagano-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:
        main(sys.argv[1:])
    except Exception as err:
        print(str(err),file=sys.stderr)
        sys.exit(1)
