#!/usr/bin/env python3
"""NaFT P64 Tokushima GIS public-source audit, plus local-only private original ZIP replay.
Public GitHub must never include original ZIP, DBF, SHP or private shape coordinates.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/'research/p64-tokushima-soil-shapefile-source-v1.json'
ZIP_SHA='2871b5b2f6f7d22840da9062b01684c67d2a221bcbfa21290362d21271d4c587'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNTS={'田':291,'普通畑':203,'牧草地':29,'樹園地':169}
GUN_COUNTS={'':368,'板野郡':114,'海部郡':68,'名西郡':39,'那賀郡':28,'勝浦郡':25,'三好郡':23,'美馬郡':19,'名東郡':8}
BOUNDS=[133.68073628028952,33.549120532786475,134.74491502690728,34.250814036638616]
EXPECTED_MULTIPLE_GUN_NAMES={'神山町':['名東郡','名西郡'],'上板町':['名西郡','板野郡'],'美波町':['海部郡','那賀郡']}
def check(ok,why):
    if not ok:raise ValueError('P64_TOKUSHIMA_SOURCE_BLOCKED:'+why)
def total(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]
def grouped(rows,keys):
    ctr=defaultdict(Counter)
    for rec in rows:ctr[tuple(rec[k] for k in keys)][rec['地目区分']]+=1
    return [[*k,*[v.get(l,0) for l in LAND]] for k,v in sorted(ctr.items())]
def multiple(rows,index):
    c=defaultdict(set)
    for r in rows:c[r[index]].add(r[1-index])
    return {k:sorted(v) for k,v in c.items() if len(v)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p64-tokushima-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='徳島県.zip' and s['member_folder']=='k36徳島県','SOURCE_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==4553174,'ZIP_SHA_BYTES')
    check(s['zip_entries']==len(s['members'])==7,'SEVEN_MEMBERS')
    check([a['name'] for a in s['members']]==['k36徳島県.'+ext for ext in EXT],'MEMBER_NAMES')
    check(sum(a['bytes'] for a in s['members'])==s['uncompressed_bytes']==7319034,'MEMBER_BYTES')
    check(all(len(a['sha256'])==64 and set(a['sha256'])<=set('0123456789abcdef') for a in s['members']),'MEMBER_HASH')
    check(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'ORIGINAL_PRIVATE')
    check(g['shape_count']==692 and g['type']=='POLYGON' and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    check(g['municipality_name_count']==24 and g['unique_jcodes']==24 and g['administrative_code_name_pairs']==51 and g['gun_name_pairs']==38,'ADMIN_TOTAL')
    check(g['sicho_counts']=={'':692} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==692,'GUN_COUNTS')
    check(m['feature_counts_by_landuse']==LAND_COUNTS and sum(LAND_COUNTS.values())==692,'LAND_COUNT')
    check(m['fields']==list(FIELDS) and m['soil_group_code_categories']==10 and m['soil_fine_class_categories']==39,'FIELDS_SOIL_CLASSES')
    check(m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_MISSING')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==51 and len(gp)==38 and len({(r[0],r[1]) for r in cp})==51 and len({(r[0],r[1]) for r in gp})==38,'PAIR_COUNT')
    check(all(len(r)==6 and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in cp+gp),'PAIR_FIELDS')
    check(total(cp)==total(gp)==[LAND_COUNTS[k] for k in LAND],'PAIR_PARITY')
    check(len({r[0] for r in cp})==24 and len({r[1] for r in cp})==24 and all(r[0].startswith('36') and len(r[0])==5 and r[0].isdigit() for r in cp),'PREF_CODE')
    ca=m['source_code_name_anomalies']
    check(ca['foreign_prefecture_code_feature_count']==0 and ca['foreign_code_prefix_totals']=={} and ca['foreign_prefecture_code_pairs']==[],'NO_FOREIGN_CODES')
    check(multiple(cp,0)==ca['codes_with_multiple_names'] and multiple(cp,1)==ca['names_with_multiple_codes'],'MULTI_CODES')
    check(len(ca['codes_with_multiple_names'])==14 and len(ca['names_with_multiple_codes'])==18,'MULTI_CODE_COUNT')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==368,'GUN_SOURCE')
    gunCounts=Counter()
    for g,n,*v in gp:gunCounts[g]+=sum(v)
    check(dict(gunCounts)==GUN_COUNTS,'GUN_AGGREGATES')
    named=defaultdict(set)
    for g,n,*v in gp:
        if g:named[n].add(g)
    check({n:sorted(v) for n,v in named.items() if len(v)>1}==ga['multiple_nonempty_guns_per_municipality_name']==EXPECTED_MULTIPLE_GUN_NAMES,'MULTIPLE_GUNS')
    blanks=[{'municipality_name':n,'empty_gun_polygon_count':sum(v),'gun_names_seen_elsewhere':sorted(named[n])} for g,n,*v in gp if not g and n in named]
    check(blanks==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blanks)==ga['empty_gun_features_for_names_with_county_elsewhere']==58,'BLANK_GUNS')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_GUN_JOIN')
    sci=m['scientific_boundaries']
    check(sci['counts_are_polygon_features_not_area_ha'] is True and sci['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA')
    check(sci['calculation_of_certified_credits_prohibited'] is True and sci['official_credit_tco2e'] is None and sci['raw_geometry_licensed_for_publication'] is False,'NOT_CREDIT_OR_PUBLIC_GEO')
    return True
def member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    n,h,s=struct.unpack_from('<IHH',blob,4)
    check((n,h,s)==(692,353,1098) and h+n*s<=len(blob),'DBF_HEADER')
    fields=[];at=32
    while at+32<=h and blob[at]!=13:
        b=blob[at:at+32]
        check(b[11]==ord('C'),'DBF_TEXT_FIELD')
        fields.append((b[:11].split(b'\0')[0].decode('cp932'),b[16]));at+=32
    check(at<h and blob[at]==13 and [k for k,_ in fields]==list(FIELDS),'DBF_FIELDS')
    spans={};pos=1
    for k,w in fields:spans[k]=(pos,pos+w);pos+=w
    check(pos==s,'DBF_RECORD_BYTES')
    records=[]
    for i in range(n):
        b=blob[h+i*s:h+(i+1)*s]
        check(len(b)==s and b[0]==0x20,'DBF_ROW_ACTIVE')
        rec={k:b[a:z].decode('cp932').strip(' \t\0') for k,(a,z) in spans.items()}
        check(rec['KEN_1']=='徳島県' and rec['地目区分'] in LAND and rec['SIKUCHOSON'] and len(rec['JCODE'])==5 and rec['JCODE'].isdigit(),'DBF_ATTR')
        check(all(rec[k] for k in ('群コード','包括_統群','統群コード','亜群コード')),'SOIL_REQUIRED')
        records.append(rec)
    return records
def verify_shapes(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHP_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'POLYGON_TYPE')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHP_SHX_BYTES')
    check(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'BBOX')
    check(len(shx)==100+8*692,'SHX_COUNT')
    off=100
    for i in range(692):
        offset,wordlen=struct.unpack_from('>II',shx,100+i*8)
        idx,recwords=struct.unpack_from('>II',shp,off)
        check(offset*2==off and wordlen==recwords and idx==i+1,'SHP_SHX_ALIGNMENT')
        check(struct.unpack_from('<I',shp,off+8)[0]==5,'POLYGON_FEATURE')
        off+=8+wordlen*2;check(off<=len(shp),'BOUNDS_OVERFLOW')
    check(off==len(shp),'SHP_RECORD_END')
def verify_zip(file,m):
    f=Path(file)
    check(f.is_file() and f.stat().st_size==4553174,'ZIP_SIZE')
    check(sha256(f.read_bytes()).hexdigest()==ZIP_SHA,'ZIP_SHA')
    chunks={}
    with zipfile.ZipFile(f) as z:
        infos=z.infolist();check(len(infos)==7,'ZIP_ENTRIES')
        for info,ext,metadata in zip(infos,EXT,m['source']['members']):
            check(member_name(info)=='k36徳島県/'+metadata['name'],'MEMBER_PATH')
            b=z.read(info)
            check(len(b)==metadata['bytes'] and sha256(b).hexdigest()==metadata['sha256'],'MEMBER_SHA')
            chunks[ext]=b
    check(b'GCS_JGD_2000' in chunks['prj'],'SOURCE_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in chunks['shp.xml'],'CREATION_DATE')
    verify_shapes(chunks['shp'],chunks['shx'])
    records=parse_dbf(chunks['dbf'])
    check(grouped(records,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_CODE_REPLAY')
    check(grouped(records,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in records))==LAND_COUNTS,'LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in records))==GUN_COUNTS,'GUN_REPLAY')
    check(dict(Counter(r['SICHO'] for r in records))=={'':692},'SICHO_REPLAY')
    check(len({r['群コード'] for r in records})==10 and len({r['包括_統群'] for r in records})==39,'SOIL_REPLAY')
    return {'status':'PRIVATE_ORIGINAL_ZIP_692_POLYGONS_VERIFIED','features':692,'jcode_pairs':51,'gun_pairs':38,'raw_gis_committed':False}
def main(args):
    m=json.loads(REGISTER.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:output={'status':'PUBLIC_REGISTER_CONSISTENT_PRIVATE_ORIGINAL_NOT_IN_CI','features':692,'jcode_pairs':51,'gun_pairs':38,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':output=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p64-tokushima-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(output,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
