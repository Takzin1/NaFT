#!/usr/bin/env node
/**
 * P11: auditable, byte-pinned non-paddy chamber CH4 concentration records.
 * The source is a public MIT-repository example dataset; measurement origin,
 * site, gas flux, carbon credit and a rice-field attribution are NOT verified.
 */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {stableJson} from './lib/research-readiness-report.mjs';
const FILE=fileURLToPath(new URL('../research/p11-upstream-chamber-raw/sample_data_CH4.csv',import.meta.url));
const META=fileURLToPath(new URL('../research/p11-real-file-source-register-2026-11-03.json',import.meta.url));
const ME=fileURLToPath(import.meta.url);
const HDR=['id','time','concentration','volume','area','temperature_celsius','air_pressure','gas_pressure','gas_temp','ph','orp','wt'];
const EXPECTED_BLOB='891ab51885c79cccbbe5d3d4625854ba4eab5923';
const BAD='NAFT_P11_CHAMBER_BLOCKED:';
const guard=(ok,msg)=>{if(!ok)throw Error(BAD+msg);};
const sha256=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const dict=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function loadP11Registry(){return JSON.parse(readFileSync(META,'utf8'));}
export function inspectP11Original(bytes=readFileSync(FILE),m=loadP11Registry()){
 guard(Buffer.isBuffer(bytes)&&bytes.length>200000&&bytes.length<600000,'ORIGINAL_RAW_FILE_SIZE');
 guard(blob(bytes)===EXPECTED_BLOB,'ORIGINAL_GIT_BLOB_HASH');
 guard(m.schema==='naft-p11-physical-file-ingestion-v1'
  &&m.ingest.upstream_blob_sha1===EXPECTED_BLOB
  &&m.ingest.upstream_commit==='9977f63563acebaa4e021801beadfebb06d0ed48'
  &&m.ingest.raw_copy_repository_path==='research/p11-upstream-chamber-raw/sample_data_CH4.csv'
  &&m.ingest.source_license.startsWith('MIT')
  &&m.ingest.original_source_verified_at_github_git_blob===true
  &&m.ingest.independent_field_sampling_verified===false
  &&m.ingest.file_type==='RAW_CHAMBER_CONCENTRATION_TIMESERIES_NOT_DAILY_CH4_FLUX'
  &&m.ingest.concentration_is_direct_fluxtype===false
  &&m.ingest.rice_field_context_licensed_or_verified===false
  &&m.ingest.j_credit_eligible===false&&m.ingest.officially_verified_tco2e===null
  &&m.raw_chamber_records_added===3005&&m.raw_rice_daily_flux_records_added===0
  &&m.certified_emissions_tco2e===null
  &&m.unvalidated_sources_not_automatically_merged===true,'SOURCE_CLAIM_CONFLICT');
 guard(Array.isArray(m.other_files)&&m.other_files.length===4
  &&m.other_files.every(x=>x.native_data_downloaded_here===false
   &&x.independent_original_checksum_sha256===null),'UNDOWNLOADED_SOURCE_PRETENDS_VERIFIED');
 let input;
 try{input=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
 catch{throw Error(BAD+'ORIGINAL_UTF8');}
 guard(!input.includes('\r')&&!input.includes('"')&&input.endsWith('\n'),'ORIGINAL_CSV_FORMAT');
 const lines=input.trimEnd().split('\n'),head=lines.shift().split(',');
 guard(head.length===12&&head.every((x,i)=>x===HDR[i]),'ORIGINAL_CSV_SCHEMA');
 guard(lines.length===3005,'ORIGINAL_ROW_COUNT');
 const ids={};let missingOptional=0,missingRequired=0,invalid=0,unusualConcentration=0;
 const timeSeen=new Set(),numericRange={concentration:[Infinity,-Infinity],temperature_celsius:[Infinity,-Infinity]};
 for(let i=0;i<lines.length;i++){
  const fields=lines[i].split(',');
  guard(fields.length===12,'ORIGINAL_COLUMN_COUNT:'+i);
  const row=Object.fromEntries(fields.map((v,j)=>[HDR[j],v]));
  guard(/^e(?:1|10|11|12|13)$/.test(row.id),'ORIGINAL_DEPLOYMENT_ID:'+i);
  const time=Number(row.time);
  guard(Number.isInteger(time)&&time>=0&&time<=600,'TIME_RANGE:'+i);
  const key=row.id+':'+time;
  guard(!timeSeen.has(key),'DUPLICATE_DEPLOYMENT_SECOND:'+key);
  timeSeen.add(key);ids[row.id]=(ids[row.id]||0)+1;
  for(const key of HDR.slice(1)){
   if(!row[key].length){
    if(['ph','orp','wt'].includes(key)){missingOptional++;continue;}
    missingRequired++;continue;
   }
   const v=Number(row[key]);
   if(!Number.isFinite(v)){invalid++;continue;}
   if(['volume','area','air_pressure','concentration'].includes(key)&&v<=0)invalid++;
   if(key==='concentration'&&(v<0||v>20000))unusualConcentration++;
   if(numericRange[key]){numericRange[key][0]=Math.min(v,numericRange[key][0]);numericRange[key][1]=Math.max(v,numericRange[key][1]);}
  }
 }
 guard(Object.keys(ids).sort().join('|')==='e1|e10|e11|e12|e13'
   &&Object.values(ids).every(v=>v===601),'DEPLOYMENT_INTERVALS');
 guard(m.ingest.records===3005&&stableJson(m.ingest.deployments)===stableJson(ids),'REGISTRY_ROW_MISMATCH');
 const unsigned={schema:'naft-p11-raw-chamber-concentration-qc-v1',
  status:'UPSTREAM_REPOSITORY_FILE_BYTES_MATCHED_MEASUREMENT_SCIENCE_UNVERIFIED',
  dataset_kind:'CH4_CHAMBER_HEADSPACE_INSTRUMENT_SAMPLE_NOT_PADDY_FLUX',
  source_url:m.ingest.source,source_commit:m.ingest.upstream_commit,
  source_git_blob_sha1:EXPECTED_BLOB,source_raw_sha256:sha256(bytes),
  source_bytes:bytes.length,columns:HDR,rows:lines.length,deployments:ids,
  seconds_per_deployment:601,concentration_unit:'ppm',
  measured_temperature_unit:'C',air_pressure_unit:'mbar_SOURCE_EXAMPLE_DECLARED',
  optional_field_missing_cell_count:missingOptional,
  required_field_missing_cell_count:missingRequired,invalid_numeric_cell_count:invalid,
  unusual_concentration_count:unusualConcentration,
  concentration_ppm_min:numericRange.concentration[0],
  concentration_ppm_max:numericRange.concentration[1],
  independent_calibration_verified:false,original_field_site_verified:false,
  is_japan_rice_field_observation:false,compatible_with_p7_daily_flux:false,
  calculated_emissions_tco2e:null,officially_certified_credits:null,
  declared_source_license:m.ingest.source_license,
  source_registry_sha256:sha256(Buffer.from(stableJson(m)))};
 return {...unsigned,receipt_sha256:sha256(Buffer.from(stableJson(unsigned)))};
}
export function verifyP11Receipt(bytes,report,meta=loadP11Registry()){
 guard(dict(report),'RECEIPT_TYPE');
 const current=inspectP11Original(bytes,meta);
 guard(stableJson(current)===stableJson(report),'REPLAY_MISMATCH');
 return {status:'UPSTREAM_BYTES_AND_METADATA_REPLAY_MATCH',sha256:current.source_raw_sha256,
  certified_credits:null};
}
function readOriginal(path){
 const x=resolve(path),s=lstatSync(x);
 guard(s.isFile()&&!s.isSymbolicLink()&&s.size>=200000&&s.size<=600000,'FILE_NOT_SAFE');
 return readFileSync(x);
}
function main(args){
 if(args.length===1&&args[0]==='audit'){
  console.log(JSON.stringify(inspectP11Original(),null,2));return;
 }
 if(args.length===2&&args[0]==='audit-file'){
  console.log(JSON.stringify(inspectP11Original(readOriginal(args[1])),null,2));return;
 }
 if(args.length===3&&args[0]==='verify'){
  const r=JSON.parse(readFileSync(resolve(args[2]),'utf8'));
  console.log(JSON.stringify(verifyP11Receipt(readOriginal(args[1]),r),null,2));return;
 }
 throw Error(BAD+'USAGE_audit_OR_audit-file_PATH_OR_verify_PATH_REPORT');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
}
