#!/usr/bin/env python3
"""NaFT P75 Okinawa: audit public derived GIS attributes, optionally verify local original ZIP.
The raw archive, SHP, DBF, and per-feature geometries are not published in this repository.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
LEDGER=ROOT/'research/p75-okinawa-soil-shapefile-source-v1.json'
ZIP_SHA='68cb4b0950aaadc07ce1e98bf52497f66b34ed595cbec6b0b511f87b1310c68f'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
SOIL_FIELDS=('包括_統群','統群コード','亜群コード','群コード')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
MEMBERS={
'dbf':(728328,'daa07b86f58f6ddbc8d3be790bb26104195326891bbbf2cc33c4d381da15fa07'),
'prj':(145,'d1de156bb748892db7642d045767629921ea76cc06597e25cea2411b12e7b0b2'),
'sbn':(6636,'3272e96778e53d3a90ffc2c17f5066c3cf0938bca62540b026ee22438010c087'),
'sbx':(316,'65f353bbd0bfd1a0603f32c1627f47da32f228cb58f08496dabffd021779710c'),
'shp':(7689808,'e64cc3e7378c9bd35981a9c713d1cce1c22a50b85d5b912d153186765c1d5005'),
'shp.xml':(105663,'7052622568dc0e902bc41b33f00f53c5fc2d85f00d13a98f4413edce70efa5ea'),
'shx':(5404,'cbac7e44f7e80a99d9903a67ce832dece3fdf34ccda4461f5cb3b674b0d42b76'),
}
COUNTS={'田':71,'普通畑':366,'牧草地':109,'樹園地':117}
GUN_COUNTS={'':272,'国頭郡':177,'島尻郡':107,'八重山郡':66,'中頭郡':37,'宮古郡':4}
BBOX=[122.94219806638782,24.04685041471502,131.32329028381963,27.080555506131848]
MULTIPLE_GUN={'与那原町':['中頭郡','島尻郡'],'南風原町':['中頭郡','島尻郡']}

def check(ok,why):
    if not ok:raise ValueError('P75_OKINAWA_SOURCE_BLOCKED:'+why)

def totals(rows):
    return [sum(row[i+2] for row in rows) for i in range(4)]

def grouped(rows,keys):
    aggregate=defaultdict(Counter)
    for row in rows:aggregate[tuple(row[key] for key in keys)][row['地目区分']]+=1
    return [[*key,*[items.get(land,0) for land in LAND]] for key,items in sorted(aggregate.items())]

def multiples(rows,index):
    mapping=defaultdict(set)
    for row in rows:mapping[row[index]].add(row[1-index])
    return {key:sorted(values) for key,values in mapping.items() if len(values)>1}

def audit(m):
    src,geo=m['source'],m['geometry']
    check(m['schema']=='naft-p75-okinawa-soil-shapefile-v1','SCHEMA')
    check(src['provided_filename']=='沖縄県.zip' and src['member_folder']=='k47沖縄県','SOURCE_NAME')
    check(src['source_zip_sha256']==ZIP_SHA and src['zip_bytes']==5541529,'ZIP_SHA_SIZE')
    check(src['zip_entries']==len(src['members'])==7,'MEMBERS_COUNT')
    check([x['name'] for x in src['members']]==['k47沖縄県.'+ext for ext in EXT],'MEMBER_FILENAMES')
    check([(x['bytes'],x['sha256']) for x in src['members']]==[MEMBERS[ext] for ext in EXT],'MEMBER_SHA_BYTES')
    check(src['uncompressed_bytes']==sum(x['bytes'] for x in src['members'])==8536300,'EXPANDED_BYTES')
    check(src['metadata_creation_date']=='2017-01-17' and src['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE_NOT_OFFICIALLY_VERIFIED')
    check(src['publisher_authentication']==src['redistribution_rights']=='NOT_VERIFIED' and src['original_zip_committed'] is False and src['raw_geometry_committed'] is False,'DO_NOT_PUBLISH_ORIGINAL')
    check(geo['type']=='POLYGON' and geo['shape_count']==663 and geo['crs']=='GCS_JGD_2000' and geo['bounds_lon_lat']==BBOX,'GEOMETRY')
    check(geo['municipality_name_count']==41 and geo['unique_jcodes']==41 and geo['administrative_code_name_pairs']==75 and geo['gun_name_pairs']==55,'ADMIN_COUNTS')
    check(geo['sicho_counts']=={'':663} and geo['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==663,'GUN_COUNTS')
    check(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==663,'LAND_COUNTS')
    check(m['soil_group_code_categories']==12 and m['soil_fine_class_categories']==40 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CLASSES')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==75 and len(gp)==55 and len({(r[0],r[1]) for r in cp})==75 and len({(r[0],r[1]) for r in gp})==55,'PAIR_COUNTS')
    check(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    check(totals(cp)==totals(gp)==[COUNTS[land] for land in LAND],'PAIRS_LAND_PARITY')
    check(len({r[0] for r in cp})==41 and len({r[1] for r in cp})==41 and all(len(r[0])==5 and r[0].isdigit() and r[0].startswith('47') for r in cp),'ALL_CODES_OKINAWA')
    ca=m['source_code_name_anomalies']
    check(ca['foreign_prefecture_code_feature_count']==0 and ca['foreign_code_prefix_totals']=={} and ca['foreign_prefecture_code_pairs']==[],'ZERO_FOREIGN_CODES')
    check(multiples(cp,0)==ca['codes_with_multiple_names'] and multiples(cp,1)==ca['names_with_multiple_codes'],'CODE_NAME_MULTIPLES')
    check(len(ca['codes_with_multiple_names'])==19 and len(ca['names_with_multiple_codes'])==16,'MULTIPLE_CODE_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_UNSAFE_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==272 and ga['non_okinawa_gun_name_feature_count']==0,'GUN_QUALITY')
    gun_agg=Counter();names=defaultdict(set)
    for gun,name,*numbers in gp:
        gun_agg[gun]+=sum(numbers)
        if gun:names[name].add(gun)
    check(dict(gun_agg)==GUN_COUNTS,'GUN_PAIR_AGGREGATES')
    check({name:sorted(v) for name,v in names.items() if len(v)>1}==ga['multiple_nonempty_guns_per_municipality_name']==MULTIPLE_GUN,'MULTIPLE_GUN_NAMES')
    missing=[{'municipality_name':name,'empty_gun_polygon_count':sum(numbers),'gun_names_seen_elsewhere':sorted(names[name])} for gun,name,*numbers in gp if not gun and name in names]
    check(missing==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in missing)==ga['empty_gun_features_for_names_with_county_elsewhere']==52,'BLANK_GUN_WITH_NAMED')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_UNSAFE_GUN_JOIN')
    sci=m['scientific_boundaries']
    check(sci['counts_are_polygon_features_not_area_ha'] is True and sci['municipality_level_aggregations_pending_reconciliation'] is True,'NO_AREA_OR_MODERN_JOIN')
    check(sci['calculation_of_certified_credits_prohibited'] is True and sci['official_credit_tco2e'] is None and sci['raw_geometry_licensed_for_publication'] is False,'NO_CARBON_CREDIT_CLAIMS')
    return True

def member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')

def parse_dbf(blob):
    check(len(blob)>=353,'DBF_TOO_SHORT')
    n,head,width=struct.unpack_from('<IHH',blob,4)
    check((n,head,width)==(663,353,1098) and head+n*width<=len(blob),'DBF_HEADER')
    fields=[];pos=32
    while pos+32<=head and blob[pos]!=13:
        f=blob[pos:pos+32]
        check(f[11]==ord('C'),'DBF_NON_TEXT')
        fields.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));pos+=32
    check(pos<head and blob[pos]==13 and [name for name,_ in fields]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};start=1
    for name,length in fields:spans[name]=(start,start+length);start+=length
    check(start==width,'DBF_RECORD_WIDTH')
    rows=[]
    for i in range(n):
        raw=blob[head+i*width:head+(i+1)*width]
        check(len(raw)==width and raw[0]==0x20,'DBF_DELETED_ROW')
        row={name:raw[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        check(row['KEN_1']=='沖縄県' and row['SIKUCHOSON'] and row['地目区分'] in LAND and row['JCODE'].startswith('47') and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_ADMIN_LAND')
        check(all(row[name] for name in SOIL_FIELDS),'DBF_SOIL_MISSING')
        rows.append(row)
    return rows

def verify_shapes(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHAPE_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_TYPE')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_FILE_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==BBOX,'SHAPE_BOUNDS')
    check(len(shx)==100+663*8,'SHX_FEATURE_COUNT')
    off=100
    for i in range(663):
        wordoff,words=struct.unpack_from('>II',shx,100+8*i)
        recno,recwords=struct.unpack_from('>II',shp,off)
        check(wordoff*2==off and words==recwords and recno==i+1,'SHAPE_RECORD_INDEX_ALIGNMENT')
        check(struct.unpack_from('<I',shp,off+8)[0]==5,'SHAPE_RECORD_POLYGON')
        off+=8+recwords*2
        check(off<=len(shp),'SHAPE_RECORD_OVERRUN')
    check(off==len(shp),'SHAPE_TRAILING_BYTES')

def verify_zip(path,m):
    p=Path(path)
    check(p.is_file() and p.stat().st_size==5541529,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    blobs={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();check(len(infos)==7,'ORIGINAL_SEVEN_MEMBERS')
        for info,ext,member in zip(infos,EXT,m['source']['members']):
            check(member_name(info)=='k47沖縄県/'+member['name'],'ORIGINAL_MEMBER_NAME')
            raw=z.read(info)
            check(len(raw)==member['bytes'] and sha256(raw).hexdigest()==member['sha256'],'ORIGINAL_MEMBER_SHA')
            blobs[ext]=raw
    check(b'GCS_JGD_2000' in blobs['prj'],'ORIGINAL_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in blobs['shp.xml'],'ORIGINAL_XML_CREATION_DATE')
    verify_shapes(blobs['shp'],blobs['shx'])
    rows=parse_dbf(blobs['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_JCODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==COUNTS,'ORIGINAL_LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'ORIGINAL_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':663},'ORIGINAL_SICHO')
    check(len({r['群コード'] for r in rows})==12 and len({r['包括_統群'] for r in rows})==40,'ORIGINAL_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_663_POLYGONS_VERIFIED','features':663,'jcode_pairs':75,'gun_pairs':55,'source_files_verified':7,'raw_gis_committed':False}

def main(args):
    m=json.loads(LEDGER.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:result={'status':'PUBLIC_LEDGER_CONSISTENT_ORIGINAL_NOT_IN_CI','features':663,'jcode_pairs':75,'gun_pairs':55,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p75-okinawa-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
