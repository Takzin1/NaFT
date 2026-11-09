#!/usr/bin/env python3
"""NaFT P52: Mie farmland soil GIS audit and private original ZIP replay.

CI runs 'audit' on derived manifest only. 'verify ORIGINAL.zip' validates
source bytes, 7 member hashes, SHP/SHX geometry records and all 1,626 DBF
rows. Python standard library only. Raw geometry is never committed publicly.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / "research/p52-mie-soil-shapefile-source-v1.json"
LANDUSE = ("田", "普通畑", "牧草地", "樹園地")
FIELDS = ("地目区分", "包括_統群", "統群コード", "亜群コード", "群コード",
          "JCODE", "KEN_1", "SICHO", "GUN", "SIKUCHOSON")
GUN = {"":1104, "三重郡":61, "北牟婁郡":29, "南牟婁郡":79,
       "員弁郡":21, "多気郡":159, "度会郡":161, "桑名郡":12}
CATEGORY = {"田":669, "普通畑":509, "牧草地":36, "樹園地":412}
ZIP_SHA = "d5664f056820a9957a7dadfca398d927f82e694532ad5965a8ad812337523ce1"
BBOX = [135.85774174419456,33.724702511083706,136.92376760129673,35.236689212016046]
MULTI_GUN = {"大紀町":["多気郡","度会郡"],"度会町":["多気郡","度会郡"],
             "玉城町":["多気郡","度会郡"]}
SOIL_NULL = [{"record_number_1based":413,"jcode":"24210","municipality_name":"亀山市",
             "landuse":"田","missing_fields":["包括_統群","統群コード","亜群コード","群コード"]}]

def require(ok, reason):
    if not ok:
        raise ValueError("P52_MIE_SOURCE_BLOCKED:"+reason)

def load():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def counts(pairs):
    return [sum(r[i+2] for r in pairs) for i in range(4)]

def analyze(cp,gp):
    code_names,name_codes=defaultdict(set),defaultdict(set)
    for code,name,*v in cp:
        require(len(code)==5 and code.isdigit() and code[:2] in ("21","23","24") and
                name and all(type(n) is int and n>=0 for n in v), "CODE_ROW_FORMAT")
        code_names[code].add(name)
        name_codes[name].add(code)
    named=defaultdict(set)
    gcount=Counter()
    for gun,name,*v in gp:
        require(name and all(type(n) is int and n>=0 for n in v),"GUN_ROW_FORMAT")
        gcount[gun]+=sum(v)
        if gun:
            named[name].add(gun)
    nulls=[{"municipality_name":name,
            "empty_gun_landuse_counts":dict(zip(LANDUSE,values)),
            "empty_gun_polygon_count":sum(values),
            "gun_names_seen_elsewhere":sorted(named[name])}
           for gun,name,*values in gp if not gun and name in named]
    multiple={name:sorted(gs) for name,gs in sorted(named.items()) if len(gs)>1}
    return code_names,name_codes,dict(gcount),nulls,multiple

def audit(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p52-mie-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="三重県.zip" and s["member_folder"]=="k24三重県","SOURCE_NAME")
    require(s["source_zip_sha256"]==ZIP_SHA and s["zip_bytes"]==7025476,"ZIP_SOURCE")
    require(s["zip_entries"]==len(s["members"])==7,"ZIP_COUNT")
    require(sum(f["bytes"] for f in s["members"])==s["uncompressed_bytes"]==11810962,"MEMBER_BYTES")
    require(all(f["name"].startswith("k24三重県.") and len(f["sha256"])==64
                for f in s["members"]),"MEMBER_SHA_FORMAT")
    require(s["metadata_creation_date"]=="2017-01-17" and
            s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","SOURCE_PROVENANCE")
    require(s["publisher_authentication"]=="NOT_VERIFIED" and
            s["redistribution_rights"]=="NOT_VERIFIED","LICENSE_PENDING")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"RAW_NOT_PUBLISHED")
    require(g["type"]=="POLYGON" and g["crs"]=="GCS_JGD_2000" and
            g["bounds_lon_lat"]==BBOX,"GEO_TYPE_CRS_BOUNDS")
    require(g["shape_count"]==1626 and g["municipality_name_count"]==29 and
            g["unique_jcodes"]==31 and g["administrative_code_name_pairs"]==58,"GEO_COUNT")
    require(g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":1626},"SICHO")
    require(g["gun_counts"]==GUN and sum(GUN.values())==1626,"GUN_TOTALS")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["feature_counts_by_landuse"]==CATEGORY and sum(CATEGORY.values())==1626,"LANDUSE")
    require(m["soil_group_code_categories"]==18 and
            m["soil_fine_class_categories"]==99,"SOIL_CLASSES")
    require(m["soil_group_missing_features"]==1 and
            m["soil_detail_missing_features"]==1 and
            m["soil_missing_record_examples"]==SOIL_NULL,"SOIL_NULL_SOURCE")
    cp,gp=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==58 and len({(r[0],r[1]) for r in cp})==58,"JCODE_PAIRS")
    require(len(gp)==41 and len({(r[0],r[1]) for r in gp})==41,"GUN_PAIRS")
    require(all(len(r)==6 for r in cp+gp),"PAIR_COLUMNS")
    require(counts(cp)==counts(gp)==[CATEGORY[k] for k in LANDUSE],"JOINED_LANDUSE_TOTALS")
    cn,nc,gcounts,nulls,multiple=analyze(cp,gp)
    require(len(cn)==31 and len(nc)==29 and gcounts==GUN,"CODE_NAME_GUN_COUNTS")
    a=m["source_code_name_anomalies"]
    foreign=[r for r in cp if not r[0].startswith("24")]
    require(foreign==a["foreign_prefecture_code_pairs"] and foreign==[
        ["21221","桑名市",3,0,0,3],["23235","木曽岬町",2,1,0,0]],"FOREIGN_SOURCE_ROWS")
    require(a["foreign_prefecture_code_feature_count"]==9 and
            a["foreign_prefixes"]==["21","23"] and
            a["foreign_code_prefix_totals"]=={"21":6,"23":3},"FOREIGN_DISTRIBUTION")
    require(a["one_to_one_code_name_mapping"] is False and
            a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_UNVERIFIED_CODE_JOIN")
    require({k:sorted(v) for k,v in cn.items() if len(v)>1}==a["codes_with_multiple_names"],"CODE_TO_MANY_NAMES")
    require({k:sorted(v) for k,v in nc.items() if len(v)>1}==a["names_with_multiple_codes"],"NAME_TO_MANY_CODES")
    require(sum(len(v)>1 for v in cn.values())==14 and
            sum(len(v)>1 for v in nc.values())==19,"CODE_NAME_AMBIGUITY")
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN and
            q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==nulls,"GUN_NULL_ROWS")
    require(sum(v["empty_gun_polygon_count"] for v in nulls)==
            q["empty_gun_features_for_names_with_county_elsewhere"]==80,"GUN_NULL_80")
    require(q["multiple_nonempty_guns_per_municipality_name"]==multiple==MULTI_GUN,"MULTIPLE_COUNTIES")
    require(q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN","NO_UNVERIFIED_GUN_JOIN")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and
            sb["gun_name_conflict_detected"] is True and
            sb["soil_classification_null_detected"] is True,"MATERIAL_CONFLICT_FLAGS")
    require(sb["municipality_level_aggregations_pending_reconciliation"] is True and
            sb["official_credit_tco2e"] is None and
            sb["calculation_of_certified_credits_prohibited"] is True,"NO_CREDIT_INFERENCE")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_TOO_SHORT")
    n,head,rec_len=struct.unpack_from("<IHH",blob,4)
    require((n,head,rec_len)==(1626,353,1098) and head+n*rec_len<=len(blob),"DBF_HEADER")
    columns=[];p=32
    while p+32<=head and blob[p]!=13:
        b=blob[p:p+32]
        require(b[11]==ord("C"),"DBF_NON_TEXT_FIELD")
        columns.append((b[:11].split(b"\0",1)[0].decode("cp932"),b[16]))
        p+=32
    require(p<head and blob[p]==13 and [f for f,_ in columns]==list(FIELDS),"DBF_COLUMNS")
    offsets={};at=1
    for name,size in columns:
        offsets[name]=(at,at+size)
        at+=size
    require(at==rec_len,"DBF_RECORD_LAYOUT")
    cp,gp=defaultdict(Counter),defaultdict(Counter)
    land=Counter();gun=Counter();sicho=Counter()
    group=set();fine=set();nullgroup=0;nulldetail=0;nulls=[]
    for idx in range(n):
        row=blob[head+idx*rec_len:head+(idx+1)*rec_len]
        require(len(row)==rec_len and row[:1]==b" ","DBF_RECORD_DELETED_OR_TRUNCATED")
        def field(key):
            a,b=offsets[key]
            return row[a:b].decode("cp932").strip(" \0\t")
        attrs={key:field(key) for key in FIELDS}
        cat=attrs["地目区分"];code=attrs["JCODE"];name=attrs["SIKUCHOSON"];g=attrs["GUN"]
        require(cat in LANDUSE and attrs["KEN_1"]=="三重県" and
                len(code)==5 and code[:2] in ("21","23","24") and name,"DBF_ROW")
        cp[(code,name)][cat]+=1
        gp[(g,name)][cat]+=1
        land[cat]+=1
        gun[g]+=1
        sicho[attrs["SICHO"]]+=1
        group.add(attrs["群コード"]);fine.add(attrs["包括_統群"])
        nullgroup+=not bool(attrs["群コード"])
        nulldetail+=not bool(attrs["包括_統群"])
        missing=[key for key in ("包括_統群","統群コード","亜群コード","群コード") if not attrs[key]]
        if missing:
            nulls.append({"record_number_1based":idx+1,"jcode":code,
                          "municipality_name":name,"landuse":cat,"missing_fields":missing})
    def aggregate(mapping):
        return [[code,name,*[x[k] for k in LANDUSE]] for (code,name),x in sorted(mapping.items())]
    return dict(land),aggregate(cp),aggregate(gp),dict(gun),dict(sicho),len(group),len(fine),nullgroup,nulldetail,nulls

def verify_zip(path,m):
    p=Path(path)
    s=m["source"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ZIP_FILE_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_FILE_HASH")
    blobs={}
    with zipfile.ZipFile(p) as z:
        require(len(z.infolist())==7,"ZIP_ENTRY_COUNT")
        for info,member in zip(z.infolist(),s["members"]):
            name=info.filename if info.flag_bits & 0x800 else info.filename.encode("cp437").decode("cp932")
            require(name==s["member_folder"]+"/"+member["name"],"ZIP_MEMBER_NAME")
            value=z.read(info)
            require(not info.is_dir() and len(value)==member["bytes"] and
                    sha256(value).hexdigest()==member["sha256"],"ZIP_MEMBER_SHA")
            blobs[member["name"].rsplit(".",1)[-1]]=value
    shp,shx,dbf=blobs["shp"],blobs["shx"],blobs["dbf"]
    require(struct.unpack_from(">I",shp,0)[0]==9994 and
            struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_MAGIC_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON")
    require((len(shx)-100)//8==1626 and struct.unpack_from(">I",shx,24)[0]*2==len(shx),"SHX_LENGTH")
    require(list(struct.unpack_from("<4d",shp,36))==BBOX,"SHP_BOUNDS")
    require("GCS_JGD_2000" in blobs["prj"].decode("ascii"),"PRJ_JGD2000")
    require("<CreaDate>20170117</CreaDate>" in blobs["xml"].decode("utf-8"),"XML_DATE")
    # Independently replay every polygon header and verify each .shx offset/length.
    off=100
    for i in range(1626):
        sz, words=struct.unpack_from(">II",shp,off)
        offset_words,index_words=struct.unpack_from(">II",shx,100+i*8)
        require(sz==i+1 and offset_words*2==off and words==index_words and
                off+8+words*2<=len(shp),"SHX_SHP_RECORD_ALIGNMENT")
        require(struct.unpack_from("<I",shp,off+8)[0] in (0,5),"SHP_RECORD_SHAPE_TYPE")
        off+=8+words*2
    require(off==len(shp),"SHP_RECORD_COUNT")
    land,cp,gp,gun,sicho,group,fine,nullgroup,nulldetail,nulls=parse_dbf(dbf)
    require(land==m["feature_counts_by_landuse"],"LANDUSE_REPLAY")
    require(cp==m["jcode_name_pairs_counts_by_landuse"],"JCODE_PAIR_REPLAY")
    require(gp==m["gun_name_pairs_counts_by_landuse"],"GUN_PAIR_REPLAY")
    require(gun==GUN and sicho=={"":1626},"COUNTY_SUBPREF_REPLAY")
    require((group,fine,nullgroup,nulldetail)==(18,99,1,1),"SOIL_CLASSES_REPLAY")
    require(nulls==SOIL_NULL,"SOIL_NULL_413_REPLAY")
    return {"status":"SOURCE_ZIP_AND_1626_FEATURES_MATCH",
            "polygons":1626,"jcode_name_pairs":58,"gun_name_pairs":41,"raw_geometry_committed":False}

def main(args):
    m=load()
    audit(m)
    if args==["audit"]:
        answer={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED",
                "polygons":1626,"jcode_name_pairs":58,"gun_name_pairs":41,
                "raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        answer=verify_zip(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p52-mie-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(answer,ensure_ascii=False))

if __name__=="__main__":
    try:
        main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
