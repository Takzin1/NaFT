#!/usr/bin/env node
/**
 * P7: honest offline CH4 daily-flux intermediate CSV QC, no fetch/auto approval.
 * External Zenodo, NASA, satellite and FAOSTAT metadata never becomes an
 * observation by appearing in a catalog. No emissions certification.
 */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stableJson} from './lib/research-readiness-report.mjs';

const ME=fileURLToPath(import.meta.url);
const SOURCE=fileURLToPath(new URL('../research/p7-rice-observation-source-intake-2026-11-02.json',import.meta.url));
const PREVIOUS=fileURLToPath(new URL('../research/asia-source-dock-2026-10-19/source-index.json',import.meta.url));
const HEADER=['source_record_id','field_id','observation_date','flux_value','flux_unit','water_management','measurement_method','qc_flag'];
const APPROVED_FLUX_SOURCES=['KR_GIMJE_DAILY_2022_2024','CN_WUHAN_AWD_GHG_2024'];
const SOURCE_IDS=['CN_WUHAN_AWD_GHG_2024','ES_EBULLITION_ML_2026','FAO_QCL_RICE_STATS','NASA_POWER_AG_DAILY','COPERNICUS_SENTINEL1_GRD','IPCC_2019_RF_VOL4_CH5','KR_GIMJE_DAILY_2022_2024'];
const FAIL='NAFT_P7_DATA_QC_BLOCKED:';
const guard=(ok,reason)=>{if(!ok)throw Error(FAIL+reason)};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const sha=x=>createHash('sha256').update(x).digest('hex');
const normalizedHash=x=>sha(stableJson(x));
const dedupe=x=>new Set(x).size===x.length;
const isDate=s=>{
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const [y,m,d]=s.split('-').map(Number);
 const x=new Date(Date.UTC(y,m-1,d));
 return x.getUTCFullYear()===y&&x.getUTCMonth()+1===m&&x.getUTCDate()===d;
};
export const CANONICAL_HEADER=Object.freeze([...HEADER]);
export function loadP7Sources(){return JSON.parse(readFileSync(SOURCE,'utf8'));}
export function validateP7Sources(g=loadP7Sources()){
 guard(g?.schema==='naft-p7-multi-source-observation-discovery-v1'
   &&g.snapshot_date==='2026-11-02'&&g.policy==='DISCOVERY_AND_OFFLINE_QC_ONLY'
   &&g.source_count===7&&g.unique_new_source_ids===6
   &&g.external_files_downloaded_this_change===0
   &&g.external_observation_rows_loaded_this_change===0
   &&g.raw_data_redistributed===false
   &&g.independent_publisher_authentication===false
   &&g.source_data_ready_for_institutional_mrv===false
   &&g.live_weather_or_satellite_fetch_performed===false
   &&g.scientifically_verified_flows===0
   &&g.officially_certified_tco2e===null
   &&g.permitted_upload_mode==='USER_SUPPLIED_CANONICAL_CSV_WITH_EXPLICIT_ORIGINAL_HASH_AND_QC',
   'SOURCE_DISCOVERY_SCOPE');
 guard(Array.isArray(g.sources)&&g.sources.length===7
   &&dedupe(g.sources.map(s=>s.id))
   &&g.sources.map(s=>s.id).sort().join('|')===SOURCE_IDS.slice().sort().join('|'),
   'SOURCE_IDS');
 guard(Array.isArray(g.prior_indexed_source_ids)
   &&g.prior_indexed_source_ids.join('|')==='KR_GIMJE_DAILY_2022_2024',
   'GIMJE_EXISTING_SOURCE_IS_NOT_NEW');
 for(const s of g.sources){
  guard(typeof s.locator==='string'&&s.locator.startsWith('https://')
    &&typeof s.title==='string'&&s.title.length>12
    &&typeof s.kind==='string'&&s.kind.length>8
    &&typeof s.unit_semantics==='string'
    &&s.artifact?.independent_sha256===null
    &&Array.isArray(s.purpose)&&s.purpose.length>0
    &&Array.isArray(s.not_allowed)
    &&s.not_allowed.includes('DIRECT_CANONICAL_CSV_IMPORT')
    &&typeof s.license==='string'&&typeof s.availability==='string',
    'UNTRUSTWORTHY_SOURCE_OR_INVALID_AUTO_INGEST:'+s.id);
 }
 const previous=JSON.parse(readFileSync(PREVIOUS,'utf8'));
 const old=previous.sources.find(x=>x.id==='KR_GIMJE_DAILY_2022_2024');
 const known=g.sources.find(x=>x.id===old?.id);
 guard(!!old&&known?.doi===old.doi&&known.artifact?.published_md5===old.files[0].md5_published
  &&known.artifact.github_public_blob_sha1==='55a376b6ce071a22f7676e15d5a88b5fd6c1babe'
  &&known.artifact.github_ref===old.reference_software.commit_sha
  &&known.availability==='PREVIOUSLY_INDEXED_GITHUB_BLOB_ID_ADDED_NO_RAW_REPLAY',
  'GIMJE_CROSS_REGISTER_CONFLICT');
 const cn=g.sources.find(s=>s.id==='CN_WUHAN_AWD_GHG_2024');
 guard(cn.doi==='10.5281/zenodo.14010496'
  &&cn.artifact?.published_md5==='8d954606493316fa897d48b8f05f57d4'
  &&cn.availability==='DISCOVERED_NO_RAW_BYTES','WUHAN_NO_RAW_VERIFICATION');
 const es=g.sources.find(s=>s.id==='ES_EBULLITION_ML_2026');
 guard(es.doi==='10.5281/zenodo.21259926'
  &&es.license==='CC_BY_4_0_REPORTED_BY_UNIVERSITY_CATALOG_NOT_RAW_RECHECKED','EBULLITION_LICENSE_BOUNDARY');
 const nasa=g.sources.find(s=>s.id==='NASA_POWER_AG_DAILY');
 guard(nasa.kind==='GRIDDED_WEATHER_DAILY_API'
  &&nasa.availability==='API_DOCUMENTATION_VERIFIED_NO_VALUE_FETCH'
  &&nasa.not_allowed.includes('CH4_FLUX_GROUND_TRUTH'),'NASA_WEATHER_NOT_GAS_FLUX');
 const fao=g.sources.find(s=>s.id==='FAO_QCL_RICE_STATS');
 guard(fao.kind==='NATIONAL_ANNUAL_AGRICULTURE_STATISTICS'
  &&fao.license==='CC_BY_4_0_OFFICIAL_CATALOG'
  &&fao.not_allowed.includes('FIELD_LEVEL_AREA_INFERENCE'),'FAOSTAT_NOT_FIELD');
 const sar=g.sources.find(s=>s.id==='COPERNICUS_SENTINEL1_GRD');
 guard(sar.kind==='SATELLITE_SAR_SCENE_CATALOG'
  &&sar.not_allowed.includes('AWD_STATUS_AUTOMATIC_PROOF'),'SENTINEL_NOT_AWD_PROOF');
 return true;
}
function parseCSV(b){
 guard(Buffer.isBuffer(b)&&b.length>0&&b.length<=8*1024*1024,'CSV_BYTES');
 let str;
 try{str=new TextDecoder('utf-8',{fatal:true}).decode(b);}
 catch{throw Error(FAIL+'CSV_UTF8');}
 guard(!str.startsWith('\ufeff')||str.length>1,'CSV_BOM_EMPTY');
 str=str.replace(/^\ufeff/,'');
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<str.length;i++){
  const c=str[i];
  if(quoted){
   if(c==='"'&&str[i+1]==='"'){cell+='"';i++;}
   else if(c==='"'){quoted=false;closed=true;}
   else cell+=c;
  }else if(c==='"'&&cell.length===0&&!closed){quoted=true;}
  else if(c===','||c==='\n'||c==='\r'){
   row.push(cell);cell='';closed=false;
   if(c!==','){
    if(c==='\r'&&str[i+1]==='\n')i++;
    rows.push(row);row=[];
   }
  }else{
   guard(!closed,'CSV_BAD_QUOTES');
   guard(c!=='"','CSV_BAD_QUOTES');
   cell+=c;
  }
  guard(rows.length<=50001&&cell.length<=2048,'CSV_LIMIT');
 }
 guard(!quoted,'CSV_UNCLOSED_QUOTES');
 if(row.length||cell.length){row.push(cell);rows.push(row);}
 while(rows.length&&rows.at(-1).every(x=>x===''))rows.pop();
 guard(rows.length>=2&&rows.length<=50001,'CSV_ROW_COUNT');
 guard(rows[0].length===HEADER.length&&rows[0].every((x,i)=>x===HEADER[i]),'CSV_CANONICAL_HEADER_REQUIRED');
 guard(rows.slice(1).every(x=>x.length===HEADER.length),'CSV_COLUMN_MISMATCH');
 return rows.slice(1).map((values,index)=>Object.fromEntries(values.map((v,i)=>[HEADER[i],v])));
}
export function evaluateP7ObservationCSV(sourceId,bytes,g=loadP7Sources()){
 validateP7Sources(g);
 guard(APPROVED_FLUX_SOURCES.includes(sourceId),'SOURCE_NOT_DAILY_CH4_FLUX_STUDY');
 const source=g.sources.find(s=>s.id===sourceId);
 guard(source?.artifact?.independent_sha256===null,'SOURCE_RAW_COPY_ALREADY_ATTESTED_CONFLICT');
 const rows=parseCSV(bytes);
 let missing=0,invalid=0,observed=0,duplicateIds=0,duplicateDay=0,flagged=0;
 let high=0,negative=0,ambiguous=0;
 const ids=new Set(),days=new Set(),unitCounts={},methods={},statuses={},waterStates={};
 const issues=[];
 const tally=(map,key)=>{map[key]=(map[key]||0)+1;};
 const flag=(code,index)=>{issues.push({source_row:index+2,code});};
 for(let i=0;i<rows.length;i++){
  const r=rows[i],row=i+2;
  guard(r.source_record_id.length>0&&r.source_record_id.length<=96
   &&r.field_id.length>0&&r.field_id.length<=96
   &&!/[\x00-\x1f]/.test(r.source_record_id+r.field_id),'INVALID_RECORD_ID:'+row);
  if(ids.has(r.source_record_id)){duplicateIds++;flag('DUPLICATE_RECORD_ID',i);}
  ids.add(r.source_record_id);
  if(!isDate(r.observation_date)){invalid++;flag('DATE_INVALID',i);}
  else{
   const day=r.field_id+'|'+r.observation_date;
   if(days.has(day)){duplicateDay++;flag('MULTIPLE_RECORDS_FIELD_DATE_REPLICATES_OR_DUPLICATES_REVIEW',i);}
   days.add(day);
  }
  guard(['g_CH4_m2_day','mg_CH4_m2_day'].includes(r.flux_unit),'CH4_UNIT_UNSUPPORTED:'+row);
  tally(unitCounts,r.flux_unit);
  guard(['STATIC_CHAMBER','EDDY_COVARIANCE','UNKNOWN'].includes(r.measurement_method),'METHOD_UNSUPPORTED:'+row);
  tally(methods,r.measurement_method);
  guard(['REPORTED_PASS','FLAGGED','UNKNOWN'].includes(r.qc_flag),'QC_FLAG_UNSUPPORTED:'+row);
  tally(statuses,r.qc_flag);
  guard(['AWD','CONTINUOUS_FLOOD','SINGLE_DRAINAGE','UNKNOWN'].includes(r.water_management),
   'WATER_STATE_UNSUPPORTED:'+row);
  tally(waterStates,r.water_management);
  if(r.flux_value.trim()===''||r.flux_value==='NA'||r.flux_value==='-9999'){
   missing++;flag('MISSING_FLUX_NEVER_IMPUTED',i);
  }else if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(r.flux_value)
    ||!Number.isFinite(Number(r.flux_value))){
   invalid++;flag('INVALID_NUMERIC_FLUX',i);
  }else{
   observed++;
   const mg=Number(r.flux_value)*(r.flux_unit==='g_CH4_m2_day'?1000:1);
   if(mg<0){negative++;flag('NEGATIVE_FLUX_SCIENTIFIC_REVIEW',i);}
   if(Math.abs(mg)>100000){high++;flag('HIGH_MAGNITUDE_REVIEW_NO_AUTOMATIC_CENSOR',i);}
  }
  if(r.qc_flag!=='REPORTED_PASS')flag('SOURCE_QC_NOT_REPORTED_PASS',i);
  if(r.qc_flag==='FLAGGED')flagged++;
  if(r.measurement_method==='UNKNOWN'||r.water_management==='UNKNOWN')ambiguous++;
  guard(issues.length<=200000,'ISSUES_LIMIT');
 }
 const unsigned={schema:'naft-p7-candidate-observation-qc-v1',
  review_status:'RESEARCH_QC_CANDIDATES_NOT_SCIENTIFICALLY_VERIFIED',
  source_id:sourceId,
  source_original_document_sha256:null,
  source_raw_original_bytes_verified:false,
  input_is_user_supplied_canonical_intermediate:true,
  input_is_official_native_export_verified:false,
  source_url:source.locator,
  uploaded_csv_sha256:sha(bytes),
  source_registry_sha256:normalizedHash(g),
  required_columns:HEADER,
  row_count:rows.length,valid_numeric_candidate_count:observed,
  missing_flux_count:missing,invalid_flux_count:invalid,
  duplicate_record_id_count:duplicateIds,multiple_records_same_field_day:duplicateDay,
  flagged_by_source_count:flagged,negative_flux_count:negative,
  high_magnitude_review_count:high,unknown_measurement_or_water_state_count:ambiguous,
  units_observed:unitCounts,methods_reported:methods,source_qc_reported:statuses,
  water_management_reported:waterStates,
  row_issues:issues,
  field_timeseries_integrated:false,imputed_missing_readings:0,
  atmospheric_conditions_independently_checked:false,
  independent_chamber_calibration_review:false,
  measurement_qc_independently_verified:false,
  methodology_eligibility_verified:false,
  model_calibration_accepted:false,
  validated_co2e_result:null,credit_issuance:null,
  no_data_is_auto_promoted_into_official_rulepacks:true
 };
 return {...unsigned,report_sha256:normalizedHash(unsigned)};
}
export function verifyP7ObservationCSV(sourceId,bytes,report,g=loadP7Sources()){
 guard(object(report),'REPORT_OBJECT');
 const recalc=evaluateP7ObservationCSV(sourceId,bytes,g);
 guard(stableJson(recalc)===stableJson(report),'REPLAY_MISMATCH');
 return {status:'INPUT_BYTES_AND_QC_CANDIDATES_REPRODUCED',
  sha256:recalc.report_sha256,validated_co2e_result:null};
}
function bytesFile(path){
 guard(typeof path==='string'&&path.length>0,'INPUT_PATH');
 const f=resolve(path),s=lstatSync(f);
 guard(s.isFile()&&!s.isSymbolicLink()&&s.size>0&&s.size<=8*1024*1024,'INPUT_FILE_UNSAFE');
 const b=readFileSync(f);
 guard(b.length===s.size,'FILE_CHANGED_DURING_READ');
 return b;
}
function jsonFile(path){try{return JSON.parse(bytesFile(path).toString('utf8'));}
 catch{throw Error(FAIL+'INVALID_JSON_REPORT');}}
function main(args){
 if(args[0]==='analyze'&&args.length===3){
  console.log(JSON.stringify(evaluateP7ObservationCSV(args[1],bytesFile(args[2])),null,2));return;
 }
 if(args[0]==='verify'&&args.length===4){
  console.log(JSON.stringify(verifyP7ObservationCSV(args[1],bytesFile(args[2]),jsonFile(args[3])),null,2));return;
 }
 if(args[0]==='sources'&&args.length===1){
  console.log(JSON.stringify(loadP7Sources(),null,2));return;
 }
 throw Error(FAIL+'USAGE_sources_OR_analyze_SOURCE_ID_CSV_OR_verify_SOURCE_ID_CSV_REPORT');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
