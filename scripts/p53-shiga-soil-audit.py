#!/usr/bin/env python3
"""NaFT P53 Shiga original soil polygon audit.

CI 'audit' checks registered source fingerprints and derived counts only.
'verify PRIVATE_ORIGINAL.zip' independently replays all original bytes,
DBF 785 records, SHP/SHX headers and source-preserved groupings.
Python stdlib only; never commit raw Shapefile/DBF without verified rights.
"""
from pathlib import Path
from collections import Counter, defaultdict
from hashlib import sha256
import json, sys, zipfile, struct

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/"research/p53-shiga-soil-shapefile-source-v1.json"
LANDUSE=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
COUNTS={"田":410,"普通畑":257,"牧草地":9,"樹園地":109}
GUN={"":662,"不破郡":1,"愛知郡":25,"犬上郡":41,"蒲生郡":56}
FOREIGN={"21":1,"24":4}
ZIP_SHA="3fef4ebc36d2856543a0034f05815fb1961e37b9ad1a160883d2ad22a0229a19"
BBOX=[135.7872572992245,34.79754192350782,136.43336700581398,35.671852353859066]
MEMBER_SHA=[
"f487359629c466947f2da20032a23966bf8bac07da409f177cf67925a575073a",
"d1de156bb748892db7642d045767629921ea76cc06597e25cea2411b12e7b0b2",
"9e8776d11a2b493126e601ebeeb33bc9a287f89110c64e0d2362e62218d9887d",
"eef9ffad7ef890e31f73adcf9d6a731d413e7095fc0803405e9734cd0f75a926",
"ae35bf29c389635ab18304abdbb3bce274731c5f447413d07aabed9c2777784a",
"f24f39da19ee5bfead68fe7d663c08af7ea6d196ad9605aefe570ba23ec87f64",
"9ed2a03c3dbf0713b43ebe51331c86331faddc29201dca43786818bb0367e0a9"
]
MEMBER_BYTES=[862284,145,7948,668,6916496,105663,6380]

def require(ok,why):
    if not ok:raise ValueError("P53_SHIGA_SOURCE_BLOCKED:"+why)

def load():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def land_counts(pairs):
    return [sum(row[2+i] for row in pairs) for i in range(4)]

def summarize(cp,gp):
    codes,names=defaultdict(set),defaultdict(set)
    for code,name,*counts in cp:
        require(len(code)==5 and code.isdigit() and code[:2] in ("21","24","25")
                and name and len(counts)==4 and all(type(v) is int and v>=0 for v in counts),"CODE_RECORD")
        codes[code].add(name);names[name].add(code)
    gun_names=defaultdict(set);gcounts=Counter()
    for gun,name,*counts in gp:
        require(name and len(counts)==4 and all(type(v) is int and v>=0 for v in counts),"GUN_RECORD")
        if gun:gun_names[name].add(gun)
        gcounts[gun]+=sum(counts)
    blank=[{"municipality_name":name,
            "empty_gun_landuse_counts":dict(zip(LANDUSE,counts)),
            "empty_gun_polygon_count":sum(counts),
            "gun_names_seen_elsewhere":sorted(gun_names[name])}
           for gun,name,*counts in gp if not gun and name in gun_names]
    multi={name:sorted(s) for name,s in sorted(gun_names.items()) if len(s)>1}
    return codes,names,dict(gcounts),blank,multi

