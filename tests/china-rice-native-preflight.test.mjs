import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {preflightChinaNativeCsv,nativeSourceContracts} from '../scripts/lib/china-rice-native-preflight.mjs';

let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const bad=(run,needle)=>{assert.throws(run,new RegExp(needle));n++};
const src=nativeSourceContracts;
const daily='CN_2023_DAILY_CARBON',hourly='CN_2023_HOURLY_MOLECULAR';
const d=src[daily],h=src[hourly];
function encoded(header,rows,newline='\n'){
 return Buffer.from([header.join(','),...rows.map(row=>row.join(',')),''].join(newline),'utf8');
}
const dailyRows=[
 ['2023','1','1','1','0','0','0','0.012'],
 ['2023','2','1','2','0','0','0','-0.002'],
 ['2023','4','1','4','0','0','0','NA']
];
const hourlyRow=(day,hour,minute,doy,rate)=>[
 '2023','1',String(day),String(hour),String(minute),String(doy),
 ...Array.from({length:11},()=>'-9999'),rate
];
const hourlyRows=[hourlyRow(1,0,0,1,'10.0'),hourlyRow(1,0,30,1,'-5.0'),hourlyRow(1,2,0,1,'NaN')];
const dBytes=encoded(d.header,dailyRows),hBytes=encoded(h.header,hourlyRows);
const doPre=(buf=dBytes,id=daily,cls='SYNTHETIC')=>
 preflightChinaNativeCsv(buf,{source_id:id,data_class:cls});
const out=doPre();
eq(out.status,'SOURCE_SHAPE_ONLY_REPLAY_BLOCKED');
eq(out.rows_inspected,3);
eq(out.source_unit,'g_CH4_C_m2_day');
eq(out.mass_basis,'CH4_C');
eq(out.syntactic_numeric_lexemes,2);
eq(out.unparsed_or_missing_rate_lexemes,1);
eq(out.calendar_discontinuity_boundaries,1);
eq(out.matches_pinned_ephemeral_bytes,false);
eq(out.native_calendar_fields_validated,true);
eq(out.timezone_verified,false);
eq(out.temporal_support_verified,false);
eq(out.source_qc_semantics_verified,false);
eq(out.normalized_observation_csv,null);
eq(out.observed_integral_mg_ch4_m2,null);
eq(out.season_total_mg_ch4_m2,null);
eq(out.certified_tco2e,null);
eq(out.source_original_data_redistributed,false);
eq(doPre(hBytes,hourly).rate_column,'CH4-umol/m2/s');
eq(doPre(hBytes,hourly).source_unit,'umol_CH4_m2_s');
eq(doPre(hBytes,hourly).calendar_discontinuity_boundaries,1);
eq(doPre(hBytes,hourly).unparsed_or_missing_rate_lexemes,1);
eq(doPre(Buffer.from(dBytes),daily).source_bytes_sha256,
   createHash('sha256').update(dBytes).digest('hex'));
eq(JSON.stringify(doPre()),JSON.stringify(out)); // Determinism
bad(()=>doPre(dBytes,daily,'PUBLISHER_ATTESTED'),'NATIVE_DATA_CLASS_UNSUPPORTED');
bad(()=>doPre(dBytes,daily,'USER_SUPPLIED_UNVERIFIED'),'NATIVE_PINNED_SOURCE_DIGEST_MISMATCH');
bad(()=>doPre(hBytes,hourly,'USER_SUPPLIED_UNVERIFIED'),'NATIVE_PINNED_SOURCE_DIGEST_MISMATCH');
bad(()=>doPre(dBytes,'JP_HRT','SYNTHETIC'),'NATIVE_SOURCE_UNREGISTERED');
bad(()=>doPre(Buffer.from('')),'NATIVE_SOURCE_BYTES_SIZE_INVALID');
bad(()=>doPre(encoded([...d.header.slice(0,-1),'CH4-gCH4/m2/day'],dailyRows)),'NATIVE_SOURCE_HEADER_MISMATCH');
bad(()=>doPre(encoded([...d.header,d.header[0]],dailyRows.map(r=>[...r,'X']))),'NATIVE_SOURCE_HEADER_MISMATCH');
bad(()=>doPre(encoded(d.header,[dailyRows[0].slice(0,-1)])),'NATIVE_SOURCE_ROW_COLUMNS');
bad(()=>doPre(encoded(d.header,[dailyRows[0],dailyRows[0]])),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>doPre(encoded(d.header,[dailyRows[1],dailyRows[0]])),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>doPre(encoded(d.header,[[...dailyRows[0].slice(0,1),'2',...dailyRows[0].slice(2)]])),'NATIVE_DOY_CALENDAR_MISMATCH');
bad(()=>doPre(encoded(d.header,[['2023','60','2','29','0','0','0','1']])),'NATIVE_INVALID_CALENDAR_DAY');

