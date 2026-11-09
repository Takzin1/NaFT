#!/usr/bin/env python3
"""P49 Gifu soil GIS source integrity replay; stdlib-only, original GIS never committed.
audit verifies the derived registry. verify PRIVATE_ORIGINAL.zip additionally checks all
original member hashes, SHP/SHX and every DBF attribute against the pinned registry.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/"research/p49-gifu-soil-shapefile-source-v1.json"
CATS=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード","JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
ZIP_SHA="aacfafa39e6864d1407d25e0190e33b8163d451e56dfaabf7b347797e5926edd"
LAND={"田":758,"普通畑":617,"牧草地":101,"樹園地":466}
GUN={"":1363,"不破郡":60,"加茂郡":232,"可児郡":16,"大野郡":18,"安八郡":52,"揖斐郡":116,"木曽郡":1,"本巣郡":10,"羽島郡":37,"養老郡":37}
BBOX=[136.34056869396517,35.14562257312633,137.59267149914808,36.460691180288364]
EMPTY_SOIL={"jcode":"21211","municipality_name":"美濃加茂市","gun":"","landuse":"田","group_code":"","fine_class":"","subgroup_code":"","series_code":""}
FOREIGN_GUN={"jcode":"20423","municipality_name":"中津川市","gun":"木曽郡","landuse":"田"}

def require(ok,reason):
    if not ok:raise ValueError("P49_GIFU_SOURCE_BLOCKED:"+reason)

def load():
    return json.loads(REGISTER.read_text(encoding="utf8"))

def counts(pairs):
    return [sum(r[i+2] for r in pairs) for i in range(4)]

def audits(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p49-gifu-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="岐阜県.zip" and s["member_folder"]=="k22岐阜県","SOURCE_FILENAME")
    require(s["source_zip_sha256"]==ZIP_SHA and s["zip_bytes"]==7457793,"SOURCE_ARCHIVE")
    require(s["zip_entries"]==len(s["members"])==7,"ZIP_MEMBERS")
    require(sum(r["bytes"] for r in s["members"])==s["uncompressed_bytes"]==12889890,"SOURCE_MEMBER_BYTES")
    require(all(r["name"].startswith("k22岐阜県.") and len(r["sha256"])==64 for r in s["members"]),"SOURCE_MEMBER_SHA")
    require(s["metadata_creation_date"]=="2017-01-17" and s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","PROVENANCE")
    require(s["publisher_authentication"]==s["redistribution_rights"]=="NOT_VERIFIED","RIGHTS_NOT_ASSUMED")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"RAW_NOT_COMMITTED")
    require(g["type"]=="POLYGON" and g["crs"]=="GCS_JGD_2000" and g["bounds_lon_lat"]==BBOX,"GEOMETRY")
    require(g["shape_count"]==1942 and g["municipality_name_count"]==42 and g["unique_jcodes"]==45 and g["administrative_code_name_pairs"]==101,"GEO_COUNTS")
    require(g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":1942},"SICHO_EMPTY")
    require(g["gun_counts"]==GUN and sum(GUN.values())==1942,"GUN_COUNTS")
    require(m["fields"]==list(FIELDS) and m["soil_group_code_categories"]==17 and m["soil_fine_class_categories"]==80,"DBF_SCHEMA")
    require(m["feature_counts_by_landuse"]==LAND and sum(LAND.values())==1942,"LANDUSE")
    cp=m["jcode_name_pairs_counts_by_landuse"];gp=m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==101 and len({(r[0],r[1]) for r in cp})==101 and counts(cp)==[LAND[c] for c in CATS],"CODE_COUNTS")
    require(len(gp)==62 and len({(r[0],r[1]) for r in gp})==62 and counts(gp)==[LAND[c] for c in CATS],"GUN_PAIR_COUNTS")
    require(all(len(r)==6 and len(r[0])==5 and r[0].isdigit() and r[0][:2] in ("16","20","21") and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in cp),"CODE_FIELDS")
    require(all(len(r)==6 and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in gp),"GUN_PAIR_FIELDS")
    require({k:sum(sum(r[2:]) for r in gp if r[0]==k) for k in GUN}==GUN,"GUN_TOTAL_PARITY")
    cn,nc=defaultdict(set),defaultdict(set)
    for code,name,*_ in cp:cn[code].add(name);nc[name].add(code)
    require(len(cn)==45 and len(nc)==42,"CITY_NAME_COUNTS")
    a=m["source_code_name_anomalies"];foreign=[r for r in cp if not r[0].startswith("21")]
    require(foreign==a["foreign_prefecture_code_pairs"] and len(foreign)==3 and sum(sum(r[2:]) for r in foreign)==3,"FOREIGN_CODES")
    require(a["foreign_prefixes"]==["16","20"] and a["foreign_code_prefix_totals"]=={"16":2,"20":1} and a["foreign_prefecture_code_feature_count"]==3,"FOREIGN_DISTRIBUTION")
    require(a["one_to_one_code_name_mapping"] is False and a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","HOLD_CITY_JOIN")
    require({k:sorted(v) for k,v in cn.items() if len(v)>1}==a["codes_with_multiple_names"],"MANY_NAMES")
    require({k:sorted(v) for k,v in nc.items() if len(v)>1}==a["names_with_multiple_codes"],"MANY_CODES")
    require(sum(len(v)>1 for v in cn.values())==21 and sum(len(v)>1 for v in nc.values())==33,"MULTIPLE_AMBIGUITIES")

    q=m["source_gun_quality"];ng=defaultdict(set)
    for gun,name,*_ in gp:
        if gun:ng[name].add(gun)
    blank=[{"municipality_name":name,"empty_gun_landuse_counts":dict(zip(CATS,cat)),
            "empty_gun_polygon_count":sum(cat),"gun_names_seen_elsewhere":sorted(ng[name])}
           for gun,name,*cat in gp if not gun and name in ng]
    require(q["gun_feature_counts"]==GUN and q["foreign_prefecture_gun_name"]=="木曽郡","GUN_PROVENANCE")
    require(q["foreign_prefecture_gun_records"]==[FOREIGN_GUN] and ["木曽郡","中津川市",1,0,0,0] in gp,"FOREIGN_GUN")
    require(q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==blank and len(blank)==16,"GUN_NULL_PAIRS")
    require(q["empty_gun_features_for_known_gun_towns"]==sum(x["empty_gun_polygon_count"] for x in blank)==234,"GUN_NULL_COUNT")
    require(q["municipality_names_with_multiple_nonempty_guns"]=={k:sorted(v) for k,v in ng.items() if len(v)>1},"MULTIPLE_GUN")
    require(len(q["municipality_names_with_multiple_nonempty_guns"])==4 and q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN","GUN_HOLD")
    t=m["source_soil_taxonomy_quality"]
    require(t["missing_group_and_detail_feature_count"]==1 and t["missing_group_and_detail_feature_rows"]==[EMPTY_SOIL],"MISSING_SOIL_TAXONOMY")
    require(t["empty_group_code_is_counted_as_a_category"] is True and t["status"]=="UNRESOLVED_ORIGINAL_PRESERVED_DO_NOT_INFER_CLASS","SOIL_NOT_IMPUTED")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_conflict_detected"] is True and sb["soil_group_missingness_detected"] is True,"SCIENTIFIC_WARNINGS")
    require(sb["municipality_level_aggregations_pending_reconciliation"] is True and sb["official_credit_tco2e"] is None and sb["calculation_of_certified_credits_prohibited"] is True,"NO_CREDIT_OR_JOIN")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_SHORT")
    n,header,rec_len=struct.unpack_from("<IHH",blob,4)
    require((n,header,rec_len)==(1942,353,1098) and header+n*rec_len<=len(blob),"DBF_HEADER")
    fields=[];p=32
    while p+32<=header and blob[p]!=13:
        d=blob[p:p+32]
        require(d[11]==ord("C"),"DBF_FIELD_TYPE")
        fields.append((d[:11].split(b"\0",1)[0].decode("cp932"),d[16]));p+=32
    require(p<header and blob[p]==13 and [name for name,_ in fields]==list(FIELDS),"DBF_COLUMNS")
    offsets={};q=1
    for field,size in fields:offsets[field]=(q,q+size);q+=size
    require(q==rec_len,"DBF_ROW_WIDTH")
    raw=[]
    for i in range(n):
        row=blob[header+i*rec_len:header+(i+1)*rec_len]
        require(row[:1]==b" " and len(row)==rec_len,"DBF_DELETED_OR_TRUNCATED")
        def value(f):
            a,b=offsets[f]
            return row[a:b].decode("cp932").strip(" \0\t")
        raw.append({f:value(f) for f in FIELDS})
    return raw

def verify_original(path,m):
    p=Path(path);s=m["source"];g=m["geometry"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_HASH")
    chunks={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist()
        require(len(infos)==7,"ZIP_ENTRY_COUNT")
        for info,declared in zip(infos,s["members"]):
            decoded=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(decoded==s["member_folder"]+"/"+declared["name"] and not info.is_dir(),"ZIP_MEMBER_PATH")
            require(info.file_size==declared["bytes"],"ZIP_MEMBER_SIZE")
            b=z.read(info)
            require(sha256(b).hexdigest()==declared["sha256"],"ZIP_MEMBER_HASH")
            chunks[declared["name"]]=b
    shp,shx,dbf=(chunks["k22岐阜県."+ext] for ext in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994 and struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_HEADER")
    require(struct.unpack_from("<II",shp,28)==(1000,5) and (len(shx)-100)//8==1942,"SHP_SHX_POLYGON")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),BBOX)),"SHP_BBOX")
    require("GCS_JGD_2000" in chunks["k22岐阜県.prj"].decode("ascii") and "<CreaDate>20170117</CreaDate>" in chunks["k22岐阜県.shp.xml"].decode("utf8"),"SOURCE_METADATA")
    rows=parse_dbf(dbf)
    require(all(row["KEN_1"]=="岐阜県" and row["SICHO"]=="" and row["地目区分"] in CATS for row in rows),"PREFECTURE_LAND")
    land=Counter(row["地目区分"] for row in rows)
    require(dict(land)==LAND and len(rows)==1942,"DBF_LANDUSE")
    cp,gp=defaultdict(Counter),defaultdict(Counter)
    for row in rows:
        cp[(row["JCODE"],row["SIKUCHOSON"])][row["地目区分"]]+=1
        gp[(row["GUN"],row["SIKUCHOSON"])][row["地目区分"]]+=1
    codepairs=[[c,n,*[v[cat] for cat in CATS]] for (c,n),v in sorted(cp.items())]
    gunpairs=[[gun,n,*[v[cat] for cat in CATS]] for (gun,n),v in sorted(gp.items())]
    require(codepairs==m["jcode_name_pairs_counts_by_landuse"] and gunpairs==m["gun_name_pairs_counts_by_landuse"],"ORIGINAL_ATTRIBUTE_PAIR_REPLAY")
    require(len({row["群コード"] for row in rows})==17 and len({row["包括_統群"] for row in rows})==80,"ORIGINAL_SOIL_CLASSES")
    empty=[{"jcode":r["JCODE"],"municipality_name":r["SIKUCHOSON"],"gun":r["GUN"],"landuse":r["地目区分"],"group_code":r["群コード"],"fine_class":r["包括_統群"],"subgroup_code":r["亜群コード"],"series_code":r["統群コード"]} for r in rows if not r["群コード"] or not r["包括_統群"]]
    require(empty==[EMPTY_SOIL],"ORIGINAL_SOIL_MISSING")
    special=[{"jcode":r["JCODE"],"municipality_name":r["SIKUCHOSON"],"gun":r["GUN"],"landuse":r["地目区分"]} for r in rows if r["GUN"]=="木曽郡"]
    require(special==[FOREIGN_GUN],"ORIGINAL_GUN_ISSUE")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"岐阜県","polygons":1942,"jcode_name_pairs":101,"gun_name_pairs":62,"official_credit_tco2e":None}

def main(argv):
    m=load();audits(m)
    if argv==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":1942,"jcode_name_pairs":101,"gun_name_pairs":62,"raw_original_verified_in_ci":False}
    elif len(argv)==2 and argv[0]=="verify":
        result=verify_original(argv[1],m)
    else:raise ValueError("USAGE: python3 scripts/p49-gifu-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr);sys.exit(1)
