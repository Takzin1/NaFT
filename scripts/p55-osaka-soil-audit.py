#!/usr/bin/env python3
"""NaFT P55 Osaka soil GIS audit; stdlib only.

'audit' validates committed source metadata and derived data WITHOUT original ZIP.
'verify PRIVATE_ORIGINAL.zip' checks source bytes, shape geometry headers and every
one of the 764 CP932 DBF records against committed counts. Raw GIS stays private.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTRY=ROOT/"research/p55-osaka-soil-shapefile-source-v1.json"
LAND=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
LAND_COUNTS={"田":391,"普通畑":158,"牧草地":2,"樹園地":213}
GUN_COUNTS={"":630,"三島郡":5,"南河内郡":67,"泉北郡":5,"泉南郡":22,"豊能郡":35}
ZIP_HASH="1f75d80027ea0d1ea2718d00f0c8d5106694991733440544f3fd040155f8909d"
BBOX=[135.09810442287565,34.273691451029,135.74367044727964,35.042092491955]
BLANK_FIELDS=["包括_統群","統群コード","亜群コード","群コード"]
EXPECTED_MISSING=[
    {"record_index_zero_based":0,"JCODE":"27214","municipality_name":"千早赤阪村",
     "gun":"","landuse":"樹園地","missing_fields":BLANK_FIELDS},
    {"record_index_zero_based":1,"JCODE":"27214","municipality_name":"富田林市",
     "gun":"","landuse":"樹園地","missing_fields":BLANK_FIELDS},
]

def require(ok,why):
    if not ok:raise ValueError("P55_OSAKA_SOURCE_BLOCKED:"+why)

def load():
    return json.loads(REGISTRY.read_text(encoding="utf-8"))

def rowsum(rows):
    return [sum(r[2+i] for r in rows) for i in range(4)]

def analyze(cp,gp):
    code_names,name_codes=defaultdict(set),defaultdict(set)
    for code,name,*x in cp:
        require(len(code)==5 and code.isdigit() and code[:2] in ("26","27")
                and bool(name) and all(type(v) is int and v>=0 for v in x),"JCODE_FORMAT")
        code_names[code].add(name);name_codes[name].add(code)
    county_names=defaultdict(set);county_totals=Counter()
    for county,name,*x in gp:
        require(bool(name) and all(type(v) is int and v>=0 for v in x),"GUN_FORMAT")
        county_totals[county]+=sum(x)
        if county:county_names[name].add(county)
    missing=[{"municipality_name":name,
              "empty_gun_landuse_counts":dict(zip(LAND,x)),
              "empty_gun_polygon_count":sum(x),
              "gun_names_seen_elsewhere":sorted(county_names[name])}
             for county,name,*x in gp if not county and name in county_names]
    multi_gun={n:sorted(v) for n,v in sorted(county_names.items()) if len(v)>1}
    return code_names,name_codes,dict(county_totals),missing,multi_gun

def audit(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p55-osaka-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="大阪府.zip" and s["member_folder"]=="k27大阪府","SOURCE_NAME")
    require(s["source_zip_sha256"]==ZIP_HASH and s["zip_bytes"]==1989097,"SOURCE_HASH_AND_SIZE")
    require(s["zip_entries"]==len(s["members"])==7,"ZIP_ENTRIES")
    require(sum(v["bytes"] for v in s["members"])==s["uncompressed_bytes"]==3780922,"ZIP_MEMBERS_BYTES")
    require([x["name"] for x in s["members"]]==["k27大阪府."+x for x in ("dbf","prj","sbn","sbx","shp","shp.xml","shx")],"MEMBER_NAMES")
    require(all(len(x["sha256"])==64 and all(c in "0123456789abcdef" for c in x["sha256"]) for x in s["members"]),"MEMBER_HASH_FORMAT")
    require(s["metadata_creation_date"]=="2017-01-17" and
            s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","PROVENANCE")
    require(s["redistribution_rights"]==s["publisher_authentication"]=="NOT_VERIFIED","RIGHTS")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"NO_PUBLIC_RAW")
    require(g["type"]=="POLYGON" and g["shape_count"]==764 and g["crs"]=="GCS_JGD_2000" and g["bounds_lon_lat"]==BBOX,"SHAPE")
    require(g["unique_jcodes"]==57 and g["municipality_name_count"]==54 and g["administrative_code_name_pairs"]==129,"CODE_NAME_TOTAL")
    require(g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":764},"SICHO")
    require(g["gun_counts"]==GUN_COUNTS and sum(GUN_COUNTS.values())==764,"COUNTY_TOTAL")
    require(m["fields"]==list(FIELDS),"DBF_SCHEMA")
    require(m["feature_counts_by_landuse"]==LAND_COUNTS and sum(LAND_COUNTS.values())==764,"LANDUSE_TOTAL")
    require(m["soil_group_code_categories"]==12 and m["soil_fine_class_categories"]==43,"SOIL_CLASSES")
    require(m["soil_group_missing_features"]==m["soil_detail_missing_features"]==2,"SOIL_MISSING_TOTAL")
    require(m["soil_class_missing_records"]==EXPECTED_MISSING,"SOIL_MISSING_ROWS")
    cp,gp=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==129 and len(set((r[0],r[1]) for r in cp))==129,"JCODE_PAIR_SIZE")
    require(len(gp)==63 and len(set((r[0],r[1]) for r in gp))==63,"GUN_PAIR_SIZE")
    require(all(len(r)==6 for r in cp+gp),"PAIR_LENGTH")
    require(rowsum(cp)==rowsum(gp)==[LAND_COUNTS[x] for x in LAND],"JOINT_LANDUSE")
    cn,nc,gun_totals,missing,multiple_gun=analyze(cp,gp)
    require(len(cn)==57 and len(nc)==54 and gun_totals==GUN_COUNTS,"ATTR_PARITY")
    a=m["source_code_name_anomalies"]
    foreign=[x for x in cp if x[0][:2]!="27"]
    require(foreign==a["foreign_prefecture_code_pairs"] and len(foreign)==5,"FOREIGN_PAIRS")
    require(sum(sum(r[2:]) for r in foreign)==a["foreign_prefecture_code_feature_count"]==7,"FOREIGN_FEATURES")
    require(a["foreign_code_prefix_totals"]=={"26":7} and a["foreign_prefixes"]==["26"],"FOREIGN_PREFIX")
    require(a["codes_with_multiple_names"]=={k:sorted(v) for k,v in cn.items() if len(v)>1},"CODE_MULTI_NAMES")
    require(a["names_with_multiple_codes"]=={k:sorted(v) for k,v in nc.items() if len(v)>1},"NAME_MULTI_CODES")
    require(sum(len(v)>1 for v in cn.values())==31 and sum(len(v)>1 for v in nc.values())==41,"MULTI_MAPPING_TOTAL")
    require(a["one_to_one_code_name_mapping"] is False and
            a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","CODE_NOT_CORRECTED")
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN_COUNTS and
            q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==missing,"GUN_MISSING_DETAIL")
    require(sum(r["empty_gun_polygon_count"] for r in missing)==q["empty_gun_features_for_known_gun_towns"]==46,"GUN_MISSING_46")
    require(multiple_gun==q["multiple_nonempty_guns_per_municipality_name"]=={},"NO_COUNTY_MULTI")
    require(q["status"]=="SOURCE_NULL_PRESERVED_GUN_COMPLETENESS_PENDING","NO_COUNTY_FILL")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and
            sb["gun_name_missingness_detected"] is True and
            sb["soil_class_missingness_detected"] is True,"ANOMALY_GUARDS")
    require(sb["municipality_level_aggregations_pending_reconciliation"] is True and
            sb["official_credit_tco2e"] is None and
            sb["calculation_of_certified_credits_prohibited"] is True,"NO_CREDIT_GUARD")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_SHORT")
    count,header,record_bytes=struct.unpack_from("<IHH",blob,4)
    require((count,header,record_bytes)==(764,353,1098) and
            header+count*record_bytes<=len(blob),"DBF_HEADER")
    columns=[];pos=32
    while pos+32<=header and blob[pos]!=13:
        f=blob[pos:pos+32]
        require(f[11]==ord("C"),"DBF_FIELD_FORMAT")
        columns.append((f[:11].split(b"\x00",1)[0].decode("cp932"),f[16]))
        pos+=32
    require(pos<header and blob[pos]==13 and [x[0] for x in columns]==list(FIELDS),"DBF_FIELDS")
    offsets={};off=1
    for col,sz in columns:offsets[col]=(off,off+sz);off+=sz
    require(off==record_bytes,"DBF_RECORD_LENGTH")
    land=Counter();cp=defaultdict(Counter);gp=defaultdict(Counter)
    groups=set();fines=set();gunc=Counter();sicho=Counter();blank=[]
    for i in range(count):
        data=blob[header+i*record_bytes:header+(i+1)*record_bytes]
        require(len(data)==record_bytes and data[:1]==b" ","DBF_ROW_STATUS")
        def val(k):
            a,b=offsets[k];return data[a:b].decode("cp932").strip(" \x00\t")
        r={key:val(key) for key in FIELDS}
        code,name,county,cat=r["JCODE"],r["SIKUCHOSON"],r["GUN"],r["地目区分"]
        require(cat in LAND and r["KEN_1"]=="大阪府" and name and
                code[:2] in ("26","27") and len(code)==5,"DBF_RECORD_VALUE")
        land[cat]+=1;cp[(code,name)][cat]+=1;gp[(county,name)][cat]+=1
        groups.add(r["群コード"]);fines.add(r["包括_統群"])
        gunc[county]+=1;sicho[r["SICHO"]]+=1
        miss=[k for k in BLANK_FIELDS if not r[k]]
        if miss:blank.append({"record_index_zero_based":i,"JCODE":code,
            "municipality_name":name,"gun":county,"landuse":cat,"missing_fields":miss})
    to_rows=lambda x:[[code,name,*[v[k] for k in LAND]] for (code,name),v in sorted(x.items())]
    return dict(land),to_rows(cp),to_rows(gp),groups,fines,dict(gunc),dict(sicho),blank

def verify(path,m):
    p=Path(path);s=m["source"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_HASH")
    blobs={}
    with zipfile.ZipFile(p) as z:
        require(len(z.infolist())==7,"ZIP_SEVEN_MEMBERS")
        for info,ref in zip(z.infolist(),s["members"]):
            filename=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(filename==s["member_folder"]+"/"+ref["name"],"MEMBER_PATH")
            blob=z.read(info)
            require(not info.is_dir() and len(blob)==ref["bytes"] and
                    sha256(blob).hexdigest()==ref["sha256"],"MEMBER_CHECKSUM")
            blobs[ref["name"].rsplit(".",1)[-1]]=blob
    shp,shx=blobs["shp"],blobs["shx"]
    require(struct.unpack_from(">I",shp,0)[0]==9994 and
            struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_HEADER")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON")
    require(struct.unpack_from(">I",shx,24)[0]*2==len(shx) and (len(shx)-100)//8==764,"SHX_RECORD_COUNT")
    require(list(struct.unpack_from("<4d",shp,36))==BBOX,"SHAPE_BOUNDS")
    require("GCS_JGD_2000" in blobs["prj"].decode("ascii"),"PRJ_JGD2000")
    require("<CreaDate>20170117</CreaDate>" in blobs["xml"].decode("utf-8"),"XML_DATE")
    land,cp,gp,groups,fines,gun,sicho,missing=parse_dbf(blobs["dbf"])
    require(land==LAND_COUNTS,"SOURCE_LANDUSE_REPLAY")
    require(cp==m["jcode_name_pairs_counts_by_landuse"],"SOURCE_CODE_REPLAY")
    require(gp==m["gun_name_pairs_counts_by_landuse"],"SOURCE_GUN_REPLAY")
    require(len(groups)==12 and len(fines)==43,"SOURCE_SOIL_CLASS_REPLAY")
    require(gun==GUN_COUNTS and sicho=={"":764},"SOURCE_ADMIN_REPLAY")
    require(missing==EXPECTED_MISSING,"SOURCE_MISSING_RECORD_REPLAY")
    return {"status":"SOURCE_BYTES_DBF_ALL_764_MATCH","polygons":764,
            "jcode_name_pairs":129,"gun_name_pairs":63,"raw_gis_committed":False}

def main(args):
    m=load();audit(m)
    if args==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":764,
                "jcode_name_pairs":129,"gun_name_pairs":63,"raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        result=verify(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p55-osaka-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try: main(sys.argv[1:])
    except Exception as ex:
        print(str(ex),file=sys.stderr);sys.exit(1)
