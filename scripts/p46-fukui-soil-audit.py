#!/usr/bin/env python3
"""NaFT P46 Fukui soil GIS: source byte and DBF attribute integrity replay.
Requires Python standard library only. Public CI checks registry; 'verify' needs private original ZIP.
Original raw geometry is intentionally NOT committed to GitHub.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTRY=ROOT/"research/p46-fukui-soil-shapefile-source-v1.json"
LANDUSE=("田","普通畑","牧草地","樹園地")
FIELDS=("地目区分","包括_統群","統群コード","亜群コード","群コード","JCODE","KEN_1","SICHO","GUN","SIKUCHOSON")
GUN={"":333,"三方上中郡":30,"三方郡":32,"丹生郡":26,"今立郡":17,"南条郡":18,"吉田郡":20,"大飯郡":34}
COUNTS={"田":265,"普通畑":159,"牧草地":19,"樹園地":67}
MISSING_GUN_NAMES={"南越前町":3,"永平寺町":8,"若狭町":3,"越前町":6}

def require(condition, reason):
    if not condition:
        raise ValueError("P46_FUKUI_SOURCE_BLOCKED:"+reason)

def load():
    return json.loads(REGISTRY.read_text(encoding="utf-8"))

def audit_register(m):
    s,g=m["source"],m["geometry"]
    require(m["schema"]=="naft-p46-fukui-soil-shapefile-v1","SCHEMA")
    require(s["provided_filename"]=="福井県.zip" and s["member_folder"]=="k21福井県","SOURCE_NAME")
    require(s["source_zip_sha256"]=="4c81e96c9a94f48990cd4ba8ba14cf44ce9fced90321cb30ca65f0dbc2ec5357","SOURCE_HASH")
    require(s["zip_bytes"]==3111309,"SOURCE_BYTES")
    require(s["zip_entries"]==len(s["members"])==7,"ZIP_ENTRIES")
    require(sum(x["bytes"] for x in s["members"])==s["uncompressed_bytes"]==5089966,"MEMBER_SIZE")
    require(all(x["name"].startswith("k21福井県.") and len(x["sha256"])==64 for x in s["members"]),"MEMBER_NAMES")
    require(s["metadata_creation_date"]=="2017-01-17" and s["source_match"]=="CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON","SOURCE_DATE")
    require(s["redistribution_rights"]==s["publisher_authentication"]=="NOT_VERIFIED","RIGHTS_UNVERIFIED")
    require(s["raw_geometry_committed"] is False and s["original_zip_committed"] is False,"RAW_NOT_PUBLISHED")
    require(g["type"]=="POLYGON" and g["crs"]=="GCS_JGD_2000","GEOMETRY")
    require(g["shape_count"]==510 and g["municipality_name_count"]==17 and g["unique_jcodes"]==18 and g["administrative_code_name_pairs"]==31,"FEATURE_COUNTS")
    require(g["bounds_lon_lat"]==[135.45436972693855,35.38873158534855,136.69095552335563,36.288086622838335],"BOUNDS")
    require(g["sicho_unique_values"]==[""] and g["sicho_counts"]=={"":510},"SICHO")
    require(g["gun_counts"]==GUN and sum(GUN.values())==510,"GUN")
    require(m["fields"]==list(FIELDS),"DBF_FIELDS")
    require(m["soil_group_code_categories"]==16 and m["soil_fine_class_categories"]==48,"SOIL_CLASSES")
    require(m["feature_counts_by_landuse"]==COUNTS and sum(COUNTS.values())==510,"LANDUSE")
    pairs=m["jcode_name_pairs_counts_by_landuse"]
    require(len(pairs)==31 and len({(r[0],r[1]) for r in pairs})==31,"JCODE_PAIRS")
    require(all(len(r)==6 and len(r[0])==5 and r[0][:2] in ("17","18") and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in pairs),"PAIR_ROWS")
    require([sum(r[2+i] for r in pairs) for i in range(4)]==[COUNTS[x] for x in LANDUSE],"PAIR_PARITY")
    code_names,name_codes=defaultdict(set),defaultdict(set)
    for code,name,*values in pairs:
        code_names[code].add(name)
        name_codes[name].add(code)
    require(len(code_names)==18 and len(name_codes)==17,"CODE_NAME_SETS")
    a=m["source_code_name_anomalies"]
    foreign=[r for r in pairs if r[0].startswith("17")]
    require(foreign==a["foreign_prefecture_code_pairs"]==[["17206","あわら市",0,0,0,1]],"FOREIGN_CODE_PAIR")
    require(sum(sum(r[2:]) for r in foreign)==a["foreign_prefecture_code_feature_count"]==1,"FOREIGN_FEATURE")
    require(a["foreign_prefixes"]==["17"] and a["foreign_code_prefix_totals"]=={"17":1},"FOREIGN_PREFIX")
    require(a["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN" and a["one_to_one_code_name_mapping"] is False,"NO_CITY_JOIN")
    require({k:sorted(v) for k,v in code_names.items() if len(v)>1}==a["codes_with_multiple_names"],"MULTI_CODE_NAMES")
    require({k:sorted(v) for k,v in name_codes.items() if len(v)>1}==a["names_with_multiple_codes"],"MULTI_NAME_CODES")
    require(sum(len(v)>1 for v in code_names.values())==8 and sum(len(v)>1 for v in name_codes.values())==9,"MULTI_COUNTS")
    gp=m["gun_name_pairs_counts_by_landuse"]
    require(len(gp)==22 and len({(r[0],r[1]) for r in gp})==22,"GUN_PAIRS")
    require(all(len(r)==6 and isinstance(r[0],str) and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in gp),"GUN_ROWS")
    require([sum(r[2+i] for r in gp) for i in range(4)]==[COUNTS[x] for x in LANDUSE],"GUN_LANDUSE")
    require({g:sum(sum(r[2:]) for r in gp if r[0]==g) for g in GUN}==GUN,"GUN_PAIR_COUNTS")
    q=m["source_gun_quality"]
    require(q["gun_feature_counts"]==GUN and q["status"]=="SOURCE_GUN_VARIATION_KEPT_NO_GUN_JOIN","SOURCE_GUN_LOCK")
    require(q["empty_gun_features_for_known_gun_towns"]==20,"MISSING_GUN_COUNT")
    missing=q["empty_gun_name_pairs_with_nonempty_gun_elsewhere"]
    require(len(missing)==4 and {x["municipality_name"]:x["empty_gun_polygon_count"] for x in missing}==MISSING_GUN_NAMES,"MISSING_GUN_MUNICIPALITIES")
    for item in missing:
        nm=item["municipality_name"]
        require(["",nm]+[item["empty_gun_landuse_counts"][x] for x in LANDUSE] in gp,"MISSING_GUN_PAIR_PARITY")
        other=sorted({r[0] for r in gp if r[1]==nm and r[0]})
        require(other==item["gun_names_seen_elsewhere"],"MISSING_GUN_NAMED_PARITY")
    require(q["wakasa_multiple_gun_names_as_source"]==[["三方上中郡","若狭町"],["三方郡","若狭町"]],"WAKASA_GUN_VARIATION")
    require(q["wakasa_sanpo_gun_feature_count"]==2 and q["wakasa_sanpo_gun_landuse"]=={"田":1,"普通畑":0,"牧草地":0,"樹園地":1},"WAKASA_GUN_COUNT")
    require(["三方郡","若狭町",1,0,0,1] in gp and ["三方上中郡","若狭町",13,7,1,9] in gp,"WAKASA_GUN_ROWS")
    sb=m["scientific_boundaries"]
    require(sb["official_credit_tco2e"] is None and sb["calculation_of_certified_credits_prohibited"] is True,"NO_CREDIT_INFERENCE")
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_missingness_detected"] is True and sb["gun_name_variation_detected"] is True,"SOURCE_ANOMALIES")
    require(sb["municipality_level_aggregations_pending_reconciliation"] is True,"NO_EXTERNAL_JOIN")
    return True

def read_dbf(blob):
    require(len(blob)>=353,"DBF_TRUNCATED")
    n,header,length=struct.unpack_from("<IHH",blob,4)
    require((n,header,length)==(510,353,1098) and header+n*length<=len(blob),"DBF_HEADER")
    fields=[];p=32
    while p+32<=header and blob[p]!=13:
        descriptor=blob[p:p+32]
        fields.append((descriptor[:11].split(b"\0",1)[0].decode("cp932"),descriptor[16]))
        require(descriptor[11]==ord("C"),"NON_TEXT_FIELD")
        p+=32
    require(p<header and blob[p]==13,"DBF_END_FIELDS")
    require([k for k,_ in fields]==list(FIELDS),"DBF_COLUMNS")
    offsets={};position=1
    for k,size in fields:
        offsets[k]=(position,position+size)
        position+=size
    require(position==length,"DBF_RECORD_LENGTH")
    lu=Counter();cp=defaultdict(Counter);gp=defaultdict(Counter)
    code_names,name_codes=defaultdict(set),defaultdict(set)
    groups,fines=set(),set();sicho=Counter();guns=Counter()
    foreign=[];wakasa=[]
    for i in range(n):
        row=blob[header+i*length:header+(i+1)*length]
        require(len(row)==length and row[:1]==b" ","DBF_DELETED_ROW")
        def value(k):
            a,b=offsets[k]
            return row[a:b].decode("cp932").strip(" \0\t")
        cat=value("地目区分");code=value("JCODE");name=value("SIKUCHOSON")
        require(cat in LANDUSE and len(code)==5 and code[:2] in ("17","18") and name,"DBF_ROW_CONTENT")
        require(value("KEN_1")=="福井県","NOT_FUKUI")
        g=value("GUN");s=value("SICHO")
        lu[cat]+=1
        cp[(code,name)][cat]+=1
        gp[(g,name)][cat]+=1
        code_names[code].add(name);name_codes[name].add(code)
        groups.add(value("群コード"));fines.add(value("包括_統群"))
        guns[g]+=1;sicho[s]+=1
        if code.startswith("17"):foreign.append((code,name,cat))
        if name=="若狭町" and g=="三方郡":wakasa.append((code,cat))
    return lu,cp,gp,len(groups),len(fines),code_names,name_codes,guns,sicho,sorted(foreign),sorted(wakasa)

def verify_zip(source,m):
    source=Path(source)
    s,g=m["source"],m["geometry"]
    require(source.is_file() and source.stat().st_size==s["zip_bytes"],"ZIP_SIZE")
    require(sha256(source.read_bytes()).hexdigest()==s["source_zip_sha256"],"ZIP_SHA256")
    data={}
    with zipfile.ZipFile(source) as zipf:
        infos=zipf.infolist()
        require(len(infos)==7,"ZIP_MEMBER_COUNT")
        for info,declared in zip(infos,s["members"]):
            name=info.filename if info.flag_bits&2048 else info.filename.encode("cp437").decode("cp932")
            require(name==s["member_folder"]+"/"+declared["name"],"ZIP_MEMBER_NAME")
            require(not info.is_dir() and info.file_size==declared["bytes"],"ZIP_MEMBER_SIZE")
            content=zipf.read(info)
            require(sha256(content).hexdigest()==declared["sha256"],"ZIP_MEMBER_SHA256")
            data[declared["name"]]=content
    shp,shx,dbf=(data["k21福井県."+suffix] for suffix in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994,"SHP_MAGIC")
    require(struct.unpack_from(">I",shp,24)[0]*2==len(shp),"SHP_BYTE_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5),"SHP_POLYGON_TYPE")
    require((len(shx)-100)//8==g["shape_count"],"SHX_FEATURE_COUNT")
    require(all(abs(x-y)<1e-9 for x,y in zip(struct.unpack_from("<4d",shp,36),g["bounds_lon_lat"])),"SHP_BOUNDS")
    require("GCS_JGD_2000" in data["k21福井県.prj"].decode("ascii"),"SHP_CRS")
    require("<CreaDate>20170117</CreaDate>" in data["k21福井県.shp.xml"].decode("utf-8"),"SHAPE_METADATA_DATE")
    lu,cp,gp,ng,nf,codes,names,guns,sicho,foreign,wakasa=read_dbf(dbf)
    require(dict(lu)==COUNTS,"DBF_LANDUSE")
    require(ng==16 and nf==48,"DBF_SOIL_CLASS")
    require((len(cp),len(codes),len(names))==(31,18,17),"DBF_JCODE_COUNTS")
    require(dict(guns)==GUN and dict(sicho)=={"":510},"DBF_GUN_AND_SICHO")
    code_rows=[[c,n]+[cp[(c,n)][cat] for cat in LANDUSE] for (c,n) in sorted(cp)]
    gun_rows=[[gu,n]+[gp[(gu,n)][cat] for cat in LANDUSE] for (gu,n) in sorted(gp)]
    require(code_rows==m["jcode_name_pairs_counts_by_landuse"],"DBF_JCODE_PAIR_REPLAY")
    require(gun_rows==m["gun_name_pairs_counts_by_landuse"],"DBF_GUN_PAIR_REPLAY")
    require(foreign==[("17206","あわら市","樹園地")],"DBF_FOREIGN_CODE")
    require(wakasa==[("18442","樹園地"),("18442","田")],"DBF_WAKASA_GUN")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"福井県","polygons":510,
            "jcode_name_pairs":31,"gun_name_pairs":22,"official_credit_tco2e":None}

def main(argv):
    m=load()
    audit_register(m)
    if argv==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED","polygons":510,
                "jcode_name_pairs":31,"gun_name_pairs":22,"raw_original_verified_in_ci":False}
    elif len(argv)==2 and argv[0]=="verify":
        result=verify_zip(argv[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p46-fukui-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:
        main(sys.argv[1:])
    except Exception as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
