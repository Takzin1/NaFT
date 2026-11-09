#!/usr/bin/env python3
"""NaFT P51 Aichi soil GIS reproducible provenance audit (Python stdlib only).

'audit' validates published derived data; 'verify ORIGINAL.zip' rechecks private
source ZIP, all 7 members, SHP/SHX and each DBF record against that manifest.
Raw GIS is not committed publicly. Do not infer area/credits from feature counts.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/"research/p51-aichi-soil-shapefile-source-v1.json"
LANDUSE=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
COUNTS={"田":845,"普通畑":798,"牧草地":77,"樹園地":397}
GUN={"":1697,"下伊那郡":2,"丹羽郡":52,"北設楽郡":87,"愛知郡":35,
     "海部郡":27,"知多郡":173,"西春日井郡":6,"額田郡":38}
FOREIGN={"20":2,"21":4,"22":11}
ZIP_SHA="188614e4a0f369af4fb9470fd6a0af3d37bd5cfd5760c5b8170165d4d7f8d495"
BBOX=[136.6739375580311,34.58256795306523,137.81151037495965,35.42157312729245]

def require(ok, code):
    if not ok:
        raise ValueError("P51_AICHI_SOURCE_BLOCKED:"+code)

def load():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def counts(rows):
    return [sum(r[2+i] for r in rows) for i in range(4)]

def analyze_pairs(cp,gp):
    cn,nc=defaultdict(set),defaultdict(set)
    for code,name,*vals in cp:
        require(len(code)==5 and code.isdigit() and code[:2] in ("20","21","22","23")
                and name and all(type(v) is int and v>=0 for v in vals),"JCODE_PAIR_FORMAT")
        cn[code].add(name);nc[name].add(code)
    named_guns=defaultdict(set)
    gun_totals=Counter()
    for gun,name,*vals in gp:
        require(name and all(type(v) is int and v>=0 for v in vals),"GUN_PAIR_FORMAT")
        gun_totals[gun]+=sum(vals)
        if gun:named_guns[name].add(gun)
    blank=[{"municipality_name":name,
            "empty_gun_landuse_counts":dict(zip(LANDUSE,vals)),
            "empty_gun_polygon_count":sum(vals),
            "gun_names_seen_elsewhere":sorted(named_guns[name])}
           for gun,name,*vals in gp if not gun and name in named_guns]
    return cn,nc,dict(gun_totals),blank

def audit(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p51-aichi-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="愛知県.zip" and s["member_folder"]=="k23愛知県","ORIGINAL_FILENAME")
    require(s["source_zip_sha256"]==ZIP_SHA and s["zip_bytes"]==9496674,"ZIP_HASH_AND_SIZE")
    require(s["zip_entries"]==len(s["members"])==7,"MEMBER_COUNT")
    require(sum(i["bytes"] for i in s["members"])==s["uncompressed_bytes"]==16068080,"MEMBER_SIZE")
    require(all(i["name"].startswith("k23愛知県.") and len(i["sha256"])==64 for i in s["members"]),"MEMBER_SHA_FORMAT")
    require(s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON" and
            s["metadata_creation_date"]=="2017-01-17","SOURCE_PROVENANCE")
    require(s["publisher_authentication"]=="NOT_VERIFIED" and s["redistribution_rights"]=="NOT_VERIFIED","LICENSE_UNVERIFIED")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"RAW_NOT_PUBLISHED")
    require(g["type"]=="POLYGON" and g["crs"]=="GCS_JGD_2000" and g["bounds_lon_lat"]==BBOX,"GEOMETRY")
    require(g["shape_count"]==2117 and g["municipality_name_count"]==64 and
            g["unique_jcodes"]==68 and g["administrative_code_name_pairs"]==174,"COUNTS")
    require(g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":2117},"SUBPREFECTURE")
    require(g["gun_counts"]==GUN and sum(GUN.values())==2117,"GUN_TOTAL")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["feature_counts_by_landuse"]==COUNTS and sum(COUNTS.values())==2117,"LANDUSE")
    require(m["soil_group_code_categories"]==17 and m["soil_fine_class_categories"]==89,"SOIL_CATEGORIES")
    require(m["soil_group_missing_features"]==0 and m["soil_detail_missing_features"]==0,"SOIL_MISSING")
    cp,gp=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==174 and len({(r[0],r[1]) for r in cp})==174,"JCODE_PAIR_COUNT")
    require(len(gp)==80 and len({(r[0],r[1]) for r in gp})==80,"GUN_PAIR_COUNT")
    require(all(len(r)==6 for r in cp+gp),"ROW_FORMAT")
    require(counts(cp)==counts(gp)==[COUNTS[k] for k in LANDUSE],"JOINT_LANDUSE_PARITY")
    cn,nc,gun_count,blanks=analyze_pairs(cp,gp)
    require(len(cn)==68 and len(nc)==64 and gun_count==GUN,"CODES_NAMES_GUN")
    a=m["source_code_name_anomalies"]
    foreign=[r for r in cp if not r[0].startswith("23")]
    require(foreign==a["foreign_prefecture_code_pairs"],"FOREIGN_PAIRS")
    require(len(foreign)==4 and sum(sum(r[2:]) for r in foreign)==17,"FOREIGN_COUNTS")
    require(a["foreign_prefecture_code_feature_count"]==17 and a["foreign_prefixes"]==["20","21","22"]
            and a["foreign_code_prefix_totals"]==FOREIGN,"FOREIGN_PREFIX")
    require({k:sorted(v) for k,v in cn.items() if len(v)>1}==a["codes_with_multiple_names"],"CODE_NAME_AMBIGUITY")
    require({k:sorted(v) for k,v in nc.items() if len(v)>1}==a["names_with_multiple_codes"],"NAME_CODE_AMBIGUITY")
    require(sum(len(v)>1 for v in cn.values())==44 and sum(len(v)>1 for v in nc.values())==45,"MAPPING_AMBIGUITY_TOTAL")
    require(a["one_to_one_code_name_mapping"] is False and
            a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_UNVERIFIED_CITY_JOIN")
    require(a["historical_place_names_as_source"]==["長久手町"] and
            a["historical_place_name_polygon_counts"]=={"長久手町":26},"HISTORIC_TOWN")
    require(sum(sum(r[2:]) for r in cp if r[1]=="長久手町")==26,"HISTORIC_TOWN_PARITY")
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN and q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==blanks,"MISSING_GUN_DETAIL")
    require(sum(r["empty_gun_polygon_count"] for r in blanks)==q["empty_gun_features_for_names_with_county_elsewhere"]==238,"MISSING_GUN_238")
    require(sum(r["empty_gun_polygon_count"] for r in blanks
                if r["municipality_name"].endswith(("町","村")))==q["empty_gun_features_in_town_village_names"]==148,"TOWN_GUN_NULLS")
    require(q["nonempty_gun_names_for_city"]==[{"gun":"下伊那郡","municipality_name":"豊田市",
            "landuse_counts":{"田":0,"普通畑":0,"牧草地":2,"樹園地":0},"polygons":2}],"FOREIGN_GUN_TWO")
    require(["下伊那郡","豊田市",0,0,2,0] in gp and q["multiple_nonempty_guns_per_municipality_name"]=={},"COUNTY_PAIR")
    require(q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN","NO_UNVERIFIED_GUN_JOIN")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_conflict_detected"] is True
            and sb["municipality_level_aggregations_pending_reconciliation"] is True,"JOIN_SAFETY")
    require(sb["calculation_of_certified_credits_prohibited"] is True and sb["official_credit_tco2e"] is None,"NO_CREDIT_INFERENCE")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_SHORT")
    n,head,rec_size=struct.unpack_from("<IHH",blob,4)
    require((n,head,rec_size)==(2117,353,1098) and head+n*rec_size<=len(blob),"DBF_HEADER")
    fields=[];pos=32
    while pos+32<=head and blob[pos]!=13:
        raw=blob[pos:pos+32];name=raw[:11].split(b"\0",1)[0].decode("cp932")
        require(raw[11]==ord("C"),"DBF_TEXT_FIELDS")
        fields.append((name,raw[16]));pos+=32
    require(pos<head and blob[pos]==13,"DBF_FIELD_TERMINATOR")
    require([f[0] for f in fields]==list(FIELDS),"DBF_EXPECTED_FIELDS")
    sizes={};offset=1
    for name,size in fields:
        sizes[name]=(offset,offset+size);offset+=size
    require(offset==rec_size,"DBF_RECORD_BYTES")
    land=Counter();cp=defaultdict(Counter);gp=defaultdict(Counter)
    cats=set();fine=set();gun=Counter();sicho=Counter()
    for i in range(n):
        row=blob[head+i*rec_size:head+(i+1)*rec_size]
        require(len(row)==rec_size and row[:1]==b" ","DBF_DELETED_RECORD")
        def field(name):
            a,b=sizes[name];return row[a:b].decode("cp932").strip(" \0\t")
        item={name:field(name) for name in FIELDS}
        category=item["地目区分"];code=item["JCODE"];name=item["SIKUCHOSON"];g=item["GUN"]
        require(category in LANDUSE and item["KEN_1"]=="愛知県" and
                len(code)==5 and code[:2] in ("20","21","22","23") and name,"DBF_ROW_INVALID")
        land[category]+=1;cp[(code,name)][category]+=1;gp[(g,name)][category]+=1
        cats.add(item["群コード"]);fine.add(item["包括_統群"])
        gun[g]+=1;sicho[item["SICHO"]]+=1
    asrows=lambda mapping:[[x,y,*[c[k] for k in LANDUSE]] for (x,y),c in sorted(mapping.items())]
    return land,asrows(cp),asrows(gp),len(cats),len(fine),dict(gun),dict(sicho)

def verify_zip(path,m):
    p=Path(path);s,g=m["source"],m["geometry"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ZIP_BYTES")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_SHA256")
    blobs={}
    with zipfile.ZipFile(p) as z:
        require(len(z.infolist())==7,"ZIP_ENTRIES")
        for inf,ref in zip(z.infolist(),s["members"]):
            filename=inf.filename if inf.flag_bits&0x800 else inf.filename.encode("cp437").decode("cp932")
            require(filename==s["member_folder"]+"/"+ref["name"],"ZIP_MEMBER_NAME")
            blob=z.read(inf)
            require(not inf.is_dir() and len(blob)==ref["bytes"] and
                    sha256(blob).hexdigest()==ref["sha256"],"ZIP_MEMBER_HASH")
            blobs[ref["name"].rsplit(".",1)[-1]]=blob
    shp,shx,dbf=blobs["shp"],blobs["shx"],blobs["dbf"]
    require(struct.unpack_from(">I",shp,0)[0]==9994 and
            struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_FILE_MAGIC_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_TYPE")
    require((len(shx)-100)//8==2117 and
            struct.unpack_from(">I",shx,24)[0]*2==len(shx),"SHX_LENGTH")
    require(all(abs(a-b)<1e-10 for a,b in
                zip(struct.unpack_from("<4d",shp,36),BBOX)),"SHP_BBOX")
    require("GCS_JGD_2000" in blobs["prj"].decode("ascii"),"PRJ_COORDINATES")
    require("<CreaDate>20170117</CreaDate>" in blobs["xml"].decode("utf-8"),"METADATA_DATE")
    land,cp,gp,cats,fine,gun,sicho=parse_dbf(dbf)
    require(dict(land)==m["feature_counts_by_landuse"],"FULL_LANDUSE_REPLAY")
    require(cp==m["jcode_name_pairs_counts_by_landuse"],"FULL_JCODE_REPLAY")
    require(gp==m["gun_name_pairs_counts_by_landuse"],"FULL_GUN_REPLAY")
    require(cats==17 and fine==89,"FULL_SOIL_REPLAY")
    require(gun==GUN and sicho=={"":2117},"FULL_GUN_SICHO")
    return {"status":"SOURCE_BYTES_DBF_ALL_2117_MATCH",
            "source_polygons":2117,"jcode_name_pairs":174,"gun_name_pairs":80,
            "raw_gis_committed":False}

def main(args):
    m=load()
    audit(m)
    if args==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED",
                "polygons":2117,"jcode_name_pairs":174,"gun_name_pairs":80,
                "raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        result=verify_zip(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p51-aichi-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as ex:
        print(str(ex),file=sys.stderr);sys.exit(1)
