#!/usr/bin/env python3
"""P42: offline source replay for user-provided Kanagawa soil GIS Shapefile ZIP.
No raw shapefile geometry is committed; CI only validates manifest consistency.
Python standard library only. Codes, names, and gun are preserved as in the source.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / "research/p42-kanagawa-soil-shapefile-source-v1.json"
LANDUSE = ("田", "普通畑", "牧草地", "樹園地")
FIELDS = ("地目区分", "包括_統群", "統群コード", "亜群コード", "群コード",
          "JCODE", "KEN_1", "SICHO", "GUN", "SIKUCHOSON")
GUN_COUNTS = {"":885, "三浦郡":4, "中郡":46, "愛甲郡":18, "足柄上郡":67, "足柄下郡":18, "高座郡":22}
GUN_SUSPECT = ["中郡", "中井町", 1, 0, 0, 1]

def require(ok, code):
    if not ok:
        raise ValueError("P42_KANAGAWA_SOURCE_BLOCKED:" + code)

def register():
    return json.loads(REGISTER.read_text(encoding="utf-8"))

def audit_register(m):
    s, geo = m["source"], m["geometry"]
    require(m["schema"] == "naft-p42-kanagawa-soil-shapefile-v1", "SCHEMA")
    require(s["zip_entries"] == len(s["members"]) == 7, "ZIP_ENTRIES")
    require(s["zip_bytes"] == 2684622 and len(s["source_zip_sha256"]) == 64, "ZIP_SIZE")
    require(s["source_zip_sha256"] == "997a9ceac06fd70c2223cfb086f4aebc9ad38a74070fa43fe7bf80797ad84282", "ZIP_HASH")
    require(sum(x["bytes"] for x in s["members"]) == s["uncompressed_bytes"] == 5082502, "MEMBER_TOTAL")
    require(all(x["name"].startswith("k14神奈川県.") and len(x["sha256"]) == 64 for x in s["members"]), "MEMBER_NAMES")
    require(s["member_folder"] == "k14神奈川県" and s["metadata_creation_date"] == "2017-01-17", "SOURCE_METADATA")
    require(s["publisher_authentication"] == s["redistribution_rights"] == "NOT_VERIFIED", "LICENSE_PENDING")
    require(s["source_match"] == "CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON", "PUBLISHER_SHA_UNVERIFIED")
    require(s["raw_geometry_committed"] is False and s["original_zip_committed"] is False, "RAW_MUST_NOT_PUBLISH")
    require(geo["type"] == "POLYGON" and geo["crs"] == "GCS_JGD_2000", "CRS")
    require(geo["shape_count"] == 1060 and geo["municipality_name_count"] == 52 and geo["unique_jcodes"] == 55 and geo["administrative_code_name_pairs"] == 128, "FEATURE_COUNTS")
    require(geo["sicho_unique_values"] == [""] and geo["sicho_counts"] == {"":1060}, "NO_SUBPREFECTURE")
    require(geo["gun_counts"] == GUN_COUNTS and sum(GUN_COUNTS.values()) == 1060, "GUN_TOTALS")
    require(m["fields"] == list(FIELDS), "DBF_FIELDS")
    require(m["soil_group_code_categories"] == 17 and m["soil_fine_class_categories"] == 63, "SOIL_CLASSES")
    require(m["feature_counts_by_landuse"] == {"田":262,"普通畑":499,"牧草地":7,"樹園地":292}, "LANDUSE_COUNTS")
    require(sum(m["feature_counts_by_landuse"].values()) == 1060, "LANDUSE_TOTAL")

    pairs=m["jcode_name_pairs_counts_by_landuse"]
    require(len(pairs)==128 and len({(r[0],r[1]) for r in pairs})==128, "JCODE_PAIRS")
    require(all(len(r)==6 and len(r[0])==5 and r[0][:2] in ("13","14") for r in pairs), "CODE_PREFIX")
    require([sum(r[2+i] for r in pairs) for i in range(4)] == [m["feature_counts_by_landuse"][k] for k in LANDUSE], "JCODE_LANDUSE_PARITY")
    code_names,name_codes=defaultdict(set),defaultdict(set)
    for code,name,*counts in pairs:
        code_names[code].add(name)
        name_codes[name].add(code)
    require(len(code_names)==55 and len(name_codes)==52, "JCODE_NAME_COUNTS")
    anomaly=m["source_code_name_anomalies"]
    foreign=[r for r in pairs if not r[0].startswith("14")]
    require(foreign == anomaly["foreign_prefecture_code_pairs"], "FOREIGN_PAIRS")
    require(len(foreign)==6 and sum(sum(r[2:]) for r in foreign)==anomaly["foreign_prefecture_code_feature_count"]==18, "FOREIGN_FEATURES")
    require(anomaly["foreign_prefixes"]==["13"] and anomaly["foreign_code_prefix_totals"]=={"13":18}, "FOREIGN_DISTRIBUTION")
    require(anomaly["one_to_one_code_name_mapping"] is False and anomaly["status"]=="UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN", "NO_CITY_JOIN")
    require({k:sorted(v) for k,v in code_names.items() if len(v)>1}==anomaly["codes_with_multiple_names"], "JCODE_MULTINAME")
    require({k:sorted(v) for k,v in name_codes.items() if len(v)>1}==anomaly["names_with_multiple_codes"], "NAME_MULTICODE")
    require(sum(len(v)>1 for v in code_names.values())==36 and sum(len(v)>1 for v in name_codes.values())==39, "MAPPING_AMBIGUITY")

    gun_pairs=m["gun_name_pairs_counts_by_landuse"]
    require(len(gun_pairs)==63 and len({(r[0],r[1]) for r in gun_pairs})==63, "GUN_PAIRS")
    require([sum(r[2+i] for r in gun_pairs) for i in range(4)]==[m["feature_counts_by_landuse"][k] for k in LANDUSE], "GUN_LANDUSE_PARITY")
    require({g:sum(sum(r[2:]) for r in gun_pairs if r[0]==g) for g in GUN_COUNTS}==GUN_COUNTS, "GUN_COUNTS_PARITY")
    require(GUN_SUSPECT in gun_pairs, "NAKAI_GUN_PAIR")
    require(m["source_gun_anomalies"]["suspicious_gun_name_pairs"] == [{
      "gun":"中郡","municipality_name":"中井町","jcode":"14342","polygons":2,
      "landuse_counts":{"田":1,"普通畑":0,"牧草地":0,"樹園地":1},
      "issue":"中井町は足柄上郡だが、原本の2レコードはGUN=中郡。原本値のまま要照合"
    }], "NAKAI_GUN_PROVENANCE")
    require(m["source_gun_anomalies"]["resolution"]=="UNRESOLVED_ORIGINAL_KEPT_NO_GUN_NORMALIZATION", "NO_GUN_JOIN")
    sb=m["scientific_boundaries"]
    require(sb["jcode_name_conflict_detected"] is True and sb["gun_name_conflict_detected"] is True, "SOURCE_CONFLICT_NOTICES")
    require(sb["municipality_level_aggregations_pending_reconciliation"] is True and sb["official_credit_tco2e"] is None, "SCIENTIFIC_GUARDS")
    return True

def read_dbf(blob):
    require(len(blob)>=353, "DBF_SHORT")
    n, header, length = struct.unpack_from("<IHH", blob, 4)
    require((n,header,length)==(1060,353,1098) and header+n*length<=len(blob), "DBF_HEADER")
    fields=[];cursor=32
    while cursor+32<=header and blob[cursor]!=13:
        entry=blob[cursor:cursor+32]
        field=entry[:11].split(b"\0",1)[0].decode("cp932")
        require(entry[11]==ord("C"), "DBF_NOT_TEXT")
        fields.append((field,entry[16]))
        cursor+=32
    require(cursor<header and blob[cursor]==13, "DBF_DESCRIPTOR_END")
    require([f for f,_ in fields]==list(FIELDS), "DBF_COLUMNS")
    offsets={};p=1
    for f,size in fields:
        offsets[f]=(p,p+size)
        p+=size
    require(p==length, "DBF_RECORD_LENGTH")
    land=Counter();city=defaultdict(Counter);gun_names=defaultdict(Counter)
    group,fine,codes,names=set(),set(),set(),set()
    sicho=Counter();gun=Counter();nakai=[]
    for i in range(n):
        row=blob[header+i*length:header+(i+1)*length]
        require(len(row)==length and row[:1]==b" ", "DBF_DELETED_OR_TRUNCATED")
        def field(k):
            a,b=offsets[k]
            return row[a:b].decode("cp932").strip(" \0\t")
        category=field("地目区分")
        require(category in LANDUSE, "UNKNOWN_LANDUSE")
        code,name=field("JCODE"),field("SIKUCHOSON")
        require(len(code)==5 and code[:2] in ("13","14") and name, "CODE_OR_NAME")
        require(field("KEN_1")=="神奈川県", "PREFECTURE")
        g=field("GUN");s=field("SICHO")
        land[category]+=1
        city[(code,name)][category]+=1
        gun_names[(g,name)][category]+=1
        codes.add(code);names.add(name)
        group.add(field("群コード"));fine.add(field("包括_統群"))
        sicho[s]+=1;gun[g]+=1
        if g=="中郡" and name=="中井町":nakai.append((code,category))
    return land,city,gun_names,len(group),len(fine),codes,names,gun,sicho,sorted(nakai)

def verify_zip(path,m):
    p=Path(path)
    s=m["source"];geo=m["geometry"]
    require(p.is_file() and p.stat().st_size==s["zip_bytes"], "ZIP_SIZE")
    require(sha256(p.read_bytes()).hexdigest()==s["source_zip_sha256"], "ZIP_HASH")
    parts={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist()
        require(len(infos)==7, "ZIP_MEMBER_COUNT")
        for info,declared in zip(infos,s["members"]):
            fname=info.filename if info.flag_bits&0x800 else info.filename.encode("cp437").decode("cp932")
            require(fname==s["member_folder"]+"/"+declared["name"], "ZIP_MEMBER_PATH")
            require(not info.is_dir() and info.file_size==declared["bytes"], "ZIP_MEMBER_BYTES")
            blob=z.read(info)
            require(sha256(blob).hexdigest()==declared["sha256"], "ZIP_MEMBER_HASH")
            parts[declared["name"]]=blob
    shp,shx,dbf=(parts["k14神奈川県."+e] for e in ("shp","shx","dbf"))
    require(struct.unpack_from(">I",shp,0)[0]==9994, "SHP_MAGIC")
    require(struct.unpack_from(">I",shp,24)[0]*2==len(shp), "SHP_FILE_LENGTH")
    require(struct.unpack_from("<II",shp,28)==(1000,5), "SHP_POLYGON")
    require((len(shx)-100)//8==geo["shape_count"], "SHX_COUNT")
    require(all(abs(a-b)<1e-9 for a,b in zip(struct.unpack_from("<4d",shp,36),geo["bounds_lon_lat"])), "SHP_BOUNDS")
    require("GCS_JGD_2000" in parts["k14神奈川県.prj"].decode("ascii"), "PRJ")
    require("<CreaDate>20170117</CreaDate>" in parts["k14神奈川県.shp.xml"].decode("utf-8"), "XML_DATE")
    land,city,gun_names,groups,fine,codes,names,gun,sicho,nakai=read_dbf(dbf)
    require(dict(land)==m["feature_counts_by_landuse"], "LANDUSE_REPLAY")
    require(groups==m["soil_group_code_categories"] and fine==m["soil_fine_class_categories"], "SOIL_REPLAY")
    require((len(codes),len(names),len(city))==(55,52,128), "MUNICIPALITY_REPLAY")
    require(dict(gun)==geo["gun_counts"] and dict(sicho)==geo["sicho_counts"], "GUN_SICHO_REPLAY")
    crows=[[code,name]+[city[(code,name)][cat] for cat in LANDUSE] for (code,name) in sorted(city)]
    grows=[[g,name]+[gun_names[(g,name)][cat] for cat in LANDUSE] for (g,name) in sorted(gun_names)]
    require(crows==m["jcode_name_pairs_counts_by_landuse"], "JCODE_PAIR_REPLAY")
    require(grows==m["gun_name_pairs_counts_by_landuse"], "GUN_PAIR_REPLAY")
    require(nakai==[("14342","樹園地"),("14342","田")], "NAKAI_GUN_RECORDS")
    return {"status":"SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH","prefecture":"神奈川県",
            "polygons":1060,"municipality_names":52,"jcode_name_pairs":128,
            "gun_name_pairs":63,"official_credit_tco2e":None}

def main(args):
    m=register()
    audit_register(m)
    if args==["audit"]:
        result={"status":"REGISTER_CONSISTENT_RAW_NOT_COMMITTED",
                "polygons":1060,"municipality_names":52,"jcode_name_pairs":128,
                "gun_name_pairs":63,"raw_original_verified_in_ci":False}
    elif len(args)==2 and args[0]=="verify":
        result=verify_zip(args[1],m)
    else:
        raise ValueError("USAGE: python3 scripts/p42-kanagawa-soil-audit.py audit | verify ORIGINAL.zip")
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    try:
        main(sys.argv[1:])
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
