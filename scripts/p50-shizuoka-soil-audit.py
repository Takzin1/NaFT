#!/usr/bin/env python3
"""NaFT P50 Shizuoka soil GIS: preserve and audit original JCODE/GUN attributes.

audit : stdlib-only manifest/derived-count consistency, appropriate for public CI
verify ORIGINAL.zip : full ZIP member hashes, SHP/SHX/DBF and 1376 DBF records
No raw GIS data or original ZIP is committed into the public repository.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / "research/p50-shizuoka-soil-shapefile-source-v1.json"
LANDUSE = ("田", "普通畑", "牧草地", "樹園地")
FIELDS = ("地目区分", "包括_統群", "統群コード", "亜群コード", "群コード",
          "JCODE", "KEN_1", "SICHO", "GUN", "SIKUCHOSON")
LAND_COUNTS = {"田":412,"普通畑":451,"牧草地":44,"樹園地":469}
GUN_COUNTS = {"":1187,"南都留郡":1,"周智郡":30,"榛原郡":22,"田方郡":24,
              "賀茂郡":86,"足柄下郡":3,"駿東郡":23}
ZIP_HASH = "5f742daa989dac20ad00e0ab10a43ec7ee42a2f529a9b5f4fb20cb512b66b799"
BOUNDS = [137.47834204518,34.59726879743675,139.1394105471396,35.43550077096272]
SOIL_MISSING = {"包括_統群":0,"統群コード":0,"亜群コード":0,"群コード":0}
FOREIGN_GUN = {"足柄下郡":3,"南都留郡":1}

def require(ok, code):
    if not ok:
        raise ValueError("P50_SHIZUOKA_SOURCE_BLOCKED:"+code)

def load():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def counts(rows):
    return [sum(r[2+i] for r in rows) for i in range(4)]

def derive(code_rows, gun_rows):
    code_names, name_codes, gun_names = defaultdict(set),defaultdict(set),defaultdict(set)
    for code,name,*categories in code_rows:
        code_names[code].add(name)
        name_codes[name].add(code)
    for gun,name,*categories in gun_rows:
        if gun:gun_names[name].add(gun)
    code_conflicts = {k:sorted(v) for k,v in code_names.items() if len(v)>1}
    name_conflicts = {k:sorted(v) for k,v in name_codes.items() if len(v)>1}
    foreign = [r for r in code_rows if r[0][:2]!="22"]
    foreign_totals=Counter()
    for r in foreign:foreign_totals[r[0][:2]]+=sum(r[2:])
    gun_totals=Counter()
    for r in gun_rows:gun_totals[r[0]]+=sum(r[2:])
    blank=[{"municipality_name":name,
            "empty_gun_landuse_counts":dict(zip(LANDUSE,values)),
            "empty_gun_polygon_count":sum(values),
            "gun_names_seen_elsewhere":sorted(gun_names[name])}
           for gun,name,*values in gun_rows if not gun and name in gun_names]
    multi_gun={k:sorted(v) for k,v in gun_names.items() if len(v)>1}
    return code_names,name_codes,code_conflicts,name_conflicts,foreign,dict(foreign_totals),dict(gun_totals),blank,multi_gun

def audit(m):
    src,geo=m["source"],m["geometry"]
    require(m["schema"]=="naft-p50-shizuoka-soil-shapefile-v1", "SCHEMA")
    require(src["provided_filename"]=="静岡県.zip" and src["member_folder"]=="k17静岡県", "SOURCE_NAME")
    require(src["source_zip_sha256"]==ZIP_HASH and src["zip_bytes"]==10405578, "SOURCE_ARCHIVE")
    require(src["zip_entries"]==len(src["members"])==7, "MEMBERS")
    require(sum(x["bytes"] for x in src["members"])==src["uncompressed_bytes"]==16393570, "UNCOMPRESSED_LENGTH")
    require(all(x["name"].startswith("k17静岡県.") and len(x["sha256"])==64 for x in src["members"]), "MEMBER_SHA")
    require(src["metadata_creation_date"]=="2017-01-17" and src["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON", "SOURCE_PROVENANCE")
    require(src["redistribution_rights"]=="NOT_VERIFIED" and src["publisher_authentication"]=="NOT_VERIFIED", "LICENSE_PENDING")
    require(src["original_zip_committed"] is False and src["raw_geometry_committed"] is False, "RAW_NOT_PUBLIC")
    require(geo["type"]=="POLYGON" and geo["crs"]=="GCS_JGD_2000" and geo["shape_count"]==1376, "GEOMETRY")
    require(geo["bounds_lon_lat"]==BOUNDS, "BBOX")
    require(geo["municipality_name_count"]==43 and geo["unique_jcodes"]==46 and geo["administrative_code_name_pairs"]==104, "NAME_COUNTS")
    require(geo["sicho_unique_values"]==[""] and geo["sicho_counts"]=={"":1376}, "SICHO")
    require(geo["gun_counts"]==GUN_COUNTS and sum(GUN_COUNTS.values())==1376, "GUN_COUNTS")
    require(m["fields"]==list(FIELDS), "DBF_FIELDS")
    require(m["feature_counts_by_landuse"]==LAND_COUNTS and sum(LAND_COUNTS.values())==1376, "LANDUSE")
    require(m["soil_group_code_categories"]==17 and m["soil_fine_class_categories"]==99, "SOIL_TAXONOMY")
    require(m["source_soil_completeness"]["missing_fields_counts"]==SOIL_MISSING, "SOIL_MISSING_COUNTS")
    cp,gp=m["jcode_name_pairs_counts_by_landuse"],m["gun_name_pairs_counts_by_landuse"]
    require(len(cp)==104 and len({(r[0],r[1]) for r in cp})==104, "JCODE_PAIR_ROWS")
    require(all(len(r)==6 and len(r[0])==5 and r[0].isdigit() and r[0][:2] in ("14","19","22") and r[1] and all(type(v)==int and v>=0 for v in r[2:]) for r in cp), "JCODE_VALUE")
    require(counts(cp)==[LAND_COUNTS[k] for k in LANDUSE], "JCODE_LANDUSE")
    require(len(gp)==56 and len({(r[0],r[1]) for r in gp})==56 and all(len(r)==6 and r[1] and all(type(v)==int and v>=0 for v in r[2:]) for r in gp), "GUN_PAIR_ROWS")
    require(counts(gp)==[LAND_COUNTS[k] for k in LANDUSE], "GUN_LANDUSE")
    cn,nc,cc,ncc,foreign,ftot,gtot,blank,multi=derive(cp,gp)
    require(len(cn)==46 and len(nc)==43, "NAME_SETS")
    require(len(cc)==28 and len(ncc)==34, "MAPPING_AMBIGUITY")
    require(gtot==GUN_COUNTS, "GUN_PAIR_PARITY")
    anomaly=m["source_code_name_anomalies"]
    require(anomaly["foreign_prefecture_code_pairs"]==foreign and len(foreign)==4, "FOREIGN_PAIR_SOURCE")
    require(anomaly["foreign_prefecture_code_feature_count"]==sum(ftot.values())==4 and ftot=={"14":3,"19":1}, "FOREIGN_JCODE_COUNTS")
    require(anomaly["foreign_code_prefix_totals"]==ftot and anomaly["foreign_prefixes"]==["14","19"], "FOREIGN_PREFIX")
    require(anomaly["codes_with_multiple_names"]==cc and anomaly["names_with_multiple_codes"]==ncc, "MAPPINGS")
    require(anomaly["one_to_one_code_name_mapping"] is False and anomaly["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN", "HOLD_CODE_JOIN")
    gq=m["source_gun_quality"]
    require(gq["gun_feature_counts"]==gtot and gq["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]==blank, "MISSING_GUN_ROWS")
    require(gq["empty_gun_features_for_known_gun_towns"]==sum(r["empty_gun_polygon_count"] for r in blank)==137 and len(blank)==13, "MISSING_GUN_137")
    require(gq["municipality_names_with_multiple_nonempty_guns"]==multi=={}, "NO_MULTI_GUN")
    require(gq["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN", "HOLD_GUN_JOIN")
    require({k:gtot[k] for k in FOREIGN_GUN}==FOREIGN_GUN, "FOREIGN_GUN")
    b=m["scientific_boundaries"]
    require(b["jcode_name_conflict_detected"] is True and b["gun_name_conflict_detected"] is True and b["municipality_level_aggregations_pending_reconciliation"] is True, "HOLD_EXTERNAL_JOINS")
    require(b["official_credit_tco2e"] is None and b["calculation_of_certified_credits_prohibited"] is True, "NO_CARBON_CREDIT")
    return True

def parse_dbf(blob):
    require(len(blob)>=353, "DBF_SHORT")
    n,hlen,rlen=struct.unpack_from("<IHH",blob,4)
    require((n,hlen,rlen)==(1376,353,1098) and hlen+n*rlen<=len(blob), "DBF_HEADER")
    fs=[];i=32
    while i+32<=hlen and blob[i]!=13:
        d=blob[i:i+32]
        fs.append((d[:11].split(b"\0",1)[0].decode("cp932"),d[16]))
        require(d[11]==ord("C"), "DBF_FIELD_TYPE")
        i+=32
    require(i<hlen and blob[i]==13 and [f for f,_ in fs]==list(FIELDS), "DBF_FIELDS")
    offsets={};a=1
    for f,length in fs:offsets[f]=(a,a+length);a+=length
    require(a==rlen, "DBF_ROW_WIDTH")
    city,gun=defaultdict(Counter),defaultdict(Counter)
    lc=Counter();src_gun=Counter();src_sicho=Counter();grp=set();fine=set();missing=Counter()
    for j in range(n):
        row=blob[hlen+j*rlen:hlen+(j+1)*rlen]
        require(len(row)==rlen and row[:1]==b" ", "DBF_ROW_ACTIVE")
        def val(k):
            a,b=offsets[k]
            return row[a:b].decode("cp932").strip(" \0\t")
        name,code,g,cat=val("SIKUCHOSON"),val("JCODE"),val("GUN"),val("地目区分")
        require(name and len(code)==5 and code[:2] in ("14","19","22") and cat in LANDUSE, "DBF_NAME_CODE_LANDUSE")
        require(val("KEN_1")=="静岡県", "DBF_KEN")
        lc[cat]+=1;city[(code,name)][cat]+=1;gun[(g,name)][cat]+=1
        src_gun[g]+=1;src_sicho[val("SICHO")]+=1
        grp.add(val("群コード"));fine.add(val("包括_統群"))
        for k in SOIL_MISSING:
            if val(k)=="":missing[k]+=1
    return {"land":dict(lc),"codepairs":[[a,b,*[v[x] for x in LANDUSE]] for (a,b),v in sorted(city.items())],
            "gunpairs":[[a,b,*[v[x] for x in LANDUSE]] for (a,b),v in sorted(gun.items())],
            "gun":dict(src_gun),"sicho":dict(src_sicho),
            "group_count":len(grp),"fine_count":len(fine),
            "missing":{k:missing[k] for k in SOIL_MISSING}}

def verify(path,m):
    p=Path(path);s=m["source"];geo=m["geometry"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ORIGINAL_ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ORIGINAL_ZIP_SHA")
    blobs={}
    with zipfile.ZipFile(p) as z:
        items=z.infolist()
        require(len(items)==7,"ORIGINAL_MEMBER_COUNT")
        for info,original in zip(items,s["members"]):
            name=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(name==s["member_folder"]+"/"+original["name"] and not info.is_dir(),"ORIGINAL_MEMBER_NAME")
            buf=z.read(info)
            require(len(buf)==original["bytes"] and sha256(buf).hexdigest()==original["sha256"],"ORIGINAL_MEMBER_SHA")
            blobs[original["name"]]=buf
    shp,shx,dbf=(blobs["k17静岡県."+x] for x in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994 and struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_HEADER")
    require(struct.unpack_from("<II",shp,28)==(1000,5) and (len(shx)-100)//8==1376, "SHP_SHX_POLYGONS")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),geo["bounds_lon_lat"])),"SHP_BOUNDS")
    require("GCS_JGD_2000" in blobs["k17静岡県.prj"].decode("ascii"),"PRJ_CRS")
    require("<CreaDate>20170117</CreaDate>" in blobs["k17静岡県.shp.xml"].decode("utf-8"),"XML_METADATA_DATE")
    r=parse_dbf(dbf)
    require(r["land"]==m["feature_counts_by_landuse"],"ORIGINAL_LANDUSE")
    require(r["codepairs"]==m["jcode_name_pairs_counts_by_landuse"],"ORIGINAL_CODE_PAIRS")
    require(r["gunpairs"]==m["gun_name_pairs_counts_by_landuse"],"ORIGINAL_GUN_PAIRS")
    require(r["gun"]==geo["gun_counts"] and r["sicho"]==geo["sicho_counts"],"ORIGINAL_GUN_SICHO")
    require(r["group_count"]==17 and r["fine_count"]==99 and r["missing"]==SOIL_MISSING,"ORIGINAL_SOIL_CLASSES")
    return {"status":"SOURCE_ZIP_ALL_MEMBERS_AND_DBF_ATTRIBUTES_MATCH","polygons":1376,"source_hash":ZIP_HASH}

def main(argv):
    m=load()
    audit(m)
    if argv==["audit"]:
        value={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":1376,"jcode_name_pairs":104,"gun_name_pairs":56,"raw_original_verified_in_ci":False}
    elif len(argv)==2 and argv[0]=="verify":
        value=verify(argv[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p50-shizuoka-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(value,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
