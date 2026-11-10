#!/usr/bin/env python3
"""P56 Hyogo soil GIS source audit. stdlib-only; public CI checks registry.

verify PRIVATE_ORIGINAL.zip replays seven original member hashes and every DBF
row against registered code-name and gun-name polygon counts. No raw GIS is
published, and no hectares/carbon/credit inference is permitted.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTRY=ROOT/'research/p56-hyogo-soil-shapefile-source-v1.json'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード',
        'JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXPECTED_COUNTS={'田':615,'普通畑':333,'牧草地':60,'樹園地':208}
GUN={'':942,'佐用郡':40,'加古郡':15,'多可郡':23,'川辺郡':20,'揖保郡':10,
     '神崎郡':47,'美方郡':106,'船井郡':1,'赤穂郡':12}
FOREIGN={'26':6,'27':2}
SOURCE_SHA='d0e2c012e060014b341595d3a34aadb83498476290c7a1ae1cd2a27363733e38'
BBOX=[134.27031944612435,34.16185850089661,135.4491554823112,35.668150185835]

def require(ok, why):
    if not ok:raise ValueError('P56_HYOGO_SOURCE_BLOCKED:'+why)
def load():return json.loads(REGISTRY.read_text(encoding='utf8'))
def totals(rows):return [sum(r[2+i] for r in rows) for i in range(4)]
def group(rows,keys):
    g=defaultdict(Counter)
    for row in rows:g[tuple(row[k] for k in keys)][row['地目区分']]+=1
    return [[*k,*[counts[land] for land in LAND]] for k,counts in sorted(g.items())]

def audit(m):
    s,g=m['source'],m['geometry']
    require(m['schema']=='naft-p56-hyogo-soil-shapefile-v1','SCHEMA')
    require(s['provided_filename']=='兵庫県.zip' and s['member_folder']=='k28兵庫県','SOURCE_NAME')
    require(s['source_zip_sha256']==SOURCE_SHA and s['zip_bytes']==11256943,'ZIP_SHA_AND_BYTES')
    require(s['zip_entries']==len(s['members'])==7 and s['uncompressed_bytes']==17355914,'ZIP_MEMBER_COUNT')
    require([x['name'] for x in s['members']]==['k28兵庫県.'+x for x in ('dbf','prj','sbn','sbx','shp','shp.xml','shx')],'MEMBER_NAMES')
    require(sum(x['bytes'] for x in s['members'])==s['uncompressed_bytes'],'ZIP_MEMBER_SIZE')
    require(all(isinstance(x['bytes'],int) and x['bytes']>0 and len(x['sha256'])==64 and all(c in '0123456789abcdef' for c in x['sha256']) for x in s['members']),'ZIP_MEMBER_HASH')
    require(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    require(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED','UNVERIFIED_LICENSE')
    require(s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'NO_RAW_PUBLICATION')
    require(g['shape_count']==1216 and g['type']=='POLYGON' and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BBOX,'GEOMETRY')
    require(g['unique_jcodes']==46 and g['municipality_name_count']==44 and g['administrative_code_name_pairs']==102,'JCODE_NAME_COUNTS')
    require(g['sicho_unique_values']==[''] and g['sicho_counts']=={'':1216},'SICHO')
    require(g['gun_counts']==GUN and sum(GUN.values())==1216,'GUN_COUNTS')
    require(g['jcodes_are_five_digit'] is True and m['fields']==list(FIELDS),'FIELDS')
    require(m['feature_counts_by_landuse']==EXPECTED_COUNTS and sum(EXPECTED_COUNTS.values())==1216,'LANDUSE')
    require(m['soil_group_code_categories']==18 and m['soil_fine_class_categories']==68,'SOIL_CATEGORIES')
    require(m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_MISSING')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    require(len(cp)==102 and len({(r[0],r[1]) for r in cp})==102,'JCODE_PAIR_COUNT')
    require(len(gp)==52 and len({(r[0],r[1]) for r in gp})==52,'GUN_PAIR_COUNT')
    require(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    require(all(len(r[0])==5 and r[0].isdigit() and r[0][:2] in ('26','27','28') for r in cp),'JCODE_FORMAT')
    require(totals(cp)==totals(gp)==[EXPECTED_COUNTS[k] for k in LAND],'CROSSCHECK_BY_LANDUSE')
    codes,names=defaultdict(set),defaultdict(set)
    for code,name,*_ in cp:codes[code].add(name);names[name].add(code)
    require(len(codes)==46 and len(names)==44,'CODE_NAME_UNIQUE')
    ano=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('28')]
    pref=Counter()
    for r in foreign:pref[r[0][:2]]+=sum(r[2:])
    require(foreign==ano['foreign_prefecture_code_pairs'] and dict(sorted(pref.items()))==FOREIGN,'FOREIGN_JCODE_VALUES')
    require(len(foreign)==5 and sum(pref.values())==ano['foreign_prefecture_code_feature_count']==8,'FOREIGN_JCODE_EIGHT')
    require(ano['foreign_code_prefix_totals']==FOREIGN and ano['foreign_prefixes']==['26','27'],'FOREIGN_PREFIX')
    require(ano['one_to_one_code_name_mapping'] is False and ano['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','JOIN_HOLD')
    require({k:sorted(v) for k,v in codes.items() if len(v)>1}==ano['codes_with_multiple_names'],'CODE_MULTIPLE_NAMES')
    require({k:sorted(v) for k,v in names.items() if len(v)>1}==ano['names_with_multiple_codes'],'NAME_MULTIPLE_CODES')
    require(sum(len(v)>1 for v in codes.values())==25 and sum(len(v)>1 for v in names.values())==31,'NAME_CODE_MANY_COUNT')
    require(ano['historical_place_name_polygon_counts']=={'篠山市':32} and ano['historical_place_names_as_source']==['篠山市'],'HISTORICAL_TOWN')
    require(sum(sum(r[2:]) for r in cp if r[1]=='篠山市')==32,'HISTORIC_NAME_PARITY')
    qc=m['source_gun_quality']
    gun_count=Counter();town_names=defaultdict(set)
    for gun,name,*vals in gp:
        gun_count[gun]+=sum(vals)
        if gun:town_names[name].add(gun)
    require(dict(sorted(gun_count.items()))==GUN and qc['gun_feature_counts']==GUN,'GUN_PAIR_PARITY')
    blank=[{'municipality_name':name,'empty_gun_landuse_counts':dict(zip(LAND,vals)),
            'empty_gun_polygon_count':sum(vals),'gun_names_seen_elsewhere':sorted(town_names[name])}
           for gun,name,*vals in gp if gun=='' and name in town_names]
    require(blank==qc['empty_gun_name_pairs_with_nonempty_gun_elsewhere'],'GUN_NULL_PAIRS')
    require(sum(row['empty_gun_polygon_count'] for row in blank)==qc['empty_gun_features_for_names_with_county_elsewhere']==71,'GUN_NULL_71')
    require(sum(row['empty_gun_polygon_count'] for row in blank if row['municipality_name'].endswith(('町','村')))==qc['empty_gun_features_in_town_village_names']==40,'GUN_NULL_TOWNS_40')
    require(qc['empty_gun_features_in_historical_city_name']==31,'GUN_NULL_CITY_31')
    require(qc['foreign_gun_name_pairs_suspected']==[{'gun':'船井郡','municipality_name':'篠山市','landuse_counts':{'田':1,'普通畑':0,'牧草地':0,'樹園地':0},'polygon_count':1,'jcode':'26407'}],'FOREIGN_GUN_ONE')
    require(['船井郡','篠山市',1,0,0,0] in gp and qc['multiple_nonempty_guns_per_municipality_name']=={},'FOREIGN_GUN_PAIR')
    require(qc['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_UNVERIFIED_GUN_JOIN')
    bounds=m['scientific_boundaries']
    require(bounds['jcode_name_conflict_detected'] is True and bounds['gun_name_conflict_detected'] is True,'NOTICE_ANOMALIES')
    require(bounds['municipality_level_aggregations_pending_reconciliation'] is True,'NO_CITY_JOIN')
    require(bounds['official_credit_tco2e'] is None and bounds['calculation_of_certified_credits_prohibited'] is True,'NO_CREDITS')
    return True

def parse_dbf(blob):
    require(len(blob)>=353,'DBF_TOO_SHORT')
    n,head,recordsize=struct.unpack_from('<IHH',blob,4)
    require((n,head,recordsize)==(1216,353,1098) and head+n*recordsize<=len(blob),'DBF_HEADER')
    schema=[];p=32
    while p+32<=head and blob[p]!=13:
        f=blob[p:p+32]
        require(f[11]==ord('C'),'DBF_TYPE')
        schema.append((f[:11].split(b'\0',1)[0].decode('cp932'),f[16]));p+=32
    require(p<head and blob[p]==13,'DBF_TERMINATOR')
    require([x[0] for x in schema]==list(FIELDS),'DBF_FIELDS')
    offsets={};start=1
    for name,length in schema:offsets[name]=(start,start+length);start+=length
    require(start==recordsize,'DBF_RECORD_LENGTH')
    rows=[]
    for i in range(n):
        data=blob[head+i*recordsize:head+(i+1)*recordsize]
        require(len(data)==recordsize and data[:1]==b' ','DBF_ROW_DELETED_OR_SHORT')
        item={name:data[a:b].decode('cp932').strip(' \0\t') for name,(a,b) in offsets.items()}
        require(item['KEN_1']=='兵庫県' and item['SICHO']=='' and item['地目区分'] in LAND and item['SIKUCHOSON'],'DBF_ROW_VALUES')
        rows.append(item)
    return rows

def verify(original,reg):
    p=Path(original);src=reg['source']
    require(p.is_file() and p.stat().st_size==src['zip_bytes'],'SOURCE_ZIP_BYTES')
    require(sha256(p.read_bytes()).hexdigest()==src['source_zip_sha256'],'SOURCE_ZIP_HASH')
    blobs={}
    with zipfile.ZipFile(p) as z:
        require(len(z.infolist())==7,'MEMBER_COUNT')
        for info,ref in zip(z.infolist(),src['members']):
            name=info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
            require(name==src['member_folder']+'/'+ref['name'],'ORIGINAL_MEMBER_NAME')
            data=z.read(info)
            require(not info.is_dir() and len(data)==ref['bytes'] and sha256(data).hexdigest()==ref['sha256'],'ORIGINAL_MEMBER_HASH')
            blobs[ref['name'].rsplit('.',1)[-1]]=data
    shp,shx,dbf=blobs['shp'],blobs['shx'],blobs['dbf']
    require(struct.unpack_from('>I',shp,0)[0]==9994 and struct.unpack_from('>I',shp,24)[0]*2==len(shp),'SHP_MAGIC_LENGTH')
    require(struct.unpack_from('<II',shp,28)==(1000,5),'SHP_TYPE')
    require(struct.unpack_from('>I',shx,24)[0]*2==len(shx) and (len(shx)-100)//8==1216,'SHX_LENGTH')
    require(struct.unpack_from('<4d',shp,36)==tuple(BBOX),'SHP_BBOX')
    require('GCS_JGD_2000' in blobs['prj'].decode('ascii'),'CRS')
    require('<CreaDate>20170117</CreaDate>' in blobs['xml'].decode('utf8'),'XML_META')
    rows=parse_dbf(dbf)
    require(Counter(r['地目区分'] for r in rows)==EXPECTED_COUNTS,'RAW_LANDUSE_REPLAY')
    require(group(rows,('JCODE','SIKUCHOSON'))==reg['jcode_name_pairs_counts_by_landuse'],'RAW_CODE_NAMES_REPLAY')
    require(group(rows,('GUN','SIKUCHOSON'))==reg['gun_name_pairs_counts_by_landuse'],'RAW_GUN_NAMES_REPLAY')
    require(dict(sorted(Counter(r['GUN'] for r in rows).items()))==GUN,'RAW_GUN_REPLAY')
    require(len(set(r['群コード'] for r in rows))==18 and len(set(r['包括_統群'] for r in rows))==68,'RAW_SOIL_CATEGORIES')
    require(not any(not r[k] for r in rows for k in ('包括_統群','統群コード','亜群コード','群コード')),'RAW_CLASS_MISSING')
    return {'status':'SOURCE_BYTES_DBF_ALL_1216_MATCH','source_polygons':1216,'jcode_name_pairs':102,'gun_name_pairs':52,'raw_gis_committed':False}

def main(args):
    reg=load();audit(reg)
    if args==['audit']:
        result={'status':'REGISTER_CONSISTENT_RAW_NOT_COMMITTED','polygons':1216,'jcode_name_pairs':102,'gun_name_pairs':52,'raw_original_verified_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify(args[1],reg)
    else:raise ValueError('USAGE: python3 scripts/p56-hyogo-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
