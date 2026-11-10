#!/usr/bin/env python3
"""NaFT P68 Fukuoka: public derived-soil audit, opt-in private original ZIP verification.
Original geographic data, ZIP, SHP and DBF are intentionally not committed to public GitHub.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p68-fukuoka-soil-shapefile-source-v1.json'
ZIP_SHA='dfce591f4f8b9758cbf0520245ff419011678cf57d38b1f82375b96485f1a276'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
COUNTS={'田':758,'普通畑':544,'牧草地':50,'樹園地':354}
GUN_COUNTS={'':1138,'遠賀郡':60,'粕屋郡':85,'鞍手郡':27,'嘉穂郡':14,'築上郡':76,'八女郡':29,'田川郡':110,'京都郡':76,'筑紫郡':14,'朝倉郡':59,'三井郡':16,'三瀦郡':2}
BBOX=[130.04199756363687,33.00175083943562,131.18911611641576,33.99441194425598]
MULTI_GUN={'大刀洗町':['三井郡','朝倉郡'],'築上町':['京都郡','築上郡'],'鞍手町':['遠賀郡','鞍手郡']}

def require(condition, detail):
    if not condition:raise ValueError('P68_FUKUOKA_SOURCE_BLOCKED:'+detail)

def total(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]

def grouped(rows,fields):
    counts=defaultdict(Counter)
    for row in rows:counts[tuple(row[key] for key in fields)][row['地目区分']]+=1
    return [[*key,*[v.get(land,0) for land in LAND]] for key,v in sorted(counts.items())]

def multiple(rows,index):
    items=defaultdict(set)
    for row in rows:items[row[index]].add(row[1-index])
    return {key:sorted(values) for key,values in items.items() if len(values)>1}

def audit(m):
    s,g=m['source'],m['geometry']
    require(m['schema']=='naft-p68-fukuoka-soil-shapefile-v1','SCHEMA')
    require(s['provided_filename']=='福岡県.zip' and s['member_folder']=='k40福岡県','SOURCE_NAME')
    require(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==10282149,'ZIP_SHA_SIZE')
    require(s['zip_entries']==len(s['members'])==7,'SEVEN_MEMBERS')
    require([x['name'] for x in s['members']]==['k40福岡県.'+e for e in EXT],'MEMBER_NAMES')
    require(s['uncompressed_bytes']==sum(x['bytes'] for x in s['members'])==16543070,'UNCOMPRESSED_SIZE')
    require(all(type(x['bytes']) is int and x['bytes']>0 and len(x['sha256'])==64 and set(x['sha256'])<=set('0123456789abcdef') for x in s['members']),'MEMBER_HASH_FORMAT')
    require(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','SOURCE_PROVENANCE')
    require(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'RAW_PRIVATE')
    require(g['type']=='POLYGON' and g['shape_count']==1706 and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BBOX,'GEOMETRY')
    require(g['unique_jcodes']==70 and g['municipality_name_count']==70 and g['administrative_code_name_pairs']==163 and g['gun_name_pairs']==99,'ADMIN_COUNTS')
    require(g['sicho_counts']=={'':1706} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==1706,'GUN_COUNTS')
    require(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==1706,'LAND_FIELDS')
    require(m['soil_group_code_categories']==18 and m['soil_fine_class_categories']==82 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CLASSES')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    require(len(cp)==163 and len(gp)==99,'PAIR_LENGTH')
    require(len({(r[0],r[1]) for r in cp})==163 and len({(r[0],r[1]) for r in gp})==99,'PAIR_UNIQUENESS')
    require(all(len(r)==6 and r[1] and all(type(n) is int and n>=0 for n in r[2:]) for r in cp+gp),'PAIR_VALUES')
    require(total(cp)==total(gp)==[COUNTS[k] for k in LAND],'PAIR_LAND_PARITY')
    require(len({r[0] for r in cp})==70 and len({r[1] for r in cp})==70 and all(len(r[0])==5 and r[0].isdigit() and r[0].startswith('40') for r in cp),'JCODE_FORMAT')
    ca=m['source_code_name_anomalies']
    require(ca['foreign_prefecture_code_feature_count']==0 and ca['foreign_code_prefix_totals']=={} and ca['foreign_prefecture_code_pairs']==[],'NO_FOREIGN_CODE')
    require(multiple(cp,0)==ca['codes_with_multiple_names'] and multiple(cp,1)==ca['names_with_multiple_codes'],'CODE_NAME_MULTI')
    require(len(ca['codes_with_multiple_names'])==43 and len(ca['names_with_multiple_codes'])==46,'CODE_MULTI_COUNT')
    require(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','BLOCK_UNSAFE_CITY_JOIN')
    ga=m['source_gun_quality']
    require(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==1138,'GUN_BLANK_COUNT')
    gun_count=Counter();named=defaultdict(set)
    for gun,name,*counts in gp:
        gun_count[gun]+=sum(counts)
        if gun:named[name].add(gun)
    require(dict(gun_count)==GUN_COUNTS,'GUN_PAIR_PARITY')
    ambiguous={name:sorted(guns) for name,guns in named.items() if len(guns)>1}
    require(ambiguous==ga['multiple_nonempty_guns_per_municipality_name']==MULTI_GUN,'MULTI_GUN')
    blanks=[{'municipality_name':name,'empty_gun_polygon_count':sum(values),'gun_names_seen_elsewhere':sorted(named[name])} for gun,name,*values in gp if not gun and name in named]
    require(blanks==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(x['empty_gun_polygon_count'] for x in blanks)==ga['empty_gun_features_for_names_with_county_elsewhere']==169,'BLANK_GUN_WITH_NAMED')
    require(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','BLOCK_UNSAFE_GUN_JOIN')
    history=m['historical_admin_warnings']
    require(history['source_has_nakagawa_machi'] is True and history['nakagawa_machi_label']=='那珂川町','HISTORICAL_NAKAGAWA')
    require(history['source_has_chikushi_gun'] is True and history['source_has_mizuma_spelling']=='三瀦郡','HISTORICAL_GUN')
    require(history['current_name_mapping_verified'] is False and history['joined_to_current_municipalities'] is False,'BLOCK_UNVERIFIED_MODERN_JOIN')
    require(any(r[1]=='那珂川町' for r in cp) and any(r[0]=='筑紫郡' for r in gp) and any(r[0]=='三瀦郡' for r in gp),'HISTORICAL_VALUES_PRESERVED')
    science=m['scientific_boundaries']
    require(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA_OR_MUNICIPAL_AGGREGATE')
    require(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NO_OFFICIAL_CARBON_CREDIT')
    return True

def name_cp932(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')

def parse_dbf(blob):
    require(len(blob)>=353,'DBF_SHORT')
    count,header,size=struct.unpack_from('<IHH',blob,4)
    require((count,header,size)==(1706,353,1098) and header+count*size<=len(blob),'DBF_HEADER')
    cols=[];off=32
    while off+32<=header and blob[off]!=13:
        spec=blob[off:off+32]
        require(spec[11]==ord('C'),'DBF_FIELD_NOT_TEXT')
        cols.append((spec[:11].split(b'\0')[0].decode('cp932'),spec[16]));off+=32
    require(off<header and blob[off]==13 and [n for n,_ in cols]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};pos=1
    for name,width in cols:spans[name]=(pos,pos+width);pos+=width
    require(pos==size,'DBF_RECORD_SIZE')
    rows=[]
    for i in range(count):
        raw=blob[header+i*size:header+(i+1)*size]
        require(len(raw)==size and raw[0]==0x20,'DBF_INACTIVE_RECORD')
        row={name:raw[start:end].decode('cp932').strip(' \t\0') for name,(start,end) in spans.items()}
        require(row['KEN_1']=='福岡県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_ATTR')
        require(all(row[name] for name in ('包括_統群','統群コード','亜群コード','群コード')),'DBF_REQUIRED_SOIL_MISSING')
        rows.append(row)
    return rows

def verify_shapes(shp,shx):
    require(len(shp)>=100 and len(shx)>=100,'SHP_SHORT')
    require(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHP_MAGIC')
    require(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHP_POLYGON')
    require(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHP_SHX_LENGTH')
    require(list(struct.unpack_from('<4d',shp,36))==BBOX,'SHP_BOUNDS')
    require(len(shx)==100+1706*8,'SHX_FEATURES')
    offset=100
    for i in range(1706):
        word_offset,word_len=struct.unpack_from('>II',shx,100+i*8)
        number,rec_words=struct.unpack_from('>II',shp,offset)
        require(word_offset*2==offset and word_len==rec_words and number==i+1,'SHP_SHX_ALIGNMENT')
        require(struct.unpack_from('<I',shp,offset+8)[0]==5,'SHP_RECORD_POLYGON')
        offset+=8+rec_words*2
        require(offset<=len(shp),'SHAPE_RECORD_OVERRUN')
    require(offset==len(shp),'SHAPE_TRAILING_BYTES')

def verify_zip(filename,m):
    p=Path(filename)
    require(p.is_file() and p.stat().st_size==10282149,'ORIGINAL_ZIP_SIZE')
    require(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    content={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();require(len(infos)==7,'ZIP_SEVEN_FILES')
        for info,ext,member in zip(infos,EXT,m['source']['members']):
            require(name_cp932(info)=='k40福岡県/'+member['name'],'ZIP_MEMBER_NAME')
            raw=z.read(info)
            require(len(raw)==member['bytes'] and sha256(raw).hexdigest()==member['sha256'],'ZIP_MEMBER_SHA')
            content[ext]=raw
    require(b'GCS_JGD_2000' in content['prj'],'SOURCE_CRS')
    require(b'<CreaDate>20170117</CreaDate>' in content['shp.xml'],'SOURCE_METADATA_DATE')
    verify_shapes(content['shp'],content['shx'])
    rows=parse_dbf(content['dbf'])
    require(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_CODE_REPLAY')
    require(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    require(dict(Counter(r['地目区分'] for r in rows))==COUNTS,'ORIGINAL_LAND_REPLAY')
    require(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'ORIGINAL_GUN_COUNT')
    require(dict(Counter(r['SICHO'] for r in rows))=={'':1706},'ORIGINAL_SICHO')
    require(len({r['群コード'] for r in rows})==18 and len({r['包括_統群'] for r in rows})==82,'ORIGINAL_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_1706_POLYGONS_VERIFIED','features':1706,'jcode_pairs':163,'gun_pairs':99,'original_files_verified':7,'raw_gis_committed':False}

def main(args):
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8'));audit(manifest)
    if args==['audit']:
        out={'status':'PUBLIC_REGISTER_CONSISTENT_PRIVATE_ORIGINAL_NOT_IN_CI','features':1706,'jcode_pairs':163,'gun_pairs':99,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':out=verify_zip(args[1],manifest)
    else:raise ValueError('USAGE: python3 scripts/p68-fukuoka-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
