#!/usr/bin/env python3
"""Scientific source index and ephemeral Zenodo archive integrity runner.
No raw scientific bytes are committed, extracted, executed or redistributed.
"""
import argparse
import csv
import hashlib
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from io import BytesIO

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/'research/asia-source-dock-2026-10-19/source-index.json'
MAX_BYTES=15_000_000
MAX_MEMBERS=400
ALLOWED_HOSTS={'zenodo.org'}
ALLOWED_SOURCE_TYPES={
 'CHAMBER_DAILY_RESEARCH_OBSERVATION','EDDY_OBSERVATION_AND_METADATA',
 'SITE_EDDY_COVARIANCE_DATASET','HARMONIZED_TOWER_DATASET',
 'MODEL_GRID_ESTIMATE_NOT_FIELD_OBSERVATION','MODEL_INVENTORY_AND_UNCERTAINTY_NOT_FIELD_OBSERVATION',
 'PUBLISHED_AGGREGATE_NO_RAW_TIMESERIES'}
MODEL_TYPES={'MODEL_GRID_ESTIMATE_NOT_FIELD_OBSERVATION','MODEL_INVENTORY_AND_UNCERTAINTY_NOT_FIELD_OBSERVATION'}

def validate_index(index):
 assert index['schema']=='naft-asia-source-index-v1'
 assert index['ieee_dock']['contract']=='naft-ieee-observation-source-dock-v1'
 assert index['ieee_dock']['transfer_policy']=='METADATA_ONLY'
 assert index['independent_download_attempt']['verified_original_file_count']==0
 assert len(index['sources'])>=7
 seen=set()
 for s in index['sources']:
  assert s['id'] not in seen;seen.add(s['id'])
  assert re.fullmatch(r'[A-Z][A-Z0-9_]{4,96}',s['id'])
  assert s['source_class'] in ALLOWED_SOURCE_TYPES
  assert s['downloaded_original_bytes'] is False and s['original_sha256'] is None
  assert s['certified_jcredit_usable'] is False
  assert s['redistribution_permitted'] is None
  assert s['license_status']=='REVIEW_REQUIRED'
  assert s['independent_field_environment_verified'] is False
  assert s['doi'] and s['record_url'].startswith('https://')
  for f in s.get('files',[]):
   assert re.fullmatch(r'[a-f0-9]{32}',f['md5_published'])
   assert f['filename'] and '/' not in f['filename'] and '\\' not in f['filename']
   if s['source_class'] in MODEL_TYPES:assert f['kind'].endswith(('MODEL','PACKAGE'))
  if s['source_class'] in MODEL_TYPES:assert 'MODEL' in s['target_adapter'] or 'BENCHMARK' in s['target_adapter']
 return index

def select(index):
 # Four small and two capped derived packages, no 13MB large raw file until reviewed.
 priority=[('KR_GIMJE_DAILY_2022_2024','ch4.zip'),
           ('KR_GIMJE_DAILY_2022_2024','input_fields_meta.xlsx'),
           ('CN_RICE_EDDY_EAST_2023','Supporting information data2.csv'),
           ('CN_RICE_EDDY_EAST_2023','Supporting information data1.csv'),
           ('ASIA_OUYANG_8DAY_2022','RiceCH4_mgCH4m2day_annual.zip'),
           ('SEA9_TIER2_INVENTORY_2026','zenodo_package_v1.0.0.zip')]
 by_id={x['id']:x for x in index['sources']}
 return [(by_id[i],next(f for f in by_id[i]['files'] if f['filename']==filename)) for i,filename in priority]

def source_url(s,f):
 url=s['record_url']
 p=urllib.parse.urlparse(url)
 if p.scheme!='https' or p.hostname not in ALLOWED_HOSTS or p.path!=('/records/'+s['doi'].split('.')[-1]):
  raise ValueError('REMOTE_HOST_OR_RECORD_NOT_ALLOWLISTED')
 return url+'/files/'+urllib.parse.quote(f['filename'],safe='')+'?download=1'

def inspect_zip(data):
 if not zipfile.is_zipfile(BytesIO(data)):raise ValueError('PUBLISHED_ZIP_NOT_ZIP')
 with zipfile.ZipFile(BytesIO(data)) as z:
  members=z.infolist()
  if len(members)>MAX_MEMBERS:raise ValueError('ZIP_TOO_MANY_MEMBERS')
  total=0
  result=[]
  for info in members:
   fn=info.filename
   if fn.startswith('/') or '\\' in fn or any(seg in ('..','') for seg in fn.split('/') if seg!='') or info.flag_bits&1:
    raise ValueError('ZIP_MEMBER_UNSAFE_OR_ENCRYPTED')
   total+=info.file_size
   if total>MAX_BYTES*60:raise ValueError('ZIP_UNPACKED_SIZE_TOO_BIG')
   if info.is_dir():continue
   result.append({'name':fn[:200],'size_bytes':info.file_size,'crc32':format(info.CRC,'08x')})
  return result[:40]

