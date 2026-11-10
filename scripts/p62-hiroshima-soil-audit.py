#!/usr/bin/env python3
"""NaFT P62 Hiroshima source-gate: public manifest audit; local opt-in original ZIP verification.
No original SHP/DBF/geometry publication without documented permission.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p62-hiroshima-soil-shapefile-source-v1.json'
ZIP_SHA='44953dd998ad968355c0d33dc910fd8806dd1a2064c4d1a10976902c0aafb626'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNTS={'田':478,'普通畑':407,'牧草地':125,'樹園地':199}
GUN_COUNTS={'':991,'世羅郡':37,'仁多郡':1,'安芸郡':24,'山県郡':108,'神石郡':37,'豊田郡':8,'邑智郡':3}
BOUNDS=[132.07673250490126,34.048859089875236,133.45478076861772,35.0948419744777]
def require(ok,why):
    if not ok:raise ValueError('P62_HIROSHIMA_SOURCE_BLOCKED:'+why)
def grouped(rows,keys):
    counts=defaultdict(Counter)
    for row in rows:counts[tuple(row[k] for k in keys)][row['地目区分']]+=1
    return [[*k,*[v.get(l,0) for l in LAND]] for k,v in sorted(counts.items())]
def totals(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]
def multi(rows,index):
    group=defaultdict(set)
    for r in rows:group[r[index]].add(r[1-index])
    return {k:sorted(v) for k,v in group.items() if len(v)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    require(m['schema']=='naft-p62-hiroshima-soil-shapefile-v1','SCHEMA')
    require(s['provided_filename']=='広島県.zip' and s['member_folder']=='k34広島県','SOURCE_NAME')
    require(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==12206280,'SOURCE_ZIP_SIZE_SHA')
    require(s['zip_entries']==len(s['members'])==7,'SEVEN_MEMBERS')
    require([x['name'] for x in s['members']]==['k34広島県.'+e for e in EXT],'MEMBER_NAMES')
    require(s['uncompressed_bytes']==sum(x['bytes'] for x in s['members'])==18739976,'SOURCE_TOTAL_BYTES')
    require(all(len(x['sha256'])==64 and set(x['sha256'])<=set('0123456789abcdef') for x in s['members']),'MEMBER_HASH_FORMAT')
    require(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    require(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['raw_geometry_committed'] is False and s['original_zip_committed'] is False,'NO_PRIVATE_PUBLICATION')
    require(g['shape_count']==1209 and g['type']=='POLYGON' and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    require(g['municipality_name_count']==29 and g['unique_jcodes']==35 and g['administrative_code_name_pairs']==62 and g['gun_name_pairs']==36,'ADMIN_COUNT')
    require(g['sicho_counts']=={'':1209} and g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==1209,'GUN_COUNTS')
    require(m['feature_counts_by_landuse']==LAND_COUNTS and sum(LAND_COUNTS.values())==1209,'LANDUSE')
    require(m['soil_group_code_categories']==16 and m['soil_fine_class_categories']==85 and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_CLASS')
    require(m['fields']==list(FIELDS),'FIELDS')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    require(len(cp)==62 and len(gp)==36 and len({(r[0],r[1]) for r in cp})==62 and len({(r[0],r[1]) for r in gp})==36,'PAIR_UNIQUENESS')
    require(all(len(r)==6 and r[1] and all(type(n) is int and n>=0 for n in r[2:]) for r in cp+gp),'PAIR_VALUES')
    require(totals(cp)==totals(gp)==[LAND_COUNTS[k] for k in LAND],'PAIR_LAND_PARITY')
    require(len({r[0] for r in cp})==35 and len({r[1] for r in cp})==29 and all(len(r[0])==5 and r[0].isdigit() for r in cp),'CODE_NAME_FORMAT')
    ca=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('34')]
    prefix=Counter()
    for r in foreign:prefix[r[0][:2]]+=sum(r[2:])
    require(foreign==ca['foreign_prefecture_code_pairs'] and dict(prefix)==ca['foreign_code_prefix_totals']=={'32':4,'33':11},'FOREIGN_CODE_ROWS')
    require(ca['foreign_prefecture_code_feature_count']==15 and sum(sum(r[2:]) for r in foreign)==15,'FOREIGN_CODE_15')
    require(multi(cp,0)==ca['codes_with_multiple_names'] and multi(cp,1)==ca['names_with_multiple_codes'],'CODE_MANY_TO_MANY')
    require(len(ca['codes_with_multiple_names'])==15 and len(ca['names_with_multiple_codes'])==15 and ca['one_to_one_code_name_mapping'] is False,'AMBIGUITY_COUNTS')
    require(ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','UNSAFE_CITY_JOIN_BLOCKED')
    ga=m['source_gun_quality']
    require(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==991,'GUN_FEATURE_COUNTS')
    gtotal=Counter()
    for r in gp:gtotal[r[0]]+=sum(r[2:])
    require(dict(gtotal)==GUN_COUNTS,'GUN_PAIR_COUNTS')
    unusual=[r for r in gp if r[0] in ('仁多郡','邑智郡')]
    require(unusual==ga['non_hiroshima_gun_name_rows'] and sum(sum(r[2:]) for r in unusual)==ga['non_hiroshima_gun_name_feature_count']==4,'FOREIGN_GUNS')
    named=defaultdict(set)
    for g,name,*v in gp:
        if g:named[name].add(g)
    require({name:sorted(guns) for name,guns in named.items() if len(guns)>1}==ga['multiple_nonempty_guns_per_municipality_name']=={},'MULTIPLE_GUN_NAMES')
    blank=[{'municipality_name':name,'empty_gun_polygon_count':sum(values),'gun_names_seen_elsewhere':sorted(named[name])} for gun,name,*values in gp if not gun and name in named]
    require(blank==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(r['empty_gun_polygon_count'] for r in blank)==ga['empty_gun_features_for_names_with_county_elsewhere']==250,'BLANK_WITH_KNOWN_GUN')
    require(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','UNSAFE_GUN_JOIN_BLOCKED')
    science=m['scientific_boundaries']
    require(science['counts_are_polygon_features_not_area_ha'] is True and science['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA_OR_MUNICIPAL_STATS')
    require(science['calculation_of_certified_credits_prohibited'] is True and science['official_credit_tco2e'] is None and science['raw_geometry_licensed_for_publication'] is False,'NO_CREDIT_OR_GEO')
    return True
def decode_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def parse_dbf(blob):
    require(len(blob)>=353,'DBF_SHORT')
    count,header,size=struct.unpack_from('<IHH',blob,4)
    require((count,header,size)==(1209,353,1098) and header+count*size<=len(blob),'DBF_HEADER')
    fields=[];pos=32
    while pos+32<=header and blob[pos]!=13:
        f=blob[pos:pos+32];require(f[11]==ord('C'),'DBF_TEXT_FIELD')
        fields.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));pos+=32
    require(pos<header and blob[pos]==13 and [name for name,_ in fields]==list(FIELDS),'DBF_FIELD_NAMES')
    spans={};offset=1
    for name,width in fields:spans[name]=(offset,offset+width);offset+=width
    require(offset==size,'DBF_RECORD_SIZE')
    rows=[]
    for i in range(count):
        data=blob[header+i*size:header+(i+1)*size]
        require(len(data)==size and data[0]==0x20,'DBF_ROW_ACTIVE')
        row={name:data[a:b].decode('cp932').strip(' \t\0') for name,(a,b) in spans.items()}
        require(row['KEN_1']=='広島県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_ATTR')
        require(all(row[k] for k in ('包括_統群','統群コード','亜群コード','群コード')),'DBF_SOIL_REQUIRED')
        rows.append(row)
    return rows
def verify_shape(shp,shx):
    require(len(shp)>=100 and len(shx)>=100,'SHP_SHX_SIZE')
    require(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    require(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_TYPE')
    require(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_BYTE_LENGTH')
    require(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'SHAPE_BBOX')
    require(len(shx)==100+1209*8,'SHX_FEATURE_COUNT')
    offset=100
    for i in range(1209):
        word_offset,word_len=struct.unpack_from('>II',shx,100+i*8)
        num,record_words=struct.unpack_from('>II',shp,offset)
        require(word_offset*2==offset and word_len==record_words and num==i+1,'INDEX_RECORD_ALIGNMENT')
        require(struct.unpack_from('<I',shp,offset+8)[0]==5,'RECORD_POLYGON')
        offset+=8+record_words*2
        require(offset<=len(shp),'RECORD_BOUNDS')
    require(offset==len(shp),'RECORD_TRAILING')
def verify_zip(file,m):
    path=Path(file);s=m['source']
    require(path.is_file() and path.stat().st_size==12206280,'ORIGINAL_ZIP_SIZE')
    require(sha256(path.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_SHA')
    content={}
    with zipfile.ZipFile(path) as z:
        infos=z.infolist();require(len(infos)==7,'ZIP_ENTRIES')
        for info,ext,member in zip(infos,EXT,s['members']):
            require(decode_name(info)=='k34広島県/'+member['name'],'ZIP_MEMBER_PATH')
            data=z.read(info)
            require(len(data)==member['bytes'] and sha256(data).hexdigest()==member['sha256'],'ZIP_MEMBER_HASH')
            content[ext]=data
    require(b'GCS_JGD_2000' in content['prj'],'ORIGINAL_CRS')
    require(b'<CreaDate>20170117</CreaDate>' in content['shp.xml'],'XML_DATE')
    verify_shape(content['shp'],content['shx'])
    rows=parse_dbf(content['dbf'])
    require(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_CODE_REPLAY')
    require(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    require(dict(Counter(r['地目区分'] for r in rows))==LAND_COUNTS,'DBF_LAND_REPLAY')
    require(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'DBF_GUN_COUNT_REPLAY')
    require(dict(Counter(r['SICHO'] for r in rows))=={'':1209},'DBF_SICHO')
    require(len({r['群コード'] for r in rows})==16 and len({r['包括_統群'] for r in rows})==85,'DBF_SOIL_CLASSES')
    return {'status':'ORIGINAL_ZIP_AND_1209_POLYGONS_FULLY_VERIFIED','original_features':1209,'jcode_pairs':62,'gun_pairs':36,'raw_gis_committed':False}
def main(args):
    m=json.loads(MANIFEST.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:
        result={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':1209,'jcode_pairs':62,'gun_pairs':36,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':result=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p62-hiroshima-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