eq(doPre(encoded(d.header,[['2024','60','2','29','0','0','0','1'],['2024','61','3','1','0','0','0','0']])).rows_inspected,2);
bad(()=>doPre(encoded(d.header,[['2023','01','1','1','0','0','0','1']])),'NATIVE_INVALID_CALENDAR_INTEGER');
bad(()=>doPre(encoded(d.header,[['2023','1','1','1','0','0','0','"1"']])),'NATIVE_ENCODING_OR_CSV_STRUCTURE');
bad(()=>doPre(Buffer.from([0xff,0x0a])),'NATIVE_UTF8_DECODE_FAILED');
bad(()=>doPre(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),dBytes])),'NATIVE_ENCODING_OR_CSV_STRUCTURE');
bad(()=>doPre(Buffer.from(dBytes.toString().trimEnd())),'NATIVE_ENCODING_OR_CSV_STRUCTURE');
eq(doPre(encoded(d.header,dailyRows,'\r\n')).rows_inspected,3);
bad(()=>doPre(encoded(h.header,[hourlyRows[1],hourlyRows[0]]),hourly),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>doPre(encoded(h.header,[hourlyRow(1,24,0,1,'1')]),hourly),'NATIVE_INVALID_CALENDAR_INTEGER');
bad(()=>doPre(encoded(h.header,[hourlyRow(1,0,60,1,'1')]),hourly),'NATIVE_INVALID_CALENDAR_INTEGER');
bad(()=>doPre(encoded(h.header,[hourlyRow(1,0,0,2,'1')]),hourly),'NATIVE_DOY_CALENDAR_MISMATCH');
// The evidence register is checked against the exact pinned file identifiers
// without embedding or distributing the original scientific data.
const source=JSON.parse(readFileSync('research/asia-source-dock-2026-10-19/verified-ephemeral-acquisition.json','utf8'));
const records=source.files.filter(x=>x.dataset_id==='CN_RICE_EDDY_EAST_2023');
eq(records.length,2);
for(const [id,contract] of Object.entries(src)){
 const entry=records.find(f=>f.filename===contract.filename);
 assert.ok(entry);n++;
 eq(entry.published_md5,contract.publisher_md5);
 eq(entry.downloaded_sha256,contract.ephemeral_sha256);
 eq(entry.size_bytes,contract.expected_size);
 eq(entry.structural_findings.header,contract.header);
}
const dir=mkdtempSync(join(tmpdir(),'naft-native-source-'));
try{
 const path=join(dir,'mock original source.csv');
 writeFileSync(path,dBytes);
 const cmd=(args)=>spawnSync(process.execPath,['scripts/preflight-china-rice-native.mjs',...args],
   {encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
 const options=['--csv',path,'--source',daily,'--data-class','SYNTHETIC'];
 const p=cmd(options);
 eq(p.status,0);eq(p.stderr,'');eq(JSON.parse(p.stdout),out);
 const invalid=cmd(['--csv',path,'--source',daily,'--data-class','USER_SUPPLIED_UNVERIFIED']);
 assert.notEqual(invalid.status,0);n++;
 assert.match(invalid.stderr,/NATIVE_PINNED_SOURCE_DIGEST_MISMATCH/);n++;
 eq(invalid.stdout,'');
 const duplicate=cmd(['--csv',path,'--source',daily,'--source',daily]);
 assert.notEqual(duplicate.status,0);n++;
 eq(duplicate.stdout,'');
 writeFileSync(path,Buffer.alloc(2000001,65));
 const excess=cmd(options);
 assert.notEqual(excess.status,0);n++;
 assert.match(excess.stderr,/NATIVE_SOURCE_BYTES_SIZE_INVALID/);n++;
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('CHINA_RICE_NATIVE_PREFLIGHT_PASS: '+n+' source/calendar/digest/CLI boundary assertions');
