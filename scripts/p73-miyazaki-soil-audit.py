#!/usr/bin/env python3
"""NaFT P73 Miyazaki: public aggregate audit & optional private original ZIP replay.
No original ZIP, SHP, DBF or per-feature geometry is redistributed in the repository.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile

ROOT=Path(__file__).resolve().parent.parent
LEDGER=ROOT/'research/p73-miyazaki-soil-shapefile-source-v1.json'
ZIP_SHA='2d2bd2bf4a29927698cc550c04850b850dd3aa5cf3f8ab357af2f6ad08024f51'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
SOIL_FIELDS=('包括_統群','統群コード','亜群コード','群コード')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
MEMBERS={
'dbf':(830442,'8b220ecc4c6f8cf992e2b82ec4ab56b8b217b52cdaf03da86616e6f64bca2c1e'),
'prj':(145,'d1de156bb748892db7642d045767629921ea76cc06597e25cea2411b12e7b0b2'),
'sbn':(7620,'33fb1dcef87b0085927864e9a46a0bca034b845973c526a27060cd01bdbfcf7a'),
'sbx':(596,'0352000fb140dff8279d4b20241f30d9e0bb164692935992ebe46e9f4cbfa39d'),
'shp':(15085200,'f9066bec66c3d5a5b21ae247e05b7538e5c6ac9b997fd2e4fae135476a8ac996'),
'shp.xml':(105663,'7dde70c3fe8f70b5471197be1975024ed759f6e5353a2e4f3f4487391e033c36'),
'shx':(6148,'5f9405207353b40a3be2c86e8ac5ed168f5ff2b587c5347a5bcb5c8290921139'),
}
COUNTS={'田':297,'普通畑':249,'牧草地':58,'樹園地':152}
GUN_COUNTS={'':438,'西諸県郡':18,'東諸県郡':39,'児湯郡':133,'東臼杵郡':69,'西臼杵郡':35,'北諸県郡':20,'阿蘇郡':4}
BOUNDS=[130.72101183282993,31.37923185736447,131.8508761843885,32.830837083165015]
MULTI_GUN={'高千穂町':['西臼杵郡','阿蘇郡']}
def check(condition,message):
    if not condition:raise ValueError('P73_MIYAZAKI_SOURCE_BLOCKED:'+message)
def totals(rows):
    return [sum(row[i+2] for row in rows) for i in range(4)]
def grouped(rows,keys):
    values=defaultdict(Counter)
    for row in rows:values[tuple(row[k] for k in keys)][row['地目区分']]+=1
    return [[*key,*[counts.get(land,0) for land in LAND]] for key,counts in sorted(values.items())]
def multiples(rows,index):
    values=defaultdict(set)
    for row in rows:values[row[index]].add(row[1-index])
    return {key:sorted(items) for key,items in values.items() if len(items)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p73-miyazaki-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='宮崎県.zip' and s['member_folder']=='k45宮崎県','ORIGINAL_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==10600644,'ORIGINAL_ZIP_SHA_AND_BYTES')
    check(s['zip_entries']==len(s['members'])==7,'MEMBERS_COUNT')
    check([x['name'] for x in s['members']]==['k45宮崎県.'+ext for ext in EXT],'MEMBER_NAMES')
    check([(x['bytes'],x['sha256']) for x in s['members']]==[MEMBERS[ext] for ext in EXT],'MEMBER_HASH_AND_BYTES')
    check(s['uncompressed_bytes']==sum(x['bytes'] for x in s['members'])==16035814,'UNCOMPRESSED_BYTES')
    check(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'PRIVATE_ORIGINAL')
    check(g['type']=='POLYGON' and g['shape_count']==756 and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BOUNDS,'GEO_COUNTS')
    check(g['municipality_name_count']==26 and g['unique_jcodes']==27 and g['administrative_code_name_pairs']==53 and g['gun_name_pairs']==36,'ADMIN_COUNTS')
    check(g['sicho_counts']=={'':756} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==756,'GUN_COUNTS')
    check(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==756,'LAND_FIELDS')
    check(m['soil_group_code_categories']==14 and m['soil_fine_class_categories']==68 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CATEGORIES')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==53 and len(gp)==36 and len({(r[0],r[1]) for r in cp})==53 and len({(r[0],r[1]) for r in gp})==36,'PAIRS_UNIQUE')
    check(all(len(r)==6 and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in cp+gp),'PAIR_VALUES')
    check(totals(cp)==totals(gp)==[COUNTS[x] for x in LAND],'PAIR_LAND_PARITY')
    check(len({r[0] for r in cp})==27 and len({r[1] for r in cp})==26 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'JCODE_SHAPE')
    ca=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('45')]
    check(foreign==ca['foreign_prefecture_code_pairs']==[['43428','高千穂町',2,1,1,0]],'FOREIGN_CODES')
    check(sum(sum(r[2:]) for r in foreign)==ca['foreign_prefecture_code_feature_count']==4 and ca['foreign_code_prefix_totals']=={'43':4},'FOREIGN_COUNT')
    check(multiples(cp,0)==ca['codes_with_multiple_names'] and multiples(cp,1)==ca['names_with_multiple_codes'],'CODE_MANY_TO_MANY')
    check(len(ca['codes_with_multiple_names'])==12 and len(ca['names_with_multiple_codes'])==16,'CODE_MULTI_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==438,'GUN_BLANK')
    gunTotals=Counter();nameGuns=defaultdict(set)
    for gun,name,*vals in gp:
        gunTotals[gun]+=sum(vals)
        if gun:nameGuns[name].add(gun)
    check(dict(gunTotals)==GUN_COUNTS,'GUN_PAIR_COUNTS')
    check(ga['non_miyazaki_gun_name_rows']==[['阿蘇郡','高千穂町',2,1,1,0]] and ga['non_miyazaki_gun_name_feature_count']==4,'FOREIGN_GUNS')
    check({name:sorted(v) for name,v in nameGuns.items() if len(v)>1}==ga['multiple_nonempty_guns_per_municipality_name']==MULTI_GUN,'GUN_MULTIPLE')
    blanks=[{'municipality_name':name,'empty_gun_polygon_count':sum(vals),'gun_names_seen_elsewhere':sorted(nameGuns[name])} for gun,name,*vals in gp if not gun and name in nameGuns]
    check(blanks==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(v['empty_gun_polygon_count'] for v in blanks)==ga['empty_gun_features_for_names_with_county_elsewhere']==57,'GUN_BLANK_WITH_NAMED')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_GUN_JOIN')
    science=m['scientific_boundaries']
    check(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NO_AREA_OR_MUNICIPAL_TOTALS')
    check(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NO_CREDIT_CLAIMS')
    return True
def member_path(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    n,header,width=struct.unpack_from('<IHH',blob,4)
    check((n,header,width)==(756,353,1098) and header+n*width<=len(blob),'DBF_HEADER')
    columns=[];at=32
    while at+32<=header and blob[at]!=13:
        raw=blob[at:at+32]
        check(raw[11]==ord('C'),'DBF_NON_TEXT')
        columns.append((raw[:11].split(b'\0')[0].decode('cp932'),raw[16]));at+=32
    check(at<header and blob[at]==13 and [name for name,_ in columns]==list(FIELDS),'DBF_FIELDS')
    spans={};pos=1
    for name,size in columns:spans[name]=(pos,pos+size);pos+=size
    check(pos==width,'DBF_RECORD_WIDTH')
    rows=[]
    for i in range(n):
        rec=blob[header+i*width:header+(i+1)*width]
        check(len(rec)==width and rec[0]==0x20,'DBF_INACTIVE_RECORD')
        row={name:rec[start:end].decode('cp932').strip(' \t\0') for name,(start,end) in spans.items()}
        check(row['KEN_1']=='宮崎県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_MAIN_ATTR')
        check(all(row[key] for key in SOIL_FIELDS),'DBF_MISSING_SOIL')
        rows.append(row)
    return rows
def verify_shapes(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHP_TOO_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHP_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHP_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHP_FILE_LENGTHS')
    check(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'SHP_BOUNDS')
    check(len(shx)==100+756*8,'SHX_RECORD_COUNT')
    offset=100
    for i in range(756):
        wordOffset,words=struct.unpack_from('>II',shx,100+i*8)
        recNo,recWords=struct.unpack_from('>II',shp,offset)
        check(wordOffset*2==offset and words==recWords and recNo==i+1,'SHP_SHX_ALIGNMENT')
        check(struct.unpack_from('<I',shp,offset+8)[0]==5,'RECORD_POLYGON')
        offset+=8+recWords*2
        check(offset<=len(shp),'SHP_OVERRUN')
    check(offset==len(shp),'SHP_TRAILING_BYTES')
def verify_zip(filename,m):
    p=Path(filename)
    check(p.is_file() and p.stat().st_size==10600644,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    blobs={}
    with zipfile.ZipFile(p) as archive:
        infos=archive.infolist()
        check(len(infos)==7,'ORIGINAL_MEMBER_COUNT')
        for info,ext,meta in zip(infos,EXT,m['source']['members']):
            check(member_path(info)=='k45宮崎県/'+meta['name'],'ORIGINAL_MEMBER_PATH')
            data=archive.read(info)
            check(len(data)==meta['bytes'] and sha256(data).hexdigest()==meta['sha256'],'ORIGINAL_MEMBER_HASH')
            blobs[ext]=data
    check(b'GCS_JGD_2000' in blobs['prj'],'ORIGINAL_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in blobs['shp.xml'],'ORIGINAL_XML_DATE')
    verify_shapes(blobs['shp'],blobs['shx'])
    rows=parse_dbf(blobs['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_CODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==COUNTS,'DBF_LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'DBF_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':756},'DBF_SICHO')
    check(len({r['群コード'] for r in rows})==14 and len({r['包括_統群'] for r in rows})==68,'DBF_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_756_POLYGONS_VERIFIED','features':756,'jcode_pairs':53,'gun_pairs':36,'original_files_verified':7,'raw_gis_committed':False}
def main(args):
    m=json.loads(LEDGER.read_text(encoding='utf-8'))
    audit(m)
    if args==['audit']:result={'status':'PUBLIC_REGISTER_CONSISTENT_ORIGINAL_NOT_IN_CI','features':756,'jcode_pairs':53,'gun_pairs':36,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p73-miyazaki-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
