#!/usr/bin/env python3
"""NaFT P66 Ehime soil GIS: public-aggregate audit and local-original source verification.
Original ZIP/SHP/DBF/geometries must not be redistributed unless rights are confirmed.
"""
from collections import Counter,defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p66-ehime-soil-shapefile-source-v1.json'
ZIP_SHA='3af0a956b989b9eaac0746695e6bc9930dab6267a62061a3aca84aa6bceecbbc'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
COUNTS={'田':219,'普通畑':189,'牧草地':14,'樹園地':207}
GUN_COUNTS={'':454,'上浮穴郡':31,'伊予郡':34,'北宇和郡':42,'南宇和郡':26,'喜多郡':27,'西宇和郡':8,'越智郡':7}
BBOX=[132.01877797092675,32.92831060495059,133.69142601919563,34.29875962795462]
def check(ok,detail):
    if not ok:raise ValueError('P66_EHIME_SOURCE_BLOCKED:'+detail)
def totals(rows):
    return [sum(row[i+2] for row in rows) for i in range(4)]
def grouped(rows,keys):
    groups=defaultdict(Counter)
    for row in rows:groups[tuple(row[k] for k in keys)][row['地目区分']]+=1
    return [[*key,*[counts.get(land,0) for land in LAND]] for key,counts in sorted(groups.items())]
