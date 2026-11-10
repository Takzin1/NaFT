#!/usr/bin/env python3
"""NaFT P60 Shimane soil GIS: public aggregate audit and opt-in local original ZIP verification."""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p60-shimane-soil-shapefile-source-v1.json'
ZIP_SHA='1c54bcdf1360103a856404e32bb6a31e5072ab35eb76b805b367ad8c500e0d90'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNTS={'田':350,'普通畑':309,'牧草地':81,'樹園地':187}
GUN_COUNTS={'':577,'邑智郡':112,'鹿足郡':96,'仁多郡':54,'隠岐郡':44,'飯石郡':44}
BOUNDS=[131.67586058329942,34.321693076674265,133.37630558513476,36.333444824119496]
def require(ok,why):
    if not ok: raise ValueError('P60_SHIMANE_SOURCE_BLOCKED:'+why)
def grouped(rows,keys):
    c=defaultdict(Counter)
    for r in rows:c[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[count.get(name,0) for name in LAND]] for key,count in sorted(c.items())]
def counts(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]
def code_multiples(rows,first):
    m=defaultdict(set)
    for r in rows:m[r[first]].add(r[1-first])
    return {k:sorted(v) for k,v in m.items() if len(v)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    require(m['schema']=='naft-p60-shimane-soil-shapefile-v1','SCHEMA')
    require(s['provided_filename']=='島根県.zip' and s['member_folder']=='k32島根県','SOURCE_NAME')
    require(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==6246580,'SOURCE_SHA_SIZE')
    require(s['zip_entries']==len(s['members'])==7 and len(EXT)==7,'ZIP_COUNT')
    require([v['name'] for v in s['members']]==['k32島根県.'+e for e in EXT],'MEMBERS')
    require(sum(v['bytes'] for v in s['members'])==s['uncompressed_bytes']==10003612,'UNCOMPRESSED_BYTES')
    require(all(len(v['sha256'])==64 and set(v['sha256'])<=set('0123456789abcdef') for v in s['members']),'MEMBER_HASH')
    require(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    require(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'NO_RAW_PUBLICATION')
    require(g['shape_count']==927 and g['type']=='POLYGON' and g['crs']=='GCS_JGD_2000' and g['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    require(g['municipality_name_count']==19 and g['unique_jcodes']==20 and g['administrative_code_name_pairs']==35 and g['gun_name_pairs']==24,'ADMIN_COUNTS')
    require(g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==927 and g['sicho_counts']=={'':927},'GUN_COUNTS')
    require(m['feature_counts_by_landuse']==LAND_COUNTS and sum(LAND_COUNTS.values())==927,'LAND_COUNTS')
    require(m['fields']==list(FIELDS) and m['soil_group_code_categories']==19 and m['soil_fine_class_categories']==74,'SOIL_FIELDS')
    require(m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'SOIL_MISSING')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    require(len(cp)==35 and len(gp)==24 and len({(r[0],r[1]) for r in cp})==35 and len({(r[0],r[1]) for r in gp})==24,'PAIRS')
    require(all(len(r)==6 and r[1] and all(type(v)==int and v>=0 for v in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    require(counts(cp)==counts(gp)==[LAND_COUNTS[x] for x in LAND],'PARITY')
    require(len({r[0] for r in cp})==20 and len({r[1] for r in cp})==19,'CODE_NAME_COUNTS')
    require(all(len(r[0])==5 and r[0].isdigit() for r in cp),'JCODE_FORMAT')
    anomaly=m['source_code_name_anomalies']
    require([r for r in cp if not r[0].startswith('32')]==anomaly['foreign_prefecture_code_pairs']==[['31202','安来市',1,0,0,0]],'FOREIGN_CODE')
    require(anomaly['foreign_code_prefix_totals']=={'31':1},'FOREIGN_CODE_TOTAL')
    require(code_multiples(cp,0)==anomaly['codes_with_multiple_names'] and code_multiples(cp,1)==anomaly['names_with_multiple_codes'],'CODE_MANY_TO_MANY')
    require(len(anomaly['codes_with_multiple_names'])==8 and len(anomaly['names_with_multiple_codes'])==11,'CODE_CONFLICT_COUNTS')
    require(anomaly['one_to_one_code_name_mapping'] is False and anomaly['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_CITY_JOIN')
    county=m['source_gun_quality']
    require(county['gun_feature_counts']==GUN_COUNTS and county['blank_gun_features']==577,'COUNTY_COUNTS')
    checkcount=Counter()
    for row in gp:checkcount[row[0]]+=sum(row[2:])
    require(dict(checkcount)==GUN_COUNTS,'COUNTY_PAIR_PARITY')
    named=defaultdict(set)
    for gun,name,*values in gp:
        if gun:named[name].add(gun)
    multiples={name:sorted(values) for name,values in named.items() if len(values)>1}
    require(multiples==county['multiple_nonempty_guns_per_municipality_name']=={'美郷町':['邑智郡','飯石郡']},'GUN_MULTI_NAMES')
    blanks=[{'municipality_name':name,'empty_gun_polygon_count':sum(values),'gun_names_seen_elsewhere':sorted(named[name])} for gun,name,*values in gp if not gun and name in named]
    require(blanks==county['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(x['empty_gun_polygon_count'] for x in blanks)==county['empty_gun_features_for_names_with_county_elsewhere']==9,'COUNTY_BLANK_BY_NAME')
    require(county['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_GUN_JOIN')
    bound=m['scientific_boundaries']
    require(bound['counts_are_polygon_features_not_area_ha'] is True and bound['municipality_level_aggregations_pending_reconciliation'] is True,'NO_AREA_JOIN')
    require(bound['calculation_of_certified_credits_prohibited'] is True and bound['official_credit_tco2e'] is None and bound['raw_geometry_licensed_for_publication'] is False,'NO_CREDIT_OR_GEO')
    return True
def parse_dbf(blob):
    require(len(blob)>=353,'DBF_SHORT')
    count,header,record_size=struct.unpack_from('<IHH',blob,4)
    require((count,header,record_size)==(927,353,1098) and header+count*record_size<=len(blob),'DBF_HEADER')
    fields=[];o=32
    while o+32<=header and blob[o]!=13:
        f=blob[o:o+32];require(f[11]==ord('C'),'DBF_TEXT')
        fields.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));o+=32
    require(o<header and blob[o]==13 and [name for name,_ in fields]==list(FIELDS),'DBF_FIELDS')
    spans={};pos=1
    for name,size in fields:spans[name]=(pos,pos+size);pos+=size
    require(pos==record_size,'DBF_RECORD_SIZE')
    rows=[]
    for i in range(count):
        b=blob[header+i*record_size:header+(i+1)*record_size]
        require(len(b)==record_size and b[0]==0x20,'DBF_RECORD')
        row={name:b[a:z].decode('cp932').strip(' \t\0') for name,(a,z) in spans.items()}
        require(row['KEN_1']=='島根県' and row['地目区分'] in LAND and row['SIKUCHOSON'] and len(row['JCODE'])==5 and row['JCODE'].isdigit(),'DBF_ATTR')
        require(all(row[x] for x in ('群コード','包括_統群','統群コード','亜群コード')),'SOIL_REQUIRED')
        rows.append(row)
    return rows
def verify_shape(shp,shx):
    require(len(shp)>=100 and len(shx)>=100,'SHAPE_SHORT')
    require(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    require(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_TYPE')
    require(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_LENGTH')
    require(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'SHAPE_BBOX')
    require(len(shx)==100+927*8,'SHX_COUNT')
    off=100
    for i in range(927):
        word_off,word_len=struct.unpack_from('>II',shx,100+i*8)
        num,shp_len=struct.unpack_from('>II',shp,off)
        require(num==i+1 and word_off*2==off and word_len==shp_len,'SHAPE_OFFSET')
        require(struct.unpack_from('<I',shp,off+8)[0]==5,'SHAPE_POLYGON')
        off+=8+shp_len*2
        require(off<=len(shp),'SHAPE_OVERRUN')
    require(off==len(shp),'SHAPE_TRAILING')
def decode_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def verify_zip(filename,m):
    f=Path(filename)
    require(f.is_file() and f.stat().st_size==6246580,'ZIP_SIZE')
    require(sha256(f.read_bytes()).hexdigest()==ZIP_SHA,'ZIP_SHA')
    s=m['source'];content={}
    with zipfile.ZipFile(f) as z:
        infos=z.infolist();require(len(infos)==7,'ZIP_ENTRIES')
        for info,ext,member in zip(infos,EXT,s['members']):
            require(decode_name(info)=='k32島根県/'+member['name'],'ZIP_MEMBER_PATH')
            data=z.read(info)
            require(len(data)==member['bytes'] and sha256(data).hexdigest()==member['sha256'],'ZIP_MEMBER_SHA')
            content[ext]=data
    require(b'GCS_JGD_2000' in content['prj'],'PRJ_CRS')
    require(b'<CreaDate>20170117</CreaDate>' in content['shp.xml'],'XML_CREATED')
    verify_shape(content['shp'],content['shx'])
    rows=parse_dbf(content['dbf'])
    require(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'DBF_CODE_REPLAY')
    require(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'DBF_GUN_REPLAY')
    require(dict(Counter(r['地目区分'] for r in rows))==LAND_COUNTS,'DBF_LAND_REPLAY')
    require(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'DBF_GUN_COUNTS')
    require(dict(Counter(r['SICHO'] for r in rows))=={'':927},'DBF_SICHO')
    require(len({r['群コード'] for r in rows})==19 and len({r['包括_統群'] for r in rows})==74,'DBF_SOIL_TYPES')
    return {'status':'PRIVATE_ORIGINAL_AND_927_POLYGONS_FULLY_VERIFIED','original_features':927,'jcode_pairs':35,'gun_pairs':24,'raw_gis_committed':False}
def main(args):
    m=json.loads(MANIFEST.read_text(encoding='utf-8'))
    audit(m)
    if args==['audit']:out={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':927,'jcode_pairs':35,'gun_pairs':24,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':out=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p60-shimane-soil-audit.py audit | verify PRIVATE_ORIGINAL.zip')
    print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
