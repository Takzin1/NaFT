#!/usr/bin/env python3
"""NaFT P47 Yamanashi agricultural soil GIS provenance replay.
'verify PRIVATE_ORIGINAL.zip' checks all member bytes, SHP header and every DBF row.
Public CI runs 'audit' on committed hashes and derived counts, without raw geometry.
No Python third-party requirements; municipality code and GUN values are never normalized.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/"research/p47-yamanashi-soil-shapefile-source-v1.json"
LANDUSE=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
COUNTS={"田":163,"普通畑":193,"牧草地":18,"樹園地":190}
GUN={"":396,"中巨摩郡":14,"北都留郡":10,"南巨摩郡":75,"南都留郡":41,"西八代郡":28}
SOURCE_SHA="78df028c3de6bd2e4544cd12f6f7aca98aa5a9af7de60b1bd574a4fa1c5f1842"
BOUNDS=[138.23930161753367,35.18602299506912,139.12879005173434,35.948501229692546]
HOLD_GUN={"富士川町":["南巨摩郡","西八代郡"],"身延町":["南巨摩郡","西八代郡"]}
MISSING_NAMES={"富士川町":4,"富士河口湖町":1,"市川三郷町":4,"忍野村":1,"昭和町":9,"西桂町":2}

def require(ok,why):
    if not ok:
        raise ValueError("P47_YAMANASHI_SOURCE_BLOCKED:"+why)

def load():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def counts_by_category(rows):
    return [sum(r[2+i] for r in rows) for i in range(4)]

def audit(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p47-yamanashi-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="山梨県.zip" and s["member_folder"]=="k15山梨県","SOURCE_FILENAME")
    require(s["source_zip_sha256"]==SOURCE_SHA and s["zip_bytes"]==3411194,"SOURCE_ARCHIVE_HASH")
    require(s["zip_entries"]==len(s["members"])==7,"ZIP_ENTRY_COUNT")
    require(sum(v["bytes"] for v in s["members"])==s["uncompressed_bytes"]==5546850,"UNCOMPRESSED_BYTES")
    require(all(v["name"].startswith("k15山梨県.") and len(v["sha256"])==64 for v in s["members"]),"ZIP_MEMBER_METADATA")
    require(s["metadata_creation_date"]=="2017-01-17" and s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","ORIGINAL_PROVENANCE")
    require(s["publisher_authentication"]=="NOT_VERIFIED" and s["redistribution_rights"]=="NOT_VERIFIED","LICENSE_UNRESOLVED")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"NO_RAW_PUBLICATION")
    require(g["type"]=="POLYGON" and g["crs"]=="GCS_JGD_2000" and g["bounds_lon_lat"]==BOUNDS,"GEO_REPROJECT_NOT_APPLIED")
    require(g["shape_count"]==564 and g["municipality_name_count"]==27 and g["unique_jcodes"]==28 and g["administrative_code_name_pairs"]==54,"GEO_FEATURES")
    require(g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":564},"SICHO")
    require(g["gun_counts"]==GUN and sum(GUN.values())==564,"GUN_COUNTS")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["feature_counts_by_landuse"]==COUNTS and sum(COUNTS.values())==564,"LANDUSE")
    require(m["soil_group_code_categories"]==13 and m["soil_fine_class_categories"]==51,"SOIL_TAXONOMY")
    pairs=m["jcode_name_pairs_counts_by_landuse"]
    require(len(pairs)==54 and len({(r[0],r[1]) for r in pairs})==54,"CODE_PAIRS")
    require(all(len(r)==6 and len(r[0])==5 and r[0][:2] in ("14","19") and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in pairs),"CODE_ROW_VALIDATION")
    require(counts_by_category(pairs)==[COUNTS[c] for c in LANDUSE],"JCODE_LANDUSE")
    code_names,name_codes=defaultdict(set),defaultdict(set)
    for code,name,*_ in pairs:
        code_names[code].add(name)
        name_codes[name].add(code)
    require(len(code_names)==28 and len(name_codes)==27,"CODE_NAME_COUNTS")
    a=m["source_code_name_anomalies"]
    foreign=[r for r in pairs if not r[0].startswith("19")]
    require(foreign==a["foreign_prefecture_code_pairs"]==[["14151","上野原市",0,1,0,0]],"FOREIGN_SOURCE_PAIR")
    require(sum(sum(r[2:]) for r in foreign)==a["foreign_prefecture_code_feature_count"]==1,"FOREIGN_FEATURES")
    require(a["foreign_prefixes"]==["14"] and a["foreign_code_prefix_totals"]=={"14":1},"FOREIGN_PREFIX")
    require(a["one_to_one_code_name_mapping"] is False and a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_CITY_JOIN")
    require({k:sorted(v) for k,v in code_names.items() if len(v)>1}==a["codes_with_multiple_names"],"CODE_MULTINAME_PARITY")
    require({k:sorted(v) for k,v in name_codes.items() if len(v)>1}==a["names_with_multiple_codes"],"NAME_MULTICODE_PARITY")
    require(sum(len(v)>1 for v in code_names.values())==14 and sum(len(v)>1 for v in name_codes.values())==17,"MULTIMAP_COUNTS")
    gun_pairs=m["gun_name_pairs_counts_by_landuse"]
    require(len(gun_pairs)==35 and len({(r[0],r[1]) for r in gun_pairs})==35,"GUN_PAIRS")
    require(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in gun_pairs),"GUN_ROW_VALIDATION")
    require(counts_by_category(gun_pairs)==[COUNTS[c] for c in LANDUSE],"GUN_LANDUSE")
    require({k:sum(sum(r[2:]) for r in gun_pairs if r[0]==k) for k in GUN}==GUN,"GUN_PARITY")
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN and q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN","GUN_HOLD")
    nonempty=defaultdict(set)
    for gun,name,*_ in gun_pairs:
        if gun: nonempty[name].add(gun)
    missing=[r for r in gun_pairs if r[0]=="" and nonempty.get(r[1])]
    missing_summary={r[1]:sum(r[2:]) for r in missing}
    require(missing_summary==MISSING_NAMES,"MISSING_GUN_NAMES")
    require(sum(missing_summary.values())==q["empty_gun_features_for_known_gun_towns"]==21,"MISSING_GUN_COUNT")
    missing_derived=[{"municipality_name":r[1],"empty_gun_landuse_counts":dict(zip(LANDUSE,r[2:])),"empty_gun_polygon_count":sum(r[2:]),"gun_names_seen_elsewhere":sorted(nonempty[r[1]])} for r in missing]
    require(missing_derived==q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"],"MISSING_GUN_DERIVATION")
    require({k:sorted(v) for k,v in nonempty.items() if len(v)>1}==q["municipality_names_with_multiple_nonempty_guns"]==HOLD_GUN,"MULTI_GUN_NAMES")
    irregular=[r for r in gun_pairs if r[0]=="西八代郡" and r[1] in ("富士川町","身延町")]
    require(irregular==[["西八代郡","富士川町",0,1,0,0],["西八代郡","身延町",1,1,0,1]],"HISTORICAL_GUN_CANDIDATES")
    require([{"gun":r[0],"municipality_name":r[1],"landuse_counts":dict(zip(LANDUSE,r[2:])),"polygon_count":sum(r[2:])} for r in irregular]==q["suspected_historical_gun_name_pairs"],"GUN_SUSPECT_PARITY")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_conflict_detected"] is True,"SOURCE_CONFLICT")
    require(sb["municipality_level_aggregations_pending_reconciliation"] is True and sb["calculation_of_certified_credits_prohibited"] is True and sb["official_credit_tco2e"] is None,"SCIENCE")
    return True

def read_dbf(blob):
    require(len(blob)>=353,"DBF_MIN_SIZE")
    n,head,record_size=struct.unpack_from("<IHH",blob,4)
    require((n,head,record_size)==(564,353,1098) and head+n*record_size<=len(blob),"DBF_HEADER")
    fields=[];offset=32
    while offset+32<=head and blob[offset]!=13:
        fd=blob[offset:offset+32]
        require(fd[11]==ord("C"),"DBF_FIELD_NOT_CHAR")
        fields.append((fd[:11].split(b"\0",1)[0].decode("cp932"),fd[16]))
        offset+=32
    require(offset<head and blob[offset]==13 and [x[0] for x in fields]==list(FIELDS),"DBF_SCHEMA")
    slices={};position=1
    for name,size in fields:
        slices[name]=(position,position+size)
        position+=size
    require(position==record_size,"DBF_RECORD_WIDTH")
    land=Counter();pair=defaultdict(Counter);gun_pair=defaultdict(Counter);groups=set();fine=set();sicho=Counter();gun=Counter()
    for i in range(n):
        row=blob[head+i*record_size:head+(i+1)*record_size]
        require(len(row)==record_size and row[:1]==b" ","DBF_DELETED_ROW")
        def get(name):
            l,r=slices[name]
            return row[l:r].decode("cp932").strip(" \0\t")
        category=get("地目区分")
        require(category in LANDUSE,"LANDUSE_UNKNOWN")
        code,name,g=get("JCODE"),get("SIKUCHOSON"),get("GUN")
        require(code[:2] in ("14","19") and len(code)==5 and name,"JCODE_FORMAT")
        require(get("KEN_1")=="山梨県","PREFECTURE")
        land[category]+=1
        pair[(code,name)][category]+=1
        gun_pair[(g,name)][category]+=1
        gun[g]+=1;sicho[get("SICHO")]+=1
        groups.add(get("群コード"));fine.add(get("包括_統群"))
    return land,pair,gun_pair,gun,sicho,len(groups),len(fine)

def verify(path,m):
    p=Path(path);s,g=m["source"],m["geometry"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_SHA")
    parts={}
    with zipfile.ZipFile(p) as z:
        entries=z.infolist()
        require(len(entries)==7,"ZIP_MEMBER_COUNT")
        for item,info in zip(entries,s["members"]):
            name=item.filename if item.flag_bits&0x800 else item.filename.encode("cp437").decode("cp932")
            require(name==s["member_folder"]+"/"+info["name"],"ZIP_MEMBER_PATH")
            require(not item.is_dir() and item.file_size==info["bytes"],"ZIP_MEMBER_SIZE")
            b=z.read(item)
            require(sha256(b).hexdigest()==info["sha256"],"ZIP_MEMBER_SHA")
            parts[info["name"]]=b
    shp,shx,dbf=(parts["k15山梨県."+ext] for ext in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994,"SHP_MAGIC")
    require(struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON")
    require((len(shx)-100)//8==g["shape_count"],"SHX_COUNT")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),g["bounds_lon_lat"])),"SHP_EXTENT")
    require("GCS_JGD_2000" in parts["k15山梨県.prj"].decode("ascii"),"PRJ_CRS")
    require("<CreaDate>20170117</CreaDate>" in parts["k15山梨県.shp.xml"].decode("utf-8"),"XML_DATE")
    land,pairs,gun_pairs,gun,sicho,groups,fine=read_dbf(dbf)
    require(dict(land)==m["feature_counts_by_landuse"],"LANDUSE_REPLAY")
    require(dict(gun)==g["gun_counts"] and dict(sicho)==g["sicho_counts"],"GUN_SICHO_REPLAY")
    require((groups,fine)==(m["soil_group_code_categories"],m["soil_fine_class_categories"]),"TAXONOMY_REPLAY")
    code_rows=[[c,n]+[pairs[(c,n)][cat] for cat in LANDUSE] for (c,n) in sorted(pairs)]
    gun_rows=[[gun,n]+[gun_pairs[(gun,n)][cat] for cat in LANDUSE] for (gun,n) in sorted(gun_pairs)]
    require(code_rows==m["jcode_name_pairs_counts_by_landuse"],"CODE_NAME_PAIR_REPLAY")
    require(gun_rows==m["gun_name_pairs_counts_by_landuse"],"GUN_NAME_PAIR_REPLAY")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"山梨県","polygons":564,
            "code_name_pairs":54,"gun_name_pairs":35,"official_credit_tco2e":None}

def main(args):
    m=load();audit(m)
    if args==["audit"]:
        out={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":564,"code_name_pairs":54,"gun_name_pairs":35,"raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        out=verify(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p47-yamanashi-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(out,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
