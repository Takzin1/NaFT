#!/usr/bin/env python3
"""NaFT P72 Kumamoto: public derived GIS aggregates audit, private original ZIP replay.
Raw ZIP/SHP/DBF, geometries and individual feature coordinates are never published here.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile

ROOT=Path(__file__).resolve().parent.parent
LEDGER=ROOT/'research/p72-kumamoto-soil-shapefile-source-v1.json'
ZIP_SHA='313aa016909916a4400d209c297120eb8b719e94264c8263c7671dbecccecb78'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
SOIL_FIELDS=('包括_統群','統群コード','亜群コード','群コード')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
MEMBERS={
'dbf':(1727508,'2908d99cbb4e6a7d0ff17378b1ef151628dd1e68306f570c81926cfbf41bbcd5'),
'prj':(145,'d1de156bb748892db7642d045767629921ea76cc06597e25cea2411b12e7b0b2'),
'sbn':(15724,'c91f73972dae4fe8d17c05e6943849fb8cfe51df3c5554afb4001a06834e88b2'),
'sbx':(1164,'747affc6aff1486e1e2bd726a559b1e12bed05f45b46f4a601879df9c5087def'),
'shp':(17114868,'4fef40546d6e735d1fe2a521a13980baf251bfcc573629e764f25bb4abd0601a'),
'shp.xml':(105663,'732839d308ec487a597e46496df7bb91263974fca4abec8acd142658d1ea8fde'),
'shx':(12684,'96296b68cdd40e8bf6a66af45da267011f159d2940e2143919d13ec80f6a369c'),
}
COUNTS={'田':616,'普通畑':475,'牧草地':71,'樹園地':411}
GUN_COUNTS={'':779,'球磨郡':212,'阿蘇郡':154,'上益城郡':153,'玉名郡':106,'芦北郡':56,'下益城郡':40,'菊池郡':31,'天草郡':22,'八代郡':20}
BBOX=[129.97948958317795,32.10011244383439,131.3007109683367,33.194900393041095]
MULTIPLE_GUN={'御船町':['上益城郡','阿蘇郡'],'甲佐町':['上益城郡','下益城郡'],'山都町':['上益城郡','下益城郡','阿蘇郡'],'球磨村':['球磨郡','芦北郡'],'益城町':['上益城郡','菊池郡','阿蘇郡'],'西原村':['菊池郡','阿蘇郡']}
def check(ok,why):
    if not ok:raise ValueError('P72_KUMAMOTO_SOURCE_BLOCKED:'+why)
def totals(rows):
    return [sum(row[i+2] for row in rows) for i in range(4)]
def grouped(rows,keys):
    agg=defaultdict(Counter)
    for r in rows:agg[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[cnt.get(land,0) for land in LAND]] for key,cnt in sorted(agg.items())]
def multiple(rows,i):
    groups=defaultdict(set)
    for r in rows:groups[r[i]].add(r[1-i])
    return {key:sorted(values) for key,values in groups.items() if len(values)>1}
def audit(m):
    src,geo=m['source'],m['geometry']
    check(m['schema']=='naft-p72-kumamoto-soil-shapefile-v1','SCHEMA')
    check(src['provided_filename']=='熊本県(1).zip' and src['member_folder']=='k43熊本県','SOURCE_NAME')
    check(src['source_zip_sha256']==ZIP_SHA and src['zip_bytes']==12144480,'ZIP_SHA_SIZE')
    check(src['zip_entries']==len(src['members'])==7,'MEMBER_COUNT')
    check([r['name'] for r in src['members']]==['k43熊本県.'+e for e in EXT],'MEMBER_NAMES')
    check([(r['bytes'],r['sha256']) for r in src['members']]==[MEMBERS[e] for e in EXT],'MEMBER_SHA_BYTES')
    check(src['uncompressed_bytes']==sum(r['bytes'] for r in src['members'])==18977756,'EXPANDED_SIZE')
    check(src['metadata_creation_date']=='2017-01-17' and src['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(src['publisher_authentication']==src['redistribution_rights']=='NOT_VERIFIED' and src['original_zip_committed'] is False and src['raw_geometry_committed'] is False,'PRIVATE_ORIGINAL')
    check(geo['type']=='POLYGON' and geo['shape_count']==1573 and geo['crs']=='GCS_JGD_2000' and geo['bounds_lon_lat']==BBOX,'GEO_FORMAT')
    check(geo['municipality_name_count']==45 and geo['unique_jcodes']==47 and geo['administrative_code_name_pairs']==119 and geo['gun_name_pairs']==74,'ADMIN_COUNTS')
    check(geo['sicho_counts']=={'':1573} and geo['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==1573,'GUN_COUNTS')
    check(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==1573,'LAND_COUNTS')
    check(m['soil_group_code_categories']==19 and m['soil_fine_class_categories']==95 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CLASSES')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==119 and len(gp)==74 and len({(r[0],r[1]) for r in cp})==119 and len({(r[0],r[1]) for r in gp})==74,'PAIR_COUNTS')
    check(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    check(totals(cp)==totals(gp)==[COUNTS[land] for land in LAND],'LAND_PARITY')
    check(len({r[0] for r in cp})==47 and len({r[1] for r in cp})==45 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'ADMIN_CODE_FORMAT')
    codes=m['source_code_name_anomalies'];foreign=[r for r in cp if not r[0].startswith('43')]
    check(foreign==codes['foreign_prefecture_code_pairs'] and all(r[0].startswith('40') for r in foreign),'FOREIGN_CODE_ROWS')
    check(sum(sum(r[2:]) for r in foreign)==codes['foreign_prefecture_code_feature_count']==15 and codes['foreign_code_prefix_totals']=={'40':15},'FOREIGN_CODE_COUNTS')
    check(multiple(cp,0)==codes['codes_with_multiple_names'] and multiple(cp,1)==codes['names_with_multiple_codes'],'MULTIPLE_CODE_NAME')
    check(len(codes['codes_with_multiple_names'])==29 and len(codes['names_with_multiple_codes'])==38,'AMBIGUOUS_ADMIN_NAMES')
    check(codes['one_to_one_code_name_mapping'] is False and codes['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_UNVERIFIED_CITY_JOIN')
    gun=m['source_gun_quality']
    check(gun['gun_feature_counts']==GUN_COUNTS and gun['blank_gun_features']==779,'BLANK_GUN_COUNT')
    check(gun['valid_kumamoto_gun_name_preserved']=='芦北郡' and GUN_COUNTS['芦北郡']==56,'KEEP_KUMAMOTO_ASHIKITA_GUN')
    gun_totals=Counter();named_guns=defaultdict(set)
    for g,name,*counts in gp:
        gun_totals[g]+=sum(counts)
        if g:named_guns[name].add(g)
    check(dict(gun_totals)==GUN_COUNTS,'GUN_PAIR_TOTALS')
    check({name:sorted(s) for name,s in named_guns.items() if len(s)>1}==gun['multiple_nonempty_guns_per_municipality_name']==MULTIPLE_GUN,'MULTIPLE_GUN_NAMES')
    blank=[{'municipality_name':name,'empty_gun_polygon_count':sum(counts),'gun_names_seen_elsewhere':sorted(named_guns[name])} for g,name,*counts in gp if not g and name in named_guns]
    check(blank==gun['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(x['empty_gun_polygon_count'] for x in blank)==gun['empty_gun_features_for_names_with_county_elsewhere']==132,'GUN_EMPTY_WITH_MATCH')
    check(gun['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_UNVERIFIED_GUN_JOIN')
    science=m['scientific_boundaries']
    check(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA')
    check(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NO_CERTIFIED_CREDITS')
    return True
def zip_member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    n,header,width=struct.unpack_from('<IHH',blob,4)
    check((n,header,width)==(1573,353,1098) and header+n*width<=len(blob),'DBF_HEADER')
    fields=[];at=32
    while at+32<=header and blob[at]!=13:
        f=blob[at:at+32];check(f[11]==ord('C'),'DBF_COLUMN_TYPE')
        fields.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));at+=32
    check(at<header and blob[at]==13 and [name for name,_ in fields]==list(FIELDS),'DBF_FIELDS')
    spans={};start=1
    for name,size in fields:spans[name]=(start,start+size);start+=size
    check(start==width,'DBF_RECORD_WIDTH')
    rows=[]
    for i in range(n):
        raw=blob[header+i*width:header+(i+1)*width]
        check(len(raw)==width and raw[0]==0x20,'DBF_RECORD_INACTIVE')
        row={name:raw[start:end].decode('cp932').strip(' \t\0') for name,(start,end) in spans.items()}
        check(row['KEN_1']=='熊本県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_ADMIN_AND_LAND')
        check(all(row[name] for name in SOIL_FIELDS),'DBF_MISSING_SOIL_FIELD')
        rows.append(row)
    return rows
def verify_shape_index(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHAPE_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_FILE_BYTES')
    check(list(struct.unpack_from('<4d',shp,36))==BBOX,'SHAPE_BOUNDS')
    check(len(shx)==100+1573*8,'SHX_RECORDS')
    off=100
    for i in range(1573):
        wordoff,words=struct.unpack_from('>II',shx,100+i*8)
        number,recwords=struct.unpack_from('>II',shp,off)
        check(wordoff*2==off and words==recwords and number==i+1,'INDEX_RECORD_MATCH')
        check(struct.unpack_from('<I',shp,off+8)[0]==5,'SHAPE_FEATURE_POLYGON')
        off+=8+recwords*2
        check(off<=len(shp),'SHAPE_OVERRUN')
    check(off==len(shp),'SHAPE_END')
def verify_original_zip(filename,m):
    p=Path(filename)
    check(p.is_file() and p.stat().st_size==12144480,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    buffers={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();check(len(infos)==7,'ORIGINAL_MEMBER_COUNT')
        for info,ext,meta in zip(infos,EXT,m['source']['members']):
            check(zip_member_name(info)=='k43熊本県/'+meta['name'],'ORIGINAL_MEMBER_NAME')
            raw=z.read(info)
            check(len(raw)==meta['bytes'] and sha256(raw).hexdigest()==meta['sha256'],'ORIGINAL_MEMBER_SHA')
            buffers[ext]=raw
    check(b'GCS_JGD_2000' in buffers['prj'],'ORIGINAL_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in buffers['shp.xml'],'ORIGINAL_XML_DATE')
    verify_shape_index(buffers['shp'],buffers['shx'])
    rows=parse_dbf(buffers['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_CODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==COUNTS,'ORIGINAL_LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'ORIGINAL_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':1573},'ORIGINAL_SICHO')
    check(len({r['群コード'] for r in rows})==19 and len({r['包括_統群'] for r in rows})==95,'ORIGINAL_SOIL_COUNTS')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_1573_POLYGONS_VERIFIED','features':1573,'jcode_pairs':119,'gun_pairs':74,'original_files_verified':7,'raw_gis_committed':False}
def main(args):
    m=json.loads(LEDGER.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:out={'status':'PUBLIC_REGISTER_CONSISTENT_PRIVATE_ORIGINAL_NOT_IN_CI','features':1573,'jcode_pairs':119,'gun_pairs':74,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':out=verify_original_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p72-kumamoto-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
