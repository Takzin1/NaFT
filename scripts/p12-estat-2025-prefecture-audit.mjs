#!/usr/bin/env node
/** P12: official user-uploaded e-Stat 2025 original XLS -> 47-pref immutable research register.
 * Binary is intentionally NOT redistributed. All rows transcribed from source bytes,
 * which can be replayed offline with scripts/p12-estat-2025-original-replay.py .
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {stableJson} from './lib/research-readiness-report.mjs';
const path=fileURLToPath(new URL('../research/p12-estat-2025-prefecture-original-xls-v1.json',import.meta.url));
const self=fileURLToPath(import.meta.url);
const fail=s=>{throw Error('NAFT_P12_ESTAT_BLOCKED:'+s)};
const check=(c,s)=>{if(!c)fail(s)};
const sha=obj=>createHash('sha256').update(stableJson(obj)).digest('hex');
const numericKeys=['area_all_including_green_ha','area_main_food_ha','producer_sieve_yield_kg_per_10a',
 'producer_sieve_main_food_harvest_t','producer_sieve_under_harvest_t','sieve_170_yield_kg_per_10a',
 'sieve_170_main_food_harvest_t','area_grain_use_ha','harvest_grain_use_t'];
const fullNames='北海道 青森 岩手 宮城 秋田 山形 福島 茨城 栃木 群馬 埼玉 千葉 東京 神奈川 新潟 富山 石川 福井 山梨 長野 岐阜 静岡 愛知 三重 滋賀 京都 大阪 兵庫 奈良 和歌山 鳥取 島根 岡山 広島 山口 徳島 香川 愛媛 高知 福岡 佐賀 長崎 熊本 大分 宮崎 鹿児島 沖縄'.split(' ');
const controlSums={area_all_including_green_ha:1520108,area_main_food_ha:1366919,
 producer_sieve_main_food_harvest_t:7181417,producer_sieve_under_harvest_t:286221,
 sieve_170_main_food_harvest_t:7467638,area_grain_use_ha:1424964,harvest_grain_use_t:7789848};
const sourceColumns={area_all_including_green_ha:'D',area_main_food_ha:'E',
 producer_sieve_yield_kg_per_10a:'F',producer_sieve_main_food_harvest_t:'G',
 producer_sieve_under_harvest_t:'N',sieve_170_yield_kg_per_10a:'Q',
 sieve_170_main_food_harvest_t:'R',area_grain_use_ha:'W',harvest_grain_use_t:'X'};
export function loadP12OriginalRegister(){return JSON.parse(readFileSync(path,'utf8'));}
export function validateP12OriginalRegister(g=loadP12OriginalRegister()){
 const s=g?.source;
 check(g?.schema==='naft-p12-estat-2025-prefecture-original-xls-v1'
  &&s?.file_sha256==='65892e3a1c095aad21f717ad4acc9787aad7d8d7e004b1c70f3284462ddca835'
  &&s.file_bytes===71680&&s.format==='BIFF8_OLE_CFB_XLS'
  &&s.sheet_name==='f002-07-001'&&s.year===2025
  &&s.source_classification==='2025_FINAL_STATISTICS'
  &&s.main_food_harvest_basis==='PRODUCER_SIEVE_ABOVE'
  &&s.secondary_harvest_basis==='1.70mm_SCREEN'
  &&s.copy_of_original_binary_in_repository===false
  &&s.country_total_excel_row===12,'RAW_SOURCE_SCOPE');
 check(stableJson(s.excel_columns)===stableJson(sourceColumns),'COLUMN_LINEAGE');
 check(g.country_totals?.area_main_food_ha===1367000
  &&g.country_totals?.producer_sieve_main_food_harvest_t===7181000
  &&g.country_totals?.area_all_including_green_ha===1520000
  &&g.country_totals?.sieve_170_main_food_harvest_t===7468000
  &&g.country_totals?.harvest_grain_use_t===7790000,'NATIONAL_OFFICIAL_ROW');
 check(Array.isArray(g.prefectures)&&g.prefectures.length===47
  &&new Set(g.prefectures.map(p=>p.jis_code)).size===47
  &&g.prefectures.every((p,i)=>p.name===fullNames[i]&&p.jis_code===String(i+1).padStart(2,'0')),'PREFECTURE_COVERAGE');
 for(const p of g.prefectures){
  check(Number.isInteger(p.source_excel_row)&&p.source_excel_row>=26
   &&p.source_excel_row<=80,'ORIGINAL_ROW_LINEAGE:'+p.jis_code);
  for(const field of numericKeys){
   check(typeof p[field]==='number'&&Number.isInteger(p[field])&&p[field]>0,'NON_INTEGER_OFFICIAL_DATA:'+p.jis_code+':'+field);
  }
  check(p.area_all_including_green_ha>=p.area_main_food_ha
   &&p.sieve_170_main_food_harvest_t>=p.producer_sieve_main_food_harvest_t
   &&p.producer_sieve_main_food_harvest_t+p.producer_sieve_under_harvest_t===
     p.sieve_170_main_food_harvest_t,
   'CONFLICTING_SIEVE_OR_CROP_BASIS:'+p.jis_code);
  const fromMultiplication=p.area_main_food_ha*p.producer_sieve_yield_kg_per_10a/100;
  check(Math.abs(fromMultiplication-p.producer_sieve_main_food_harvest_t)<=
    Math.max(100,0.008*p.producer_sieve_main_food_harvest_t),'AREA_YIELD_IDENTITY_REVIEW:'+p.jis_code);
 }
 for(const [field,total] of Object.entries(controlSums)){
  check(g.prefectures.reduce((s,p)=>s+p[field],0)===total,'PREFECTURE_TRANSCRIPTION_SUM:'+field);
  check(Math.abs(total-g.country_totals[field])<=Math.max(1000,g.country_totals[field]*0.005),
   'NATIONAL_ROUNDING_NOT_EXPLAINED:'+field);
 }
 check(g.model_guard?.statistical_rows_extracted_from_original_uploaded_file===true
  &&g.model_guard?.rice_methane_field_observations===0
  &&g.model_guard?.certified_tco2e===null
  &&g.model_guard?.approved_emission_factor===null
  &&g.model_guard?.allow_2024_p9_direct_comparison===false
  &&g.model_guard?.allow_certified_credit_calculation===false,'FALSE_MRV_CERTIFICATION');
 return true;
}
export function auditP12(g=loadP12OriginalRegister()){
 validateP12OriginalRegister(g);
 const summary=Object.fromEntries(Object.entries(controlSums).map(([key,v])=>[key,{
  prefecture_sum:v,official_country_value:g.country_totals[key],
  rounding_discrepancy:v-g.country_totals[key]}]));
 const unsigned={schema:'naft-p12-original-estat-2025-intake-qc-v1',
  source_original_sha256:g.source.file_sha256,
  row_count:47,metrics_per_prefecture:numericKeys.length,source_year:2025,
  source_scope:'MAIN_FOOD_PRODUCER_SIEVE_AND_SEPARATE_1_70_MM_AND_GRAIN',
  prefecture_sums_vs_official:summary,
  raw_original_stored_in_public_github:false,
  raw_original_replay_supported:'python3 scripts/p12-estat-2025-original-replay.py ORIGINAL.xls',
  p9_2024_same_scope_comparison_allowed:false,
  measured_methane_rows:0,official_certified_tco2e:null,
  source_register_sha256:sha(g)};
 return {...unsigned,receipt_sha256:sha(unsigned)};
}
export function getP12Prefecture(code,g=loadP12OriginalRegister()){
 validateP12OriginalRegister(g);
 check(typeof code==='string'&&/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(code),'PREFECTURE_CODE');
 return {source:g.source,region:g.prefectures.find(x=>x.jis_code===code),
  producer_sieve_main_food_area_is_not_all_paddy_area:true,official_certified_tco2e:null};
}
export function compareP12ToP9(g=loadP12OriginalRegister()){
 validateP12OriginalRegister(g);
 return {status:'COMPARISON_BLOCKED_DIFFERENT_2024_AND_2025_SCOPE',
  reason:'P9 2024 all-rice harvest cannot be directly compared with P12 2025 main-food producer-sieve harvest.',
  delta_t:null,official_certified_tco2e:null};
}
if(process.argv[1]&&resolve(process.argv[1])===self){
 try{
  const op=process.argv[2];
  if(op==='audit'&&process.argv.length===3)console.log(JSON.stringify(auditP12(),null,2));
  else if(op==='prefecture'&&process.argv.length===4)console.log(JSON.stringify(getP12Prefecture(process.argv[3]),null,2));
  else if(op==='compare-2024'&&process.argv.length===3)console.log(JSON.stringify(compareP12ToP9(),null,2));
  else fail('USAGE');
 }catch(e){console.error(e.message);process.exitCode=1}
}
