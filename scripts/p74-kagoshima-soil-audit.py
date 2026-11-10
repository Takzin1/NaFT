#!/usr/bin/env python3
"""NaFT P74 Kagoshima: public derived-attribute ledger audit and local original ZIP replay.
Do not publish original ZIP/SHP/DBF or individual geographic feature coordinates.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile

ROOT=Path(__file__).resolve().parent.parent
LEDGER=ROOT/'research/p74-kagoshima-soil-shapefile-source-v1.json'
ZIP_SHA='26b91128ec49d96d48285157295e5aef2bc3b7fe464c24ac0349493bafc8e817'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
SOIL_FIELDS=('包括_統群','統群コード','亜群コード','群コード')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
MEMBERS={
'dbf':(1701156,'0b958beeae4eaed44f9d9698c5dc0055344bf73ab4678a8241fc1f24b5d047b1'),
'prj':(145,'d1de156bb748892db7642d045767629921ea76cc06597e25cea2411b12e7b0b2'),
'sbn':(14972,'96bed22cf778fa89ddbad4ed6c54adb647d75cfcee7af3f4c8a11ff5ed424e1d'),
'sbx':(540,'97c075469d3ae492e1f6999cf1a476895d6eb9e19d625a938c25d05ce7feff7f'),
'shp':(20627116,'d6f14b4f5a4cae3d255dd71522cc1ed0396154ebcd03f7133e5157fdffcb38ba'),
'shp.xml':(105663,'5bc0aa3c3716c61b9df36ea5ee0bf2a4921e8882ec2e4638e96267883114da65'),
'shx':(12492,'7e7bc47cc71da03a98a2e0c795fd13403608bc43168d3fa594dd3ec4fe522dad'),
}
COUNTS={'田':467,'普通畑':616,'牧草地':111,'樹園地':355}
GUN_COUNTS={'':1039,'出水郡':23,'熊毛郡':93,'大島郡':180,'姶良郡':30,'薩摩郡':51,'肝属郡':102,'曽於郡':31}
BOUNDS=[128.3958638018731,27.020080694968268,131.20017362541256,32.300699385068704]
MULTI_GUN={'東串良町':['曽於郡','肝属郡']}
def check(ok,reason):
    if not ok:raise ValueError('P74_KAGOSHIMA_SOURCE_BLOCKED:'+reason)
def totals(rows):
    return [sum(row[2+i] for row in rows) for i in range(4)]
def grouped(rows,keys):
    agg=defaultdict(Counter)
    for row in rows:agg[tuple(row[k] for k in keys)][row['地目区分']]+=1
    return [[*key,*[counts.get(land,0) for land in LAND]] for key,counts in sorted(agg.items())]
def multiple(rows,index):
    groups=defaultdict(set)
    for row in rows:groups[row[index]].add(row[1-index])
    return {key:sorted(vals) for key,vals in groups.items() if len(vals)>1}
def audit(m):
    src,geo=m['source'],m['geometry']
    check(m['schema']=='naft-p74-kagoshima-soil-shapefile-v1','SCHEMA')
    check(src['provided_filename']=='鹿児島県.zip' and src['member_folder']=='k46鹿児島県','SOURCE_NAME')
    check(src['source_zip_sha256']==ZIP_SHA and src['zip_bytes']==14692127,'ZIP_SHA_SIZE')
    check(src['zip_entries']==len(src['members'])==7,'SEVEN_MEMBERS')
    check([r['name'] for r in src['members']]==['k46鹿児島県.'+ext for ext in EXT],'MEMBER_NAMES')
    check([(r['bytes'],r['sha256']) for r in src['members']]==[MEMBERS[ext] for ext in EXT],'MEMBER_HASHES_AND_BYTES')
    check(src['uncompressed_bytes']==sum(r['bytes'] for r in src['members'])==22462084,'UNCOMPRESSED_SIZE')
    check(src['metadata_creation_date']=='2017-01-17' and src['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(src['publisher_authentication']==src['redistribution_rights']=='NOT_VERIFIED' and src['original_zip_committed'] is False and src['raw_geometry_committed'] is False,'PRIVATE_ORIGINAL')
    check(geo['type']=='POLYGON' and geo['shape_count']==1549 and geo['crs']=='GCS_JGD_2000' and geo['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    check(geo['municipality_name_count']==41 and geo['unique_jcodes']==45 and geo['administrative_code_name_pairs']==90 and geo['gun_name_pairs']==51,'ADMIN_COUNTS')
    check(geo['sicho_counts']=={'':1549} and geo['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==1549,'GUN_COUNTS')
    check(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==1549,'LAND_COUNTS')
    check(m['soil_group_code_categories']==23 and m['soil_fine_class_categories']==108 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CLASSES')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==90 and len(gp)==51 and len({(r[0],r[1]) for r in cp})==90 and len({(r[0],r[1]) for r in gp})==51,'PAIR_COUNTS')
    check(all(len(row)==6 and row[1] and all(type(v) is int and v>=0 for v in row[2:]) for row in cp+gp),'PAIR_FORMAT')
    check(totals(cp)==totals(gp)==[COUNTS[x] for x in LAND],'LAND_PARITY')
    check(len({r[0] for r in cp})==45 and len({r[1] for r in cp})==41 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'CODE_FORMAT')
    ca=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('46')]
    check(foreign==ca['foreign_prefecture_code_pairs'],'FOREIGN_PAIRS')
    prefixes=Counter()
    for r in foreign:prefixes[r[0][:2]]+=sum(r[2:])
    check(dict(prefixes)==ca['foreign_code_prefix_totals']=={'43':2,'45':24} and sum(prefixes.values())==ca['foreign_prefecture_code_feature_count']==26,'FOREIGN_COUNTS')
    check(multiple(cp,0)==ca['codes_with_multiple_names'] and multiple(cp,1)==ca['names_with_multiple_codes'],'MULTIPLE_CODE_NAMES')
    check(len(ca['codes_with_multiple_names'])==23 and len(ca['names_with_multiple_codes'])==27,'MULTIPLE_CODE_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_AUTO_CITY_JOIN')
    ga=m['source_gun_quality']
    check(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==1039 and ga['non_kagoshima_gun_name_feature_count']==0,'GUN_COUNTS_QUALITY')
    named=defaultdict(set);gunAgg=Counter()
    for gun,name,*vals in gp:
        gunAgg[gun]+=sum(vals)
        if gun:named[name].add(gun)
    check(dict(gunAgg)==GUN_COUNTS,'GUN_AGGREGATES')
    check({n:sorted(guns) for n,guns in named.items() if len(guns)>1}==ga['multiple_nonempty_guns_per_municipality_name']==MULTI_GUN,'MULTI_GUN')
    blanks=[{'municipality_name':n,'empty_gun_polygon_count':sum(vals),'gun_names_seen_elsewhere':sorted(named[n])} for gun,n,*vals in gp if not gun and n in named]
    check(blanks==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blanks)==ga['empty_gun_features_for_names_with_county_elsewhere']==63,'BLANK_GUN_NAMED')
    check(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_AUTO_GUN_JOIN')
    science=m['scientific_boundaries']
    check(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA')
    check(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NO_CARBON_CREDIT')
    return True
def source_member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_SHORT')
    n,head,width=struct.unpack_from('<IHH',blob,4)
    check((n,head,width)==(1549,353,1098) and head+n*width<=len(blob),'DBF_HEADER')
    cols=[];at=32
    while at+32<=head and blob[at]!=13:
        f=blob[at:at+32]
        check(f[11]==ord('C'),'DBF_NON_TEXT')
        cols.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));at+=32
    check(at<head and blob[at]==13 and [n for n,_ in cols]==list(FIELDS),'DBF_FIELDS')
    spans={};pos=1
    for name,size in cols:spans[name]=(pos,pos+size);pos+=size
    check(pos==width,'DBF_WIDTH')
    rows=[]
    for i in range(n):
        b=blob[head+i*width:head+(i+1)*width]
        check(len(b)==width and b[0]==0x20,'DBF_INACTIVE_ROW')
        row={name:b[a:stop].decode('cp932').strip(' \t\0') for name,(a,stop) in spans.items()}
        check(row['KEN_1']=='鹿児島県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_LAND_ADMIN')
        check(all(row[k] for k in SOIL_FIELDS),'DBF_SOIL_MISSING')
        rows.append(row)
    return rows
def verify_shapes(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHAPE_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHP_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'SHAPE_BOUNDS')
    check(len(shx)==100+1549*8,'SHX_COUNT')
    pos=100
    for i in range(1549):
        seek,words=struct.unpack_from('>II',shx,100+8*i)
        recNumber,recWords=struct.unpack_from('>II',shp,pos)
        check(seek*2==pos and words==recWords and recNumber==i+1,'SHAPE_INDEX_ALIGNMENT')
        check(struct.unpack_from('<I',shp,pos+8)[0]==5,'SHAPE_RECORD_POLYGON')
        pos+=8+recWords*2
        check(pos<=len(shp),'SHAPE_OVERRUN')
    check(pos==len(shp),'SHAPE_TRAILING')
def verify_original_zip(filename,m):
    p=Path(filename)
    check(p.is_file() and p.stat().st_size==14692127,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    blobs={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist()
        check(len(infos)==7,'ORIGINAL_MEMBERS')
        for info,ext,member in zip(infos,EXT,m['source']['members']):
            check(source_member_name(info)=='k46鹿児島県/'+member['name'],'ORIGINAL_MEMBER_NAME')
            b=z.read(info)
            check(len(b)==member['bytes'] and sha256(b).hexdigest()==member['sha256'],'ORIGINAL_MEMBER_HASH')
            blobs[ext]=b
    check(b'GCS_JGD_2000' in blobs['prj'],'ORIGINAL_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in blobs['shp.xml'],'ORIGINAL_XML_DATE')
    verify_shapes(blobs['shp'],blobs['shx'])
    rows=parse_dbf(blobs['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_JCODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==COUNTS,'ORIGINAL_LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'ORIGINAL_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':1549},'ORIGINAL_SICHO')
    check(len({r['群コード'] for r in rows})==23 and len({r['包括_統群'] for r in rows})==108,'ORIGINAL_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_1549_POLYGONS_VERIFIED','features':1549,'jcode_pairs':90,'gun_pairs':51,'source_files_verified':7,'raw_gis_committed':False}
def main(argv):
    m=json.loads(LEDGER.read_text(encoding='utf-8'));audit(m)
    if argv==['audit']:result={'status':'PUBLIC_LEDGER_CONSISTENT_ORIGINAL_ZIP_NOT_IN_CI','features':1549,'jcode_pairs':90,'gun_pairs':51,'private_zip_checked_in_ci':False}
    elif len(argv)==2 and argv[0]=='verify':result=verify_original_zip(argv[1],m)
    else:raise ValueError('USAGE: python3 scripts/p74-kagoshima-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