def audit(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p53-shiga-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="滋賀県.zip" and s["member_folder"]=="k25滋賀県","SOURCE_NAME")
    require(s["source_zip_sha256"]==ZIP_SHA and s["zip_bytes"]==4887387,"ZIP_HASH_SIZE")
    require(s["zip_entries"]==len(s["members"])==len(MEMBER_SHA)==7,"SOURCE_MEMBERS")
    require([i["bytes"] for i in s["members"]]==MEMBER_BYTES and s["uncompressed_bytes"]==7899584,"MEMBER_SIZES")
    require([i["sha256"] for i in s["members"]]==MEMBER_SHA,"MEMBER_HASHES")
    require([i["name"] for i in s["members"]]==[
        "k25滋賀県."+x for x in ("dbf","prj","sbn","sbx","shp","shp.xml","shx")],"MEMBER_NAMES")
    require(s["metadata_creation_date"]=="2017-01-17" and
            s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","SOURCE_PROVENANCE")
    require(s["redistribution_rights"]==s["publisher_authentication"]=="NOT_VERIFIED","RIGHTS_PENDING")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"NO_PUBLIC_RAW_GIS")
    require(g["type"]=="POLYGON" and g["crs"]=="GCS_JGD_2000" and g["bounds_lon_lat"]==BBOX,"SOURCE_GEOMETRY")
    require(g["shape_count"]==785 and g["municipality_name_count"]==19 and
            g["unique_jcodes"]==22 and g["administrative_code_name_pairs"]==51,"GEOMETRY_FEATURE_COUNTS")
    require(g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":785},"SICHO")
    require(g["gun_counts"]==GUN and sum(GUN.values())==785,"SOURCE_GUN")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["feature_counts_by_landuse"]==COUNTS and sum(COUNTS.values())==785,"LANDUSE_TOTALS")
    require(m["soil_group_code_categories"]==16 and m["soil_fine_class_categories"]==64,"SOIL_CLASSES")
    require(m["soil_column_missing_features"]==dict.fromkeys(("包括_統群","統群コード","亜群コード","群コード"),0),"SOIL_MISSING")
    cp,gp=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==len({(r[0],r[1]) for r in cp})==51,"JCODE_PAIR_COUNT")
    require(len(gp)==len({(r[0],r[1]) for r in gp})==27,"GUN_PAIR_COUNT")
    require(land_counts(cp)==land_counts(gp)==[COUNTS[k] for k in LANDUSE],"PAIR_LANDUSE_PARITY")
    codes,names,gun_counts,blank,multi=summarize(cp,gp)
    require(len(codes)==22 and len(names)==19 and gun_counts==GUN,"CODE_NAME_GUN_TOTALS")
    a=m["source_code_name_anomalies"]
    foreign=[r for r in cp if not r[0].startswith("25")]
    require(foreign==a["foreign_prefecture_code_pairs"] and
            foreign==[["21362","米原市",0,0,0,1],["24210","甲賀市",0,0,0,1],["24216","甲賀市",3,0,0,0]],"FOREIGN_PAIRS")
    require(a["foreign_prefecture_code_feature_count"]==sum(sum(r[2:]) for r in foreign)==5,"FOREIGN_COUNT")
    require(a["foreign_prefixes"]==["21","24"] and a["foreign_code_prefix_totals"]==FOREIGN,"FOREIGN_PREFIXES")
    require(a["one_to_one_code_name_mapping"] is False and a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","JOIN_HELD")
    require({k:sorted(v) for k,v in codes.items() if len(v)>1}==a["codes_with_multiple_names"],"MULTIPLE_NAMES")
    require({k:sorted(v) for k,v in names.items() if len(v)>1}==a["names_with_multiple_codes"],"MULTIPLE_CODES")
    require(sum(len(v)>1 for v in codes.values())==14 and sum(len(v)>1 for v in names.values())==15,"MULTIPLE_MAPPING_COUNTS")
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN and q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==blank,"GUN_MISSING_DETAILS")
    require(sum(r["empty_gun_polygon_count"] for r in blank)==94 and
            q["empty_gun_features_for_names_with_county_elsewhere"]==94,"GUN_94")
    require(q["empty_gun_features_in_town_village_names"]==sum(r["empty_gun_polygon_count"] for r in blank if r["municipality_name"].endswith(("町","村")))==38,"GUN_TOWN_38")
    require(q["city_name_empty_gun_features_with_county_elsewhere"]==56,"GUN_CITY_56")
    require(multi==q["municipality_names_with_multiple_nonempty_guns"]=={"豊郷町":["愛知郡","犬上郡"]},"TOYOSATO_MULTIPLE_GUN")
    foreign_gun=[{"gun":gun,"municipality_name":name,
                  "landuse_counts":dict(zip(LANDUSE,values)),
                  "polygon_count":sum(values)}
                 for gun,name,*values in gp if gun=="不破郡"]
    require(q["non_shiga_gun_pairs"]==foreign_gun==[
            {"gun":"不破郡","municipality_name":"米原市",
             "landuse_counts":{"田":0,"普通畑":0,"牧草地":0,"樹園地":1},
             "polygon_count":1}],"FOREIGN_GUN")
    require(q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN","GUN_JOIN_HELD")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_conflict_detected"] is True
            and sb["municipality_level_aggregations_pending_reconciliation"] is True,"JOIN_POLICY")
    require(sb["official_credit_tco2e"] is None and
            sb["calculation_of_certified_credits_prohibited"] is True,"CREDIT_PROTECTION")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_TOO_SHORT")
    n,header,rec_len=struct.unpack_from("<IHH",blob,4)
    require((n,header,rec_len)==(785,353,1098) and len(blob)>=header+n*rec_len,"DBF_HEADER")
    fields=[];off=32
    while off+32<=header and blob[off]!=13:
        f=blob[off:off+32]
        require(f[11]==ord("C"),"DBF_FIELD_TYPE")
        fields.append((f[:11].split(b"\0",1)[0].decode("cp932"),f[16]))
        off+=32
    require(blob[off]==13 and [f[0] for f in fields]==list(FIELDS),"DBF_COLUMN_NAMES")
    pos=1;indices={}
    for name,width in fields:
        indices[name]=(pos,pos+width);pos+=width
    require(pos==rec_len,"DBF_ROW_BYTES")
    l=Counter();cp=defaultdict(Counter);gp=defaultdict(Counter);gun=Counter();sicho=Counter()
    classes=set();groups=set();missing=Counter()
    for i in range(n):
        row=blob[header+i*rec_len:header+(i+1)*rec_len]
        require(len(row)==rec_len and row[:1]==b" ","DBF_DELETED_RECORD")
        def val(k):
            a,b=indices[k];return row[a:b].decode("cp932").strip(" \0\t")
        x={k:val(k) for k in FIELDS}
        require(x["地目区分"] in LANDUSE and x["KEN_1"]=="滋賀県" and
                len(x["JCODE"])==5 and x["SIKUCHOSON"],"DBF_INVALID_ROW")
        kind=x["地目区分"];l[kind]+=1
        cp[(x["JCODE"],x["SIKUCHOSON"])][kind]+=1
        gp[(x["GUN"],x["SIKUCHOSON"])][kind]+=1
        gun[x["GUN"]]+=1;sicho[x["SICHO"]]+=1
        groups.add(x["群コード"]);classes.add(x["包括_統群"])
        for k in ("包括_統群","統群コード","亜群コード","群コード"):
            if not x[k]:missing[k]+=1
    grouped=lambda data:[[key[0],key[1],*[v[k] for k in LANDUSE]] for key,v in sorted(data.items())]
    return dict(l),grouped(cp),grouped(gp),dict(gun),dict(sicho),len(groups),len(classes),dict(missing)

