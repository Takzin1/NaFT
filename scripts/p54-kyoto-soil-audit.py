#!/usr/bin/env python3
"""NaFT P54 Kyoto agricultural-soil Shapefile audit (stdlib only).

'audit' validates committed source metadata and derived aggregations (no private ZIP).
'verify ORIGINAL.zip' independently replays original ZIP member hashes, SHP/SHX
headers and all 969 CP932 DBF records. Raw GIS is not published to GitHub.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/"research/p54-kyoto-soil-shapefile-source-v1.json"
LAND=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
LANDCOUNTS={"田":452,"普通畑":279,"牧草地":11,"樹園地":227}
GUN={"":742,"与謝郡":46,"久世郡":12,"乙訓郡":5,"大飯郡":1,"相楽郡":64,"綴喜郡":41,"船井郡":58}
FOREIGN={"18":1,"24":2,"25":7}
SHA="f5440640ef355f37e6bd4ee67f2039521407f252398fdfdabcb3b5fbf221bf9a"
BOUNDS=[134.8673268777947,34.70883381293244,136.04693401420027,35.7663518420321]
MISSING={"record_index_zero_based":227,"JCODE":"26407","municipality_name":"京丹波町",
         "gun":"船井郡","landuse":"田",
         "missing_fields":["包括_統群","統群コード","亜群コード","群コード"]}

def require(ok, code):
    if not ok:
        raise ValueError("P54_KYOTO_SOURCE_BLOCKED:"+code)

def load():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def summed(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]

def check_derived(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p54-kyoto-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="京都府.zip" and s["member_folder"]=="k26京都府","SOURCE_ID")
    require(s["source_zip_sha256"]==SHA and s["zip_bytes"]==3960656,"SOURCE_SHA_SIZE")
    require(s["zip_entries"]==len(s["members"])==7,"SOURCE_MEMBERS")
    require(sum(x["bytes"] for x in s["members"])==s["uncompressed_bytes"]==6770512,"MEMBER_BYTE_TOTAL")
    require([x["name"] for x in s["members"]]==["k26京都府."+x for x in ("dbf","prj","sbn","sbx","shp","shp.xml","shx")],"MEMBER_NAMES")
    require(all(len(x["sha256"])==64 and all(c in "0123456789abcdef" for c in x["sha256"]) for x in s["members"]),"MEMBER_SHA")
    require(s["metadata_creation_date"]=="2017-01-17" and
            s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","SOURCE_METADATA")
    require(s["publisher_authentication"]==s["redistribution_rights"]=="NOT_VERIFIED","RIGHTS_UNVERIFIED")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"NO_SOURCE_REPUBLICATION")
    require(g["type"]=="POLYGON" and g["shape_count"]==969 and g["crs"]=="GCS_JGD_2000"
            and g["bounds_lon_lat"]==BOUNDS,"GEOMETRY")
    require(g["municipality_name_count"]==33 and g["unique_jcodes"]==37 and
            g["administrative_code_name_pairs"]==75,"ADMIN_COUNTS")
    require(g["sicho_counts"]=={"":969} and g["sicho_unique_values"]==[""],"SUBPREFECTURE")
    require(g["gun_counts"]==GUN and sum(GUN.values())==969,"GUN_FEATURE_COUNTS")
    require(m["fields"]==list(FIELDS),"FIELDS")
    require(m["feature_counts_by_landuse"]==LANDCOUNTS and sum(LANDCOUNTS.values())==969,"LANDUSE")
    require(m["soil_group_code_categories"]==18 and m["soil_fine_class_categories"]==64,"SOIL_TYPES")
    require(m["soil_group_missing_features"]==m["soil_detail_missing_features"]==1 and
            m["soil_missing_records"]==[MISSING],"SINGLE_SOIL_MISSING")

    cp,gp=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==75 and len({(r[0],r[1]) for r in cp})==75,"JCODE_PAIR_COUNT")
    require(len(gp)==44 and len({(r[0],r[1]) for r in gp})==44,"GUN_PAIR_COUNT")
    require(all(len(r)==6 and r[1] and
                all(type(v) is int and v>=0 for v in r[2:]) for r in cp+gp),"PAIR_FORMAT")
    require(all(len(r[0])==5 and r[0].isdigit() and r[0][:2] in ("18","24","25","26") for r in cp),"JCODE_FORMAT")
    require(summed(cp)==summed(gp)==[LANDCOUNTS[x] for x in LAND],"PAIR_LANDUSE_RECONCILIATION")
    code_names,name_codes,names_guns=defaultdict(set),defaultdict(set),defaultdict(set)
    for code,name,*counts in cp:
        code_names[code].add(name);name_codes[name].add(code)
    gun_counts=Counter()
    for gun,name,*counts in gp:
        gun_counts[gun]+=sum(counts)
        if gun:names_guns[name].add(gun)
    require(len(code_names)==37 and len(name_codes)==33 and dict(gun_counts)==GUN,"ADMIN_UNIQUE")
    a=m["source_code_name_anomalies"]
    foreign=[r for r in cp if not r[0].startswith("26")]
    require(foreign==a["foreign_prefecture_code_pairs"] and
            sum(sum(r[2:]) for r in foreign)==10 and a["foreign_prefecture_code_feature_count"]==10,"FOREIGN_JCODE_ROWS")
    require(a["foreign_code_prefix_totals"]==FOREIGN and a["foreign_prefixes"]==["18","24","25"],"FOREIGN_JCODE_PREFIX")
    require({k:sorted(v) for k,v in code_names.items() if len(v)>1}==a["codes_with_multiple_names"],"MULTI_CODE_NAME")
    require({k:sorted(v) for k,v in name_codes.items() if len(v)>1}==a["names_with_multiple_codes"],"MULTI_NAME_CODE")
    require(sum(len(v)>1 for v in code_names.values())==23 and
            sum(len(v)>1 for v in name_codes.values())==26,"MULTI_COUNT")
    require(a["one_to_one_code_name_mapping"] is False and a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_CITY_JOIN")

    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN,"GUN_SOURCE_PARITY")
    blank=[{"municipality_name":name,"empty_gun_landuse_counts":dict(zip(LAND,vals)),
            "empty_gun_polygon_count":sum(vals),"gun_names_seen_elsewhere":sorted(names_guns[name])}
           for gun,name,*vals in gp if not gun and name in names_guns]
    require(blank==q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]
            and sum(x["empty_gun_polygon_count"] for x in blank)==q["empty_gun_features_for_names_with_county_elsewhere"]==88,"BLANK_GUN_PAIRS")
    require({k:sorted(v) for k,v in names_guns.items() if len(v)>1}==
            q["multiple_nonempty_guns_per_municipality_name"]=={"和束町":["相楽郡","綴喜郡"]},"MULTIPLE_GUNS")
    require(q["foreign_gun_name_records"]==[{"gun":"大飯郡","municipality_name":"舞鶴市","JCODE":"18481","landuse":"田"}],"FOREIGN_GUN")
    require(["大飯郡","舞鶴市",1,0,0,0] in gp and
            ["綴喜郡","和束町",0,0,0,1] in gp,"GUN_ANOMALOUS_PAIR")
    require(q["suspected_gun_name_pairs"]==[{"gun":"綴喜郡","municipality_name":"和束町",
            "JCODE":"26344","polygon_count":1,
            "landuse_counts":{"田":0,"普通畑":0,"牧草地":0,"樹園地":1}}],"WAZUKA_SUSPECT")
    require(q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN","NO_GUN_JOIN")
    b=m["scientific_boundaries"]
    require(b["jcode_name_conflict_detected"] is True and b["gun_name_conflict_detected"] is True
            and b["soil_classification_missing_detected"] is True,"ANOMALY_DISCLOSURE")
    require(b["municipality_level_aggregations_pending_reconciliation"] is True and
            b["raw_geometry_licensed_for_publication"] is False,"NO_UNCHECKED_JOIN_OR_RAW")
    require(b["official_credit_tco2e"] is None and
            b["calculation_of_certified_credits_prohibited"] is True,"NO_CREDIT_INFERENCE")

def parse_dbf(data):
    require(len(data)>=353,"DBF_SHORT")
    rows,header,record=struct.unpack_from("<IHH",data,4)
    require((rows,header,record)==(969,353,1098) and header+rows*record<=len(data),"DBF_HEADER")
    names=[];ptr=32
    while ptr+32<=header and data[ptr]!=13:
        d=data[ptr:ptr+32];name=d[:11].split(b"\0",1)[0].decode("cp932")
        require(d[11]==ord("C"),"DBF_NON_TEXT_FIELD")
        names.append((name,d[16]));ptr+=32
    require(ptr<header and data[ptr]==13 and [x[0] for x in names]==list(FIELDS),"DBF_FIELDS")
    offsets={};offset=1
    for name,nbytes in names:
        offsets[name]=(offset,offset+nbytes);offset+=nbytes
    require(offset==record,"DBF_ROW_SIZE")
    land=Counter();bycode=defaultdict(Counter);bygun=defaultdict(Counter);gun=Counter();sicho=Counter()
    groups=set();fine=set();missing=[]
    for i in range(rows):
        rec=data[header+i*record:header+(i+1)*record]
        require(len(rec)==record and rec[0:1]==b" ","DBF_DELETED_RECORD")
        def field(n):
            a,b=offsets[n];return rec[a:b].decode("cp932").strip(" \0\t")
        row={k:field(k) for k in FIELDS}
        l,j,n,g=row["地目区分"],row["JCODE"],row["SIKUCHOSON"],row["GUN"]
        require(l in LAND and row["KEN_1"]=="京都府" and row["SICHO"]=="" and
                len(j)==5 and j.isdigit() and n,"DBF_ROW")
        land[l]+=1;bycode[(j,n)][l]+=1;bygun[(g,n)][l]+=1
        gun[g]+=1;sicho[row["SICHO"]]+=1
        groups.add(row["群コード"]);fine.add(row["包括_統群"])
        nulls=[c for c in ("包括_統群","統群コード","亜群コード","群コード") if not row[c]]
        if nulls:missing.append({"record_index_zero_based":i,"JCODE":j,"municipality_name":n,
                                  "gun":g,"landuse":l,"missing_fields":nulls})
    to_rows=lambda d:[[a,b,*[count.get(c,0) for c in LAND]] for (a,b),count in sorted(d.items())]
    return dict(land),to_rows(bycode),to_rows(bygun),dict(gun),dict(sicho),len(groups),len(fine),missing

def verify(path,m):
    p=Path(path);s=m["source"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ORIGINAL_ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ORIGINAL_ZIP_SHA256")
    blobs={}
    with zipfile.ZipFile(p) as z:
        require(len(z.infolist())==7,"ZIP_ENTRY_COUNT")
        for i,expected in zip(z.infolist(),s["members"]):
            original_name=i.filename if i.flag_bits&0x800 else i.filename.encode("cp437").decode("cp932")
            require(original_name=="k26京都府/"+expected["name"],"ZIP_SOURCE_ENTRY")
            data=z.read(i)
            require(len(data)==expected["bytes"] and sha256(data).hexdigest()==expected["sha256"],"MEMBER_SHA")
            blobs[expected["name"].rsplit(".",1)[-1]]=data
    shp,shx=blobs["shp"],blobs["shx"]
    require(struct.unpack_from(">I",shp,0)[0]==9994 and
            struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5) and
            list(struct.unpack_from("<4d",shp,36))==BOUNDS,"SHP_CRS_BOUNDS")
    require(struct.unpack_from(">I",shx,24)[0]*2==len(shx) and
            (len(shx)-100)//8==969,"SHX_FEATURE_COUNT")
    require("GCS_JGD_2000" in blobs["prj"].decode("ascii"),"PRJ")
    require("<CreaDate>20170117</CreaDate>" in blobs["xml"].decode("utf-8"),"METADATA_DATE")
    land,cp,gp,gun,sicho,groups,fine,missing=parse_dbf(blobs["dbf"])
    require(land==m["feature_counts_by_landuse"],"FULL_LANDUSE")
    require(cp==m["jcode_name_pairs_counts_by_landuse"],"FULL_JCODE_NAME")
    require(gp==m["gun_name_pairs_counts_by_landuse"],"FULL_GUN_NAME")
    require(gun==GUN and sicho=={"":969} and (groups,fine)==(18,64),"FULL_SOIL_META")
    require(missing==m["soil_missing_records"],"FULL_SOIL_MISSING")
    return {"status":"FULL_ZIP_AND_969_DBF_RECORDS_VERIFIED","polygons":969,"raw_gis_committed":False}

def main(args):
    m=load();check_derived(m)
    if args==["audit"]:
        res={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":969,
             "jcode_name_pairs":75,"gun_name_pairs":44,"raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        res=verify(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p54-kyoto-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(res,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr);sys.exit(1)
