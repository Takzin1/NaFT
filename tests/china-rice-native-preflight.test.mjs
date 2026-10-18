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
bad(()=>doPre(Buffer.from(''),'NATIVE_SOURCE_BYTES_SIZE_INVALID');
bad(()=>doPre(encoded([...d.header.slice(0,-1),'CH4-gCH4/m2/day'],dailyRows)),'NATIVE_SOURCE_HEADER_MISMATCH');
bad(()=>doPre(encoded([...d.header,d.header[0]],dailyRows.map(r=>[...r,'X']))),'NATIVE_SOURCE_HEADER_MISMATCH');
bad(()=>doPre(encoded(d.header,[dailyRows[0].slice(0,-1)])),'NATIVE_SOURCE_ROW_COLUMNS');
bad(()=>doPre(encoded(d.header,[dailyRows[0],dailyRows[0]])),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>doPre(encoded(d.header,[dailyRows[1],dailyRows[0]])),'NATIVE_CHRONOLOGY_DUPLICATE');
bad(()=>doPre(encoded(d.header,[[...dailyRows[0].slice(0,1),'2',...dailyRows[0].slice(2)]])),'NATIVE_DOY_CALENDAR_MISMATCH');
bad(()=>doPre(encoded(d.header,[['2023','60','2','29','0','0','0','1']])),'NATIVE_INVALID_CALENDAR_DAY');
