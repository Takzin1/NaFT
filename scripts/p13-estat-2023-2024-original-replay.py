#!/usr/bin/env python3
"""Verify original 2023/24 e-Stat BIFF8 XLS against P13's committed source cells.
Standard-library-only; reuses the project's P12 CFB/SST parser. No macros
executed, no raw XLS ever transmitted or committed.
"""
import hashlib
import importlib.util
import json
import re
import struct
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
SOURCE_JS=ROOT/'src/gx-rice-history.js'
P12=ROOT/'scripts/p12-estat-2025-original-replay.py'
spec=importlib.util.spec_from_file_location('naft_p12_xls_ole',P12)
p12=importlib.util.module_from_spec(spec)
spec.loader.exec_module(p12)
EXPECTED={
  2023:dict(length=54272,sha='3b0e088abed5aa9f187a5d83f4ea31797ee1c347af8e6005185b1a99feebdaed',
    sheet='f002-05-001',header='令和５年産',national=[1344000,533,7165000,515,1242000,6610000]),
  2024:dict(length=46592,sha='e0fe569b201077da105688754bb9951df94db63fc547b5660fb77d9be0b9685d',
    sheet='f002-06-001',header='令和６年産',national=[1359000,540,7345000,519,1259000,6792000]),
}
COLS=(3,4,5,6,8,9)  # D,E,F,G,I,J; zero-based

def need(condition,code):
    if not condition:raise ValueError('NAFT_P13_SOURCE_BLOCKED:'+code)

def expected_rows(year):
    source=SOURCE_JS.read_text(encoding='utf-8')
    hit=re.search(r'(?m)^'+str(year)+r':`([^`]+)`',source)
    need(hit is not None,'NO_COMMITTED_SOURCE_CELLS')
    lines=hit.group(1).strip().splitlines()
    need(len(lines)==47,'SOURCE_PREFECTURE_COUNT')
    rows=[]
    for line in lines:
        values=line.split(',')
        need(len(values)==8,'SOURCE_CELL_SHAPE')
        row,name,*items=values
        need(row.isdigit() and all(s.isdigit() for s in items),'SOURCE_CELL_NUMBER')
        rows.append((int(row),name,list(map(int,items))))
    need(len({v[0] for v in rows})==47,'DUPLICATE_PREFECTURE_ROW')
    return rows

def extract_cells(workbook,year):
    rec=[];offset=0
    while offset+4<=len(workbook):
        typ,ln=struct.unpack_from('<HH',workbook,offset)
        need(offset+4+ln<=len(workbook),'BIFF_RECORD_SIZE')
        rec.append((offset,typ,workbook[offset+4:offset+4+ln]))
        offset+=4+ln
    sheets=[]
    for pos,typ,p in rec:
        if typ==0x85:
            ln=p[6];flag=p[7]
            name=p[8:8+ln*(2 if flag&1 else 1)].decode('utf-16le' if flag&1 else 'latin1')
            sheets.append((p12.u32(p,0),name))
    need(sheets==[(sheets[0][0],EXPECTED[year]['sheet'])] if sheets else False,'WRONG_SHEET')
    sst=[p for _,typ,p in rec if typ==0xfc]
    need(len(sst)==1,'INVALID_SST_COUNT')
    strings=p12.strings_from_sst(sst[0])
    cells={}
    for offset,typ,p in rec:
        if offset<sheets[0][0]:continue
        if typ==0xfd:
            row,col,style,ind=struct.unpack_from('<HHHI',p)
            need(ind<len(strings),'SST_INDEX_OUT_OF_RANGE')
            cells[(row,col)]=strings[ind]
        elif typ==0x27e:
            row,col,style,raw=struct.unpack_from('<HHHI',p)
            cells[(row,col)]=p12.rk_value(raw)
        elif typ==0x0203:
            row,col,style,v=struct.unpack_from('<HHHd',p)
            cells[(row,col)]=v
        elif typ==0xbd:
            row,first=struct.unpack_from('<HH',p)
            last=p12.u16(p,len(p)-2)
            need(0<=first<=last<256 and len(p)==6+6*(last-first+1),'MULRK_SIZE')
            for col in range(first,last+1):
                raw=p12.u32(p,4+(col-first)*6+2)
                cells[(row,col)]=p12.rk_value(raw)
    need(EXPECTED[year]['header'] in cells.get((2,0),''),'YEAR_HEADER_CHANGED')
    need('水稲' in cells.get((3,0),''),'TABLE_HEADER_CHANGED')
    need(cells.get((11,0))=='全国','COUNTRY_ROW_CHANGED')
    return cells

def verify(year,path):
    m=EXPECTED[year]
    file=Path(path)
    need(file.is_file() and not file.is_symlink(),'MISSING_OR_SYMLINK_SOURCE')
    b=file.read_bytes()
    need(len(b)==m['length'],'SOURCE_LENGTH')
    sha=hashlib.sha256(b).hexdigest()
    need(sha==m['sha'],'SOURCE_SHA256')
    cells=extract_cells(p12.compound_workbook(b),year)
    rows=expected_rows(year)
    for row,name,values in rows:
        need(cells.get((row-1,0))==name,'PREFECTURE_ROW_'+str(row))
        for col,v in zip(COLS,values):
            need(cells.get((row-1,col))==v,'CELL_'+str(year)+'_'+str(row)+'_'+str(col))
    for col,value in zip(COLS,m['national']):
        need(cells.get((11,col))==value,'NATIONAL_'+str(year)+'_'+str(col))
    return {'year':year,'source_sha256':sha,'file_bytes':len(b),
      'source_rows':len(rows),'numeric_cells_checked':47*6+6,
      'methane_measurements':0,'certified_tco2e':None}

if __name__=='__main__':
    if len(sys.argv)!=3:
        print('Usage: p13-estat-2023-2024-original-replay.py 2023.xls 2024.xls',file=sys.stderr)
        sys.exit(2)
    try:
        print(json.dumps({'status':'ORIGINAL_XLS_2023_2024_MATCH',
            'files':[verify(2023,sys.argv[1]),verify(2024,sys.argv[2])]},
            ensure_ascii=False,sort_keys=True))
    except (OSError,ValueError,IndexError,KeyError,UnicodeError,struct.error) as e:
        print(str(e),file=sys.stderr)
        sys.exit(1)
