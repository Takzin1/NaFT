#!/usr/bin/env python3
"""NaFT P71 Oita: public audit of source-derived GIS aggregates and private ZIP replay.
Original ZIP/SHP/DBF and polygon coordinates must not be published without rights confirmation.
"""
from collections import Counter,defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile

ROOT=Path(__file__).resolve().parent.parent
LEDGER=ROOT/'research/p71-oita-soil-shapefile-source-v1.json'
ZIP_SHA='8bc9152a0d50d6e3dcdea6eb1ecc304b386ddafe1de4af1575ebde4f5aa70965'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
SOIL_FIELDS=('包括_統群','統群コード','亜群コード','群コード')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
MEMBERS={
'dbf':(900714,'0fdf14593596d9774d809fa8111c8f13efcee543352bb6bb9783d68b8f134fc7'),
'prj':(145,'d1de156bb748892db7642d045767629921ea76cc06597e25cea2411b12e7b0b2'),
'sbn':(8220,'dbcdcd87919a3b118220442dbad4e5a1edc9eb8799e67c1ad945fc95c09c23e3'),
'sbx':(692,'d9b2e8128972fa61e5ffb0d1a034ee06edcccd01deb5b12197a7c9e2d43a0632'),
'shp':(10760228,'c470ce4ece37c633f9337838be442b5d1f6eb1fbafa7cf46f5a0b44118dc1f54'),
'shp.xml':(105663,'c63b6406174ecf8766dff28956a473f3f717975be5ea82a161e24dab0e256c00'),
'shx':(6660,'f11bfa04a629edced71fa53eb036360e811f74d5b87b6e032d7f2eb26fb8a0a6'),
}
COUNTS={'田':311,'普通畑':234,'牧草地':80,'樹園地':195}
GUN_COUNTS={'':689,'玖珠郡':69,'速見郡':35,'阿蘇郡':16,'東国東郡':8,'朝倉郡':2,'築上郡':1}
BOUNDS=[130.83791614207084,32.74137031009184,132.07526650924214,33.734739662405644]
FOREIGN_GUNS=('阿蘇郡','朝倉郡','築上郡')
MULTI_GUN={'日田市':['朝倉郡','阿蘇郡'],'九重町':['玖珠郡','阿蘇郡'],'玖珠町':['玖珠郡','阿蘇郡']}
def check(ok,why):
    if not ok:raise ValueError('P71_OITA_SOURCE_BLOCKED:'+why)
def totals(rows):
    return [sum(row[i+2] for row in rows) for i in range(4)]
def grouped(rows,keys):
    agg=defaultdict(Counter)
    for r in rows:agg[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[cnt.get(land,0) for land in LAND]] for key,cnt in sorted(agg.items())]
