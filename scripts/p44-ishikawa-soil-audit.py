#!/usr/bin/env python3
"""P44 Ishikawa soil GIS reproducible provenance audit.
CI verifies metadata/derived counts only. Local verify ORIGINAL.zip additionally
checks all original bytes, shape headers and DBF 630 records. No public raw GIS.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/"research/p44-ishikawa-soil-shapefile-source-v1.json"
LANDUSE=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
EXPECTED_GUN={"":434,"河北郡":31,"石川郡":5,"羽咋郡":73,
              "能美郡":10,"鳳珠郡":59,"鹿島郡":18}

def require(ok,code):
    if not ok:
        raise ValueError("P44_ISHIKAWA_SOURCE_BLOCKED:"+code)

def load():
    return json.loads(REGISTER.read_text(encoding="utf8"))

def audit_register(m):
    s,geo=m["source"],m["geometry"]
    require(m["schema"]=="naft-p44-ishikawa-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="石川県.zip" and s["member_folder"]=="k20石川県","SOURCE_NAME")
    require(s["zip_bytes"]==3522275,"ZIP_SIZE")
    require(s["source_zip_sha256"]=="84cb6318af859e65827319e613baa60ce9d0c2913d859dce3e9c3f1c0050f9ad","ZIP_SHA")
    require(s["zip_entries"]==len(s["members"])==7,"MEMBER_COUNT")
    require(sum(f["bytes"] for f in s["members"])==s["uncompressed_bytes"]==5802534,"MEMBER_BYTES")
    require(all(f["name"].startswith("k20石川県.") and len(f["sha256"])==64 for f in s["members"]),"MEMBER_NAMES")
    require(s["metadata_creation_date"]=="2017-01-17" and
            s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","SOURCE_PROVENANCE")
    require(s["redistribution_rights"]=="NOT_VERIFIED" and s["publisher_authentication"]=="NOT_VERIFIED","LICENSE_PENDING")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"RAW_NO_PUBLICATION")
    require(geo["type"]=="POLYGON" and geo["crs"]=="GCS_JGD_2000","GEOMETRY")
    require(geo["shape_count"]==630 and geo["municipality_name_count"]==19 and
            geo["unique_jcodes"]==22 and geo["administrative_code_name_pairs"]==47,"FEATURE_COUNTS")
    require(geo["bounds_lon_lat"]==[136.2509378621368,36.16399276652885,137.35953704185152,37.528077919581506],"BBOX")
    require(geo["sicho_unique_values"]==[""] and geo["sicho_counts"]=={"":630},"SICHO")
    require(geo["gun_counts"]==EXPECTED_GUN and sum(EXPECTED_GUN.values())==630,"GUN_TOTALS")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["soil_group_code_categories"]==18 and m["soil_fine_class_categories"]==59,"SOIL_CLASS")
    totals=m["feature_counts_by_landuse"]
    require(totals=={"田":309,"普通畑":198,"牧草地":33,"樹園地":90},"LANDUSE")
    require(sum(totals.values())==630,"LANDUSE_TOTAL")
    pairs=m["jcode_name_pairs_counts_by_landuse"]
    require(len(pairs)==47 and len({(r[0],r[1]) for r in pairs})==47,"PAIRS")
    require(all(len(r)==6 and r[0][:2] in ("16","17") and len(r[0])==5 and r[1] and
                all(type(x) is int and x>=0 for x in r[2:]) for r in pairs),"VALID_CODE_ROWS")
    require([sum(r[i+2] for r in pairs) for i in range(4)]==[totals[k] for k in LANDUSE],"PAIR_COUNTS")
    code_names,name_codes=defaultdict(set),defaultdict(set)
    for code,name,*counts in pairs:
        code_names[code].add(name)
        name_codes[name].add(code)
    require(len(code_names)==22 and len(name_codes)==19,"CODE_NAME_SETS")
    anomalies=m["source_code_name_anomalies"]
    foreign=[r for r in pairs if r[0].startswith("16")]
    require(foreign==anomalies["foreign_prefecture_code_pairs"],"FOREIGN_PAIRS")
    require(len(foreign)==3 and sum(sum(r[2:]) for r in foreign)==anomalies["foreign_prefecture_code_feature_count"]==5,"FOREIGN_COUNTS")
    require(anomalies["foreign_prefixes"]==["16"] and anomalies["foreign_code_prefix_totals"]=={"16":5},"FOREIGN_PREFIX")
    require(anomalies["one_to_one_code_name_mapping"] is False and anomalies["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_CITY_JOIN")
    require({k:sorted(v) for k,v in code_names.items() if len(v)>1}==anomalies["codes_with_multiple_names"],"MANY_NAMES_CODE")
    require({k:sorted(v) for k,v in name_codes.items() if len(v)>1}==anomalies["names_with_multiple_codes"],"MANY_CODES_NAME")
    require(sum(len(v)>1 for v in code_names.values())==11 and sum(len(v)>1 for v in name_codes.values())==14,"MAPPING_COUNTS")
    require(anomalies["historical_place_names_as_source"]==["野々市町"] and
            anomalies["historical_place_name_polygon_counts"]=={"野々市町":11},"HISTORICAL_PLACE")
    require(sum(sum(r[2:]) for r in pairs if r[1]=="野々市町")==11,"HISTORICAL_COUNT")
    gun_pairs=m["gun_name_pairs_counts_by_landuse"]
    require(len(gun_pairs)==29 and len({(r[0],r[1]) for r in gun_pairs})==29,"GUN_PAIRS")
    require(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in gun_pairs),"GUN_ROWS")
    require([sum(r[i+2] for r in gun_pairs) for i in range(4)]==[totals[k] for k in LANDUSE],"GUN_LANDUSE")
    require({k:sum(sum(r[2:]) for r in gun_pairs if r[0]==k) for k in EXPECTED_GUN}==EXPECTED_GUN,"GUN_PARITY")
    require(["羽咋郡","中能登町",1,0,0,0] in gun_pairs,"NAKANOTO_GUN")
    suspicious=m["source_gun_anomalies"]["suspicious_gun_name_pairs"]
    require(len(suspicious)==1 and suspicious[0]["gun"]=="羽咋郡" and
            suspicious[0]["municipality_name"]=="中能登町" and suspicious[0]["jcode"]=="17384" and
            suspicious[0]["polygons"]==1 and
            suspicious[0]["landuse_counts"]=={"田":1,"普通畑":0,"牧草地":0,"樹園地":0},"GUN_SUSPECT")
    require(m["source_gun_anomalies"]["resolution"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_NORMALIZATION","NO_GUN_JOIN")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_conflict_detected"] is True,"CONFLICT_NOTICES")
    require(sb["official_credit_tco2e"] is None and sb["municipality_level_aggregations_pending_reconciliation"] is True,"SCIENTIFIC_BOUNDARY")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_SHORT")
    n,header,rec=struct.unpack_from("<IHH",blob,4)
    require((n,header,rec)==(630,353,1098) and header+n*rec<=len(blob),"DBF_HEADER")
    fields=[];p=32
    while p+32<=header and blob[p]!=13:
        b=blob[p:p+32]
        name=b[:11].split(b"\0",1)[0].decode("cp932")
        require(b[11]==ord("C"),"DBF_FIELD_TYPE")
        fields.append((name,b[16]))
        p+=32
    require(p<header and blob[p]==13 and [x[0] for x in fields]==list(FIELDS),"DBF_COLUMNS")
    offsets={};cursor=1
    for name,length in fields:
        offsets[name]=(cursor,cursor+length)
        cursor+=length
    require(cursor==rec,"DBF_RECORD_LENGTH")
    land=Counter();cities=defaultdict(Counter);gun_names=defaultdict(Counter)
    group,fine,codes,names=set(),set(),set(),set()
    gun,sicho=Counter(),Counter()
    suspect=[]
    for i in range(n):
        b=blob[header+i*rec:header+(i+1)*rec]
        require(len(b)==rec and b[:1]==b" ","DBF_DELETED_OR_TRUNCATED")
        def get(key):
            a,z=offsets[key]
            return b[a:z].decode("cp932").strip(" \0\t")
        cat=get("地目区分")
        require(cat in LANDUSE,"LANDUSE_FIELD")
        code,name=get("JCODE"),get("SIKUCHOSON")
        require(len(code)==5 and code[:2] in ("16","17") and name,"CODE_FIELD")
        require(get("KEN_1")=="石川県","PREFECTURE_FIELD")
        g,s=get("GUN"),get("SICHO")
        land[cat]+=1;cities[(code,name)][cat]+=1;gun_names[(g,name)][cat]+=1
        codes.add(code);names.add(name);group.add(get("群コード"));fine.add(get("包括_統群"))
        gun[g]+=1;sicho[s]+=1
        if g=="羽咋郡" and name=="中能登町":suspect.append((code,cat))
    return land,cities,gun_names,len(group),len(fine),codes,names,gun,sicho,suspect

def verify_zip(path,m):
    path=Path(path);src=m["source"];geo=m["geometry"]
    require(path.is_file() and path.stat().st_size==src["zip_bytes"],"ZIP_SIZE")
    require(sha256(path.read_bytes()).hexdigest()==src["source_zip_sha256"],"ZIP_HASH")
    parts={}
    with zipfile.ZipFile(path) as z:
        infos=z.infolist()
        require(len(infos)==7,"ZIP_MEMBER_COUNT")
        for info,expected in zip(infos,src["members"]):
            filename=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(filename==src["member_folder"]+"/"+expected["name"],"ZIP_PATH")
            require(not info.is_dir() and info.file_size==expected["bytes"],"ZIP_MEMBER_LENGTH")
            blob=z.read(info)
            require(sha256(blob).hexdigest()==expected["sha256"],"ZIP_MEMBER_SHA")
            parts[expected["name"]]=blob
    shp,shx,dbf=(parts["k20石川県."+suffix] for suffix in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994 and struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_HEADER")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON")
    require((len(shx)-100)//8==geo["shape_count"],"SHX_RECORD_COUNT")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),geo["bounds_lon_lat"])),"SHP_BBOX")
    require("GCS_JGD_2000" in parts["k20石川県.prj"].decode("ascii"),"PRJ")
    require("<CreaDate>20170117</CreaDate>" in parts["k20石川県.shp.xml"].decode("utf8"),"CREATION_DATE")
    land,cities,gun_names,groups,fine,codes,names,gun,sicho,suspect=parse_dbf(dbf)
    require(dict(land)==m["feature_counts_by_landuse"],"LANDUSE_REPLAY")
    require((groups,fine)==(m["soil_group_code_categories"],m["soil_fine_class_categories"]),"SOIL_CLASS_REPLAY")
    require((len(codes),len(names),len(cities))==(22,19,47),"PAIR_COUNTS_REPLAY")
    require(dict(gun)==geo["gun_counts"] and dict(sicho)==geo["sicho_counts"],"GUN_SICHO_REPLAY")
    cp=[[code,name]+[cities[(code,name)][cat] for cat in LANDUSE] for code,name in sorted(cities)]
    gp=[[gun,name]+[gun_names[(gun,name)][cat] for cat in LANDUSE] for gun,name in sorted(gun_names)]
    require(cp==m["jcode_name_pairs_counts_by_landuse"],"JCODE_PAIR_REPLAY")
    require(gp==m["gun_name_pairs_counts_by_landuse"],"GUN_PAIR_REPLAY")
    require(suspect==[("17384","田")],"NAKANOTO_GUN_REPLAY")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"石川県",
            "polygons":630,"municipality_names":19,"jcode_name_pairs":47,
            "gun_name_pairs":29,"official_credit_tco2e":None}

def main(argv):
    m=load();audit_register(m)
    if argv==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED",
                "polygons":630,"municipality_names":19,"jcode_name_pairs":47,
                "gun_name_pairs":29,"raw_original_verified_in_ci":False}
    elif len(argv)==2 and argv[0]=="verify":
        result=verify_zip(argv[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p44-ishikawa-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as err:
        print(str(err),file=sys.stderr);sys.exit(1)
