#!/usr/bin/env python3
"""NaFT P63 Yamaguchi: public derived aggregates audit and private-original full replay.
Never publish raw ZIP, DBF, SHP or geographic feature coordinates absent rights confirmation.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json,struct,sys,zipfile

ROOT=Path(__file__).resolve().parent.parent
REGISTER=ROOT/'research/p63-yamaguchi-soil-shapefile-source-v1.json'
ZIP_SHA='9331249a4b2fef18bba89979954c06a12ea69e8c33708aa1b89282f66c50d957'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
COUNT={'田':483,'普通畑':276,'牧草地':59,'樹園地':215}
GUN={'':890,'熊毛郡':59,'大島郡':40,'阿武郡':38,'鹿足郡':3,'玖珂郡':3}
BOUNDS=[130.78638896717717,33.729662451661014,132.47720546476057,34.793876460230564]
def check(ok,why):
    if not ok:raise ValueError('P63_YAMAGUCHI_SOURCE_BLOCKED:'+why)
def totals(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]
def grouped(rows,keys):
    ctr=defaultdict(Counter)
    for row in rows:ctr[tuple(row[k] for k in keys)][row['地目区分']]+=1
    return [[*key,*[v.get(n,0) for n in LAND]] for key,v in sorted(ctr.items())]
def multiples(rows,col):
    d=defaultdict(set)
    for row in rows:d[row[col]].add(row[1-col])
    return {k:sorted(v) for k,v in d.items() if len(v)>1}
def audit(m):
    src,geo=m['source'],m['geometry']
    check(m['schema']=='naft-p63-yamaguchi-soil-shapefile-v1','SCHEMA')
    check(src['provided_filename']=='山口県.zip' and src['member_folder']=='k35山口県','SOURCE_NAME')
    check(src['source_zip_sha256']==ZIP_SHA and src['zip_bytes']==8786845,'ZIP_SHA_BYTES')
    check(src['zip_entries']==len(src['members'])==7,'MEMBER_COUNT')
    check([member['name'] for member in src['members']]==['k35山口県.'+ext for ext in EXT],'MEMBER_NAMES')
    check(sum(x['bytes'] for x in src['members'])==src['uncompressed_bytes']==13708960,'UNCOMPRESSED_BYTES')
    check(all(len(x['sha256'])==64 and set(x['sha256'])<=set('0123456789abcdef') for x in src['members']),'MEMBER_SHA')
    check(src['metadata_creation_date']=='2017-01-17' and src['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    check(src['publisher_authentication']==src['redistribution_rights']=='NOT_VERIFIED' and src['original_zip_committed'] is False and src['raw_geometry_committed'] is False,'RAW_PRIVATE')
    check(geo['type']=='POLYGON' and geo['crs']=='GCS_JGD_2000' and geo['shape_count']==1033 and geo['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    check(geo['municipality_name_count']==19 and geo['unique_jcodes']==22 and geo['administrative_code_name_pairs']==46 and geo['gun_name_pairs']==25,'ADMIN_COUNT')
    check(geo['sicho_counts']=={'':1033} and geo['gun_counts']==GUN and sum(GUN.values())==1033,'GUN_COUNTS')
    check(m['feature_counts_by_landuse']==COUNT and sum(COUNT.values())==1033,'LAND_COUNTS')
    check(m['soil_group_code_categories']==15 and m['soil_fine_class_categories']==68 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_FIELDS')
    check(m['fields']==list(FIELDS),'DBF_FIELDS')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    check(len(cp)==46 and len(gp)==25 and len({(r[0],r[1]) for r in cp})==46 and len({(r[0],r[1]) for r in gp})==25,'PAIRS')
    check(all(len(r)==6 and r[1] and all(type(x) is int and x>=0 for x in r[2:]) for r in cp+gp),'PAIR_VALUES')
    check(totals(cp)==totals(gp)==[COUNT[k] for k in LAND],'PAIR_PARITY')
    check(len({r[0] for r in cp})==22 and len({r[1] for r in cp})==19 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'CODE_NAME_FORMAT')
    c=m['source_code_name_anomalies'];foreign=[r for r in cp if not r[0].startswith('35')]
    prefixes=Counter()
    for r in foreign:prefixes[r[0][:2]]+=sum(r[2:])
    check(foreign==c['foreign_prefecture_code_pairs'] and dict(prefixes)==c['foreign_code_prefix_totals']=={'32':3,'34':1},'FOREIGN_CODES')
    check(sum(sum(r[2:]) for r in foreign)==c['foreign_prefecture_code_feature_count']==4,'FOREIGN_CODE_COUNT')
    check(multiples(cp,0)==c['codes_with_multiple_names'] and multiples(cp,1)==c['names_with_multiple_codes'],'CODE_MULTIPLES')
    check(len(c['codes_with_multiple_names'])==11 and len(c['names_with_multiple_codes'])==14,'CODE_MULTIPLE_COUNTS')
    check(c['one_to_one_code_name_mapping'] is False and c['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','UNSAFE_CITY_JOIN_BLOCKED')
    gun=m['source_gun_quality']
    check(gun['gun_feature_counts']==GUN and gun['blank_gun_features']==890,'GUN_FEATURES')
    gtotal=Counter()
    for row in gp:gtotal[row[0]]+=sum(row[2:])
    check(dict(gtotal)==GUN,'GUN_PAIR_COUNTS')
    foreign_gun=[r for r in gp if r[0]=='鹿足郡']
    check(foreign_gun==gun['non_yamaguchi_gun_name_rows'] and sum(sum(r[2:]) for r in foreign_gun)==gun['non_yamaguchi_gun_name_feature_count']==3,'FOREIGN_GUN')
    name_guns=defaultdict(set)
    for g,n,*values in gp:
        if g:name_guns[n].add(g)
    check({n:sorted(v) for n,v in name_guns.items() if len(v)>1}==gun['multiple_nonempty_guns_per_municipality_name']=={},'GUN_MULTIPLES')
    blank=[{'municipality_name':n,'empty_gun_polygon_count':sum(v),'gun_names_seen_elsewhere':sorted(name_guns[n])} for g,n,*v in gp if not g and n in name_guns]
    check(blank==gun['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(x['empty_gun_polygon_count'] for x in blank)==gun['empty_gun_features_for_names_with_county_elsewhere']==195,'GUN_BLANK_NAMED')
    check(gun['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','UNSAFE_GUN_JOIN_BLOCKED')
    s=m['scientific_boundaries']
    check(s['counts_are_polygon_features_not_area_ha'] is True and s['municipality_level_aggregations_pending_reconciliation'] is True,'NO_AREA_MUNICIPAL')
    check(s['calculation_of_certified_credits_prohibited'] is True and s['official_credit_tco2e'] is None and s['raw_geometry_licensed_for_publication'] is False,'NO_CREDITS_RAW_GEO')
    return True
def original_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    check(len(blob)>=353,'DBF_LENGTH')
    count,header,size=struct.unpack_from('<IHH',blob,4)
    check((count,header,size)==(1033,353,1098) and header+count*size<=len(blob),'DBF_HEADER')
    cols=[];pos=32
    while pos+32<=header and blob[pos]!=13:
        c=blob[pos:pos+32];check(c[11]==ord('C'),'DBF_FIELD_TYPE')
        cols.append((c[:11].split(b'\x00')[0].decode('cp932'),c[16]));pos+=32
    check(pos<header and blob[pos]==13 and [n for n,_ in cols]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};at=1
    for n,w in cols:spans[n]=(at,at+w);at+=w
    check(at==size,'DBF_RECORD_SIZE')
    records=[]
    for i in range(count):
        rec=blob[header+i*size:header+(i+1)*size]
        check(len(rec)==size and rec[0]==0x20,'DBF_RECORD_ACTIVE')
        r={name:rec[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        check(r['KEN_1']=='山口県' and r['地目区分'] in LAND and len(r['JCODE'])==5 and r['JCODE'].isdigit() and r['SIKUCHOSON'],'DBF_ATTRIBUTES')
        check(all(r[k] for k in ('包括_統群','統群コード','亜群コード','群コード')),'DBF_SOIL_MISSING')
        records.append(r)
    return records
def verify_shp(shp,shx):
    check(len(shp)>=100 and len(shx)>=100,'SHP_SHORT')
    check(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_TYPE')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_FILE_BYTES')
    check(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'SHAPE_BOUNDS')
    check(len(shx)==100+1033*8,'SHX_FEATURE_COUNT')
    off=100
    for i in range(1033):
        wordoffset,wordlength=struct.unpack_from('>II',shx,100+8*i)
        idx,length=struct.unpack_from('>II',shp,off)
        check(wordoffset*2==off and wordlength==length and idx==i+1,'SHAPE_RECORD_OFFSET')
        check(struct.unpack_from('<I',shp,off+8)[0]==5,'SHAPE_POLYGON_TYPE')
        off+=8+length*2;check(off<=len(shp),'SHAPE_OVERRUN')
    check(off==len(shp),'SHAPE_TRAILING')
def verify(file,m):
    p=Path(file);check(p.is_file() and p.stat().st_size==8786845,'ORIGINAL_ZIP_SIZE')
    check(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    blobs={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();check(len(infos)==7,'ZIP_ENTRIES')
        for i,(info,ext) in enumerate(zip(infos,EXT)):
            member=m['source']['members'][i]
            check(original_name(info)=='k35山口県/'+member['name'],'ZIP_MEMBER_PATH')
            b=z.read(info)
            check(len(b)==member['bytes'] and sha256(b).hexdigest()==member['sha256'],'MEMBER_SHA_MATCH')
            blobs[ext]=b
    check(b'GCS_JGD_2000' in blobs['prj'],'PRJ_CRS')
    check(b'<CreaDate>20170117</CreaDate>' in blobs['shp.xml'],'XML_CREATION')
    verify_shp(blobs['shp'],blobs['shx'])
    rows=parse_dbf(blobs['dbf'])
    check(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'CODE_REPLAY')
    check(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'GUN_REPLAY')
    check(dict(Counter(r['地目区分'] for r in rows))==COUNT,'LAND_REPLAY')
    check(dict(Counter(r['GUN'] for r in rows))==GUN,'GUN_COUNT_REPLAY')
    check(dict(Counter(r['SICHO'] for r in rows))=={'':1033},'SICHO_REPLAY')
    check(len({r['群コード'] for r in rows})==15 and len({r['包括_統群'] for r in rows})==68,'SOIL_REPLAY')
    return {'status':'PRIVATE_ORIGINAL_ZIP_AND_1033_POLYGONS_VERIFIED','features':1033,'jcode_pairs':46,'gun_pairs':25,'raw_gis_committed':False}
def main(args):
    m=json.loads(REGISTER.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:result={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':1033,'jcode_pairs':46,'gun_pairs':25,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p63-yamaguchi-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