def multiples(rows,i):
    values=defaultdict(set)
    for r in rows:values[r[i]].add(r[1-i])
    return {key:sorted(items) for key,items in values.items() if len(items)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p71-oita-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='大分県.zip' and s['member_folder']=='k44大分県','SOURCE_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==7647021,'ORIGINAL_ZIP_SHA_SIZE')
    check(s['zip_entries']==len(s['members'])==7,'SEVEN_FILES')
    check([r['name'] for r in s['members']]==['k44大分県.'+ext for ext in EXT],'MEMBER_NAMES')
    check([(r['bytes'],r['sha256']) for r in s['members']]==[MEMBERS[ext] for ext in EXT],'MEMBER_HASHES_AND_BYTES')
    check(s['uncompressed_bytes']==sum(x['bytes'] for x in s['members'])==11782322,'UNCOMPRESSED_SIZE')
    check(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'RAW_PRIVATE')
    check(g['type']=='POLYGON' and g['shape_count']==820 and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BOUNDS,'SHAPE_CRS_BOUNDS')
    check(g['municipality_name_count']==18 and g['unique_jcodes']==27 and g['administrative_code_name_pairs']==52 and g['gun_name_pairs']==27,'ADMIN_COUNT')
    check(g['sicho_counts']=={'':820} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==820,'GUN_COUNTS')
    check(m['fields']==list(FIELDS) and m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==820,'LAND_COUNTS')
    check(m['soil_group_code_categories']==15 and m['soil_fine_class_categories']==53 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CLASSES')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==52 and len(gp)==27 and len({(r[0],r[1]) for r in cp})==52 and len({(r[0],r[1]) for r in gp})==27,'PAIR_COUNTS')
    check(all(len(r)==6 and r[1] and all(type(n) is int and n>=0 for n in r[2:]) for r in cp+gp),'PAIR_VALUES')
    check(totals(cp)==totals(gp)==[COUNTS[k] for k in LAND],'LAND_PARITY')
    check(len({r[0] for r in cp})==27 and len({r[1] for r in cp})==18 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'JCODE_FORMAT')
    ca=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('44')]
    prefixes=Counter()
    for row in foreign:prefixes[row[0][:2]]+=sum(row[2:])
    check(foreign==ca['foreign_prefecture_code_pairs'] and dict(prefixes)==ca['foreign_code_prefix_totals']=={'40':6,'43':17},'FOREIGN_CODE_PAIRS')
    check(sum(sum(row[2:]) for row in foreign)==ca['foreign_prefecture_code_feature_count']==23,'FOREIGN_CODE_COUNTS')
    check(multiples(cp,0)==ca['codes_with_multiple_names'] and multiples(cp,1)==ca['names_with_multiple_codes'],'CODE_MULTIPLES')
    check(len(ca['codes_with_multiple_names'])==13 and len(ca['names_with_multiple_codes'])==13,'CODE_AMBIGUITY_COUNTS')
    check(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','BLOCK_UNSAFE_CITY_JOIN')
    gun=m['source_gun_quality']
    check(gun['gun_feature_counts']==GUN_COUNTS and gun['blank_gun_features']==689,'GUN_BLANK_FEATURES')
    gun_count=Counter();name_guns=defaultdict(set)
    for g,n,*values in gp:
        gun_count[g]+=sum(values)
        if g:name_guns[n].add(g)
    check(dict(gun_count)==GUN_COUNTS,'GUN_PAIR_COUNTS')
    foreign_guns=[r for r in gp if r[0] in FOREIGN_GUNS]
    check(foreign_guns==gun['non_oita_gun_name_rows'] and sum(sum(r[2:]) for r in foreign_guns)==gun['non_oita_gun_name_feature_count']==19,'FOREIGN_GUNS')
    check({name:sorted(g) for name,g in name_guns.items() if len(g)>1}==gun['multiple_nonempty_guns_per_municipality_name']==MULTI_GUN,'MULTIPLE_GUN_NAMES')
    blanks=[{'municipality_name':name,'empty_gun_polygon_count':sum(values),'gun_names_seen_elsewhere':sorted(name_guns[name])} for g,name,*values in gp if not g and name in name_guns]
    check(blanks==gun['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blanks)==gun['empty_gun_features_for_names_with_county_elsewhere']==168,'BLANK_GUN_NAMED')
    check(gun['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','BLOCK_UNSAFE_GUN_JOIN')
    science=m['scientific_boundaries']
    check(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA')
    check(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NOT_CARBON_CREDITS')
    return True
def member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_TOO_SHORT')
    n,header,width=struct.unpack_from('<IHH',blob,4)
    check((n,header,width)==(820,353,1098) and header+n*width<=len(blob),'DBF_HEADER')
    fields=[];at=32
    while at+32<=header and blob[at]!=13:
        fld=blob[at:at+32];check(fld[11]==ord('C'),'DBF_FIELD_TYPE')
        fields.append((fld[:11].split(b'\0')[0].decode('cp932'),fld[16]));at+=32
    check(at<header and blob[at]==13 and [name for name,_ in fields]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};pos=1
    for name,size in fields:spans[name]=(pos,pos+size);pos+=size
    check(pos==width,'DBF_COLUMN_WIDTH')
    rows=[]
    for i in range(n):
        rec=blob[header+i*width:header+(i+1)*width]
        check(len(rec)==width and rec[0]==0x20,'DBF_INACTIVE_RECORD')
        row={name:rec[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        check(row['KEN_1']=='大分県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and row['JCODE'].isdigit() and len(row['JCODE'])==5,'DBF_MAIN_ATTR')
        check(all(row[k] for k in SOIL_FIELDS),'DBF_SOIL_FIELD_MISSING')
        rows.append(row)
    return rows
def verify_shapes(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHAPE_TOO_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_TYPE')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'SHAPE_BOUNDS')
    check(len(shx)==100+820*8,'SHX_FEATURE_COUNT')
    offset=100
    for i in range(820):
        word_offset,words=struct.unpack_from('>II',shx,100+i*8)
        rec,record_words=struct.unpack_from('>II',shp,offset)
        check(word_offset*2==offset and record_words==words and rec==i+1,'SHP_SHX_RECORD_ALIGNMENT')
        check(struct.unpack_from('<I',shp,offset+8)[0]==5,'SHP_RECORD_POLYGON')
        offset+=8+record_words*2;check(offset<=len(shp),'SHP_OVERRUN')
    check(offset==len(shp),'SHP_END')
def verify_zip(filename,m):
    p=Path(filename)
    check(p.is_file() and p.stat().st_size==7647021,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    blocks={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();check(len(infos)==7,'ORIGINAL_ZIP_MEMBERS')
        for info,ext,meta in zip(infos,EXT,m['source']['members']):
            check(member_name(info)=='k44大分県/'+meta['name'],'ORIGINAL_MEMBER_NAME')
            raw=z.read(info)
            check(len(raw)==meta['bytes'] and sha256(raw).hexdigest()==meta['sha256'],'ORIGINAL_MEMBER_SHA')
            blocks[ext]=raw
    check(b'GCS_JGD_2000' in blocks['prj'],'ORIGINAL_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in blocks['shp.xml'],'ORIGINAL_CREATION_DATE')
    verify_shapes(blocks['shp'],blocks['shx'])
    rows=parse_dbf(blocks['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_CODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==COUNTS,'DBF_LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'DBF_GUN_COUNTS')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':820},'DBF_SICHO')
    check(len({r['群コード'] for r in rows})==15 and len({r['包括_統群'] for r in rows})==53,'DBF_SOIL_CLASSES')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_820_POLYGONS_VERIFIED','features':820,'jcode_pairs':52,'gun_pairs':27,'original_files_verified':7,'raw_gis_committed':False}
def main(args):
    m=json.loads(LEDGER.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:result={'status':'PUBLIC_REGISTER_CONSISTENT_PRIVATE_ORIGINAL_NOT_IN_CI','features':820,'jcode_pairs':52,'gun_pairs':27,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p71-oita-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
