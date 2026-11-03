#!/usr/bin/env python3
"""P21 JAXA user-provided 2024 GeoTIFF 3-file offline replay. No uploads."""
import argparse,hashlib,json,re,sys
from pathlib import Path
REG='research/p21-jaxa-lulc-2024-v25-04-batch01.json'
FIXED={
'LC_N24E131':('4348138ea766f7a02d8d7011c93d7b1aa6644751815d662ea65dd965e8978bfb',617860,None),
'LC_N30E131':('c5e8e164c140c725afbb50cd8daa386e8450a399b460ea5ffd622b0faa79c245',1027356,None),
'LC_N31E139':('2d62fe901337b42f5ecbef811c8925ad269606d06c023aa7cc76b7a7379655d5',614778,0)}
SUPPORT={
'README_2024JPN_v25.04_20250430.txt':('1f43c617d9addec634ae0c35fe8461959b1d4aa9f5e7c89c4e3adec3c8534a3b',662),
'2024JPN_v25.04_overview_legend_jp.png':('a4536459797bbafd7f21b501b22b1d6e9f44663bb31e47882cfb7fd3ed75dc03',275164),
'2024JPN_v25.04_overview_legend_en.png':('93eef9ff0a7e28e76e663c0d4872f6137f855fac702abefdf12c6d9ef4fb06f4',268352)}
class IntakeError(ValueError):pass
def guard(ok,label):
 if not ok:raise IntakeError('NAFT_P21_SOURCE_REJECTED:'+label)
def sha_file(p):
 p=Path(p);guard(p.is_file() and not p.is_symlink() and p.stat().st_size<=4_000_000,'FILE_MISSING_OR_UNSAFE')
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return (h.hexdigest(),p.stat().st_size)
def validate(r):
 guard(r.get('schema')=='naft-p21-jaxa-lulc-2024-v25-04-batch01' and r.get('year')==2024
       and r.get('version')=='25.04' and r.get('complete_national_coverage') is False
       and r.get('source_geotiff_committed') is False
       and r.get('source_redistribution_permission_verified') is False
       and r.get('class_one_is_water') is True and r.get('class_three_is_paddy') is True
       and r.get('field_area_ha') is None and r.get('formal_credit_tco2e') is None,'SCOPE')
 guard(len(r.get('categories',[]))==15 and [c['id'] for c in r['categories']]==list(range(1,16))
       and r['categories'][0]['en']=='Water bodies' and r['categories'][2]['en']=='Paddy field','CATEGORY_LEGEND')
 guard(len(r.get('tiles',[]))==3 and {t['id'] for t in r['tiles']}==set(FIXED),'TILE_SET')
 guard({s['name']:(s['sha256'],s['bytes']) for s in r.get('support_files',[])}==SUPPORT,'SUPPORT_REGISTRY')
 for t in r['tiles']:
  m=re.fullmatch(r'LC_N(\d{2})E(\d{3})',t['id']);guard(bool(m),'TILE_NAME')
  lat,lon=int(m[1]),int(m[2]);expected=FIXED[t['id']]
  c=t['count_by_class']
  guard(t['filename']==t['id']+'.tif' and (t['sha256'],t['bytes'],t['nodata'])==expected
        and t['bounds']==[lon,lat,lon+1,lat+1] and t['pixels']==144000000 and t['ha'] is None,'TILE_METADATA')
  guard(len(c)==15 and all(type(n)==int and n>=0 for n in c) and sum(c)==t['pixels']
        and c[0]==t['water_pixels'] and c[2]==t['paddy_pixels'],'TILE_COUNTS')
 return True
def replay(folder,manifest=REG):
 r=json.loads(Path(manifest).read_text(encoding='utf8'));validate(r)
 for name,expected in SUPPORT.items():guard(sha_file(Path(folder)/name)==expected,'SUPPORT_SHA:'+name)
 text=(Path(folder)/'README_2024JPN_v25.04_20250430.txt').read_text(encoding='utf8')
 guard(all(x in text for x in ['Paddy field','Water bodies','2024','Version 25.04']),'README_TEXT')
 try:
  import rasterio,numpy as np
 except ImportError as e:raise IntakeError('INSTALL_RASTERIO_NUMPY') from e
 matched=[]
 for t in r['tiles']:
  file=Path(folder)/t['filename']
  guard(sha_file(file)==FIXED[t['id']][:2],'TIF_SHA:'+t['id'])
  with rasterio.open(file) as ds:
   guard(ds.driver=='GTiff' and ds.crs.to_epsg()==4326 and ds.count==1 and ds.dtypes==('uint8',)
         and ds.width==12000 and ds.height==12000 and ds.nodata==t['nodata'],'RASTER_PROPERTIES:'+t['id'])
   guard(all(abs(a-b)<2e-7 for a,b in zip(ds.bounds,t['bounds'])),'BOUNDS:'+t['id'])
   guard(abs(ds.res[0]-1/12000)<1e-10 and abs(ds.res[1]-1/12000)<1e-10,'RESOLUTION:'+t['id'])
   counts=np.bincount(ds.read(1,masked=False).ravel(),minlength=16)
   guard(len(counts)==16 and counts[0]==0 and int(counts.sum())==144000000
         and counts[1:].tolist()==t['count_by_class'],'PIXEL_PARITY:'+t['id'])
   matched.append({'tile':t['id'],'paddy_pixels':int(counts[3]),'water_pixels':int(counts[1]),'match':True})
 return {'status':'THREE_JAXA_TILES_LOCAL_SOURCE_PARITY_MATCH','tiles':matched,'nationwide_complete':False,'area_ha':None,'credit_tco2e':None}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('folder');a.add_argument('--register',default=REG);p=a.parse_args()
 try:print(json.dumps(replay(p.folder,p.register),ensure_ascii=False,indent=2))
 except (IntakeError,OSError,KeyError,ValueError) as e:print(e,file=sys.stderr);sys.exit(1)
