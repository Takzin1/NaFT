#!/usr/bin/env python3
"""NaFT P69 Saga soil-GIS source audit.
Public CI validates only aggregate records. Private 'verify' checks an original ZIP locally.
The one original soil-null record must remain null, and must never be imputed.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
LEDGER=ROOT/'research/p69-saga-soil-shapefile-source-v1.json'
ZIP_SHA='2603d2c858c58e61ac653b87e724693b5d1644c7bb716c06be11fb386ce92ca2'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
SOIL_FIELDS=('包括_統群','統群コード','亜群コード','群コード')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNT={'田':309,'普通畑':182,'牧草地':11,'樹園地':210}
GUN_COUNTS={'藤津郡':30,'':506,'神埼郡':27,'三養基郡':57,'西松浦郡':27,'杵島郡':42,'東松浦郡':22,'筑紫郡':1}
BBOX=[129.75540936345158,32.95787331260338,130.54187041558737,33.60857674212308]
MULTI_GUN={'みやき町':['三養基郡','神埼郡'],'上峰町':['三養基郡','神埼郡'],'吉野ヶ里町':['神埼郡','筑紫郡']}
SOIL_MISSING={'missing_soil_feature_count':1,'dbf_record_number_1_based':211,'original_jcode':'41205','original_municipality_name':'伊万里市','landuse':'田','missing_fields':list(SOIL_FIELDS),'status':'UNRESOLVED_ORIGINAL_SOIL_CLASSIFICATION_MISSING_NO_IMPUTATION'}

def check(ok,why):
    if not ok:raise ValueError('P69_SAGA_SOURCE_BLOCKED:'+why)

def pair_totals(pairs):
    return [sum(row[i+2] for row in pairs) for i in range(4)]

def grouped(rows,keys):
    counts=defaultdict(Counter)
    for row in rows:counts[tuple(row[k] for k in keys)][row['地目区分']]+=1
    return [[*key,*[v.get(land,0) for land in LAND]] for key,v in sorted(counts.items())]

def multiple(rows,index):
    groups=defaultdict(set)
    for row in rows:groups[row[index]].add(row[1-index])
    return {k:sorted(v) for k,v in groups.items() if len(v)>1}

def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p69-saga-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='佐賀県.zip' and s['member_folder']=='k41佐賀県','ORIGINAL_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==5577079,'SOURCE_SHA_SIZE')
    check(s['zip_entries']==len(s['members'])==7,'ZIP_MEMBER_COUNT')
    check([x['name'] for x in s['members']]==['k41佐賀県.'+e for e in EXT],'MEMBER_FILENAMES')
    check(s['uncompressed_bytes']==sum(x['bytes'] for x in s['members'])==8796778,'UNCOMPRESSED_SIZE')
    check(all(type(x['bytes']) is int and x['bytes']>0 and len(x['sha256'])==64 and set(x['sha256'])<=set('0123456789abcdef') for x in s['members']),'MEMBER_SHA_FORMAT')
    check(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE_UNVERIFIED')
    check(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'ORIGINAL_NOT_PUBLIC')
    check(g['type']=='POLYGON' and g['shape_count']==712 and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BBOX,'GEOMETRY')
    check(g['municipality_name_count']==20 and g['unique_jcodes']==26 and g['administrative_code_name_pairs']==57 and g['gun_name_pairs']==32,'ADMIN_COUNTS')
    check(g['sicho_counts']=={'':712} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==712,'GUN_COUNTS')
    check(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==LAND_COUNT and sum(LAND_COUNT.values())==712,'LAND_FIELDS')
    check(m['soil_group_code_categories']==16 and m['soil_fine_class_categories']==54,'SOIL_CLASS_COUNTS_NONEMPTY')
    check(m['soil_group_missing_features']==m['soil_detail_missing_features']==1,'SOIL_NULL_COUNTS')
    check(m['soil_missing_feature']==SOIL_MISSING,'SOIL_NULL_RECORD_DETAILS')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==57 and len(gp)==32,'ADMIN_PAIR_LENGTH')
    check(len({(r[0],r[1]) for r in cp})==57 and len({(r[0],r[1]) for r in gp})==32,'ADMIN_PAIR_DUPLICATES')
    check(all(len(row)==6 and row[1] and all(type(n) is int and n>=0 for n in row[2:]) for row in cp+gp),'ADMIN_PAIR_FORMAT')
    check(pair_totals(cp)==pair_totals(gp)==[LAND_COUNT[k] for k in LAND],'PAIR_LAND_PARITY')
    check(len({r[0] for r in cp})==26 and len({r[1] for r in cp})==20 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'JCODE_VALIDITY')
    ca=m['source_code_name_anomalies'];foreign=[r for r in cp if not r[0].startswith('41')]
    check(foreign==ca['foreign_prefecture_code_pairs'] and all(r[0].startswith('40') for r in foreign),'FOREIGN_CODES')
    check(sum(sum(row[2:]) for row in foreign)==ca['foreign_prefecture_code_feature_count']==13 and ca['foreign_code_prefix_totals']=={'40':13},'FOREIGN_CODE_COUNT')
    check(multiple(cp,0)==ca['codes_with_multiple_names'] and multiple(cp,1)==ca['names_with_multiple_codes'],'CODE_NAME_MULTIPLES')
    check(len(ca['codes_with_multiple_names'])==16 and len(ca['names_with_multiple_codes'])==19,'CODE_AMBIGUITY_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_UNVERIFIED_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==506,'GUN_MISSING')
    gun_counts=Counter();named_guns=defaultdict(set)
    for gun,name,*nums in gp:
        gun_counts[gun]+=sum(nums)
        if gun:named_guns[name].add(gun)
    check(dict(gun_counts)==GUN_COUNTS,'GUN_PAIR_AGGREGATES')
    foreign_gun=[r for r in gp if r[0]=='筑紫郡']
    check(foreign_gun==ga['non_saga_gun_name_rows']==[['筑紫郡','吉野ヶ里町',1,0,0,0]],'FOREIGN_GUN_ROW')
    check(ga['non_saga_gun_name_feature_count']==sum(sum(row[2:]) for row in foreign_gun)==1,'FOREIGN_GUN_FEATURES')
    named_multiple={name:sorted(guns) for name,guns in named_guns.items() if len(guns)>1}
    check(named_multiple==ga['multiple_nonempty_guns_per_municipality_name']==MULTI_GUN,'MULTIPLE_COUNTY_NAMES')
    blanks=[{'municipality_name':name,'empty_gun_polygon_count':sum(nums),'gun_names_seen_elsewhere':sorted(named_guns[name])} for gun,name,*nums in gp if not gun and name in named_guns]
    check(blanks==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(x['empty_gun_polygon_count'] for x in blanks)==ga['empty_gun_features_for_names_with_county_elsewhere']==63,'BLANK_GUN_WITH_NAMED')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_UNVERIFIED_COUNTY_JOIN')
    sci=m['scientific_boundaries']
    check(sci['counts_are_polygon_features_not_area_ha'] is True and sci['municipality_level_aggregations_pending_reconciliation'] is True,'NO_AREA_OR_MUNICIPAL_TOTAL')
    check(sci['soil_class_coverage_incomplete'] is True and sci['soil_specific_mrv_eligibility_requires_review'] is True,'MISSING_SOIL_MRV_BLOCKED')
    check(sci['calculation_of_certified_credits_prohibited'] is True and sci['official_credit_tco2e'] is None and sci['raw_geometry_licensed_for_publication'] is False,'NO_CREDIT_CLAIM')
    return True

def member_path(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')

def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    num,header,width=struct.unpack_from('<IHH',blob,4)
    check((num,header,width)==(712,353,1098) and header+num*width<=len(blob),'DBF_HEADER')
    columns=[];pos=32
    while pos+32<=header and blob[pos]!=13:
        field=blob[pos:pos+32]
        check(field[11]==ord('C'),'DBF_COLUMN_TEXT_TYPE')
        columns.append((field[:11].split(b'\0')[0].decode('cp932'),field[16]));pos+=32
    check(pos<header and blob[pos]==13 and [name for name,_ in columns]==list(FIELDS),'DBF_FIELDS')
    spans={};offset=1
    for name,field_width in columns:spans[name]=(offset,offset+field_width);offset+=field_width
    check(offset==width,'DBF_RECORD_WIDTH')
    rows=[]
    for i in range(num):
        raw=blob[header+i*width:header+(i+1)*width]
        check(len(raw)==width and raw[0]==0x20,'DBF_ROW_INACTIVE')
        row={name:raw[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        check(row['KEN_1']=='佐賀県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and row['JCODE'].isdigit() and len(row['JCODE'])==5,'DBF_MAIN_ATTRIBUTES')
        if i==210:
            check(row['JCODE']=='41205' and row['SIKUCHOSON']=='伊万里市' and row['地目区分']=='田','MISSING_SOIL_ROW_IDENTITY')
            check(all(row[name]=='' for name in SOIL_FIELDS),'MISSING_SOIL_ROW_NOT_BLANK')
        else:
            check(all(row[name]!='' for name in SOIL_FIELDS),'UNEXPECTED_ADDITIONAL_MISSING_SOIL')
        rows.append(row)
    return rows

def verify_shapes(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHAPE_FILES_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_FILE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHP_SHX_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==BBOX,'SHP_BOUNDING_BOX')
    check(len(shx)==100+712*8,'SHX_RECORD_COUNT')
    offset=100
    for i in range(712):
        word_offset,words=struct.unpack_from('>II',shx,100+i*8)
        number,record_words=struct.unpack_from('>II',shp,offset)
        check(word_offset*2==offset and words==record_words and number==i+1,'SHP_SHX_INDEX_ALIGNMENT')
        check(struct.unpack_from('<I',shp,offset+8)[0]==5,'RECORD_SHAPE_POLYGON')
        offset+=8+record_words*2
        check(offset<=len(shp),'SHP_RECORD_OVERRUN')
    check(offset==len(shp),'SHP_RECORD_TRAILING')

def verify_zip(filename,m):
    p=Path(filename)
    check(p.is_file() and p.stat().st_size==5577079,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    content={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();check(len(infos)==7,'ORIGINAL_SEVEN_MEMBERS')
        for info,ext,member in zip(infos,EXT,m['source']['members']):
            check(member_path(info)=='k41佐賀県/'+member['name'],'ZIP_MEMBER_NAME')
            raw=z.read(info)
            check(len(raw)==member['bytes'] and sha256(raw).hexdigest()==member['sha256'],'ZIP_MEMBER_SHA')
            content[ext]=raw
    check(b'GCS_JGD_2000' in content['prj'],'ZIP_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in content['shp.xml'],'ZIP_METADATA_DATE')
    verify_shapes(content['shp'],content['shx'])
    rows=parse_dbf(content['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_JCODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==LAND_COUNT,'ORIGINAL_LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'ORIGINAL_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':712},'ORIGINAL_SICHO')
    check(len({r['群コード'] for r in rows if r['群コード']})==16,'ORIGINAL_GROUP_CLASSES')
    check(len({r['包括_統群'] for r in rows if r['包括_統群']})==54,'ORIGINAL_DETAIL_CLASSES')
    check(sum(not row['群コード'] for row in rows)==sum(not row['包括_統群'] for row in rows)==1,'ORIGINAL_MISSING_SOIL')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_712_POLYGONS_VERIFIED','features':712,'jcode_pairs':57,'gun_pairs':32,'original_files_verified':7,'soil_missing_rows':1,'raw_gis_committed':False}

def main(argv):
    m=json.loads(LEDGER.read_text(encoding='utf-8'));audit(m)
    if argv==['audit']:
        result={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':712,'jcode_pairs':57,'gun_pairs':32,'soil_missing_rows':1,'private_zip_checked_in_ci':False}
    elif len(argv)==2 and argv[0]=='verify':result=verify_zip(argv[1],m)
    else:raise ValueError('USAGE: python3 scripts/p69-saga-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
