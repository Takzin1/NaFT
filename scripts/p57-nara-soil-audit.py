#!/usr/bin/env python3
"""NaFT P57 Nara agricultural soil GIS provenance audit (Python stdlib only).

audit: validate public metadata + derived counts; raw ZIP not available in CI.
verify ORIGINAL.zip: independently hash original archive and 7 members, parse
all 855 DBF features, and reproduce original JCODE and GUN pair counts.
Public GitHub retains no raw Shapefile, geometry or DBF.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/"research/p57-nara-soil-shapefile-source-v1.json"
LAND=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
EXPECTED_LAND={"田":401,"普通畑":265,"牧草地":9,"樹園地":180}
EXPECTED_GUN={"":464,"北葛城郡":49,"吉野郡":139,"宇陀郡":22,
              "山辺郡":21,"生駒郡":51,"相楽郡":12,"磯城郡":55,"高市郡":42}
FOREIGN={"24":9,"26":16,"27":8}
HASH="6a1787c976149b29fead495730d749b0ce072e1e5d9922f4d25786aba3d61d16"
BOUNDS=[135.56310091626395,33.87643163780173,136.21964315993296,34.777998616262266]

def require(ok, code):
    if not ok: raise ValueError("P57_NARA_SOURCE_BLOCKED:"+code)

def load():
    return json.loads(MANIFEST.read_text(encoding="utf-8"))

def sums(pairs):
    return [sum(row[2+i] for row in pairs) for i in range(4)]

def grouped(rows, columns):
    counter=defaultdict(Counter)
    for r in rows:
        counter[tuple(r[x] for x in columns)][r["地目区分"]]+=1
    return [[*key,*[counts[k] for k in LAND]] for key,counts in sorted(counter.items())]

def audit(m):
    source, geo=m["source"],m["geometry"]
    require(m["schema"]=="naft-p57-nara-soil-shapefile-v1","SCHEMA")
    require(source["provided_filename"]=="奈良県.zip" and source["member_folder"]=="k29奈良県","ORIGINAL_NAME")
    require(source["source_zip_sha256"]==HASH and source["zip_bytes"]==3703958,"ORIGINAL_SHA_SIZE")
    require(source["zip_entries"]==len(source["members"])==7 and
            source["uncompressed_bytes"]==6289996 and
            sum(x["bytes"] for x in source["members"])==6289996,"SOURCE_MEMBERS")
    require([x["name"] for x in source["members"]]==["k29奈良県."+ext for ext in
            ("dbf","prj","sbn","sbx","shp","shp.xml","shx")],"ORIGINAL_MEMBER_NAMES")
    require(all(len(x["sha256"])==64 and set(x["sha256"])<=set("0123456789abcdef")
                for x in source["members"]),"MEMBER_SHA")
    require(source["metadata_creation_date"]=="2017-01-17" and
            source["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","SOURCE_METADATA")
    require(source["publisher_authentication"]==source["redistribution_rights"]=="NOT_VERIFIED","RIGHTS_PENDING")
    require(source["original_zip_committed"] is False and source["raw_geometry_committed"] is False,"RAW_UNPUBLISHED")
    require(geo["type"]=="POLYGON" and geo["crs"]=="GCS_JGD_2000" and
            geo["bounds_lon_lat"]==BOUNDS and geo["shape_count"]==855,"GEOMETRY")
    require(geo["municipality_name_count"]==39 and geo["unique_jcodes"]==51
            and geo["administrative_code_name_pairs"]==109,"MUNICIPALITY_COUNTS")
    require(geo["sicho_unique_values"]==[""] and geo["sicho_counts"]=={"":855},"SICHO")
    require(geo["gun_counts"]==EXPECTED_GUN and sum(EXPECTED_GUN.values())==855,"GUN_TOTALS")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["feature_counts_by_landuse"]==EXPECTED_LAND and sum(EXPECTED_LAND.values())==855,"LANDUSE")
    require(m["soil_group_code_categories"]==12 and m["soil_fine_class_categories"]==42,"SOIL_CATEGORIES")
    require(m["soil_group_missing_features"]==m["soil_detail_missing_features"]==0
            and m["soil_classification_missing_records"]==[],"NO_MISSING_SOIL_CLASSIFICATION")
    cp,gp=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==109 and len(set((r[0],r[1]) for r in cp))==109,"CODE_PAIR_COUNT")
    require(len(gp)==58 and len(set((r[0],r[1]) for r in gp))==58,"GUN_PAIR_COUNT")
    require(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:])
                for r in cp+gp),"NONNEGATIVE_COUNTS")
    require(all(len(r[0])==5 and r[0].isdigit() and r[0][:2] in ("24","26","27","29")
                for r in cp),"JCODE_FORMAT")
    require(sums(cp)==sums(gp)==[EXPECTED_LAND[c] for c in LAND],"MARGINAL_PARITY")
    code_names,name_codes,named_guns=defaultdict(set),defaultdict(set),defaultdict(set)
    for code,name,*v in cp:
        code_names[code].add(name);name_codes[name].add(code)
    for gun,name,*v in gp:
        if gun:named_guns[name].add(gun)
    require(len(code_names)==51 and len(name_codes)==39,"MAPPING_CARDINALITY")
    an=m["source_code_name_anomalies"]
    foreign=[r for r in cp if not r[0].startswith("29")]
    require(foreign==an["foreign_prefecture_code_pairs"]
            and sum(sum(r[2:]) for r in foreign)==33,"FOREIGN_PAIRS")
    require(an["foreign_prefecture_code_feature_count"]==33 and
            an["foreign_prefixes"]==["24","26","27"] and
            an["foreign_code_prefix_totals"]==FOREIGN,"FOREIGN_PREFIX")
    require(an["codes_with_multiple_names"]==
            {k:sorted(v) for k,v in code_names.items() if len(v)>1},"MULTINAME_CODE")
    require(an["names_with_multiple_codes"]==
            {k:sorted(v) for k,v in name_codes.items() if len(v)>1},"MULTICODE_NAME")
    require(sum(len(x)>1 for x in code_names.values())==24 and
            sum(len(x)>1 for x in name_codes.values())==28,"AMBIGUOUS_COUNTS")
    require(an["one_to_one_code_name_mapping"] is False and
            an["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_AUTO_CITY_JOIN")
    gun_totals=Counter()
    for gun,name,*v in gp:gun_totals[gun]+=sum(v)
    require(dict(gun_totals)==EXPECTED_GUN,"GUN_MARGINS")
    blank=[{"municipality_name":name,
            "empty_gun_landuse_counts":dict(zip(LAND,v)),
            "empty_gun_polygon_count":sum(v),
            "gun_names_seen_elsewhere":sorted(named_guns[name])}
           for gun,name,*v in gp if gun=="" and name in named_guns]
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==EXPECTED_GUN
            and q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==blank,"GUN_NULL_DETAIL")
    require(sum(r["empty_gun_polygon_count"] for r in blank)==
            q["empty_gun_features_for_names_with_county_elsewhere"]==155,"GUN_NULL_155")
    require(sum(r["empty_gun_polygon_count"] for r in blank
                if r["municipality_name"].endswith(("町","村")))==
            q["empty_gun_features_in_town_village_names"]==79,"GUN_NULL_TOWN_79")
    require(q["multiple_nonempty_guns_per_municipality_name"]==
            {"広陵町":["北葛城郡","磯城郡"],
             "河合町":["北葛城郡","生駒郡","磯城郡"]},"MULTIPLE_COUNTIES")
    require(q["foreign_prefecture_gun_names"]=={"相楽郡":12} and
            q["foreign_prefecture_gun_name_pairs"]==
            [["相楽郡","奈良市",6,0,0,5],["相楽郡","生駒市",1,0,0,0]],"KYOTO_GUN")
    require(q["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN","NO_AUTO_GUN_JOIN")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and
            sb["gun_name_conflict_detected"] is True and
            sb["municipality_level_aggregations_pending_reconciliation"] is True,"JOIN_SAFETY")
    require(sb["calculation_of_certified_credits_prohibited"] is True
            and sb["official_credit_tco2e"] is None,"NO_CO2E_INFERENCE")
    return True

def parse_dbf(blob):
    n,head,size=struct.unpack_from("<IHH",blob,4)
    require((n,head,size)==(855,353,1098) and head+n*size<=len(blob),"DBF_HEADER")
    desc=[];pos=32
    while pos+32<=head and blob[pos]!=13:
        raw=blob[pos:pos+32];name=raw[:11].split(b"\0",1)[0].decode("cp932")
        require(raw[11]==ord("C"),"DBF_FIELD_TYPE")
        desc.append((name,raw[16]));pos+=32
    require(pos<head and blob[pos]==13 and [x[0] for x in desc]==list(FIELDS),"DBF_FIELD_LIST")
    offsets={};p=1
    for name,nbytes in desc:
        offsets[name]=(p,p+nbytes);p+=nbytes
    require(p==size,"DBF_RECORD_SIZE")
    rows=[]
    for i in range(n):
        raw=blob[head+i*size:head+(i+1)*size]
        require(len(raw)==size and raw[:1]==b" ","DBF_DELETED_OR_BAD_ROW")
        row={k:raw[a:b].decode("cp932").strip(" \x00\t")
             for k,(a,b) in offsets.items()}
        require(row["KEN_1"]=="奈良県" and row["SICHO"]=="" and row["地目区分"] in LAND,"DBF_ATTR")
        rows.append(row)
    return rows

def verify(path,m):
    p=Path(path);s=m["source"]
    require(p.is_file() and p.stat().st_size==3703958,"ORIGINAL_ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==HASH,"ORIGINAL_ZIP_SHA")
    parts={}
    with zipfile.ZipFile(p) as z:
        require(len(z.infolist())==7,"ZIP_ENTRY_COUNT")
        for item,manifest in zip(z.infolist(),s["members"]):
            fullname=item.filename if item.flag_bits & 0x800 else item.filename.encode("cp437").decode("cp932")
            require(fullname==s["member_folder"]+"/"+manifest["name"],"ZIP_MEMBER_NAME")
            blob=z.read(item)
            require(not item.is_dir() and len(blob)==manifest["bytes"]
                    and sha256(blob).hexdigest()==manifest["sha256"],"MEMBER_HASH")
            parts[manifest["name"].rsplit(".",1)[-1]]=blob
    shp,shx=parts["shp"],parts["shx"]
    for typ,b in (("SHP",shp),("SHX",shx)):
        require(struct.unpack_from(">I",b,0)[0]==9994 and
                struct.unpack_from(">I",b,24)[0]*2==len(b),"SHAPE_FILE_LENGTH_"+typ)
        require(struct.unpack_from("<II",b,28)==(1000,5),"SHAPE_TYPE_"+typ)
    require((len(shx)-100)//8==855,"SHX_POLYGON_COUNT")
    require(list(struct.unpack_from("<4d",shp,36))==BOUNDS,"SHP_BBOX")
    require("GCS_JGD_2000" in parts["prj"].decode("ascii"),"SOURCE_CRS")
    require("<CreaDate>20170117</CreaDate>" in parts["xml"].decode("utf-8"),"XML_DATE")
    rows=parse_dbf(parts["dbf"])
    require(Counter(x["地目区分"] for x in rows)==EXPECTED_LAND,"SOURCE_LANDUSE")
    require(grouped(rows,("JCODE","SIKUCHOSON"))==m["jcode_name_pairs_counts_by_landuse"],"SOURCE_CODE_PAIRS")
    require(grouped(rows,("GUN","SIKUCHOSON"))==m["gun_name_pairs_counts_by_landuse"],"SOURCE_GUN_PAIRS")
    require(Counter(x["GUN"] for x in rows)==EXPECTED_GUN,"SOURCE_GUN_MARGINS")
    require(len({x["群コード"] for x in rows})==12 and
            len({x["包括_統群"] for x in rows})==42,"SOIL_TAXONOMY")
    require(all(all(x[f] for f in FIELDS[1:5]) for x in rows),"SOIL_NO_NULL")
    return {"status":"ORIGINAL_ZIP_SHA_AND_DBF_ALL_855_MATCH","polygons":855,
            "code_pairs":109,"gun_pairs":58,"raw_gis_committed":False}

def main(argv):
    m=load();audit(m)
    if argv==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":855,
                "code_pairs":109,"gun_pairs":58,"raw_original_verified_in_ci":False}
    elif len(argv)==2 and argv[0]=="verify":
        result=verify(argv[1],m)
    else:raise ValueError("USAGE: python3 scripts/p57-nara-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as error:
        print(str(error),file=sys.stderr);sys.exit(1)
