#!/usr/bin/env python3
"""NaFT P59 Tottori original-source guard (standard library only).
Audit public aggregates, or verify an authorized LOCAL private original ZIP.
Never commit original DBF/SHP/geometry to public GitHub without rights review.
"""
import collections, hashlib, json, pathlib, struct, sys, zipfile
ROOT=pathlib.Path(__file__).resolve().parent.parent
M=ROOT/'research/p59-tottori-soil-shapefile-source-v1.json'
FIELDS=('地目区分','包括_統群','統群コード','亜群コード','群コード','JCODE','KEN_1','SICHO','GUN','SIKUCHOSON')
LAND=('田','普通畑','牧草地','樹園地')
ZIP_SHA='a4bdf588790b48d87d445d25c03151caae781937b5ccb3b3054e574acf558915'
def check(ok,what):
    if not ok: raise ValueError('P59_TOTTORI_SOURCE_BLOCKED:'+what)
def pairs(rows,keys):
    agg=collections.defaultdict(collections.Counter)
    for r in rows: agg[tuple(r[k] for k in keys)][r['地目区分']]+=1
    return [[*k,*[v.get(x,0) for x in LAND]] for k,v in sorted(agg.items())]
def countpair(rs):
    return [sum(r[i+2] for r in rs) for i in range(4)]
def audit(m):
    s,g=m['source'],m['geometry']
    check(m['schema']=='naft-p59-tottori-soil-shapefile-v1','SCHEMA')
    check(s['provided_filename']=='鳥取県.zip' and s['member_folder']=='k31鳥取県','ORIGINAL_NAME')
    check(s['source_zip_sha256']==ZIP_SHA and s['zip_bytes']==5198920,'ORIGINAL_SHA')
    check(s['zip_entries']==len(s['members'])==7,'MEMBER_COUNT')
    check([e['name'] for e in s['members']]==['k31鳥取県.'+v for v in ('dbf','prj','sbn','sbx','shp','shp.xml','shx')],'MEMBER_NAMES')
    check(sum(x['bytes'] for x in s['members'])==s['uncompressed_bytes'],'RAW_TOTAL')
    check(all(len(x['sha256'])==64 for x in s['members']),'MEMBER_HASH_FORMAT')
    check(s['original_zip_committed'] is False and s['raw_geometry_committed'] is False and s['redistribution_rights']=='NOT_VERIFIED','PRIVATE_GIS')
    check(g['shape_count']==1032 and g['type']=='POLYGON' and g['crs']=='GCS_JGD_2000','GEOMETRY')
    check(g['municipality_name_count']==19 and g['unique_jcodes']==20 and g['administrative_code_name_pairs']==40 and g['gun_name_pairs']==33,'ADMIN_COUNTS')
    check(m['feature_counts_by_landuse']==dict(zip(LAND,(352,358,41,281))),'LANDUSE')
    check(m['soil_group_code_categories']==20 and m['soil_fine_class_categories']==97,'SOIL_TYPES')
    check(m['fields']==list(FIELDS) and m['soil_group_missing_features']==m['soil_detail_missing_features']==0,'FIELDS')
    code=m['jcode_name_pairs_counts_by_landuse']; gun=m['gun_name_pairs_counts_by_landuse']
    check(len(code)==40 and len(gun)==33 and countpair(code)==countpair(gun)==[352,358,41,281],'PAIR_PARITY')
    check(len({(r[0],r[1]) for r in code})==40 and len({(r[0],r[1]) for r in gun})==33,'PAIR_UNIQUENESS')
    check(all(len(r)==6 and all(isinstance(n,int) and n>=0 for n in r[2:]) for r in code+gun),'NONNEGATIVE')
    check(sum(g['gun_counts'].values())==1032 and g['sicho_counts']=={'':1032},'GUN_SICHO')
    check([r for r in code if not r[0].startswith('31')]==m['source_code_name_anomalies']['foreign_prefecture_code_pairs'],'FOREIGN_CODE_ROWS')
    check(m['source_code_name_anomalies']['foreign_code_prefix_totals']=={'28':2},'FOREIGN_CODE_TOTAL')
    check([r for r in gun if r[0]=='美方郡']==m['source_gun_quality']['foreign_prefecture_gun_name_pairs'],'FOREIGN_GUN_ROWS')
    check(m['source_gun_quality']['foreign_prefecture_gun_names']=={'美方郡':2},'FOREIGN_GUN_COUNT')
    check(m['scientific_boundaries']['calculation_of_certified_credits_prohibited'] is True,'CREDIT_PROHIBITED')
    return True
