#!/usr/bin/env python3
"""Offline replay of user-supplied Hokkaido soil polygons (no raw publication)."""
from collections import Counter, defaultdict
import hashlib, json, struct, sys, zipfile
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
REG=BASE/'research/p29-hokkaido-soil-shapefile-source-v1.json'
def need(ok,code):
 if not ok: raise ValueError('P29_HOKKAIDO_SOURCE_BLOCKED:'+code)

def check_register(g):
 s=g['source'];p=g['geometry'];v=g['feature_counts_by_landuse']
 need(g['schema']=='naft-p29-hokkaido-agricultural-soil-polygon-source-v1','SCHEMA')
 need(len(s['members'])==s['zip_entries']==7,'MEMBER_COUNT')
 need(sum(m['bytes'] for m in s['members'])==s['uncompressed_bytes']==66561004,'BYTES')
 need(p['shape_count']==5477 and p['municipalities']==186 and p['subprefectures']==14,'GEO_COUNT')
 need(sum(v.values())==5477,'LANDUSE_SUM')
 need(len(g['subprefecture_feature_counts'])==14,'REGIONS')
 need([sum(r[i] for r in g['subprefecture_feature_counts']) for i in range(1,5)]==
 [v[k] for k in ['田','普通畑','牧草地','樹園地']],'REGION_CROSSCHECK')
 need(s['source_zip_committed'] is False and s['original_shapefile_committed'] is False,'RAW_REPOST')
 need(g['scientific_boundaries']['official_credit_tco2e'] is None,'FAKE_CREDIT')
 return True

def dbf_table(blob):
 need(len(blob)>100,'DBF_BYTES')
 n,head,step=struct.unpack_from('<IHH',blob,4)
 need(n==5477 and head>32 and step>10 and head+n*step<=len(blob),'DBF_HEADER')
 fields=[];offset=32
 while offset+32<=head and blob[offset]!=13:
  item=blob[offset:offset+32]
  fields.append((item[:11].split(b'\0',1)[0].decode('cp932'),item[16]))
  offset+=32
 need(blob[offset]==13,'FIELD_TERMINATOR')
 cols={};start=1
 for name,length in fields:
  cols[name]=(start,start+length);start+=length
 need(set(['地目区分','群コード','包括_統群','JCODE','SICHO']).issubset(cols),'DBF_FIELDS')
 land=Counter();groups=set();fine=set();cities=set();regions=defaultdict(Counter)
 for i in range(n):
  row=blob[head+i*step:head+(i+1)*step]
  need(row[:1]==b' ','INVALID_OR_DELETED_ROW')
  def get(key):
   a,b=cols[key];return row[a:b].decode('cp932').strip(' \x00\t')
  category=get('地目区分');land[category]+=1
  groups.add(get('群コード'));fine.add(get('包括_統群'));cities.add(get('JCODE'))
  regions[get('SICHO')][category]+=1
 return land,len(groups),len(fine),len(cities),regions

def replay(source,g):
 s=g['source'];path=Path(source)
 need(path.is_file() and path.stat().st_size==s['zip_bytes'],'ZIP_SIZE')
 need(hashlib.sha256(path.read_bytes()).hexdigest()==s['source_zip_sha256'],'ZIP_HASH')
 extracted={}
 with zipfile.ZipFile(path) as z:
  members=z.infolist()
  need(len(members)==7,'ZIP_ENTRY_COUNT')
  for info,expect in zip(members,s['members']):
   name=info.filename if info.flag_bits&0x800 else info.filename.encode('cp437').decode('cp932')
   need(name==s['member_folder']+'/'+expect['name'],'FILENAME')
   need(info.file_size==expect['bytes'] and not info.is_dir(),'FILE_SIZE')
   data=z.read(info)
   need(hashlib.sha256(data).hexdigest()==expect['sha256'],'MEMBER_HASH')
   extracted[expect['name']]=data
 shp,shx,dbf=[extracted['k1北海道.'+suffix] for suffix in ('shp','shx','dbf')]
 need(shp[:4]==bytes([0,0,39,10]) and struct.unpack_from('>I',shp,24)[0]*2==len(shp),'SHP_LENGTH')
 need(struct.unpack_from('<I',shp,32)[0]==5,'SHAPE_TYPE')
 need((len(shx)-100)//8==5477,'SHX_RECORDS')
 need(all(abs(a-b)<1e-10 for a,b in zip(struct.unpack_from('<4d',shp,36),g['geometry']['bounds_lon_lat'])),'SHAPE_BBOX')
 need('GCS_JGD_2000' in extracted['k1北海道.prj'].decode('ascii'),'CRS')
 land,groups,fine,cities,regions=dbf_table(dbf)
 need(dict(land)==g['feature_counts_by_landuse'],'LANDUSE')
 need(groups==g['soil_group_code_categories'] and fine==g['soil_fine_class_categories'],'SOIL_CODES')
 need(cities==g['geometry']['municipalities'],'MUNICIPALITIES')
 expected={r[0]:dict(zip(['田','普通畑','牧草地','樹園地'],r[1:])) for r in g['subprefecture_feature_counts']}
 need(len(regions)==len(expected),'REGION_COUNT')
 for name,counts in expected.items():
  need(all(regions.get(name,{}).get(category,0)==n for category,n in counts.items()),'REGION_MISMATCH:'+name)
 return {'status':'SOURCE_BYTES_AND_DBF_ATTRIBUTES_MATCH','features':5477,
   'municipalities':186,'subprefectures':14,'certified_tco2e':None}

def main(args):
 g=json.loads(REG.read_text(encoding='utf-8'));check_register(g)
 if args==['audit']:
  out={'status':'REGISTER_CONSISTENT_RAW_NOT_COMMITTED','features':5477,'archive_bytes_verified':False}
 elif len(args)==2 and args[0]=='verify':
  out=replay(args[1],g)
 else:
  raise ValueError('USAGE: python3 scripts/p29-hokkaido-soil-audit.py audit | verify ORIGINAL_ZIP')
 print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__':
 try:main(sys.argv[1:])
 except Exception as e:
  print(str(e),file=sys.stderr);sys.exit(1)
