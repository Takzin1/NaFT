import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {preflightChinaNativeCsv,nativeSourceContracts} from '../scripts/lib/china-rice-native-preflight.mjs';

let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const bad=(fn,match)=>{assert.throws(fn,new RegExp(match));n++};
const daily='CN_2023_DAILY_CARBON',hourly='CN_2023_HOURLY_MOLECULAR';
const d=nativeSourceContracts[daily],h=nativeSourceContracts[hourly];
function encoded(header,rows,nl='\n'){
 const headerBytes=Buffer.concat(header.flatMap((field,i)=>[
  i?Buffer.from(','):Buffer.alloc(0),
  field.startsWith('NON_ASCII_HEX:')?Buffer.from(field.slice(14),'hex'):Buffer.from(field,'ascii')
 ]));
 return Buffer.concat([headerBytes,Buffer.from(nl+rows.map(r=>r.join(',')).join(nl)+nl,'ascii')]);
}
const drow=(year,doy,month,day,rate)=>[
 String(year),String(doy),String(month),String(day),'0','0','0',rate,
 '1','1','1','1','22','0','0','0'];
const hrow=(day,hour,minute,doy,rate)=>[
 '2023','1',String(day),String(hour),String(minute),String(doy),
 ...Array.from({length:11},()=>'-9999'),rate
];
const dailyRows=[drow(2023,1,1,1,'0.012'),drow(2023,2,1,2,'-0.002'),drow(2023,4,1,4,'NA')];
const hourlyRows=[hrow(1,0,0,1,'10.0'),hrow(1,0,30,1,'-5.0'),hrow(1,2,0,1,'NaN')];
const dBytes=encoded(d.header,dailyRows),hBytes=encoded(h.header,hourlyRows);
const pre=(buf=dBytes,id=daily,cls='SYNTHETIC')=>preflightChinaNativeCsv(buf,{source_id:id,data_class:cls});
const out=pre();
eq(out.status,'SOURCE_SHAPE_ONLY_REPLAY_BLOCKED');
eq(out.rows_inspected,3);
eq(out.header_columns,16);
eq(out.raw_header_sha256,d.header_sha256);
eq(out.source_character_encoding_verified,false);
eq(out.non_utf8_header_preserved_as_bytes,true);
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
eq(pre(hBytes,hourly).header_columns,18);
eq(pre(hBytes,hourly).source_unit,'umol_CH4_m2_s');
eq(pre(hBytes,hourly).calendar_discontinuity_boundaries,1);
eq(pre(hBytes,hourly).unparsed_or_missing_rate_lexemes,1);
eq(pre().source_bytes_sha256,createHash('sha256').update(dBytes).digest('hex'));
eq(JSON.stringify(pre()),JSON.stringify(out));
bad(()=>pre(dBytes,daily,'PUBLISHER_ATTESTED'),'NATIVE_DATA_CLASS_UNSUPPORTED');
bad(()=>pre(dBytes,daily,'USER_SUPPLIED_UNVERIFIED'),'NATIVE_PINNED_SOURCE_DIGEST_MISMATCH');
bad(()=>pre(hBytes,hourly,'USER_SUPPLIED_UNVERIFIED'),'NATIVE_PINNED_SOURCE_DIGEST_MISMATCH');
bad(()=>pre(dBytes,'JP_HRT','SYNTHETIC'),'NATIVE_SOURCE_UNREGISTERED');
bad(()=>pre(Buffer.alloc(0)),'NATIVE_SOURCE_BYTES_SIZE_INVALID');
bad(()=>pre(encoded([...d.header.slice(0,-1),'CH4-gCH4/m2/day'],dailyRows)),'NATIVE_SOURCE_HEADER_MISMATCH');
bad(()=>pre(encoded([...d.header,'unexpected'],dailyRows)),'NATIVE_SOURCE_HEADER_MISMATCH');
bad(()=>pre(encoded(d.header,[dailyRows[0].slice(0,-1)])),'NATIVE_SOURCE_ROW_COLUMNS');
bad(()=>pre(encoded(d.header,[dailyRows[0],dailyRows[0]])),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>pre(encoded(d.header,[dailyRows[1],dailyRows[0]])),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>pre(encoded(d.header,[drow(2023,2,1,1,'0')])),'NATIVE_DOY_CALENDAR_MISMATCH');
bad(()=>pre(encoded(d.header,[drow(2023,60,2,29,'0')])),'NATIVE_INVALID_CALENDAR_DAY');
eq(pre(encoded(d.header,[drow(2024,60,2,29,'0'),drow(2024,61,3,1,'0')])).rows_inspected,2);
bad(()=>pre(encoded(d.header,[drow('2023','01',1,1,'0')])),'NATIVE_INVALID_CALENDAR_INTEGER');
bad(()=>pre(encoded(d.header,[drow(2023,1,1,1,'"1"')])),'NATIVE_ENCODING_OR_CSV_STRUCTURE');
bad(()=>pre(Buffer.from([0xff,0x0a])),'NATIVE_SOURCE_HEADER_MISMATCH');
bad(()=>pre(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),dBytes])),'NATIVE_ENCODING_OR_CSV_STRUCTURE');
bad(()=>pre(dBytes.subarray(0,dBytes.length-1)),'NATIVE_ENCODING_OR_CSV_STRUCTURE');
eq(pre(encoded(d.header,dailyRows,'\r\n')).rows_inspected,3);
bad(()=>pre(encoded(h.header,[hourlyRows[1],hourlyRows[0]]),hourly),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>pre(encoded(h.header,[hrow(1,24,0,1,'1')]),hourly),'NATIVE_INVALID_CALENDAR_INTEGER');
bad(()=>pre(encoded(h.header,[hrow(1,0,60,1,'1')]),hourly),'NATIVE_INVALID_CALENDAR_INTEGER');
bad(()=>pre(encoded(h.header,[hrow(1,0,0,2,'1')]),hourly),'NATIVE_DOY_CALENDAR_MISMATCH');
const report=JSON.parse(readFileSync('research/asia-source-dock-2026-10-19/verified-ephemeral-acquisition.json','utf8'));
const pinned=report.files.filter(x=>x.dataset_id==='CN_RICE_EDDY_EAST_2023');
eq(pinned.length,2);
for(const [id,contract] of Object.entries(nativeSourceContracts)){
 const row=pinned.find(x=>x.filename===contract.filename);
 assert.ok(row);n++;
 eq(row.published_md5,contract.publisher_md5);
 eq(row.downloaded_sha256,contract.ephemeral_sha256);
 eq(row.size_bytes,contract.expected_size);
 eq(row.structural_findings.header,contract.header.slice(0,id===daily?8:18).map(s=>
  s.startsWith('NON_ASCII_HEX:')?'Ta-<?>':s)); // original short report only pins prefix
 const exact=encoded(contract.header,[id===daily?dailyRows[0]:hourlyRows[0]]);
 const header=exact.subarray(0,exact.indexOf(10));
 eq(createHash('sha256').update(header).digest('hex'),contract.header_sha256);
}
const captured=JSON.parse(readFileSync('research/asia-source-dock-2026-10-19/native-byte-shape-2026-10-19.json','utf8'));
eq(captured.files.length,2);
eq(captured.original_file_bytes_committed,false);
eq(captured.license_reviewed,false);
eq(captured.actual_charset_independently_identified,false);
for(const item of captured.files){
 const contract=nativeSourceContracts[item.source_id];
 assert.ok(contract);n++;
 eq(item.publisher_md5,contract.publisher_md5);
 eq(item.actual_sha256,contract.ephemeral_sha256);
 eq(item.byte_size,contract.expected_size);
 eq(item.header_sha256,contract.header_sha256);
 eq(item.columns,contract.header.length);
 eq(item.utf8_header_decodable,false);
 eq(item.non_ascii_header_field_hex,'54612da1e6');
 eq(item.first_400_rows_column_count,item.columns);
}
const folder=mkdtempSync(join(tmpdir(),'naft-native-'));
try{
 const file=join(folder,'native.csv');writeFileSync(file,dBytes);
 const cmd=(args)=>spawnSync(process.execPath,['scripts/preflight-china-rice-native.mjs',...args],{encoding:'utf8',timeout:20000,maxBuffer:1048576});
 const args=['--csv',file,'--source',daily,'--data-class','SYNTHETIC'];
 const p=cmd(args);
 eq(p.status,0);eq(p.stderr,'');eq(JSON.parse(p.stdout),out);
 const reject=cmd(['--csv',file,'--source',daily,'--data-class','USER_SUPPLIED_UNVERIFIED']);
 assert.notEqual(reject.status,0);n++;assert.match(reject.stderr,/NATIVE_PINNED_SOURCE_DIGEST_MISMATCH/);n++;eq(reject.stdout,'');
 const dup=cmd(['--csv',file,'--source',daily,'--source',daily]);
 assert.notEqual(dup.status,0);n++;eq(dup.stdout,'');
 writeFileSync(file,Buffer.alloc(2000001,65));
 const oversize=cmd(args);
 assert.notEqual(oversize.status,0);n++;assert.match(oversize.stderr,/NATIVE_SOURCE_BYTES_SIZE_INVALID/);n++;
}finally{rmSync(folder,{recursive:true,force:true});}
console.log('CHINA_RICE_NATIVE_PREFLIGHT_PASS: '+n+' original-header/calendar/byte-preservation/CLI assertions');
