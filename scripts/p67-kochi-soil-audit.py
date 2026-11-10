#!/usr/bin/env python3
"""NaFT P67 Kochi: public-source derived attribute audit and private original-ZIP replay.
Do not publish licensed source geometry, original ZIP, DBF or SHP.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p67-kochi-soil-shapefile-source-v1.json'
ZIP_SHA='783d8be4ba99102f30a136ac056227eceff4b1d36d7b212e52de1b0f7d5769af'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNTS={'田':334,'普通畑':228,'牧草地':34,'樹園地':171}
GUN_COUNTS={'長岡郡':32,'土佐郡':19,'高岡郡':156,'幡多郡':61,'':379,'安芸郡':84,'吾川郡':30,'南宇和郡':3,'北宇和郡':1,'上浮穴郡':2}
BBOX=[132.49168124739185,32.72507072663292,134.2958250814625,33.85584823720654]
FOREIGN_GUNS=('上浮穴郡','北宇和郡','南宇和郡')
def check(ok,why):
    if not ok:raise ValueError('P67_KOCHI_SOURCE_BLOCKED:'+why)
def totals(rows):
    return [sum(row[i+2] for row in rows) for i in range(4)]
def grouped(rows,keys):
    counts=defaultdict(Counter)
    for r in rows:counts[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[c.get(land,0) for land in LAND]] for key,c in sorted(counts.items())]
def multiple(rows,index):
    groups=defaultdict(set)
    for row in rows:groups[row[index]].add(row[1-index])
    return {k:sorted(v) for k,v in groups.items() if len(v)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p67-kochi-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='高知県.zip' and s['member_folder']=='k39高知県','SOURCE_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==5950368,'ZIP_SHA_SIZE')
    check(s['zip_entries']==len(s['members'])==7,'MEMBERS_7')
    check([r['name'] for r in s['members']]==['k39高知県.'+e for e in EXT],'MEMBER_NAMES')
    check(s['uncompressed_bytes']==sum(v['bytes'] for v in s['members'])==9460292,'UNCOMPRESSED_BYTES')
    check(all(len(v['sha256'])==64 and set(v['sha256'])<=set('0123456789abcdef') for v in s['members']),'MEMBER_SHA_FORMAT')
    check(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'PRIVATE_SOURCE_ONLY')
    check(g['type']=='POLYGON' and g['shape_count']==767 and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BBOX,'GEOMETRY')
    check(g['municipality_name_count']==34 and g['unique_jcodes']==37 and g['administrative_code_name_pairs']==63 and g['gun_name_pairs']==50,'ADMIN_COUNTS')
    check(g['gun_counts']==GUN_COUNTS and g['sicho_counts']=={'':767} and sum(GUN_COUNTS.values())==767,'GUN_COUNTS')
    check(m['feature_counts_by_landuse']==LAND_COUNTS and sum(LAND_COUNTS.values())==767,'LAND_COUNTS')
    check(m['fields']==list(FIELDS) and m['soil_group_code_categories']==15 and m['soil_fine_class_categories']==43,'SOIL_CLASSES')
    check(m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_MISSING')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==63 and len(gp)==50 and len({(r[0],r[1]) for r in cp})==63 and len({(r[0],r[1]) for r in gp})==50,'PAIRS_UNIQUE')
    check(all(len(r)==6 and r[1] and all(type(n) is int and n>=0 for n in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    check(totals(cp)==totals(gp)==[LAND_COUNTS[k] for k in LAND],'PAIR_LAND_PARITY')
    check(len({r[0] for r in cp})==37 and len({r[1] for r in cp})==34 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'JCODE_FORMAT')
    ca=m['source_code_name_anomalies'];foreign=[r for r in cp if not r[0].startswith('39')]
    check(foreign==ca['foreign_prefecture_code_pairs']==[['38386','梼原町',0,0,2,0],['38484','四万十市',1,0,0,0],['38506','宿毛市',3,0,0,0]],'FOREIGN_CODE_PAIRS')
    check(ca['foreign_prefecture_code_feature_count']==6 and ca['foreign_code_prefix_totals']=={'38':6},'FOREIGN_CODE_COUNT')
    check(multiple(cp,0)==ca['codes_with_multiple_names'] and multiple(cp,1)==ca['names_with_multiple_codes'],'CODE_MANY_TO_MANY')
    check(len(ca['codes_with_multiple_names'])==18 and len(ca['names_with_multiple_codes'])==19,'CODE_MULTI_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==379,'GUN_BLANK')
    gp_counts=Counter();named=defaultdict(set)
    for gun,name,*vals in gp:
        gp_counts[gun]+=sum(vals)
        if gun:named[name].add(gun)
    check(dict(gp_counts)==GUN_COUNTS,'GUN_PAIR_SUM')
    foreign_guns=[r for r in gp if r[0] in FOREIGN_GUNS]
    check(foreign_guns==ga['non_kochi_gun_name_rows'] and sum(sum(r[2:]) for r in foreign_guns)==ga['non_kochi_gun_name_feature_count']==6,'FOREIGN_GUNS')
    multi_gun={name:sorted(g) for name,g in named.items() if len(g)>1}
    check(multi_gun==ga['multiple_nonempty_guns_per_municipality_name'] and len(multi_gun)==6,'MULTIPLE_GUN_NAMES')
    blanks=[{'municipality_name':name,'empty_gun_polygon_count':sum(v),'gun_names_seen_elsewhere':sorted(named[name])} for gun,name,*v in gp if not gun and name in named]
    check(blanks==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blanks)==ga['empty_gun_features_for_names_with_county_elsewhere']==92,'COUNTY_BLANK_NAMED')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_GUN_JOIN')
    science=m['scientific_boundaries']
    check(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NO_AREA')
    check(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NO_CERTIFIED_CREDIT')
    return True
def source_path(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    n,h,w=struct.unpack_from('<IHH',blob,4)
    check((n,h,w)==(767,353,1098) and h+n*w<=len(blob),'DBF_HEADER')
    fields=[];at=32
    while at+32<=h and blob[at]!=13:
        f=blob[at:at+32];check(f[11]==ord('C'),'DBF_TEXT_TYPE')
        fields.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));at+=32
    check(at<h and blob[at]==13 and [n for n,_ in fields]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};pos=1
    for name,size in fields:spans[name]=(pos,pos+size);pos+=size
    check(pos==w,'DBF_RECORD_WIDTH')
    rows=[]
    for i in range(n):
        rowb=blob[h+i*w:h+(i+1)*w]
        check(len(rowb)==w and rowb[0]==0x20,'DBF_ACTIVE_ROW')
        r={name:rowb[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        check(r['KEN_1']=='高知県' and r['地目区分'] in LAND and r['SIKUCHOSON'] and len(r['JCODE'])==5 and r['JCODE'].isdigit(),'DBF_ADMIN_VALUES')
        check(all(r[k] for k in ('包括_統群','統群コード','亜群コード','群コード')),'DBF_SOIL_REQUIRED')
        rows.append(r)
    return rows
def verify_shapefile(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHP_SHX_MIN_BYTES')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHP_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHP_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHP_SHX_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==BBOX,'SHP_BOUNDS')
    check(len(shx)==100+8*767,'SHX_COUNT')
    off=100
    for i in range(767):
        wordoffset,wordlength=struct.unpack_from('>II',shx,100+i*8)
        num,recordwords=struct.unpack_from('>II',shp,off)
        check(wordoffset*2==off and wordlength==recordwords and num==i+1,'SHP_SHX_INDEX')
        check(struct.unpack_from('<I',shp,off+8)[0]==5,'SHP_RECORD_POLYGON')
        off+=8+recordwords*2
        check(off<=len(shp),'SHP_OVERRUN')
    check(off==len(shp),'SHP_RECORD_END')
def verify_zip(filename,m):
    p=Path(filename)
    check(p.is_file() and p.stat().st_size==5950368,'ZIP_BYTES')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ZIP_SHA')
    original={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();check(len(infos)==7,'ZIP_SEVEN_MEMBERS')
        for info,ext,meta in zip(infos,EXT,m['source']['members']):
            check(source_path(info)=='k39高知県/'+meta['name'],'ORIGINAL_MEMBER_NAME')
            b=z.read(info)
            check(len(b)==meta['bytes'] and sha256(b).hexdigest()==meta['sha256'],'ORIGINAL_MEMBER_SHA')
            original[ext]=b
    check(b'GCS_JGD_2000' in original['prj'],'ORIGINAL_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in original['shp.xml'],'XML_DATE')
    verify_shapefile(original['shp'],original['shx'])
    rows=parse_dbf(original['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_CODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==LAND_COUNTS,'DBF_LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'DBF_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':767},'DBF_SICHO')
    check(len({r['群コード'] for r in rows})==15 and len({r['包括_統群'] for r in rows})==43,'DBF_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_767_POLYGONS_FULLY_VERIFIED','features':767,'jcode_pairs':63,'gun_pairs':50,'raw_gis_committed':False}
def main(args):
    m=json.loads(MANIFEST.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:out={'status':'PUBLIC_REGISTER_CONSISTENT_PRIVATE_ZIP_NOT_IN_CI','features':767,'jcode_pairs':63,'gun_pairs':50,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':out=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p67-kochi-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
