#!/usr/bin/env node
/**
 * NaFT P9: 47-prefecture rice STATISTICS research & historical AG-005 formula
 * preview. No official factor release, field calculation or J-Credit certificate.
 * One 2024 47-prefecture table was republished by Hokkaido from MAFF statistics.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stableJson} from './lib/research-readiness-report.mjs';
const GRAPH=fileURLToPath(new URL('../research/p9-japan-47-prefecture-paddy-pdf-source-register-2026-11-03.json',import.meta.url));
const ME=fileURLToPath(import.meta.url);
const fail=x=>{throw Error('NAFT_P9_PREFECTURE_BLOCKED:'+x)};
const assert=(test,code)=>{if(!test)fail(code)};
const shape=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const digest=o=>createHash('sha256').update(stableJson(o)).digest('hex');
const codeValid=s=>typeof s==='string'&&/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(s);
const unique=x=>new Set(x).size===x.length;
const keys=(o,k)=>shape(o)&&Object.keys(o).sort().join('|')===k.slice().sort().join('|');
export function loadP9PrefectureRegister(){return JSON.parse(readFileSync(GRAPH,'utf8'));}
export function validateP9PrefectureRegister(g=loadP9PrefectureRegister()){
 assert(g?.schema==='naft-p9-prefecture-paddy-pdf-statistics-v1'
  &&g.snapshot_date==='2026-11-03'
  &&g.coverage_policy==='ONE_NATIONAL_47_PREFECTURE_PDF_TABLE_PLUS_SEPARATE_REGIONAL_PDF_DISCOVERY'
  &&g.publisher_authenticated_raw_files===0&&g.verified_ch4_flux_rows_added===0
  &&g.certified_ag005_emission_factors===0&&g.officially_certified_tco2e===null
  &&g.prefecture_specific_pdf_coverage_incomplete===true,'RESEARCH_SCOPE');
 const s=g.national_source;
 assert(s?.source_pdf_url?.startsWith('https://www.pref.hokkaido.lg.jp/')
  &&s?.source_landing_url==='https://www.pref.hokkaido.lg.jp/ns/nsk/kome/index3.html'
  &&s.table_column_year==='令和6年=2024'&&s.pdf_page_1_based===3
  &&s.national_area_ha===1359000&&s.national_yield_kg_per_10a===540
  &&s.national_harvest_brown_rice_t===7345000
  &&s.raw_pdf_sha256===null&&s.official_pdf_bytes_local_verified===false
  &&s.source_is_field_level_ch4===false,'NATIONAL_SOURCE_SCOPE_OR_VINTAGE');
 assert(Array.isArray(g.prefectures)&&g.prefectures.length===47
  &&unique(g.prefectures.map(p=>p.jis_code))
  &&unique(g.prefectures.map(p=>p.name)),'PREFECTURE_COVERAGE');
 for(let i=0;i<47;i++){
  const p=g.prefectures[i];
  assert(p.jis_code===String(i+1).padStart(2,'0')
   &&typeof p.name==='string'&&p.name.length>=3&&p.year===2024
   &&Number.isInteger(p.rice_area_ha)&&p.rice_area_ha>0
   &&Number.isInteger(p.reported_yield_kg_per_10a)&&p.reported_yield_kg_per_10a>0
   &&Number.isInteger(p.reported_harvest_brown_rice_t)&&p.reported_harvest_brown_rice_t>0
   &&p.source_id==='HOKKAIDO_MAFF_2024_P3'&&p.field_methane_measured===false
   &&p.certified_credits_tco2e===null,'MIXED_YEAR_OR_FAKE_FIELD_DATA:'+i);
 }
 assert(g.prefectures.reduce((a,p)=>a+p.rice_area_ha,0)===1359126
  &&g.prefectures.reduce((a,p)=>a+p.reported_harvest_brown_rice_t,0)===7344993,
  'NATIONAL_TRANSCRIPTION_CHECKSUM');
 assert(Array.isArray(g.regional_pdf_sources)&&g.regional_pdf_sources.length===15
  &&g.regional_sources_reviewed===15
  &&unique(g.regional_pdf_sources.map(x=>x.prefecture_code)),'REGIONAL_INDEX');
 const names=new Set(g.prefectures.map(p=>p.jis_code));
 for(const r of g.regional_pdf_sources){
  assert(names.has(r.prefecture_code)&&r.url.startsWith('https://')
   &&r.raw_pdf_sha256===null&&r.raw_pdf_downloaded_for_repository===false
   &&r.auto_promote_to_emission_factor===false
   &&r.auto_replace_2024_national_stats===false
   &&r.original_formula_verified===false
   &&['PDF_TEXT_SCREENSHOT_REVIEWED','PDF_TEXT_REVIEWED_SCREENSHOT_FAILED',
      'PDF_TEXT_REVIEWED_SCREENSHOT_NOT_DONE','OFFICIAL_PDF_LINK_ON_PREFECTURE_PAGE']
      .includes(r.verification_level),'REGIONAL_PDF_PROMOTED_TO_CERTIFIED');
 }
 assert(Array.isArray(g.formula_registry)&&g.formula_registry.length===4
  &&unique(g.formula_registry.map(x=>x.id))
  &&g.formula_registry.every(x=>x.official_credit_calculation===false),
  'UNSUPPORTED_FORMULA_POLICY');
 assert(g.historical_method_source?.version==='AG-005 v1.0'
  &&g.historical_method_source.current_adopted_version_verified===false
  &&g.historical_method_source.source_pdf_sha256===null
  &&g.historical_method_source.raw_bytes_checked===false,
  'HISTORICAL_METHOD_TO_CURRENT_PROMOTION');
 return true;
}
export function researchP9PrefectureAudit(g=loadP9PrefectureRegister()){
 validateP9PrefectureRegister(g);
 const alerts=g.prefectures.map(p=>{
  const predicted=p.rice_area_ha*p.reported_yield_kg_per_10a/100;
  const difference=predicted-p.reported_harvest_brown_rice_t;
  const tolerance=Math.max(500,p.reported_harvest_brown_rice_t*0.02);
  return {code:p.jis_code,name:p.name,reported_harvest_t:p.reported_harvest_brown_rice_t,
   identity_estimate_t:Math.round(predicted*100)/100,
   difference_t:Math.round(difference*100)/100,
   absolute_discrepancy_share:Math.abs(difference)/p.reported_harvest_brown_rice_t,
   status:Math.abs(difference)>tolerance?'REVIEW_SOURCE_TABLE_OR_MULTI_CROP_AND_ROUNDING':
    'ROUNDED_PUBLISHED_STATISTICS_NOT_FIELD_QC',
   source_page:3,source_year:2024};
 });
 const exceptions=alerts.filter(a=>a.status.startsWith('REVIEW_'));
 const unsigned={schema:'naft-p9-prefecture-statistical-sanity-audit-v1',
  status:'RESEARCH_ONLY_STATISTICAL_RECONCILIATION',
  national_pdf_record_hash_sha256:digest(g),
  reference_crop_year:2024,
  national_pdf_claimed_prefecture_count:47,
  regional_individual_pdf_indexed_count:g.regional_pdf_sources.length,
  remaining_prefectures_without_prefecture_specific_pdf_index:47-g.regional_pdf_sources.length,
  reported_prefecture_area_sum_ha:g.prefectures.reduce((a,p)=>a+p.rice_area_ha,0),
  national_pdf_area_ha:g.national_source.national_area_ha,
  reported_prefecture_harvest_sum_t:g.prefectures.reduce((a,p)=>a+p.reported_harvest_brown_rice_t,0),
  national_pdf_harvest_t:g.national_source.national_harvest_brown_rice_t,
  discrepancy_rule:'abs(ha*kg_10a/100 - official_t) > max(500 t, 2% of official_t); manual review only',
  flagged_table_rows:exceptions,
  prefecture_checks:alerts,
  all_prefectures_individually_pdf_reviewed:false,
  aggregate_paddy_harvest_not_methane_credit:true,
  official_factors_loaded:0,approved_methodology:false,
  field_emissions_tco2e:null,verified_credits_tco2e:null};
 return {...unsigned,report_sha256:digest(unsigned)};
}
function finite(v,max,allowZero=false){
 assert(typeof v==='number'&&Number.isFinite(v)
  &&v>=(allowZero?0:Number.EPSILON)&&v<=max,'NUMBER_NOT_FINITE_OR_OUT_OF_RANGE');
 return v;
}
export function historicalAg005Preview(input,g=loadP9PrefectureRegister()){
 validateP9PrefectureRegister(g);
 assert(keys(input,['schema','method_version','prefecture_code','baseline_years',
  'project_midseason_drain_days','strata','gwp_ch4','gwp_year_source',
  'factor_source_and_version']),'PREVIEW_KEYS');
 assert(input.schema==='naft-p9-ag005-v1-historical-preview-v1'
  &&input.method_version==='AG005_V1_0_HISTORICAL_REFERENCE_ONLY','METHOD_NOT_CURRENT_OR_UNKNOWN');
 const p=g.prefectures.find(x=>x.jis_code===input.prefecture_code);
 assert(!!p,'PREFECTURE_NOT_FOUND');
 assert(Array.isArray(input.baseline_years)&&input.baseline_years.length>=2
  &&input.baseline_years.length<=10&&unique(input.baseline_years.map(x=>x.year))
  &&input.baseline_years.every(x=>keys(x,['year','crop_drain_days'])
   &&Number.isInteger(x.year)&&x.year>=2000&&x.year<=2026
   &&Array.isArray(x.crop_drain_days)&&x.crop_drain_days.length>=1
   &&x.crop_drain_days.length<=3
   &&x.crop_drain_days.every(d=>Number.isInteger(d)&&d>=0&&d<=120)),
  'REQUIRED_PRIOR_TWO_YEARS_DOCUMENTATION');
 const baseline=input.baseline_years.flatMap(x=>x.crop_drain_days);
 const baselineMean=baseline.reduce((a,b)=>a+b,0)/baseline.length;
 const project=finite(input.project_midseason_drain_days,120,true);
 const gap=project-baselineMean;
 finite(input.gwp_ch4,200);
 assert(typeof input.gwp_year_source==='string'&&input.gwp_year_source.length>=15
  &&typeof input.factor_source_and_version==='string'&&input.factor_source_and_version.length>=15,
  'FACTOR_OR_GWP_PROVENANCE_REQUIRED');
 assert(Array.isArray(input.strata)&&input.strata.length>=1&&input.strata.length<=100
  &&unique(input.strata.map(x=>x.stratum_id)),'STRATA_REQUIRED');
 let baselineEm=0,projectEm=0,area=0;
 const perStratum=[];
 for(const s of input.strata){
  assert(keys(s,['stratum_id','area_ha','baseline_ef_kg_ch4_c_ha_year',
   'project_ef_kg_ch4_c_ha_year'])&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(s.stratum_id),
   'STRATUM_STRUCTURE');
  const a=finite(s.area_ha,1e7);
  const ef0=finite(s.baseline_ef_kg_ch4_c_ha_year,1e6,true);
  const ef1=finite(s.project_ef_kg_ch4_c_ha_year,1e6,true);
  const eb=a*ef0*(16/12)*input.gwp_ch4/1000;
  const ep=a*ef1*(16/12)*input.gwp_ch4/1000;
  baselineEm+=eb;projectEm+=ep;area+=a;
  perStratum.push({stratum_id:s.stratum_id,area_ha:a,
   baseline_preview_tco2e:Math.round(eb*1e6)/1e6,
   project_preview_tco2e:Math.round(ep*1e6)/1e6});
 }
 assert(area<=p.rice_area_ha,'AREA_EXCEEDS_2024_PREFECTURE_AGGREGATE');
 const unsigned={schema:'naft-p9-ag005-v1-historical-math-preview-v1',
  status:'ILLUSTRATIVE_LEGACY_FORMULA_NOT_CERTIFIABLE',
  prefecture_code:p.jis_code,prefecture:p.name,
  national_year:2024,method_version:'AG-005 v1.0',
  baseline_rice_years:input.baseline_years.length,baseline_crop_count:baseline.length,
  baseline_mean_drain_days:Math.round(baselineMean*1e6)/1e6,
  project_drain_days:project,increment_days:Math.round(gap*1e6)/1e6,
  drainage_duration_7day_precheck:gap>=7?'CANDIDATE_ONLY_REQUIRE_RECORD_REVIEW':'FAIL_PRECHECK',
  display_preview_baseline_tco2e:Math.round(baselineEm*1e6)/1e6,
  display_preview_project_tco2e:Math.round(projectEm*1e6)/1e6,
  display_preview_difference_tco2e:Math.round((baselineEm-projectEm)*1e6)/1e6,
  user_provided_factor_source:input.factor_source_and_version,
  user_provided_gwp_source:input.gwp_year_source,
  user_supplied_ef_validated_from_official_inventory:false,
  current_method_applicability_verified:false,
  physical_field_area_verified:false,
  independent_measurement_qc_verified:false,
  formal_approval_or_vvb_attestation:false,
  issuance_performed:false,
  official_credits_tco2e:null,
  stratum_preview:perStratum,
  input_sha256:digest(input),register_sha256:digest(g)};
 return {...unsigned,receipt_sha256:digest(unsigned)};
}
export function verifyP9Preview(input,receipt,g=loadP9PrefectureRegister()){
 assert(shape(receipt)&&stableJson(receipt)===stableJson(historicalAg005Preview(input,g)),'RECEIPT_REPLAY_MISMATCH');
 return {status:'RESEARCH_ONLY_INPUT_AND_FORMULA_REPLAY_MATCH',certified_tco2e:null,
  receipt_sha256:receipt.receipt_sha256};
}
function readJson(path){
 assert(typeof path==='string'&&path.length>0,'PATH');
 const s=lstatSync(resolve(path));
 assert(s.isFile()&&!s.isSymbolicLink()&&s.size>0&&s.size<120000,'UNSAFE_FILE');
 return JSON.parse(readFileSync(resolve(path),'utf8'));
}
function main(args){
 if(args.length===1&&args[0]==='audit'){console.log(JSON.stringify(researchP9PrefectureAudit(),null,2));return;}
 if(args.length===2&&args[0]==='prefecture'){
  assert(codeValid(args[1]),'PREFECTURE_CODE');
  const g=loadP9PrefectureRegister();validateP9PrefectureRegister(g);
  const r=g.prefectures.find(p=>p.jis_code===args[1]);
  const sources=g.regional_pdf_sources.filter(p=>p.prefecture_code===args[1]);
  console.log(JSON.stringify({statistics:r,national_pdf:g.national_source,
   prefecture_local_pdf_sources:sources,formula_registry:g.formula_registry},null,2));return;
 }
 if(args.length===2&&args[0]==='preview'){
  console.log(JSON.stringify(historicalAg005Preview(readJson(args[1])),null,2));return;
 }
 if(args.length===3&&args[0]==='verify'){
  console.log(JSON.stringify(verifyP9Preview(readJson(args[1]),readJson(args[2])),null,2));return;
 }
 fail('USAGE_audit_OR_prefecture_CODE_OR_preview_INPUT_OR_verify_INPUT_RECEIPT');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