def verify(path,m):
    p=Path(path)
    require(p.is_file() and p.stat().st_size==4887387,"ZIP_BYTES")
    require(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,"ZIP_SHA256")
    blobs={}
    with zipfile.ZipFile(p) as z:
        require(len(z.infolist())==7,"ZIP_MEMBERS")
        for entry,expected in zip(z.infolist(),m["source"]["members"]):
            name=(entry.filename if entry.flag_bits & 0x800 else entry.filename.encode("cp437").decode("cp932"))
            require(name=="k25滋賀県/"+expected["name"] and not entry.is_dir(),"ZIP_MEMBER_NAME")
            blob=z.read(entry)
            require(len(blob)==expected["bytes"] and sha256(blob).hexdigest()==expected["sha256"],"ZIP_MEMBER_SHA")
            blobs[expected["name"].rsplit(".",1)[-1]]=blob
    shp,shx,dbf=blobs["shp"],blobs["shx"],blobs["dbf"]
    require(struct.unpack_from(">I",shp,0)[0]==9994 and struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_HEADER_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON_TYPE")
    require((len(shx)-100)//8==785 and struct.unpack_from(">I",shx,24)[0]*2==len(shx),"SHX_COUNT")
    require(all(abs(a-b)<1e-10 for a,b in zip(struct.unpack_from("<4d",shp,36),BBOX)),"SHP_BOUNDS")
    require("GCS_JGD_2000" in blobs["prj"].decode("ascii"),"COORDINATE_SYSTEM")
    require(b"<CreaDate>20170117</CreaDate>" in blobs["xml"],"XML_METADATA_DATE")
    l,cp,gp,gun,sicho,groups,classes,missing=parse_dbf(dbf)
    require(l==COUNTS and cp==m["jcode_name_pairs_counts_by_landuse"],"RAW_CODE_RECORD_PARITY")
    require(gp==m["gun_name_pairs_counts_by_landuse"] and gun==GUN and sicho=={"":785},"RAW_GUN_RECORD_PARITY")
    require(groups==16 and classes==64 and missing=={},"RAW_SOIL_GROUPS")
    return {"status":"SOURCE_BYTES_DBF_ALL_785_MATCH","source_polygons":785,
            "jcode_name_pairs":51,"gun_name_pairs":27,"raw_gis_committed":False}

def main(args):
    m=load();audit(m)
    if args==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":785,
                "jcode_name_pairs":51,"gun_name_pairs":27,
                "raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        result=verify(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p53-shiga-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
