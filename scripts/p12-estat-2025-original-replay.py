#!/usr/bin/env python3
"""Replay a known e-Stat 2025 .xls raw file against committed NaFT P12 data.
Standard library only. No Excel macros or calculations are executed.
Refuses unknown file identities and legacy workbook schemas. The original
binary stays at the user's private path; no .xls is uploaded by this script.
"""
from pathlib import Path
import hashlib
import json
import struct
import sys

BASE=Path(__file__).resolve().parent.parent
REGISTER=BASE/'research/p12-estat-2025-prefecture-original-xls-v1.json'
END=0xFFFFFFFE
FAT_END=0xFFFFFFF0
METRICS=[
 ('area_all_including_green_ha',3),
 ('area_main_food_ha',4),
 ('producer_sieve_yield_kg_per_10a',5),
 ('producer_sieve_main_food_harvest_t',6),
 ('producer_sieve_under_harvest_t',13),
 ('sieve_170_yield_kg_per_10a',16),
 ('sieve_170_main_food_harvest_t',17),
 ('area_grain_use_ha',22),
 ('harvest_grain_use_t',23),
]

def demand(ok,label):
 if not ok:raise ValueError('NAFT_P12_ORIGINAL_XLS_BLOCKED:'+label)

def u16(b,o=0):return struct.unpack_from('<H',b,o)[0]
def u32(b,o=0):return struct.unpack_from('<I',b,o)[0]