def dbf_rows(b):
    count,header,size=struct.unpack_from('<IHH',b,4)
    check((count,header,size)==(1032,353,1098) and header+size*count<=len(b),'DBF_HEADER')
    fields=[];o=32
    while o+32<=header and b[o]!=13:
        d=b[o:o+32]; check(d[11]==ord('C'),'DBF_TEXT_FIELD')
        fields.append((d[:11].split(b'\0')[0].decode('cp932'),d[16]));o+=32
    check(o<header and b[o]==13 and tuple(f[0] for f in fields)==FIELDS,'DBF_FIELDS')
    spans={};pos=1
    for name,n in fields: spans[name]=(pos,pos+n);pos+=n
    check(pos==size,'DBF_SIZE')
    rows=[]
    for i in range(count):
        item=b[header+i*size:header+(i+1)*size];check(item[0]==0x20,'DBF_DELETED')
        r={name:item[a:z].decode('cp932').strip(' \t\0') for name,(a,z) in spans.items()}
        check(r['KEN_1']=='鳥取県' and r['地目区分'] in LAND and r['JCODE'].isdigit() and len(r['JCODE'])==5 and r['SIKUCHOSON'],'DBF_ROW')
        check(all(r[n] for n in ('群コード','包括_統群','統群コード','亜群コード')),'SOIL_REQUIRED')
        rows.append(r)
    return rows
def verify_shape(shp,shx,geo):
    check(struct.unpack_from('>I',shp)[0]==9994 and struct.unpack_from('>I',shx)[0]==9994,'SHAPE_MAGIC')
    check(struct.unpack_from('<II',shp,28)==struct.unpack_from('<II',shx,28)==(1000,5),'SHAPE_POLYGON')
    check(struct.unpack_from('>I',shp,24)[0]*2==len(shp) and struct.unpack_from('>I',shx,24)[0]*2==len(shx),'SHAPE_LENGTH')
    check(list(struct.unpack_from('<4d',shp,36))==geo['bounds_lon_lat'],'BBOX')
    check((len(shx)-100)//8==1032 and len(shx)==100+1032*8,'SHX_COUNT')
    off=100
    for i in range(1032):
        start,words=struct.unpack_from('>II',shx,100+i*8)
        num,n=struct.unpack_from('>II',shp,off)
        check(start*2==off and words==n and num==i+1,'SHAPE_INDEX')
        check(struct.unpack_from('<I',shp,off+8)[0]==5,'SHAPE_FEATURE_TYPE')
        off+=8+2*n;check(off<=len(shp),'SHAPE_BOUNDS')
    check(off==len(shp),'SHAPE_RECORDS')
def verify(path,m):
    f=pathlib.Path(path);check(f.exists() and f.stat().st_size==5198920,'ZIP_SIZE')
    check(hashlib.sha256(f.read_bytes()).hexdigest()==ZIP_SHA,'ZIP_SHA')
    s=m['source'];b={}
    with zipfile.ZipFile(f) as z:
        infos=z.infolist();check(len(infos)==7,'ZIP_ENTRIES')
        for item,expected in zip(infos,s['members']):
            full=item.filename if item.flag_bits&0x800 else item.filename.encode('cp437').decode('cp932')
            check(full=='k31鳥取県/'+expected['name'],'ZIP_MEMBER_NAME')
            raw=z.read(item);check(len(raw)==expected['bytes'] and hashlib.sha256(raw).hexdigest()==expected['sha256'],'ZIP_MEMBER_HASH')
            b[expected['name'].split('.')[-1]]=raw
        # XML has a two-part extension and must be keyed separately.
        xml=z.read(infos[5])
        check(b'<CreaDate>20170117</CreaDate>' in xml,'ORIGINAL_METADATA_DATE')
    verify_shape(b['shp'],b['shx'],m['geometry'])
    check(b'GCS_JGD_2000' in b['prj'],'CRS')
    rows=dbf_rows(b['dbf'])
    check(pairs(rows,('JCODE','SIKUCHOSON'))==m['jcode_name_pairs_counts_by_landuse'],'ORIGINAL_JCODE_REPLAY')
    check(pairs(rows,('GUN','SIKUCHOSON'))==m['gun_name_pairs_counts_by_landuse'],'ORIGINAL_GUN_REPLAY')
    check(dict(collections.Counter(r['地目区分'] for r in rows))==m['feature_counts_by_landuse'],'ORIGINAL_LANDUSE')
    check(dict(collections.Counter(r['GUN'] for r in rows))==m['geometry']['gun_counts'],'ORIGINAL_GUN_TOTAL')
    check(len({r['群コード'] for r in rows})==20 and len({r['包括_統群'] for r in rows})==97,'ORIGINAL_SOIL_CATEGORIES')
    return {'status':'PRIVATE_ORIGINAL_AND_1032_POLYGONS_VERIFIED','features':1032,'raw_gis_committed':False}
def main(args):
    m=json.loads(M.read_text(encoding='utf-8'));audit(m)
    if args==['audit']: output={'status':'PUBLIC_REGISTER_CONSISTENT_PRIVATE_ZIP_NOT_IN_CI','features':1032,'jcode_pairs':40,'gun_pairs':33,'private_zip_checked_in_ci':False}
    elif len(args)==2 and args[0]=='verify':output=verify(args[1],m)
    else:raise ValueError('USAGE: python3 scripts/p59-tottori-soil-audit.py audit | verify LOCAL_ORIGINAL.zip')
    print(json.dumps(output,ensure_ascii=False))
if __name__=='__main__':
    try:main(sys.argv[1:])
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