def multiples(rows,index):
    v=defaultdict(set)
    for r in rows:v[r[index]].add(r[1-index])
    return {k:sorted(s) for k,s in v.items() if len(s)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p66-ehime-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='愛媛県.zip' and s['member_folder']=='k38愛媛県','ORIGINAL_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==13466351,'ORIGINAL_ZIP_HASH')
    check(s['zip_entries']==len(s['members'])==7,'MEMBER_COUNT')
    check([x['name'] for x in s['members']]==['k38愛媛県.'+e for e in EXT],'MEMBER_NAMES')
    check(sum(x['bytes'] for x in s['members'])==s['uncompressed_bytes']==19995760,'UNCOMPRESSED_BYTES')
    check(all(len(x['sha256'])==64 and set(x['sha256'])<=set('0123456789abcdef') for x in s['members']),'SHA_FORMAT')
    check(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'NO_RAW_PUBLICATION')
    check(g['type']=='POLYGON' and g['shape_count']==629 and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BBOX,'GEOMETRY')
    check(g['municipality_name_count']==20 and g['unique_jcodes']==21 and g['administrative_code_name_pairs']==37 and g['gun_name_pairs']==25,'ADMIN_COUNTS')
    check(g['sicho_counts']=={'':629} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==629,'GUN_COUNTS')
    check(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==629,'FIELD_AND_LAND')
    check(m['soil_group_code_categories']==13 and m['soil_fine_class_categories']==50 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CLASS')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==37 and len(gp)==25 and len({(r[0],r[1]) for r in cp})==37 and len({(r[0],r[1]) for r in gp})==25,'PAIRS_UNIQUE')
    check(all(len(r)==6 and r[1] and all(type(n) is int and n>=0 for n in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    check(totals(cp)==totals(gp)==[COUNTS[k] for k in LAND],'LAND_PARITY')
    check(len({r[0] for r in cp})==21 and len({r[1] for r in cp})==20 and all(r[0].isdigit() and len(r[0])==5 for r in cp),'CODE_NAME_FORMAT')
    ca=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('38')]
    check(foreign==ca['foreign_prefecture_code_pairs']==[['36208','四国中央市',0,0,0,1]],'FOREIGN_CODE_PAIR')
    check(ca['foreign_prefecture_code_feature_count']==1 and ca['foreign_code_prefix_totals']=={'36':1},'FOREIGN_CODE_COUNT')
    check(multiples(cp,0)==ca['codes_with_multiple_names'] and multiples(cp,1)==ca['names_with_multiple_codes'],'CODE_MULTIPLES')
    check(len(ca['codes_with_multiple_names'])==8 and len(ca['names_with_multiple_codes'])==11,'MULTI_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==454,'GUN_BLANK')
    gcounts=Counter();names=defaultdict(set)
    for gun,name,*v in gp:
        gcounts[gun]+=sum(v)
        if gun:names[name].add(gun)
    check(dict(gcounts)==GUN_COUNTS,'GUN_PAIR_TOTAL')
    check({k:sorted(v) for k,v in names.items() if len(v)>1}==ga['multiple_nonempty_guns_per_municipality_name']=={},'GUN_MULTI')
    blank=[{'municipality_name':n,'empty_gun_polygon_count':sum(v),'gun_names_seen_elsewhere':sorted(names[n])} for gun,n,*v in gp if not gun and n in names]
    check(blank==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blank)==ga['empty_gun_features_for_names_with_county_elsewhere']==29,'GUN_BLANK_WITH_NAMED')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_GUN_JOIN')
    science=m['scientific_boundaries']
    check(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NO_AREA')
    check(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NO_CARBON_CREDIT_CLAIM')
    return True
def zip_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    count,header,size=struct.unpack_from('<IHH',blob,4)
    check((count,header,size)==(629,353,1098) and header+count*size<=len(blob),'DBF_HEADER')
    fields=[];offset=32
    while offset+32<=header and blob[offset]!=13:
        b=blob[offset:offset+32];check(b[11]==ord('C'),'DBF_FIELD_NOT_TEXT')
        fields.append((b[:11].split(b'\0')[0].decode('cp932'),b[16]));offset+=32
    check(offset<header and blob[offset]==13 and [name for name,_ in fields]==list(FIELDS),'DBF_FIELDS')
    spans={};pos=1
    for name,width in fields:spans[name]=(pos,pos+width);pos+=width
    check(pos==size,'DBF_RECORD_WIDTH')
    rows=[]
    for i in range(count):
        rec=blob[header+i*size:header+(i+1)*size]
        check(len(rec)==size and rec[0]==0x20,'DBF_RECORD_INACTIVE')
        row={name:rec[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        check(row['KEN_1']=='愛媛県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_CORE_ATTRIBUTES')
        check(all(row[k] for k in ('包括_統群','統群コード','亜群コード','群コード')),'DBF_SOIL_ATTRIBUTE_MISSING')
        rows.append(row)
    return rows
def verify_geometry(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHP_SHX_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHP_SHX_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_TYPE')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHP_FILE_SIZE')
    check(list(struct.unpack_from('<4d',shp,36))==BBOX,'SHAPE_BBOX')
    check(len(shx)==100+629*8,'SHX_COUNT')
    off=100
    for i in range(629):
        wordoff,wordlength=struct.unpack_from('>II',shx,100+i*8)
        number,recordwords=struct.unpack_from('>II',shp,off)
        check(wordoff*2==off and wordlength==recordwords and number==i+1,'INDEX_ALIGNMENT')
        check(struct.unpack_from('<I',shp,off+8)[0]==5,'POLYGON_FEATURE')
        off+=8+wordlength*2;check(off<=len(shp),'SHAPE_OVERRUN')
    check(off==len(shp),'SHAPE_END')
def verify_zip(file,m):
    p=Path(file)
    check(p.is_file() and p.stat().st_size==13466351,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    content={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();check(len(infos)==7,'ZIP_MEMBERS')
        for info,ext,member in zip(infos,EXT,m['source']['members']):
            check(zip_name(info)=='k38愛媛県/'+member['name'],'ZIP_MEMBER_NAME')
            b=z.read(info)
            check(len(b)==member['bytes'] and sha256(b).hexdigest()==member['sha256'],'ZIP_MEMBER_SHA')
            content[ext]=b
    check(b'GCS_JGD_2000' in content['prj'],'PRJ_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in content['shp.xml'],'XML_DATE')
    verify_geometry(content['shp'],content['shx'])
    records=parse_dbf(content['dbf'])
    check(grouped(records,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'CODE_REPLAY')
    check(grouped(records,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in records))==COUNTS,'LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in records))==GUN_COUNTS,'GUN_COUNT_REPLAY')
    check(dict(Counter(r['SICHO'] for r in records))=={'':629},'SICHO_REPLAY')
    check(len({r['群コード'] for r in records})==13 and len({r['包括_統群'] for r in records})==50,'SOIL_CLASS_REPLAY')
    return {'status':'PRIVATE_ORIGINAL_ZIP_629_POLYGONS_VERIFIED','features':629,'jcode_pairs':37,'gun_pairs':25,'raw_gis_committed':False}
def main(args):
    m=json.loads(MANIFEST.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:result={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':629,'jcode_pairs':37,'gun_pairs':25,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p66-ehime-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
