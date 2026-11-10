#!/usr/bin/env python3
"""NaFT P61 Okayama soil GIS: audit public aggregates, verify original in permitted local environment.
Original ZIP, raw coordinates, SHP and DBF must NOT be committed to public GitHub.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json, struct, sys, zipfile
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'research/p61-okayama-soil-shapefile-source-v1.json'
ZIP_SHA='beb5ffe3f03d788641d952b9d51621ee1d70612d7bd544b82b03476d94b3b47d'
LAND=('田','普通畑','牧草地','樹園地')
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
EXT=('dbf','prj','sbn','sbx','shp','shp.xml','shx')
LAND_COUNTS={'田':489,'普通畑':337,'牧草地':74,'樹園地':251}
GUN_COUNTS={'':891,'久米郡':58,'加賀郡':36,'勝田郡':37,'和気郡':22,'小田郡':30,'都窪郡':8,'苫田郡':36,'浅口郡':9,'英田郡':7,'佐用郡':2,'真庭郡':13,'東伯郡':1,'日野郡':1}
BOUNDS=[133.29089872319759,34.35494317288926,134.40065548476292,35.32684087140926]
def require(ok,why):
    if not ok:raise ValueError('P61_OKAYAMA_SOURCE_BLOCKED:'+why)
def grouped(rows,keys):
    c=defaultdict(Counter)
    for r in rows:c[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*key,*[counts.get(name,0) for name in LAND]] for key,counts in sorted(c.items())]
def sums(rows):
    return [sum(r[i+2] for r in rows) for i in range(4)]
def multiples(rows,index):
    m=defaultdict(set)
    for r in rows:m[r[index]].add(r[1-index])
    return {k:sorted(v) for k,v in m.items() if len(v)>1}
def audit(m):
    s,g=m['source'],m['geometry']
    require(m['schema']=='naft-p61-okayama-soil-shapefile-v1','SCHEMA')
    require(s['provided_filename']=='岡山県.zip' and s['member_folder']=='k33岡山県','SOURCE_NAME')
    require(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==13379023,'ZIP_SHA_SIZE')
    require(s['zip_entries']==len(s['members'])==7,'MEMBER_COUNT')
    require([v['name'] for v in s['members']]==['k33岡山県.'+e for e in EXT],'MEMBER_NAMES')
    require(sum(v['bytes'] for v in s['members'])==s['uncompressed_bytes']==20735752,'MEMBER_BYTES')
    require(all(len(v['sha256'])==64 and set(v['sha256'])<=set('0123456789abcdef') for v in s['members']),'MEMBER_HASH_FORMAT')
    require(s['metadata_creation_date']=='2017-01-17' and s['source_match']=='CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON','PROVENANCE')
    require(s['publisher_authentication']==s['redistribution_rights']=='NOT_VERIFIED' and s['original_zip_committed'] is False and s['raw_geometry_committed'] is False,'RAW_PRIVATE')
    require(g['type']=='POLYGON' and g['crs']=='GCS_JGD_2000' and g['shape_count']==1151 and g['bounds_lon_lat']==BOUNDS,'GEOMETRY')
    require(g['municipality_name_count']==30 and g['unique_jcodes']==33 and g['administrative_code_name_pairs']==80 and g['gun_name_pairs']==43,'ADMIN_TOTALS')
    require(g['gun_counts']==GUN_COUNTS and sum(GUN_COUNTS.values())==1151 and g['sicho_counts']=={'':1151},'GUN_SICHO')
    require(m['feature_counts_by_landuse']==LAND_COUNTS and sum(LAND_COUNTS.values())==1151,'LAND_COUNTS')
    require(m['soil_group_code_categories']==18 and m['soil_fine_class_categories']==85,'SOIL_CATEGORY_COUNTS')
    require(m['fields']==list(FIELDS) and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'FIELDS')
    cp,gp=m['jcode_name_pairs_counts_by_landuse'],m['gun_name_pairs_counts_by_landuse']
    require(len(cp)==80 and len(gp)==43 and len({(r[0],r[1]) for r in cp})==80 and len({(r[0],r[1]) for r in gp})==43,'PAIR_UNIQUENESS')
    require(all(len(r)==6 and r[1] and all(type(v) is int and v>=0 for v in r[2:]) for r in cp+gp),'PAIR_FORMAT')
    require(sums(cp)==sums(gp)==[LAND_COUNTS[k] for k in LAND],'PAIR_PARITY')
    require(len({r[0] for r in cp})==33 and len({r[1] for r in cp})==30,'JCODE_NAME_COUNT')
    require(all(len(r[0])==5 and r[0].isdigit() for r in cp),'JCODE_FORMAT')
    ca=m['source_code_name_anomalies']
    foreign=[r for r in cp if not r[0].startswith('33')]
    foreign_prefix=Counter()
    for row in foreign:foreign_prefix[row[0][:2]]+=sum(row[2:])
    require(foreign==ca['foreign_prefecture_code_pairs'] and dict(foreign_prefix)==ca['foreign_code_prefix_totals']=={'28':2,'31':2},'FOREIGN_CODES')
    require(ca['foreign_prefecture_code_feature_count']==4 and sum(sum(r[2:]) for r in foreign)==4,'FOREIGN_COUNT')
    require(multiples(cp,0)==ca['codes_with_multiple_names'] and multiples(cp,1)==ca['names_with_multiple_codes'],'ADMIN_AMBIGUITY')
    require(len(ca['codes_with_multiple_names'])==18 and len(ca['names_with_multiple_codes'])==22,'AMBIGUOUS_COUNTS')
    require(ca['one_to_one_code_name_mapping'] is False and ca['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN','NO_UNSAFE_JOIN')
    ga=m['source_gun_quality']
    require(ga['gun_feature_counts']==GUN_COUNTS and ga['blank_gun_features']==891,'COUNTY_TOTALS')
    c=Counter()
    for gun,name,*v in gp:c[gun]+=sum(v)
    require(dict(c)==GUN_COUNTS,'GUN_PARITY')
    suspicious=[r for r in gp if r[0] in ('佐用郡','東伯郡','日野郡')]
    require(suspicious==ga['non_okayama_gun_name_rows'] and sum(sum(r[2:]) for r in suspicious)==ga['non_okayama_gun_name_feature_count']==4,'FOREIGN_GUN')
    name_guns=defaultdict(set)
    for gun,name,*values in gp:
        if gun:name_guns[name].add(gun)
    multi={name:sorted(guns) for name,guns in name_guns.items() if len(guns)>1}
    require(multi==ga['multiple_nonempty_guns_per_municipality_name']=={'真庭市':['日野郡','東伯郡']},'MULTI_GUN')
    blank=[{'municipality_name':name,'empty_gun_polygon_count':sum(v),'gun_names_seen_elsewhere':sorted(name_guns[name])} for gun,name,*v in gp if not gun and name in name_guns]
    require(blank==ga['empty_gun_name_pairs_with_nonempty_gun_elsewhere'] and sum(row['empty_gun_polygon_count'] for row in blank)==ga['empty_gun_features_for_names_with_county_elsewhere']==222,'BLANK_GUN_NAME')
    require(ga['status']=='UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN','NO_UNSAFE_GUN_JOIN')
    bound=m['scientific_boundaries']
    require(bound['counts_are_polygon_features_not_area_ha'] is True and bound['municipality_level_aggregations_pending_reconciliation'] is True,'NOT_AREA')
    require(bound['calculation_of_certified_credits_prohibited'] is True and bound['official_credit_tco2e'] is None and bound['raw_geometry_licensed_for_publication'] is False,'NO_OFFICIAL_CREDIT')
    return True
def parse_dbf(blob):
    require(len(blob)>=353,'DBF_SHORT')
    count,header,recsize=struct.unpack_from('<IHH',blob,4)
    require((count,header,recsize)==(1151,353,1098) and header+count*recsize<=len(blob),'DBF_HEADER')
    fields=[];off=32
    while off+32<=header and blob[off]!=13:
        f=blob[off:off+32];require(f[11]==ord('C'),'DBF_TYPE')
        fields.append((f[:11].split(b'\0')[0].decode('cp932'),f[16]));off+=32
    require(off<header and blob[off]==13 and [n for n,_ in fields]==list(FIELDS),'DBF_FIELDS')
    spans={};pos=1
    for name,size in fields:spans[name]=(pos,pos+size);pos+=size
    require(pos==recsize,'DBF_RECORD_BYTES')
    rows=[]
    for i in range(count):
        b=blob[header+i*recsize:header+(i+1)*recsize]
        require(len(b)==recsize and b[0]==0x20,'DBF_RECORD_NOT_ACTIVE')
        r={name:b[a:z].decode('cp932').strip(' \t\0') for name,(a,z) in spans.items()}
        require(r['KEN_1']=='岡山県' and r['地目区分'] in LAND and r['SIKUCHOSON'] and len(r['JCODE'])==5 and r['JCODE'].isdigit(),'DBF_ATTRIBUTES')
        require(all(r[n] for n in ('群コード','包括_統群','統群コード','亜群コード')),'SOIL_FIELDS_REQUIRED')
        rows.append(r)
    return rows
def verify_shape(shp,shx):
    require(len(shp)>=100 and len(shx)>=100,'SHAPE_SHORT')
    require(struct.unpack_from('>I',shp,0)[0]==struct.unpack_from('>I',shx,0)[0]==9994,'SHAPE_MAGIC')
    require(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_POLYGON')
    require(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_BYTES')
    require(list(struct.unpack_from('<4d',shp,36))==BOUNDS,'BBOX')
    require(len(shx)==100+8*1151,'SHX_FEATURES')
    off=100
    for i in range(1151):
        words,n=struct.unpack_from('>II',shx,100+i*8)
        number,rec_len=struct.unpack_from('>II',shp,off)
        require(words*2==off and rec_len==n and number==i+1,'SHP_SHX_OFFSETS')
        require(struct.unpack_from('<I',shp,off+8)[0]==5,'SHP_POLYGON_FEATURE')
        off+=8+2*n
        require(off<=len(shp),'SHP_RECORD_BOUNDS')
    require(off==len(shp),'SHP_RECORD_COUNT')
def original_name(info):
    return info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
def verify_zip(file,m):
    p=Path(file)
    require(p.is_file() and p.stat().st_size==13379023,'ORIGINAL_ZIP_SIZE')
    require(sha256(p.read_bytes()).hexdigest()==ZIP_SHA,'ORIGINAL_ZIP_HASH')
    s=m['source'];content={}
    with zipfile.ZipFile(p) as z:
        infos=z.infolist();require(len(infos)==7,'ZIP_ENTRIES')
        for info,ext,member in zip(infos,EXT,s['members']):
            require(original_name(info)=='k33岡山県/'+member['name'],'ZIP_MEMBER_PATH')
            blob=z.read(info)
            require(len(blob)==member['bytes'] and sha256(blob).hexdigest()==member['sha256'],'ZIP_MEMBER_HASH')
            content[ext]=blob
    require(b'GCS_JGD_2000' in content['prj'],'PRJ_CRS')
    require(b'<CreaDate>20170117</CreaDate>' in content['shp.xml'],'ORIGINAL_XML_DATE')
    verify_shape(content['shp'],content['shx'])
    rows=parse_dbf(content['dbf'])
    require(grouped(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_CODE_REPLAY')
    require(grouped(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    require(dict(Counter(r['地目区分'] for r in rows))==LAND_COUNTS,'ORIGINAL_LAND')
    require(dict(Counter(r['GUN'] for r in rows))==GUN_COUNTS,'ORIGINAL_COUNTY')
    require(dict(Counter(r['SICHO'] for r in rows))=={'':1151},'ORIGINAL_SICHO')
    require(len({r['群コード'] for r in rows})==18 and len({r['包括_統群'] for r in rows})==85,'ORIGINAL_SOIL_CLASS')
    return {'status':'PRIVATE_ORIGINAL_ZIP_1151_POLYGONS_VERIFIED','features':1151,'jcode_pairs':80,'gun_pairs':43,'raw_gis_committed':False}
def main(args):
    m=json.loads(MANIFEST.read_text(encoding='utf-8'));audit(m)
    if args==['audit']:r={'status':'PUBLIC_REGISTER_CONSISTENT_NO_RAW_GIS','features':1151,'jcode_pairs':80,'gun_pairs':43,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':r=verify_zip(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p61-okayama-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(r,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