def compound_workbook(b):
 demand(b[:8]==bytes.fromhex('d0cf11e0a1b11ae1'),'NOT_OLE_CFB')
 demand(u16(b,30)==9 and u16(b,32)==6,'OLE_SECTOR_FORMAT')
 sector_size=512
 def sector(i):
  start=(i+1)*sector_size
  demand(0<=i<len(b)//sector_size-1,'OLE_SECTOR_OUT_OF_RANGE')
  return b[start:start+sector_size]
 fat_ids=[i for i in struct.unpack_from('<109I',b,76) if i<FAT_END]
 demand(u32(b,72)==0 and 0<u32(b,44)<=10,'OLE_DIFAT_UNSUPPORTED')
 demand(len(fat_ids)>=u32(b,44),'OLE_FAT_ID_COUNT')
 fat=[]
 for i in fat_ids[:u32(b,44)]:
  fat.extend(struct.unpack('<128I',sector(i)))
 def chain(start,size=None):
  out=bytearray()
  seen=set()
  while start<FAT_END:
   demand(start not in seen and len(seen)<=300,'OLE_CYCLIC_OR_OVERSIZED_CHAIN')
   seen.add(start)
   out.extend(sector(start))
   demand(start<len(fat),'OLE_FAT_ENTRY_MISSING')
   start=fat[start]
  demand(start==END and (size is None or len(out)>=size),'OLE_CHAIN_LENGTH')
  return bytes(out if size is None else out[:size])
 dirs=chain(u32(b,48))
 entries={}
 for i in range(0,len(dirs),128):
  e=dirs[i:i+128]
  name_len=u16(e,64)
  if name_len<2 or name_len>64:continue
  name=e[:name_len-2].decode('utf-16le')
  entries[name]=(e[66],u32(e,116),struct.unpack_from('<Q',e,120)[0])
 demand('Workbook' in entries,'NO_WORKBOOK_STREAM')
 kind,start,size=entries['Workbook']
 demand(kind==2 and size>=4096 and size<2*1024*1024,'WORKBOOK_STREAM_SIZE')
 return chain(start,size)

def strings_from_sst(payload):
 total=u32(payload,0); count=u32(payload,4)
 demand(47<=count<=2000 and total>=count,'SST_COUNT')
 pos=8; result=[]
 for _ in range(count):
  length=u16(payload,pos);flags=payload[pos+2];pos+=3
  demand(flags&0xf2==0,'SST_UNSUPPORTED_OPTIONS')
  runs=u16(payload,pos) if flags&8 else 0
  if flags&8:pos+=2
  extra=u32(payload,pos) if flags&4 else 0
  if flags&4:pos+=4
  n=length*(2 if flags&1 else 1)
  data=payload[pos:pos+n];pos+=n
  demand(len(data)==n,'SST_TRUNCATED')
  result.append(data.decode('utf-16le' if flags&1 else 'latin1'))
  pos+=runs*4+extra
 demand(pos==len(payload),'SST_TRAILING_BYTES')
 return result

def rk_value(word):
 val=word>>2
 if word&2:
  if val&0x20000000:val-=0x40000000
 else:
  val=struct.unpack('<d',struct.pack('<Q',(word&0xfffffffc)<<32))[0]
 if word&1:val/=100
 demand(isinstance(val,(int,float)) and abs(val)<1e12,'RK_NONFINITE')
 return val

def biff_cells(stream):
 idx=0;records=[];sheets=[]
 while idx+4<=len(stream):
  typ,size=struct.unpack_from('<HH',stream,idx)
  demand(idx+4+size<=len(stream),'BIFF_RECORD_SIZE')
  p=stream[idx+4:idx+4+size]
  records.append((idx,typ,p))
  if typ==0x85:
   pos=u32(p,0);length=p[6];flag=p[7]
   name=p[8:8+length*(2 if flag&1 else 1)].decode('utf-16le' if flag&1 else 'latin1')
   sheets.append((pos,name))
  idx+=4+size
 demand(len(sheets)==1 and sheets[0][1]=='f002-07-001','WRONG_SHEET_NAME')
 sst_records=[p for off,t,p in records if t==0xfc]
 demand(len(sst_records)==1,'WRONG_SHARED_STRING_TABLE')
 stringtable=strings_from_sst(sst_records[0])
 cells={}
 for off,typ,p in records:
  if off<sheets[0][0]:continue
  if typ==0xfd:
   row,col,style,ind=struct.unpack_from('<HHHI',p)
   demand(ind<len(stringtable),'BAD_STRING_INDEX')
   cells[(row,col)]=stringtable[ind]
  elif typ==0x27e:
   row,col,style,raw=struct.unpack_from('<HHHI',p)
   cells[(row,col)]=rk_value(raw)
  elif typ==0x0203:
   row,col,style,num=struct.unpack('<HHHd',p)
   cells[(row,col)]=num
  elif typ==0xbd:
   row,first=struct.unpack_from('<HH',p)
   last=u16(p,len(p)-2)
   demand(0<=first<=last<=128 and len(p)==6+6*(last-first+1),'MULRK_RECORD_SIZE')
   for c in range(first,last+1):
    raw=u32(p,4+(c-first)*6+2)
    cells[(row,c)]=rk_value(raw)
 demand(cells.get((2,0),'').find('令和７年産')>=0,'YEAR_HEADER_CHANGED')
 demand(cells.get((3,0),'').find('水稲')>=0,'MAIN_TABLE_HEADER_CHANGED')
 demand(cells.get((11,0))=='全国','NATIONAL_ROW_NOT_FOUND')
 return cells

def audit(xls_path):
 register=json.loads(REGISTER.read_text(encoding='utf8'))
 meta=register['source']
 original=Path(xls_path)
 demand(original.is_file() and not original.is_symlink(),'INPUT_NOT_REGULAR')
 b=original.read_bytes()
 demand(len(b)==meta['file_bytes'],'RAW_FILE_LENGTH')
 digest=hashlib.sha256(b).hexdigest()
 demand(digest==meta['file_sha256'],'ORIGINAL_SHA256_MISMATCH')
 cells=biff_cells(compound_workbook(b))
 demand(len(register['prefectures'])==47,'PREFECTURE_COUNT')
 validated=[]
 for row in register['prefectures']:
  excel_row=row['source_excel_row']
  source_row=excel_row-1
  demand(cells.get((source_row,0))==row['name'],'ORIGINAL_PREFECTURE_LABEL_'+str(excel_row))
  for key,col in METRICS:
   val=cells.get((source_row,col))
   demand(isinstance(val,(int,float)) and val==row[key],
     'ORIGINAL_METRIC_MISMATCH_'+str(excel_row)+'_'+key)
  validated.append(excel_row)
 for key,col in METRICS:
  demand(cells[(11,col)]==register['country_totals'][key],
    'NATIONAL_TOTAL_MISMATCH_'+key)
 demand(len(set(validated))==47,'DUPLICATE_PREFECTURE_ROWS')
 return {'status':'P12_ORIGINAL_2025_ESTAT_XLS_VERIFIED',
  'original_sha256':digest,'bytes':len(b),'prefecture_rows_replayed':47,
  'original_values_per_prefecture':len(METRICS),
  'cells_cross_checked':47*len(METRICS)+len(METRICS),
  'certified_tco2e':None}

if __name__=='__main__':
 if len(sys.argv)!=2:
  print('Usage: python3 scripts/p12-estat-2025-original-replay.py /private/f002-07-001.xls',file=sys.stderr)
  sys.exit(2)
 try:
  print(json.dumps(audit(sys.argv[1]),ensure_ascii=False,sort_keys=True))
 except (OSError,ValueError,IndexError,struct.error,UnicodeError,KeyError) as exc:
  print(str(exc),file=sys.stderr)
  sys.exit(1)