def inspect_csv_byte_shape(data):
 # Structural metadata only. Do NOT print any rows, observational values,
 # time-series samples or proprietary fields from a user/source file.
 # In particular latin1 rendering here is not a validated encoding claim.
 header=data.split(b'\n',1)[0].removesuffix(b'\r')
 tokens=header.split(b',')
 invalid=[]
 ascii_or_hex=[]
 for i,token in enumerate(tokens):
  try:ascii_or_hex.append(token.decode('ascii'))
  except UnicodeDecodeError:
   invalid.append(i)
   ascii_or_hex.append('NON_ASCII_HEX:'+token.hex())
 raw_lines=data.split(b'\n')
 if raw_lines and raw_lines[-1]==b'':raw_lines.pop()
 data_lines=raw_lines[1:]
 lengths={}
 for line in data_lines[:400]:
  row=line.removesuffix(b'\r')
  count=row.count(b',')+1
  lengths[str(count)]=lengths.get(str(count),0)+1
 try:header.decode('utf-8-sig');header_utf8=True
 except UnicodeDecodeError:header_utf8=False
 return {'header_count':len(tokens),
         'header_fields_ascii_or_hex':ascii_or_hex[:40],
         'non_ascii_header_field_indexes':invalid,
         'header_utf8_decodable':header_utf8,
         'header_raw_sha256':hashlib.sha256(header).hexdigest(),
         'raw_line_count':len(raw_lines),
         'data_row_count':len(data_lines),
         'sample_400_row_column_counts':lengths,
         'byte_order_mark_utf8':data.startswith(b'\xef\xbb\xbf'),
         'crlf_line_endings':data.count(b'\r\n'),
         'lf_line_endings':data.count(b'\n')}

def inspect_scientific_header(data,s,f):
 # Only structural headers; never echo unpublished measurement rows.
 if s['id']=='KR_GIMJE_DAILY_2022_2024' and f['filename']=='ch4.zip':
  with zipfile.ZipFile(BytesIO(data)) as z:
   members=sorted(v.filename for v in z.infolist() if v.filename.lower().endswith('.csv'))
   if not members:return {'status':'NO_CSV_IN_ZIP'}
   name=members[0]
   first=z.read(name)
   if len(first)>100000:raise ValueError('OBS_CSV_PREVIEW_SIZE_LIMIT')
   row=next(csv.reader(first.decode('utf-8-sig',errors='replace').splitlines()))
   return {'status':'CSV_HEADER_INSPECTED','first_member':name,
           'csv_member_count':len(members),'header':row[:30],
           'first_member_size_bytes':len(first)}
 if s['id']=='CN_RICE_EDDY_EAST_2023' and f['filename'].endswith('.csv'):
  row=next(csv.reader(data.decode('utf-8-sig',errors='replace').splitlines()))
  return {'status':'CSV_HEADER_INSPECTED','header':row[:30]}
 return {'status':'NOT_AN_OBSERVATION_CSV_PREVIEW'}

def fetch(s,f):
 url=source_url(s,f)
 req=urllib.request.Request(url,headers={'User-Agent':'NaFT-research-integrity/1.0 (source citation Zenodo)'})
 with urllib.request.urlopen(req,timeout=30) as res:
  end=urllib.parse.urlparse(res.geturl())
  if end.scheme!='https' or end.hostname not in ALLOWED_HOSTS:
   raise ValueError('DOWNLOAD_REDIRECT_NOT_ALLOWLISTED')
  data=res.read(MAX_BYTES+1)
  if len(data)>MAX_BYTES:raise ValueError('FILE_TOO_LARGE')
 if hashlib.md5(data).hexdigest()!=f['md5_published']:
  raise ValueError('PUBLISHED_MD5_MISMATCH')
 output={'dataset_id':s['id'],'filename':f['filename'],
         'state':'EPHEMERAL_ORIGINAL_BYTES_MD5_MATCH',
         'publisher_md5':f['md5_published'],'actual_sha256':hashlib.sha256(data).hexdigest(),
         'size_bytes':len(data),'source_class':s['source_class'],
         'license_reviewed':False,'redistribution_allowed':False,
         'official_jcredit_usable':False,
         'research_computation_ready':False}
 if f['filename'].endswith('.zip'):output['archive_members']=inspect_zip(data)
 if s['source_class'] in ('CHAMBER_DAILY_RESEARCH_OBSERVATION','EDDY_OBSERVATION_AND_METADATA'):
  output['structural_preview']=inspect_scientific_header(data,s,f)
  if s['id']=='CN_RICE_EDDY_EAST_2023' and f['filename'].endswith('.csv'):
   output['native_byte_shape']=inspect_csv_byte_shape(data)
 return output

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--fetch',action='store_true',help='Network required; no dataset bytes persisted.')
 args=ap.parse_args()
 index=validate_index(json.loads(INDEX.read_text('utf8')))
 selected=select(index)
 if not args.fetch:
  print(json.dumps({'status':'OFFLINE_CATALOG_PASS','source_count':len(index['sources']),
    'pinned_publisher_md5_files':sum(len(s.get('files',[])) for s in index['sources']),
    'ephemeral_download_candidates':len(selected),
    'verified_original_file_count':0,'ieee_transfer':'METADATA_ONLY'},sort_keys=True))
  return
 results=[]
 for s,f in selected:
  try:
   result=fetch(s,f);results.append(result)
   print('SOURCE_FETCH_RESULT '+json.dumps(result,sort_keys=True),flush=True)
  except (OSError,ValueError,urllib.error.URLError,zipfile.BadZipFile) as exc:
   result={'dataset_id':s['id'],'filename':f['filename'],
           'state':'FAILED_DOWNLOAD_OR_VALIDATION','reason':str(exc)[:240]}
   results.append(result)
   print('SOURCE_FETCH_RESULT '+json.dumps(result,sort_keys=True),flush=True)
 count=sum(r['state']=='EPHEMERAL_ORIGINAL_BYTES_MD5_MATCH' for r in results)
 print('SOURCE_HARVEST_SUMMARY '+json.dumps({
    'download_attempts':len(results),'verified_ephemeral_original_files':count,
    'failures':len(results)-count,'source_bytes_committed':False,
    'official_jcredit_usable':False,'ieee_transfer':'METADATA_ONLY'},sort_keys=True))
 if count==0:sys.exit(2)
if __name__=='__main__':main()
