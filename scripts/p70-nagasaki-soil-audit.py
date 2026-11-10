#!/usr/bin/env python3
"""NaFT P70 Nagasaki: public derived soil-GIS ledger audit / local private original ZIP replay.
Original ZIP, SHP, DBF and individual geographic shapes are NOT redistributed in public GitHub.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
LEDGER=ROOT/'research/p70-nagasaki-soil-shapefile-source-v1.json'
ZIP_SHA='b164c6fdbdea997356b05f6658005d2acc855916d2837ec459aed994fc764b1e'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
SOIL_FIELDS=('包括_統群','統群コード','亜群コード','群コード')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNTS={'田':327,'普通畑':290,'牧草地':27,'樹園地':219}
GUN_COUNTS={'':680,'東彼杵郡':73,'西彼杵郡':42,'北松浦郡':39,'南松浦郡':18,'藤津郡':6,'西松浦郡':5}
BBOX=[128.59385531766893,32.55640573583621,130.37423008265233,34.69993682802231]
MULTIPLE_GUN={'波佐見町':['東彼杵郡','西松浦郡']}
FOREIGN_GUNS=('藤津郡','西松浦郡')

def check(ok,reason):
    if not ok:raise ValueError('P70_NAGASAKI_SOURCE_BLOCKED:'+reason)

def totals(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]

def grouped(rows,keys):
    agg=defaultdict(Counter)
    for r in rows:agg[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[v.get(land,0) for land in LAND]] for key,v in sorted(agg.items())]

def multiples(rows,index):
    g=defaultdict(set)
    for r in rows:g[r[index]].add(r[1-index])
    return {k:sorted(v) for k,v in g.items() if len(v)>1}

def audit(m):
    source,geo=m['source'],m['geometry']
    check(m['schema']=='naft-p70-nagasaki-soil-shapefile-v1','SCHEMA')
    check(source['provided_filename']=='長崎県.zip' and source['member_folder']=='k42長崎県','ORIGINAL_NAME')
    check(source['source_zip_sha256']==ZIP_SHA and source['zip_bytes']==7239387,'ORIGINAL_ZIP_SHA_SIZE')
    check(source['zip_entries']==len(source['members'])==7,'SEVEN_MEMBERS')
    check([x['name'] for x in source['members']]==['k42長崎県.'+ext for ext in EXT],'MEMBER_NAMES')
    check(source['uncompressed_bytes']==sum(x['bytes'] for x in source['members'])==11235300,'EXPANDED_BYTES')
    check(all(type(x['bytes']) is int and x['bytes']>0 and len(x['sha256'])==64 and set(x['sha256'])<=set('0123456789abcdef') for x in source['members']),'MEMBER_SHA_FORMAT')
    check(source['metadata_creation_date']=='2017-01-17' and source['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(source['publisher_authentication']==source['redistribution_rights']=='NOT_VERIFIED' and source['original_zip_committed'] is False and source['raw_geometry_committed'] is False,'PRIVATE_ORIGINAL')
    check(geo['type']=='POLYGON' and geo['shape_count']==863 and geo['crs']=='GCS_JGD_2000' and geo['bounds_lon_lat']==BBOX,'SHAPE_CRS_BOUNDS')
    check(geo['municipality_name_count']==21 and geo['unique_jcodes']==26 and geo['administrative_code_name_pairs']==46 and geo['gun_name_pairs']==30,'ADMIN_COUNTS')
    check(geo['sicho_counts']=={'':863} and geo['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==863,'GUN_COUNTS')
    check(m['feature_counts_by_landuse']==LAND_COUNTS and sum(LAND_COUNTS.values())==863,'LAND_COUNT')
    check(m['fields']==list(FIELDS) and m['soil_group_code_categories']==20 and m['soil_fine_class_categories']==80,'SOIL_CATEGORIES')
    check(m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'NO_SOIL_MISSING')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==46 and len(gp)==30 and len({(r[0],r[1]) for r in cp})==46 and len({(r[0],r[1]) for r in gp})==30,'PAIR_COUNTS')
    check(all(len(r)==6 and r[1] and all(type(n) is int and n>=0 for n in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    check(totals(cp)==totals(gp)==[LAND_COUNTS[k] for k in LAND],'PAIR_LAND_PARITY')
    check(len({r[0] for r in cp})==26 and len({r[1] for r in cp})==21 and all(r[0].isdigit() and len(r[0])==5 for r in cp),'JCODE_FORMAT')
    codes=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('42')]
    check(foreign==codes['foreign_prefecture_code_pairs'] and all(r[0].startswith('41') for r in foreign),'FOREIGN_CODE_PAIR')
    check(sum(sum(r[2:]) for r in foreign)==codes['foreign_prefecture_code_feature_count']==19 and codes['foreign_code_prefix_totals']=={'41':19},'FOREIGN_CODE_COUNTS')
    check(multiples(cp,0)==codes['codes_with_multiple_names'] and multiples(cp,1)==codes['names_with_multiple_codes'],'CODE_MANY_TO_MANY')
    check(len(codes['codes_with_multiple_names'])==10 and len(codes['names_with_multiple_codes'])==14,'MULTIPLE_CODE_NAMES')
    check(codes['one_to_one_code_name_mapping'] is False and codes['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_UNSAFE_CITY_JOIN')
    gun=m['source_gun_quality']
    check(gun['gun_feature_counts']==GUN_COUNTS and gun['blank_gun_features']==680,'BLANK_GUN_COUNT')
    grouped_count=Counter();named_guns=defaultdict(set)
    for g,n,*nums in gp:
        grouped_count[g]+=sum(nums)
        if g:named_guns[n].add(g)
    check(dict(grouped_count)==GUN_COUNTS,'GUN_PAIR_PARITY')
    foreign_gun=[r for r in gp if r[0] in FOREIGN_GUNS]
    check(foreign_gun==gun['non_nagasaki_gun_name_rows'] and sum(sum(r[2:]) for r in foreign_gun)==gun['non_nagasaki_gun_name_feature_count']==11,'FOREIGN_GUN_ROWS')
    check({n:sorted(g) for n,g in named_guns.items() if len(g)>1}==gun['multiple_nonempty_guns_per_municipality_name']==MULTIPLE_GUN,'MULTIPLE_GUN')
    blank=[{'municipality_name':n,'empty_gun_polygon_count':sum(v),'gun_names_seen_elsewhere':sorted(named_guns[n])} for g,n,*v in gp if not g and n in named_guns]
    check(blank==gun['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blank)==gun['empty_gun_features_for_names_with_county_elsewhere']==159,'GUN_BLANK_WITH_NONEMPTY_NAME')
    check(gun['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_UNSAFE_GUN_JOIN')
    scientific=m['scientific_boundaries']
    check(scientific['counts_are_polygon_features_not_area_ha'] is True and scientific['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA')
    check(scientific['calculation_of_certified_credits_prohibited'] is True and scientific['official_credit_tco2e'] is None and scientific['raw_geometry_licensed_for_publication'] is False,'NO_CARBON_CREDIT_OR_RAW_LICENSE')
    return True

def original_member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')

def parse_dbf(blob):
    check(len(blob)>=353,'DBF_TOO_SHORT')
    n,head,width=struct.unpack_from('<IHH',blob,4)
    check((n,head,width)==(863,353,1098) and head+n*width<=len(blob),'DBF_HEADER')
    columns=[];at=32
    while at+32<=head and blob[at]!=13:
        field=blob[at:at+32]
        check(field[11]==ord('C'),'DBF_NON_TEXT_FIELD')
        columns.append((field[:11].split(b'\0')[0].decode('cp932'),field[16]));at+=32
    check(at<head and blob[at]==13 and [k for k,_ in columns]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};start=1
    for key,size in columns:spans[key]=(start,start+size);start+=size
    check(start==width,'DBF_COLUMN_WIDTH')
    records=[]
    for i in range(n):
        rec=blob[head+i*width:head+(i+1)*width]
        check(len(rec)==width and rec[0]==0x20,'DBF_RECORD_INACTIVE')
        row={k:rec[a:b].decode('cp932').strip(' \t\0') for k,(a,b) in spans.items()}
        check(row['KEN_1']=='長崎県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_ATTRIBUTES')
        check(all(row[k] for k in SOIL_FIELDS),'DBF_SOIL_CLASS_MISSING')
        records.append(row)
    return records

def verify_geometry(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHAPE_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==BBOX,'SHAPE_BOUNDS')
    check(len(shx)==100+863*8,'SHX_RECORD_COUNT')
    offset=100
    for i in range(863):
        rec_offset,words=struct.unpack_from('>II',shx,100+i*8)
        number,rec_words=struct.unpack_from('>II',shp,offset)
        check(rec_offset*2==offset and rec_words==words and number==i+1,'SHP_SHX_RECORD_ALIGNMENT')
        check(struct.unpack_from('<I',shp,offset+8)[0]==5,'RECORD_POLYGON')
        offset+=8+rec_words*2;check(offset<=len(shp),'RECORD_OVERRUN')
    check(offset==len(shp),'SHAPE_END')

def verify_zip(filename,m):
    p=Path(filename)
    check(p.is_file() and p.stat().st_size==7239387,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    blocks={}
    with zipfile.ZipFile(p) as archive:
        entries=archive.infolist();check(len(entries)==7,'ORIGINAL_SEVEN_MEMBERS')
        for entry,ext,meta in zip(entries,EXT,m['source']['members']):
            check(original_member_name(entry)=='k42長崎県/'+meta['name'],'ORIGINAL_MEMBER_PATH')
            raw=archive.read(entry)
            check(len(raw)==meta['bytes'] and sha256(raw).hexdigest()==meta['sha256'],'MEMBER_SHA')
            blocks[ext]=raw
    check(b'GCS_JGD_2000' in blocks['prj'],'SOURCE_PRJ')
    check(b'<CreaDate>20170117</CreaDate>' in blocks['shp.xml'],'XML_DATE')
    verify_geometry(blocks['shp'],blocks['shx'])
    rows=parse_dbf(blocks['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_JCODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    check(dict(Counter(row['地目区分'] for row in rows))==LAND_COUNTS,'DBF_LAND_REPLAY')
    check(dict(Counter(row['GUN'] for row in rows))==GUN_COUNTS,'DBF_GUN_COUNTS')
    check(dict(Counter(row['SICHO'] for row in rows))=={'':863},'DBF_SICHO')
    check(len({r['群コード'] for r in rows})==20 and len({r['包括_統群'] for r in rows})==80,'DBF_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_863_POLYGONS_VERIFIED','features':863,'jcode_pairs':46,'gun_pairs':30,'files_sha256_checked':7,'raw_gis_committed':False}

def main(args):
    m=json.loads(LEDGER.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:
        result={'status':'PUBLIC_REGISTER_CONSISTENT_ORIGINAL_NOT_IN_CI','features':863,'jcode_pairs':46,'gun_pairs':30,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p70-nagasaki-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
