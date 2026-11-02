#!/usr/bin/env node
/** P11 rice 2023 chromatography: validation-only adapter. Original CSV NOT redistributed. */
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {stableJson} from './lib/research-readiness-report.mjs';
const PATH=fileURLToPath(new URL('../research/p11-rice-chromatography-source-2026-11-03.json',import.meta.url));
const HEAD=['Index','Sampling_date','Ref_lab','VialCodi','Exp','Plot','Chamber_opacity','Year','Month','Day','Tr1','Tr2','Rep','chamber number','Sampler','Code','Water_level_cm','Temp_soil','Rice_cover_prop','Env_temp_initial','Env_temp_final','Sample_time','Sample_hour','Sample_time_min ','CCH4_ppm','CCO2_ppm','NN2O_ppm','Chamber_temp'];
const stop=s=>{throw Error('NAFT_P11_RICE_CHROM_BLOCKED:'+s);};
const check=(a,s)=>{if(!a)stop(s);};
const sha=b=>createHash('sha256').update(b).digest('hex');
const gitblob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
export function loadP11RiceMetadata(){return JSON.parse(readFileSync(PATH,'utf8'));}
export function validateP11RiceMetadata(m=loadP11RiceMetadata()){
 const s=m?.primary_source;
 check(m?.schema==='naft-p11-real-rice-chromatography-review-v1'
  &&s?.commit==='e51c176983c5bc5c38a6c7f15a0fcbb49052c58f'
  &&s?.git_blob_sha1==='575c6bc2826c1b0a7e829ea45463c77ac7048bbd'
  &&s?.source_file_size_bytes===122694&&s?.record_count===718
  &&s?.header_field_count===28&&s?.sampling_dates_count===20
  &&s?.year===2023&&s?.raw_csv_bytes_committed_to_naft===false
  &&s?.raw_csv_sha256_uncomputed===null
  &&s?.license==='NO_DATA_SPECIFIC_REUSE_LICENSE_FOUND_IN_PUBLIC_REPOSITORY'
  &&s?.temporal_type==='CHAMBER_SAMPLING_TIMEPOINTS_NOT_DAILY_FLUX'
  &&s?.independent_qa_of_chromatograph===false,'SOURCE_LICENSE_PROVENANCE');
 check(stableJson(s.treatment_counts)===stableJson({AWD:239,MSD:239,CON:240})
  &&m.new_original_rice_raw_csv_files_copied_to_naft===0
  &&m.new_rice_daily_flux_rows_inserted===0
  &&m.certified_ch4_emission_factor===null
  &&m.certified_tco2e===null
  &&m.derived_metadata_does_not_republish_restricted_raw_csv===true,'FALSE_FIELD_CERTIFICATION');
 check(m.supporting_files?.length===2
  &&m.supporting_files[0].records===15
  &&m.supporting_files[1].records===537,'SUPPORTING_ROWS');
 return true;
}
const ISO=/^\d{4}-\d{2}-\d{2}$/;
function validDate(s){
 if(!ISO.test(s))return false;
 const [y,m,d]=s.split('-').map(Number),x=new Date(Date.UTC(y,m-1,d));
 return x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d;
}
export function parseP11Chromatography(b){
 check(Buffer.isBuffer(b)&&b.length>0&&b.length<1024*1024,'BYTES');
 let t;
 try{t=new TextDecoder('utf8',{fatal:true}).decode(b).replace(/^\ufeff/,'');}
 catch{stop('UTF8');}
 check(!t.includes('"'),'CSV_QUOTES_UNSUPPORTED_FAIL_CLOSED');
 const lines=t.trimEnd().split(/\r?\n/),head=lines.shift().split(',');
 check(head.length===28&&head.every((x,i)=>x===HEAD[i]),'NATIVE_SOURCE_HEADERS');
 const dates=new Set(),counts={},keys=new Set(),invalid=[],nondaily=[];
 lines.forEach((line,i)=>{
  const arr=line.split(',');
  check(arr.length===28,'NATIVE_COLUMNS:'+i);
  const row=Object.fromEntries(HEAD.map((x,j)=>[x,arr[j]]));
  check(validDate(row.Sampling_date)&&row.Year==='2023'
   &&row.Sampling_date.slice(0,4)===row.Year,'INVALID_YEAR_OR_DATE:'+i);
  check(['AWD','CON','MSD'].includes(row.Tr1),'IRRIGATION_GROUP:'+i);
  const v=row.CCH4_ppm;
  if(!v||!Number.isFinite(Number(v))||Number(v)<0)invalid.push({row:i+2,code:'CH4_CONCENTRATION_INVALID'});
  const time=row['Sample_time_min '].trim();
  if(time&&!/^\d+(?:\.\d+)?$/.test(time))nondaily.push({row:i+2,code:'TIMEPOINT_NOT_NUMERIC'});
  check(row.Plot.length>0&&row.Index.length>0,'MISSING_PLOT_OR_SAMPLE_KEY:'+i);
  const k=row.Index;
  check(!keys.has(k),'DUPLICATE_SOURCE_INDEX');keys.add(k);
  counts[row.Tr1]=(counts[row.Tr1]||0)+1;dates.add(row.Sampling_date);
 });
 return {rows:lines.length,source_columns:HEAD,irrigation_sample_counts:counts,
  unique_sampling_dates:dates.size,invalid_ch4_concentration:invalid,
  invalid_elapsed_times:nondaily,
  raw_source_sha256:sha(b),raw_source_git_blob:gitblob(b)};
}
export function inspectP11RiceOriginal(b,m=loadP11RiceMetadata()){
 validateP11RiceMetadata(m);
 const s=m.primary_source;
 check(b.length===s.source_file_size_bytes&&gitblob(b)===s.git_blob_sha1,'PINNED_RICE_ORIGINAL_BLOB_MISMATCH');
 const parsed=parseP11Chromatography(b);
 check(parsed.rows===718&&parsed.unique_sampling_dates===20
  &&stableJson(parsed.irrigation_sample_counts)===stableJson(s.treatment_counts)
  &&parsed.invalid_ch4_concentration.length===0,'RICE_SOURCE_ROW_COUNTS_OR_UNIT_INVALID');
 const unsigned={schema:'naft-p11-rice-chromatography-original-qc-v1',
  status:'RESEARCH_CONCENTRATION_TIMESTEPS_NOT_VERIFIED_FLUX',
  source:s.raw_csv_url,git_blob_sha1:s.git_blob_sha1,
  rows:parsed.rows,columns:parsed.source_columns.length,
  treatment_counts:parsed.irrigation_sample_counts,unique_dates:parsed.unique_sampling_dates,
  original_sha256:parsed.raw_source_sha256,
  original_republished_in_naft:false,
  output_is_ch4_ppm_not_flux:true,independent_sensor_calibration_verified:false,
  method_validity_verified:false,official_co2e:null};
 return {...unsigned,receipt_sha256:sha(Buffer.from(stableJson(unsigned)))};
}
function main(a){
 if(a.length===1&&a[0]==='sources'){validateP11RiceMetadata();console.log(JSON.stringify(loadP11RiceMetadata(),null,2));return;}
 if(a.length===2&&a[0]==='verify-original'){
  const p=resolve(a[1]),s=lstatSync(p);check(s.isFile()&&!s.isSymbolicLink()&&s.size===122694,'ORIGINAL_FILE_NOT_SAFE');
  console.log(JSON.stringify(inspectP11RiceOriginal(readFileSync(p)),null,2));return;
 }
 stop('USAGE_sources_OR_verify-original_FILE');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
}
