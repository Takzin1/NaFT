#!/usr/bin/env python3
"""NaFT P65 Kagawa: audit public derived aggregates; verify a permitted local original ZIP.
Never publish original ZIP, SHP, DBF or geometry before permissions are established.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p65-kagawa-soil-shapefile-source-v1.json'
ZIP_SHA='715f79859b59b29403ddb9b9e875074208c148cbc2fc4f4008d6392fa65858be'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNTS={'田':217,'普通畑':141,'牧草地':7,'樹園地':143}
GUN_COUNTS={'綾歌郡':36,'':358,'木田郡':24,'仲多度郡':60,'小豆郡':26,'香川郡':4}
BOUNDS=[133.52673014757838,34.016058078217874,134.43624711880966,34.5578230845225]
def check(ok,why):
    if not ok:raise ValueError('P65_KAGAWA_SOURCE_BLOCKED:'+why)
def totals(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]
def grouped(rows,keys):
    agg=defaultdict(Counter)
    for r in rows:agg[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[v.get(t,0) for t in LAND]] for key,v in sorted(agg.items())]
def multiple(rows,index):
    agg=defaultdict(set)
    for r in rows:agg[r[index]].add(r[1-index])
    return {k:sorted(v) for k,v in agg.items() if len(v)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p65-kagawa-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='香川県.zip' and s['member_folder']=='k37香川県','SOURCE_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==5394144,'ORIGINAL_ZIP_BYTES_SHA')
    check(s['zip_entries']==len(s['members'])==7,'ZIP_MEMBERS')
    check([v['name'] for v in s['members']]==['k37香川県.'+ext for ext in EXT],'MEMBER_NAMES')
    check(sum(v['bytes'] for v in s['members'])==s['uncompressed_bytes']==8272630,'MEMBER_BYTES')
    check(all(len(v['sha256'])==64 and set(v['sha256'])<=set('0123456789abcdef') for v in s['members']),'MEMBER_HASH_FORMAT')
    check(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'RAW_PRIVATE')
    check(g['type']=='POLYGON' and g['crs']=='GCS_JGD_2000' and g['shape_count']==508 and g['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    check(g['municipality_name_count']==17 and g['unique_jcodes']==20 and g['administrative_code_name_pairs']==44 and g['gun_name_pairs']==23,'ADMIN_COUNTS')
    check(g['sicho_counts']=={'':508} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==508,'GUN_COUNTS')
    check(m['feature_counts_by_landuse']==LAND_COUNTS and sum(LAND_COUNTS.values())==508,'LAND_COUNTS')
    check(m['fields']==list(FIELDS) and m['soil_group_code_categories']==9 and m['soil_fine_class_categories']==42,'SOIL_CLASSES')
    check(m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_FIELDS_MISSING')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==44 and len(gp)==23 and len({(r[0],r[1]) for r in cp})==44 and len({(r[0],r[1]) for r in gp})==23,'PAIR_COUNTS')
    check(all(len(r)==6 and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in cp+gp),'PAIR_VALUES')
    check(totals(cp)==totals(gp)==[LAND_COUNTS[k] for k in LAND],'PAIR_PARITY')
    check(len({r[0] for r in cp})==20 and len({r[1] for r in cp})==17 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'CODE_NAME_FORMAT')
    ca=m['source_code_name_anomalies'];foreign=[r for r in cp if not r[0].startswith('37')]
    check(foreign==ca['foreign_prefecture_code_pairs'] and all(r[0].startswith('36') for r in foreign),'FOREIGN_CODE_ROWS')
    check(sum(sum(r[2:]) for r in foreign)==ca['foreign_prefecture_code_feature_count']==10 and ca['foreign_code_prefix_totals']=={'36':10},'FOREIGN_COUNT')
    check(multiple(cp,0)==ca['codes_with_multiple_names'] and multiple(cp,1)==ca['names_with_multiple_codes'],'CODE_MULTIPLES')
    check(len(ca['codes_with_multiple_names'])==10 and len(ca['names_with_multiple_codes'])==13,'MULTIPLE_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_AUTO_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==358,'GUN_FEATURES')
    gunCounts=Counter()
    named=defaultdict(set)
    for gun,name,*values in gp:
        gunCounts[gun]+=sum(values)
        if gun:named[name].add(gun)
    check(dict(gunCounts)==GUN_COUNTS,'GUN_PAIR_COUNTS')
    check({name:sorted(vals) for name,vals in named.items() if len(vals)>1}==ga['multiple_nonempty_guns_per_municipality_name']=={},'MULTIPLE_GUN_NAMES')
    blanks=[{'municipality_name':name,'empty_gun_polygon_count':sum(values),'gun_names_seen_elsewhere':sorted(named[name])} for gun,name,*values in gp if not gun and name in named]
    check(blanks==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blanks)==ga['empty_gun_features_for_names_with_county_elsewhere']==53,'EMPTY_GUN_WITH_NAME')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_AUTO_GUN_JOIN')
    bound=m['scientific_boundaries']
    check(bound['counts_are_polygon_features_not_area_ha'] is True and bound['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA')
    check(bound['calculation_of_certified_credits_prohibited'] is True and bound['official_credit_tco2e'] is None and bound['raw_geometry_licensed_for_publication'] is False,'NOT_CERTIFIED_CREDIT')
    return True
def member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    n,head,size=struct.unpack_from('<IHH',blob,4)
    check((n,head,size)==(508,353,1098) and head+n*size<=len(blob),'DBF_HEADER')
    fields=[];pos=32
    while pos+32<=head and blob[pos]!=13:
        f=blob[pos:pos+32]
        check(f[11]==ord('C'),'DBF_TEXT_FIELD')
        fields.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));pos+=32
    check(pos<head and blob[pos]==13 and [name for name,_ in fields]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};start=1
    for name,width in fields:spans[name]=(start,start+width);start+=width
    check(start==size,'DBF_RECORD_BYTES')
    records=[]
    for i in range(n):
        data=blob[head+i*size:head+(i+1)*size]
        check(len(data)==size and data[0]==0x20,'DBF_ROW_ACTIVE')
        row={name:data[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        check(row['KEN_1']=='香川県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_ATTRIBUTES')
        check(all(row[k] for k in ('包括_統群','統群コード','亜群コード','群コード')),'SOIL_REQUIRED')
        records.append(row)
    return records
def verify_shapes(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHAPE_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_BYTE_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'BBOX')
    check(len(shx)==100+8*508,'SHX_FEATURE_COUNT')
    offset=100
    for i in range(508):
        word_offset,word_len=struct.unpack_from('>II',shx,100+8*i)
        number,record_words=struct.unpack_from('>II',shp,offset)
        check(word_offset*2==offset and word_len==record_words and number==i+1,'SHP_SHX_RECORD_ALIGNMENT')
        check(struct.unpack_from('<I',shp,offset+8)[0]==5,'SHP_POLYGON_FEATURE')
        offset+=8+record_words*2
        check(offset<=len(shp),'RECORD_OVERRUN')
    check(offset==len(shp),'SHP_TRAILING')
def verify_zip(file,m):
    f=Path(file)
    check(f.is_file() and f.stat().st_size==5394144,'ZIP_SIZE')
    check(sha256(f.read_bytes()).hexdigest()==ZIP_SHA,'ZIP_SHA')
    blobs={}
    with zipfile.ZipFile(f) as z:
        infos=z.infolist();check(len(infos)==7,'ZIP_ENTRIES')
        for info,ext,member in zip(infos,EXT,m['source']['members']):
            check(member_name(info)=='k37香川県/'+member['name'],'MEMBER_PATH')
            raw=z.read(info)
            check(len(raw)==member['bytes'] and sha256(raw).hexdigest()==member['sha256'],'MEMBER_HASH')
            blobs[ext]=raw
    check(b'GCS_JGD_2000' in blobs['prj'],'PRJ_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in blobs['shp.xml'],'XML_CREATED')
    verify_shapes(blobs['shp'],blobs['shx'])
    rows=parse_dbf(blobs['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_JCODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==LAND_COUNTS,'ORIGINAL_LAND_COUNTS')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'ORIGINAL_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':508},'ORIGINAL_SICHO')
    check(len({r['群コード'] for r in rows})==9 and len({r['包括_統群'] for r in rows})==42,'ORIGINAL_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_508_POLYGONS_FULLY_VERIFIED','features':508,'jcode_pairs':44,'gun_pairs':23,'raw_gis_committed':False}
def main(args):
    m=json.loads(MANIFEST.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:
        result={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':508,'jcode_pairs':44,'gun_pairs':23,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p65-kagawa-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
