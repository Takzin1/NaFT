#!/usr/bin/env python3
"""P43: source-preserving independent integrity replay for user-uploaded Niigata soil GIS.
Python standard library only; no raw GIS binary is committed to public GitHub.
CI audits only metadata, while local "verify ORIGINAL.zip" replays full source bytes.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTRY=ROOT/"research/p43-niigata-soil-shapefile-source-v1.json"
LANDUSE=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード",
        "JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
EXPECTED_GUN={"":1345,"三島郡":10,"中魚沼郡":18,"刈羽郡":7,
              "北蒲原郡":20,"南蒲原郡":11,"南魚沼郡":6,"岩船郡":31,
              "東蒲原郡":42,"西蒲原郡":13}
def require(test,why):
    if not test: raise ValueError("P43_NIIGATA_SOURCE_BLOCKED:"+why)
def load():
    return json.loads(REGISTRY.read_text(encoding="utf-8"))
def audit(m):
    s, geo=m["source"],m["geometry"]
    require(m["schema"]=="naft-p43-niigata-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="新潟県.zip" and s["member_folder"]=="k18新潟県","SOURCE_NAME")
    require(s["zip_bytes"]==17478591,"ZIP_SIZE")
    require(s["source_zip_sha256"]=="7e1e4877d7d7b9443b1bfc34fb71d1333fbfa4949a626837ee1fb83b6ff0246f","SOURCE_HASH")
    require(s["zip_entries"]==len(s["members"])==7,"MEMBER_COUNT")
    require(sum(x["bytes"] for x in s["members"])==s["uncompressed_bytes"]==26728304,"MEMBER_SIZE")
    require(all(x["name"].startswith("k18新潟県.") and len(x["sha256"])==64 for x in s["members"]),"MEMBER_SHA_FORMAT")
    require(s["metadata_creation_date"]=="2017-01-17" and s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","PROVENANCE")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"RAW_NOT_PUBLISHED")
    require(s["redistribution_rights"]=="NOT_VERIFIED" and s["publisher_authentication"]=="NOT_VERIFIED","LICENSE_PENDING")
    require(geo["type"]=="POLYGON" and geo["crs"]=="GCS_JGD_2000" and geo["shape_count"]==1503,"GEOMETRY")
    require(geo["bounds_lon_lat"]==[137.6363794713516,36.84500778396874,139.68688147974075,38.54217014257465],"BBOX")
    require(geo["municipality_name_count"]==37 and geo["unique_jcodes"]==37 and geo["administrative_code_name_pairs"]==86,"COUNTS")
    require(geo["sicho_unique_values"]==[""] and geo["sicho_counts"]=={"":1503},"SICHO")
    require(geo["gun_counts"]==EXPECTED_GUN and sum(EXPECTED_GUN.values())==1503,"GUN_COUNTS")
    require(m["fields"]==list(FIELDS),"FIELDS")
    require(m["soil_group_code_categories"]==19 and m["soil_fine_class_categories"]==78,"SOIL_CLASSES")
    totals=m["feature_counts_by_landuse"]
    require(totals=={"田":682,"普通畑":524,"牧草地":86,"樹園地":211} and sum(totals.values())==1503,"LANDUSE")
    pairs=m["jcode_name_pairs_counts_by_landuse"]
    require(len(pairs)==86 and len(set((r[0],r[1]) for r in pairs))==86,"CODE_PAIRS")
    require(all(len(r)==6 and r[0].startswith("15") and len(r[0])==5 and r[1] for r in pairs),"NO_FOREIGN_CODE")
    require([sum(r[i+2] for r in pairs) for i in range(4)]==[totals[c] for c in LANDUSE],"PAIR_LANDUSE")
    codes,names=defaultdict(set),defaultdict(set)
    for code,name,*counts in pairs:
        require(all(type(x) is int and x>=0 for x in counts),"NEGATIVE_PAIR")
        codes[code].add(name);names[name].add(code)
    require(len(codes)==len(names)==37,"NAME_CODE_SET")
    a=m["source_code_name_anomalies"]
    require(a["foreign_prefecture_code_feature_count"]==0 and a["foreign_prefecture_code_pairs"]==[],"ZERO_FOREIGN")
    require(a["foreign_prefixes"]==[] and a["foreign_code_prefix_totals"]=={},"ZERO_FOREIGN_PREFIX")
    require(a["one_to_one_code_name_mapping"] is False and a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_AUTO_JOIN")
    require({k:sorted(v) for k,v in codes.items() if len(v)>1}==a["codes_with_multiple_names"],"CODE_MULTINAME")
    require({k:sorted(v) for k,v in names.items() if len(v)>1}==a["names_with_multiple_codes"],"NAME_MULTICODE")
    require(sum(len(v)>1 for v in codes.values())==21 and sum(len(v)>1 for v in names.values())==25,"AMBIGUITY_COUNTS")
    gun_pairs=m["gun_name_pairs_counts_by_landuse"]
    require(len(gun_pairs)==45 and len(set((r[0],r[1]) for r in gun_pairs))==45,"GUN_PAIRS")
    require([sum(r[i+2] for r in gun_pairs) for i in range(4)]==[totals[c] for c in LANDUSE],"GUN_LANDUSE")
    require({k:sum(sum(r[2:]) for r in gun_pairs if r[0]==k) for k in EXPECTED_GUN}==EXPECTED_GUN,"GUN_PARITY")
    b=m["scientific_boundaries"]
    require(b["jcode_name_conflict_detected"] is True and b["municipality_level_aggregations_pending_reconciliation"] is True,"HOLD_MUNICIPALITY_JOIN")
    require(b["official_credit_tco2e"] is None and b["calculation_of_certified_credits_prohibited"] is True,"NO_CREDIT_INFERENCE")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_SHORT")
    n,header,rec_len=struct.unpack_from("<IHH",blob,4)
    require((n,header,rec_len)==(1503,353,1098) and header+n*rec_len<=len(blob),"DBF_HEADER")
    fields=[];p=32
    while p+32<=header and blob[p]!=13:
        f=blob[p:p+32];name=f[:11].split(b"\0",1)[0].decode("cp932")
        require(f[11]==ord("C"),"NOT_CHAR_FIELD")
        fields.append((name,f[16]));p+=32
    require(p<header and blob[p]==13 and [f for f,_ in fields]==list(FIELDS),"DBF_COLUMNS")
    offsets={};cursor=1
    for key,width in fields:
        offsets[key]=(cursor,cursor+width);cursor+=width
    require(cursor==rec_len,"DBF_RECORD_SIZE")
    cats=Counter();pairs=defaultdict(Counter);gun_pairs=defaultdict(Counter)
    gun,sicho=Counter(),Counter();codes=set();names=set();groups=set();fine=set()
    for i in range(n):
        row=blob[header+i*rec_len:header+(i+1)*rec_len]
        require(len(row)==rec_len and row[:1]==b" ","DBF_ROW")
        def val(field):
            start,end=offsets[field]
            return row[start:end].decode("cp932").strip(" \0\t")
        use=val("地目区分")
        require(use in LANDUSE,"UNKNOWN_LANDUSE")
        require(val("KEN_1")=="新潟県","KEN_MISMATCH")
        code,name=val("JCODE"),val("SIKUCHOSON")
        require(code.startswith("15") and len(code)==5 and name,"UNEXPECTED_JCODE")
        g,s=val("GUN"),val("SICHO")
        cats[use]+=1;pairs[(code,name)][use]+=1;gun_pairs[(g,name)][use]+=1
        gun[g]+=1;sicho[s]+=1;codes.add(code);names.add(name)
        groups.add(val("群コード"));fine.add(val("包括_統群"))
    return cats,pairs,gun_pairs,gun,sicho,codes,names,len(groups),len(fine)

def verify_zip(filename,m):
    p=Path(filename);s,geo=m["source"],m["geometry"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_HASH")
    files={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist()
        require(len(infos)==7,"ZIP_MEMBERS")
        for info,declared in zip(infos,s["members"]):
            path=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(path==s["member_folder"]+"/"+declared["name"],"MEMBER_PATH")
            require(not info.is_dir() and info.file_size==declared["bytes"],"MEMBER_BYTES")
            blob=z.read(info)
            require(sha256(blob).hexdigest()==declared["sha256"],"MEMBER_HASH")
            files[declared["name"]]=blob
    shp,shx,dbf=(files["k18新潟県."+x] for x in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994,"SHP_MAGIC")
    require(struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_SIZE")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON")
    require((len(shx)-100)//8==geo["shape_count"],"SHX_COUNT")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),geo["bounds_lon_lat"])),"BBOX")
    require("GCS_JGD_2000" in files["k18新潟県.prj"].decode("ascii"),"PRJ")
    require("<CreaDate>20170117</CreaDate>" in files["k18新潟県.shp.xml"].decode("utf-8"),"XML_DATE")
    cats,pairs,gun_pairs,gun,sicho,codes,names,group,fine=parse_dbf(dbf)
    require(dict(cats)==m["feature_counts_by_landuse"],"LANDUSE_REPLAY")
    require(len(codes)==len(names)==37 and len(pairs)==86 and len(gun_pairs)==45,"SETS_REPLAY")
    require((group,fine)==(19,78),"SOIL_REPLAY")
    require(dict(gun)==geo["gun_counts"] and dict(sicho)==geo["sicho_counts"],"GUN_SICHO_REPLAY")
    cr=[[c,n]+[pairs[(c,n)][x] for x in LANDUSE] for c,n in sorted(pairs)]
    gr=[[g,n]+[gun_pairs[(g,n)][x] for x in LANDUSE] for g,n in sorted(gun_pairs)]
    require(cr==m["jcode_name_pairs_counts_by_landuse"],"CODE_NAME_REPLAY")
    require(gr==m["gun_name_pairs_counts_by_landuse"],"GUN_NAME_REPLAY")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"新潟県",
            "polygons":1503,"municipality_names":37,"jcode_name_pairs":86,
            "gun_name_pairs":45,"official_credit_tco2e":None}

def main(args):
    m=load();audit(m)
    if args==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":1503,
                "municipality_names":37,"jcode_name_pairs":86,"gun_name_pairs":45,
                "raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        result=verify_zip(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p43-niigata-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr);sys.exit(1)
