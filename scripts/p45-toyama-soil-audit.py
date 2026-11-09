#!/usr/bin/env python3
"""P45 Toyama soil GIS source audit. Python stdlib only.
Public CI audits derived metadata, never raw licensed GIS. Local 'verify' replays
original ZIP member SHA256, every SHP/SHX polygon and every DBF field.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "research/p45-toyama-soil-shapefile-source-v1.json"
LANDUSE = ("田", "普通畑", "牧草地", "樹園地")
FIELDS = ("地目区分", "包括_統群", "統群コード", "亜群コード", "群コード",
          "JCODE", "KEN_1", "SICHO", "GUN", "SIKUCHOSON")
EXPECTED_GUN = {"":495,"下新川郡":50,"中新川郡":87}
EXPECTED_MISSING = {
    "上市町":("中新川郡",(15,0,0,0)),
    "入善町":("下新川郡",(5,0,0,0)),
    "立山町":("中新川郡",(1,0,0,0)),
    "舟橋村":("中新川郡",(3,1,0,0))
}

def require(valid, marker):
    if not valid:
        raise ValueError("P45_TOYAMA_SOURCE_BLOCKED:" + marker)

def load():
    return json.loads(REGISTRY.read_text(encoding="utf-8"))

def audit_register(m):
    s, geo = m["source"],m["geometry"]
    require(m["schema"]=="naft-p45-toyama-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="富山県.zip" and s["member_folder"]=="k19富山県","SOURCE_PATH")
    require(s["zip_bytes"]==4675546,"ZIP_SIZE")
    require(s["source_zip_sha256"]=="fbbe882b713db76fc18fde6106cdbaeb2a82a2302e97b1cb8dc33b1d8cc19ab7","ZIP_SHA")
    require(s["zip_entries"]==len(s["members"])==7,"ZIP_MEMBERS")
    require(sum(x["bytes"] for x in s["members"])==s["uncompressed_bytes"]==7481198,"MEMBER_TOTAL_BYTES")
    require(all(x["name"].startswith("k19富山県.") and len(x["sha256"])==64 and
                all(ch in "0123456789abcdef" for ch in x["sha256"]) for x in s["members"]),"MEMBER_SHA_FORMAT")
    require(s["metadata_creation_date"]=="2017-01-17" and
            s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","PROVENANCE")
    require(s["redistribution_rights"]==s["publisher_authentication"]=="NOT_VERIFIED","UNCONFIRMED_LICENSE")
    require(s["original_zip_committed"] is False and s["raw_geometry_committed"] is False,"SOURCE_PRIVATE")
    require(geo["type"]=="POLYGON" and geo["crs"]=="GCS_JGD_2000","GEOMETRY")
    require(geo["shape_count"]==632 and geo["municipality_name_count"]==15 and
            geo["unique_jcodes"]==15 and geo["administrative_code_name_pairs"]==36,"FEATURE_COUNTS")
    require(geo["bounds_lon_lat"]==[136.78498869633378,36.34960657076776,137.65754674358115,36.97336380774928],"BBOX")
    require(geo["sicho_unique_values"]==[""] and geo["sicho_counts"]=={"":632},"SICHO")
    require(geo["gun_counts"]==EXPECTED_GUN and sum(EXPECTED_GUN.values())==632,"GUN_COUNTS")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["soil_group_code_categories"]==15 and m["soil_fine_class_categories"]==59,"SOIL_CLASSES")
    totals=m["feature_counts_by_landuse"]
    require(totals=={"田":428,"普通畑":116,"牧草地":18,"樹園地":70},"LANDUSE")
    require(sum(totals.values())==632,"LANDUSE_TOTAL")
    pairs=m["jcode_name_pairs_counts_by_landuse"]
    require(len(pairs)==36 and len({(r[0],r[1]) for r in pairs})==36,"JCODE_PAIRS")
    require(all(len(r)==6 and len(r[0])==5 and r[0].startswith("16") and r[1] and
                all(type(x) is int and x>=0 for x in r[2:]) for r in pairs),"JCODE_ROW_VALIDATION")
    require([sum(r[i+2] for r in pairs) for i in range(4)]==[totals[k] for k in LANDUSE],"JCODE_COUNTS")
    codes,names=defaultdict(set),defaultdict(set)
    for code,name,*_ in pairs:
        codes[code].add(name)
        names[name].add(code)
    require(len(codes)==len(names)==15,"MUNICIPALITY_SET")
    a=m["source_code_name_anomalies"]
    require(a["foreign_prefecture_code_feature_count"]==0 and a["foreign_prefecture_code_pairs"]==[],"ZERO_FOREIGN")
    require(a["foreign_prefixes"]==[] and a["foreign_code_prefix_totals"]=={},"ZERO_FOREIGN_PREFIX")
    require(a["one_to_one_code_name_mapping"] is False and a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN","NO_JOIN")
    require({c:sorted(v) for c,v in codes.items() if len(v)>1}==a["codes_with_multiple_names"],"CODE_MULTINAME")
    require({n:sorted(v) for n,v in names.items() if len(v)>1}==a["names_with_multiple_codes"],"NAME_MULTICODE")
    require(sum(len(v)>1 for v in codes.values())==10 and sum(len(v)>1 for v in names.values())==12,"AMBIGUITY_COUNTS")
    g=m["gun_name_pairs_counts_by_landuse"]
    require(len(g)==19 and len({(r[0],r[1]) for r in g})==19,"GUN_NAME_PAIRS")
    require(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in g),"GUN_VALIDATION")
    require([sum(r[i+2] for r in g) for i in range(4)]==[totals[k] for k in LANDUSE],"GUN_LANDUSE")
    require({k:sum(sum(r[2:]) for r in g if r[0]==k) for k in EXPECTED_GUN}==EXPECTED_GUN,"GUN_PARITY")
    quality=m["source_gun_quality"]
    require(quality["gun_feature_counts"]==EXPECTED_GUN and
            quality["status"]=="SOURCE_NULL_PRESERVED_GUN_COMPLETENESS_PENDING","GUN_SOURCE_STATE")
    observed={}
    for name,(gun,counts) in EXPECTED_MISSING.items():
        require([gun,name,*counts] in g or (gun,name) in [(r[0],r[1]) for r in g],"KNOWN_GUN_PRESENT")
        row=next((r for r in g if r[0]=="" and r[1]==name),None)
        require(row is not None and tuple(row[2:])==counts,"MISSING_GUN_ROW")
        observed[name]={"municipality_name":name,
                        "empty_gun_landuse_counts":dict(zip(LANDUSE,counts)),
                        "empty_gun_polygon_count":sum(counts),
                        "gun_names_seen_elsewhere":[gun]}
    require({r["municipality_name"]:r for r in quality["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]}==observed,"MISSING_GUN_DETAIL")
    require(sum(r["empty_gun_polygon_count"] for r in observed.values())==
            quality["empty_gun_features_for_known_gun_towns"]==25,"MISSING_GUN_TOTAL")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_missingness_detected"] is True,"BOUNDARY_WARNINGS")
    require(sb["official_credit_tco2e"] is None and sb["municipality_level_aggregations_pending_reconciliation"] is True,"SCIENTIFIC_BLOCK")
    return True

def parse_dbf(blob):
    require(len(blob)>=353,"DBF_SHORT")
    n,header,record_length=struct.unpack_from("<IHH",blob,4)
    require((n,header,record_length)==(632,353,1098) and header+n*record_length<=len(blob),"DBF_HEADER")
    fields=[];p=32
    while p+32<=header and blob[p]!=13:
        entry=blob[p:p+32]
        name=entry[:11].split(b"\0",1)[0].decode("cp932")
        require(entry[11]==ord("C"),"DBF_NOT_TEXT")
        fields.append((name,entry[16]))
        p+=32
    require(p<header and blob[p]==13 and [n for n,_ in fields]==list(FIELDS),"DBF_COLUMNS")
    offsets={};p=1
    for name,size in fields:
        offsets[name]=(p,p+size);p+=size
    require(p==record_length,"DBF_RECORD_LENGTH")
    land=Counter();codes=defaultdict(Counter);gun_names=defaultdict(Counter)
    groups,fines,cities,codenames=set(),set(),set(),set()
    gun=Counter();sicho=Counter()
    for i in range(n):
        record=blob[header+i*record_length:header+(i+1)*record_length]
        require(len(record)==record_length and record[:1]==b" ","DBF_ROW")
        def field(key):
            a,b=offsets[key]
            return record[a:b].decode("cp932").strip(" \0\t")
        cat=field("地目区分")
        require(cat in LANDUSE,"UNKNOWN_LANDUSE")
        code,name=field("JCODE"),field("SIKUCHOSON")
        require(len(code)==5 and code.startswith("16") and name,"INVALID_JCODE")
        require(field("KEN_1")=="富山県","PREFECTURE")
        g,s=field("GUN"),field("SICHO")
        land[cat]+=1;codes[(code,name)][cat]+=1;gun_names[(g,name)][cat]+=1
        groups.add(field("群コード"));fines.add(field("包括_統群"))
        cities.add(name);codenames.add(code)
        gun[g]+=1;sicho[s]+=1
    return land,codes,gun_names,len(groups),len(fines),len(cities),len(codenames),gun,sicho

def verify_zip(path,m):
    p=Path(path);s,geo=m["source"],m["geometry"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"],"ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_SHA")
    parts={}
    with zipfile.ZipFile(p) as z:
        entries=z.infolist()
        require(len(entries)==7,"ZIP_MEMBER_COUNT")
        for info,expected in zip(entries,s["members"]):
            name=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(name==s["member_folder"]+"/"+expected["name"],"ZIP_MEMBER_PATH")
            require(not info.is_dir() and info.file_size==expected["bytes"],"ZIP_MEMBER_LENGTH")
            contents=z.read(info)
            require(sha256(contents).hexdigest()==expected["sha256"],"ZIP_MEMBER_HASH")
            parts[expected["name"]]=contents
    shp,shx,dbf=(parts["k19富山県."+sfx] for sfx in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994 and
            struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_HEADER_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON")
    require((len(shx)-100)//8==632 and
            struct.unpack_from(">I",shx,24)[0]*2==len(shx),"SHX_HEADER")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),geo["bounds_lon_lat"])),"SHP_BBOX")
    require("GCS_JGD_2000" in parts["k19富山県.prj"].decode("ascii"),"PRJ")
    require("<CreaDate>20170117</CreaDate>" in parts["k19富山県.shp.xml"].decode("utf-8"),"XML_DATE")
    offset=100
    for i in range(632):
        declared_offset,declared_length=struct.unpack_from(">II",shx,100+i*8)
        require(declared_offset*2==offset and offset+8<=len(shp),"SHX_OFFSET")
        record_num,record_length=struct.unpack_from(">II",shp,offset)
        require(record_num==i+1 and declared_length==record_length,"SHX_RECORD_ORDER")
        require(struct.unpack_from("<I",shp,offset+8)[0]==5,"NON_POLYGON_SHAPE")
        offset+=8+record_length*2
    require(offset==len(shp),"SHP_RECORD_BYTES")
    land,city,gpair,groups,fines,names,codes,gun,sicho=parse_dbf(dbf)
    require(dict(land)==m["feature_counts_by_landuse"],"LANDUSE_REPLAY")
    require((groups,fines,names,codes)==(15,59,15,15),"SOIL_MUNICIPALITY_REPLAY")
    require(dict(gun)==EXPECTED_GUN and dict(sicho)=={"":632},"GUN_SICHO_REPLAY")
    got=[[c,n,*[city[(c,n)][cat] for cat in LANDUSE]] for c,n in sorted(city)]
    gotgun=[[g,n,*[gpair[(g,n)][cat] for cat in LANDUSE]] for g,n in sorted(gpair)]
    require(got==m["jcode_name_pairs_counts_by_landuse"],"JCODE_PAIRS_REPLAY")
    require(gotgun==m["gun_name_pairs_counts_by_landuse"],"GUN_PAIRS_REPLAY")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH",
            "prefecture":"富山県","polygons":632,"code_name_pairs":36,
            "gun_name_pairs":19,"official_credit_tco2e":None}

def main(argv):
    m=load()
    audit_register(m)
    if argv==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED",
                "polygons":632,"code_name_pairs":36,"gun_name_pairs":19,
                "raw_original_verified_in_ci":False}
    elif len(argv)==2 and argv[0]=="verify":
        result=verify_zip(argv[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p45-toyama-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:
        main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
