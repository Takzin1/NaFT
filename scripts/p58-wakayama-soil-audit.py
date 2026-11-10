#!/usr/bin/env python3
"""NaFT P58 Wakayama soil GIS audit (Python stdlib only).

'audit' validates the public derived manifest without private geometry.
'verify PRIVATE_ORIGINAL.zip' replays all archive hashes, SHP/SHX features,
and all 822 CP932 DBF records against committed counts.
Original ZIP, Shapefile geometry and DBF must not be committed publicly.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile

ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p58-wakayama-soil-shapefile-source-v1.json'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード',
        'JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
COUNTS={'田':280,'普通畑':209,'牧草地':8,'樹園地':325}
GUN={'':383,'伊都郡':80,'日高郡':131,'有田郡':80,
     '東牟婁郡':67,'泉南郡':1,'海草郡':16,'西牟婁郡':64}
FOREIGN={'27':2,'29':9}
ZIP_SHA='c663a62ae93deb5672cc7645ec9ec98d18b1bb80171171ce1c74f8b591090453'
BOUNDS=[135.06211223455733,33.440356351953994,135.99644666955822,34.3795490128588]
MEMBER_EXT=['dbf','prj','sbn','sbx','shp','shp.xml','shx']


def require(ok, why):
    if not ok:raise ValueError('P58_WAKAYAMA_SOURCE_BLOCKED:'+why)


def load():
    return json.loads(MANIFEST.read_text(encoding='utf-8'))


def totals(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]


def grouped(rows, keys):
    c=defaultdict(Counter)
    for r in rows:c[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[count.get(name,0) for name in LAND]] for key,count in sorted(c.items())]


def audit(m):
    source,geo=m['source'],m['geometry']
    require(m['schema']=='naft-p58-wakayama-soil-shapefile-v1','SCHEMA')
    require(source['provided_filename']=='和歌山県.zip' and source['member_folder']=='k30和歌山県','SOURCE_NAME')
    require(source['source_zip_sha256']==ZIP_SHA and source['zip_bytes']==5134115,'SOURCE_SHA_SIZE')
    require(source['zip_entries']==len(source['members'])==7,'MEMBER_COUNT')
    require([v['name'] for v in source['members']]==['k30和歌山県.'+s for s in MEMBER_EXT],'MEMBER_NAMES')
    require(source['uncompressed_bytes']==sum(v['bytes'] for v in source['members'])==8261834,'UNCOMPRESSED_TOTAL')
    require(all(len(v['sha256'])==64 and set(v['sha256'])<=set('0123456789abcdef') for v in source['members']),'MEMBER_SHA')
    require(source['metadata_creation_date']=='2017-01-17' and source['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    require(source['publisher_authentication']==source['redistribution_rights']=='NOT_VERIFIED','LICENSE')
    require(source['raw_geometry_committed'] is False and source['original_zip_committed'] is False,'NO_RAW_PUBLICATION')
    require(geo['type']=='POLYGON' and geo['crs']=='GCS_JGD_2000' and geo['shape_count']==822 and geo['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    require(geo['municipality_name_count']==30 and geo['unique_jcodes']==33 and geo['administrative_code_name_pairs']==64,'CODES_AND_NAMES')
    require(geo['sicho_unique_values']==[''] and geo['sicho_counts']=={'':822},'SICHO')
    require(geo['gun_counts']==GUN and sum(GUN.values())==822,'GUN_TOTAL')
    require(geo['jcodes_are_five_digit'] is True and m['fields']==list(FIELDS),'FIELDS')
    require(m['feature_counts_by_landuse']==COUNTS and sum(COUNTS.values())==822,'LAND_COUNTS')
    require(m['soil_group_code_categories']==11 and m['soil_fine_class_categories']==38,'SOIL_CATEGORIES')
    require(m['soil_group_missing_features']==m['soil_detail_missing_features']==0 and m['soil_classification_missing_records']==[],'MISSING_SOIL')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    require(len(cp)==64 and len({(r[0],r[1]) for r in cp})==64,'CODE_PAIR_UNIQUENESS')
    require(len(gp)==44 and len({(r[0],r[1]) for r in gp})==44,'GUN_PAIR_UNIQUENESS')
    require(all(len(r)==6 and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    require(totals(cp)==totals(gp)==[COUNTS[k] for k in LAND],'LANDUSE_PAIR_PARITY')
    code_names,name_codes=defaultdict(set),defaultdict(set)
    for code,name,*vals in cp:
        require(len(code)==5 and code.isdigit() and code[:2] in ('27','29','30'),'CODE_FORMAT')
        code_names[code].add(name);name_codes[name].add(code)
    require(len(code_names)==33 and len(name_codes)==30,'NAME_COUNTS')
    cf=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('30')]
    foreign_total=Counter()
    for code,name,*vals in foreign:foreign_total[code[:2]]+=sum(vals)
    require(foreign_total==FOREIGN and cf['foreign_code_prefix_totals']==FOREIGN and
            cf['foreign_prefixes']==['27','29'] and cf['foreign_prefecture_code_feature_count']==11 and
            cf['foreign_prefecture_code_pairs']==foreign,'FOREIGN_CODE')
    require(len(foreign)==4 and sum(sum(r[2:]) for r in foreign)==11,'FOREIGN_CODE_11')
    require({c:sorted(n) for c,n in code_names.items() if len(n)>1}==cf['codes_with_multiple_names'],'MULTI_CODE')
    require({n:sorted(c) for n,c in name_codes.items() if len(c)>1}==cf['names_with_multiple_codes'],'MULTI_NAME')
    require(sum(len(v)>1 for v in code_names.values())==15 and sum(len(v)>1 for v in name_codes.values())==20,'MULTI_COUNTS')
    require(cf['one_to_one_code_name_mapping'] is False and cf['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_CODE_JOIN')
    gq=m['source_gun_quality']
    gun_totals=Counter()
    name_guns=defaultdict(set)
    for gun,name,*vals in gp:
        gun_totals[gun]+=sum(vals)
        if gun:name_guns[name].add(gun)
    blank=[{'municipality_name':name,'empty_gun_landuse_counts':dict(zip(LAND,vals)),
            'empty_gun_polygon_count':sum(vals),'gun_names_seen_elsewhere':sorted(name_guns[name])}
           for gun,name,*vals in gp if not gun and name in name_guns]
    require(dict(gun_totals)==GUN and gq['gun_feature_counts']==GUN,'GUN_PARITY')
    require(blank==gq['empty_gun_name_pairs_with_nonempty_gun_elsewhere'],'BLANK_GUN_ROWS')
    require(sum(r['empty_gun_polygon_count'] for r in blank)==gq['empty_gun_features_for_names_with_county_elsewhere']==81,'BLANK_GUN_81')
    require(sum(r['empty_gun_polygon_count'] for r in blank if r['municipality_name'].endswith(('町','村')))==gq['empty_gun_features_in_town_village_names']==48,'BLANK_TOWN_48')
    require({n:sorted(v) for n,v in name_guns.items() if len(v)>1}==gq['multiple_nonempty_guns_per_municipality_name']=={'有田川町':['伊都郡','有田郡']},'MULTI_GUN')
    require(gq['foreign_prefecture_gun_names']=={'泉南郡':1} and gq['foreign_prefecture_gun_name_pairs']==[['泉南郡','和歌山市',0,0,0,1]],'OSAKA_GUN')
    require(gq['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_GUN_JOIN')
    science=m['scientific_boundaries']
    require(science['jcode_name_conflict_detected'] is True and science['gun_name_conflict_detected'] is True
            and science['municipality_level_aggregations_pending_reconciliation'] is True,'NO_UNRECONCILED_JOINS')
    require(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None
            and science['raw_geometry_licensed_for_publication'] is False,'NO_CREDIT_GEO_PUBLISH')
    return True


def decode_member_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')


def parse_dbf(blob):
    require(len(blob)>=353,'DBF_SHORT')
    count,head,record_size=struct.unpack_from('<IHH',blob,4)
    require((count,head,record_size)==(822,353,1098) and head+count*record_size<=len(blob),'DBF_HEADER')
    fields=[];cursor=32
    while cursor+32<=head and blob[cursor]!=13:
        field=blob[cursor:cursor+32]
        fieldname=field[:11].split(b'\0',1)[0].decode('cp932')
        require(field[11]==ord('C'),'DBF_FIELD_TEXT')
        fields.append((fieldname,field[16]));cursor+=32
    require(cursor<head and blob[cursor]==13 and [n for n,_ in fields]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};pos=1
    for name,size in fields:
        spans[name]=(pos,pos+size);pos+=size
    require(pos==record_size,'DBF_RECORD_BYTES')
    rows=[];soil_groups=set();soil_fine=set()
    for i in range(count):
        row=blob[head+i*record_size:head+(i+1)*record_size]
        require(len(row)==record_size and row[0]==0x20,'DBF_ROW_DELETED')
        rec={name:row[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        require(rec['KEN_1']=='和歌山県' and rec['地目区分'] in LAND and
                rec['JCODE'].isdigit() and len(rec['JCODE'])==5 and rec['SIKUCHOSON'],'DBF_ROW_CONTENT')
        require(rec['群コード'] and rec['包括_統群'] and rec['統群コード'] and rec['亜群コード'],'DBF_SOIL_REQUIRED')
        soil_groups.add(rec['群コード']);soil_fine.add(rec['包括_統群']);rows.append(rec)
    return rows,soil_groups,soil_fine


def validate_shapefile(shp,shx):
    require(len(shp)>=100 and len(shx)>=100,'SHAPE_HEADER')
    require(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    require(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_TYPE')
    require(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_LENGTHS')
    require([float(v) for v in struct.unpack_from('<4d',shp,36)]==BOUNDS,'BBOX')
    require((len(shx)-100)//8==822,'SHX_FEATURES')
    off=100
    for i in range(822):
        word_offset,word_len=struct.unpack_from('>II',shx,100+8*i)
        recnum,shp_len=struct.unpack_from('>II',shp,off)
        require(word_offset*2==off and shp_len==word_len and recnum==i+1,'SHX_SHP_RECORD_OFFSETS')
        require(struct.unpack_from('<I',shp,off+8)[0]==5,'SHP_POLYGON_FEATURE')
        off+=8+shp_len*2
        require(off<=len(shp),'SHP_RECORD_BOUNDS')
    require(off==len(shp),'SHP_FILE_RECORD_COUNT')


def verify_zip(file,m):
    f=Path(file);source=m['source']
    require(f.is_file() and f.stat().st_size==5134115,'ORIGINAL_ZIP_SIZE')
    require(sha256(f.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    with zipfile.ZipFile(f) as z:
        infos=z.infolist();require(len(infos)==7,'ZIP_ENTRY_COUNT')
        blobs={}
        for info,member,ext in zip(infos,source['members'],MEMBER_EXT):
            name=decode_member_name(info)
            require(name=='k30和歌山県/'+member['name'],'ZIP_MEMBER_PATH')
            data=z.read(info)
            require(len(data)==member['bytes'] and sha256(data).hexdigest()==member['sha256'],'ZIP_MEMBER_HASH')
            blobs[ext]=data
    validate_shapefile(blobs['shp'],blobs['shx'])
    require('GCS_JGD_2000' in blobs['prj'].decode('ascii'),'ORIGINAL_CRS')
    require(b'<CreaDate>20170117</CreaDate>' in blobs['shp.xml'],'ORIGINAL_XML_DATE')
    rows,groups,fine=parse_dbf(blobs['dbf'])
    require(len(rows)==822 and len(groups)==11 and len(fine)==38,'ALL_DBF_RECORDS')
    require(dict(Counter(r['地目区分'] for r in rows))==COUNTS,'DBF_LANDUSE_REPLAY')
    require(dict(Counter(r['GUN'] for r in rows))==GUN,'DBF_GUN_REPLAY')
    require(dict(Counter(r['SICHO'] for r in rows))=={'':822},'DBF_SICHO_REPLAY')
    require(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_JCODE_REPLAY')
    require(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    return {'status':'ORIGINAL_ZIP_AND_822_POLYGONS_FULLY_VERIFIED','original_features':822,'jcode_pairs':64,'gun_pairs':44,'raw_gis_committed':False}


def main(args):
    m=load();audit(m)
    if args==['audit']:
        result={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':822,'jcode_pairs':64,'gun_pairs':44,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p58-wakayama-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as ex:print(str(ex),file=sys.stderr);sys.exit(1)
