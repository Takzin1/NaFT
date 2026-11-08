#!/usr/bin/env node
/**
 * P26 research-only prescreen based on 4 user-provided government PDFs.
 * A successful prescreen is NOT BDAS acceptance, J-Credit eligibility,
 * emission reduction, actual issuance, registry custody or Web3 permission.
 * No remote calls, wallet interaction, or coefficient-based credit calculation.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const MLIT_SHA='0da1d89b594f2c5835e65193758d1ecf435f1397ce4f9d663f367bd7fb9c309e';
export const MAFF_RICE_SHA='37471c2d7440f176dd674fedab407c5306ff15456650ec38e1d6ad54b7c79bba';
const HEX=/^[a-f0-9]{64}$/;
const METRIC=/^-?(?:0|[1-9]\d{0,11})(?:\.\d{2,6})$/;
const POSITIVE=/^(?:0|[1-9]\d{0,8})(?:\.\d{1,6})?$/;
const rejected=(reason)=>{throw new Error('P26_OFFICIAL_PRESCREEN_BLOCKED:'+reason);};
const check=(value,reason)=>{if(!value)rejected(reason);};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function keys(x,allow){
  check(object(x)&&Object.keys(x).every(k=>allow.includes(k)) &&
    !Object.keys(x).some(k=>['__proto__','constructor','prototype'].includes(k)),
    'UNEXPECTED_FIELDS');
}
function date(value){
  check(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value),'INVALID_DATE');
  const [y,m,d]=value.split('-').map(Number),t=Date.UTC(y,m-1,d),ref=new Date(t);
  check(y>=2000&&y<=2100&&ref.getUTCFullYear()===y&&ref.getUTCMonth()+1===m&&
    ref.getUTCDate()===d,'INVALID_DATE');
  return t;
}
function sha(x){return createHash('sha256').update(JSON.stringify(x)).digest('hex');}
function receipt(body){
  return {...body,formal_certification:false,certified_tco2e:null,
    registry_custody_verified:false,official_issued_credit_quantity:null,
    production_mint_authorized:false,transaction_submitted:false};
}
/** Internal adapter requires csv columns ordered exactly as MLIT section 4.2.
 * Header is an NaFT internal convention, not an official BDAS-required header. */
export function prescreenBdasGreenLaser(input){
  keys(input,['schema','manual_sha256','metadata','csv']);
  check(input.schema==='naft-p26-bdas-green-laser-input/1','BDAS_SCHEMA');
  check(input.manual_sha256===MLIT_SHA,'MANUAL_VERSION_MISMATCH');
  keys(input.metadata,['observation_date','vegetation_type','coordinate_system_type',
    'coordinate_reference','sensor_type']);
  date(input.metadata.observation_date);
  check(typeof input.metadata.vegetation_type==='string' &&
    input.metadata.vegetation_type.trim().length>0&&
    input.metadata.vegetation_type.length<=160,'VEGETATION_TYPE_REQUIRED');
  check(['JAPAN_PLANE_RECTANGULAR','LOCAL_ARBITRARY'].includes(
    input.metadata.coordinate_system_type),'COORDINATE_SYSTEM_REQUIRED');
  check(typeof input.metadata.coordinate_reference==='string' &&
    input.metadata.coordinate_reference.length>0&&
    input.metadata.coordinate_reference.length<=100,'COORDINATE_REFERENCE_REQUIRED');
  check(['UAV_GREEN_LASER','ALB_GREEN_LASER'].includes(input.metadata.sensor_type),
    'GREEN_LASER_ONLY');
  check(typeof input.csv==='string'&&Buffer.byteLength(input.csv,'utf8')<=65536,
    'CSV_LIMIT');
  let lines=input.csv.replace(/\r\n/g,'\n').trim().split('\n');
  check(lines.length>=1&&lines.length<=1001,'CSV_ROW_COUNT');
  if(lines[0]==='x_m,y_m,vegetation_height_m,intensity')lines=lines.slice(1);
  check(lines.length>0&&lines.length<=1000,'CSV_ROW_COUNT');
  for(const [i,line]of lines.entries()){
    check(!line.includes('"')&&!line.includes(';'),'CSV_FORMAT');
    const fields=line.split(',');
    check(fields.length===4,'CSV_FOUR_COLUMNS');
    const [x,y,h,intensity]=fields;
    for(const value of [x,y,h])check(METRIC.test(value),'CSV_TWO_DECIMAL_METRIC');
    check(!h.startsWith('-'),'NEGATIVE_VEGETATION_HEIGHT');
    check(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,6})?$/.test(intensity),
      'INVALID_INTENSITY');
    check(line.length<220,'CSV_ROW_LENGTH');
  }
  return receipt({
    schema:'naft-p26-bdas-prescreen-receipt/1',
    classification:'CSV_SHAPE_ONLY_NOT_BDAS_ACCEPTANCE',
    manual_sha256:MLIT_SHA,reference_pdf_page:25,reference_sections:['4.1','4.2'],
    observation_date:input.metadata.observation_date,
    coordinate_system_type:input.metadata.coordinate_system_type,
    sensor_type:input.metadata.sensor_type,
    cells_checked:lines.length,
    input_sha256:sha(input),
    grid_coverage_quality:'NOT_VERIFIED',
    point_cloud_refraction_and_noise:'NOT_VERIFIED',
    species_annotation:'HUMAN_VERIFICATION_REQUIRED',
    co2_absorption_quantification:'NOT_PERFORMED',
    no_real_bdas_submission:true
  });
}
/**
 * MAFF MAY 2026 informational brochure only, not a version-pinned AG-005
 * method, nor a substitute for project-specific agricultural safety checks.
 */
export function prescreenMidseasonEvidence(input){
  keys(input,['schema','pamphlet_sha256','activity_year','baseline_history',
    'drying_start','drying_end','reported_drying_days','heading_date',
    'field_area_ha','region','prior_crop_organic_inputs_sha256',
    'activity_records_sha256','field_evidence_sha256',
    'supplemental_irrigation_during_extension','crop_safety_risk']);
  check(input.schema==='naft-p26-maff-midseason-evidence-input/1','MIDSEASON_SCHEMA');
  check(input.pamphlet_sha256===MAFF_RICE_SHA,'PAMPHLET_VERSION_MISMATCH');
  check(Number.isInteger(input.activity_year)&&input.activity_year>=2000&&
    input.activity_year<=2100,'INVALID_ACTIVITY_YEAR');
  check(Array.isArray(input.baseline_history)&&input.baseline_history.length>=2&&
    input.baseline_history.length<=10,'TWO_BASELINE_YEARS_REQUIRED');
  const baselineYears=new Set();
  let longest=0;
  for(const record of input.baseline_history){
    keys(record,['year','drying_days','record_sha256']);
    check(Number.isInteger(record.year)&&record.year<input.activity_year&&
      record.year>=2000&&!baselineYears.has(record.year),'INVALID_BASELINE_YEAR');
    baselineYears.add(record.year);
    check(Number.isInteger(record.drying_days)&&record.drying_days>=0&&
      record.drying_days<=120,'INVALID_BASELINE_DAYS');
    check(HEX.test(record.record_sha256||''),'BASELINE_RECORD_SHA_REQUIRED');
    longest=Math.max(longest,record.drying_days);
  }
  const start=date(input.drying_start),end=date(input.drying_end);
  const duration=(end-start)/86400000;
  check(new Date(start).getUTCFullYear()===input.activity_year &&
    end>start,'ACTIVITY_DATE_RANGE');
  check(Number.isInteger(input.reported_drying_days)&&
    input.reported_drying_days>=0&&input.reported_drying_days<=120,
    'INVALID_REPORTED_DURATION');
  check(Math.abs(duration-input.reported_drying_days)<=1,
    'DATE_DURATION_INCONSISTENT');
  date(input.heading_date);
  check(POSITIVE.test(input.field_area_ha)&&
    Number(input.field_area_ha)>0,'FIELD_AREA_REQUIRED');
  check(typeof input.region==='string'&&
    input.region.trim().length>0&&input.region.length<=100,'REGION_REQUIRED');
  for(const k of ['prior_crop_organic_inputs_sha256','activity_records_sha256',
    'field_evidence_sha256'])check(HEX.test(input[k]||''),'EVIDENCE_HASH_REQUIRED');
  check(typeof input.supplemental_irrigation_during_extension==='boolean'&&
    typeof input.crop_safety_risk==='boolean','SAFETY_FLAGS_REQUIRED');
  const threshold=input.reported_drying_days>=longest+7;
  const safety=input.supplemental_irrigation_during_extension||input.crop_safety_risk;
  const status=safety?'STOP_AND_REVIEW_CROP_SAFETY_NO_CREDIT':
    threshold?'DOCUMENTARY_CONSERVATIVE_SCREEN_ONLY':'LESS_THAN_CONSERVATIVE_7_DAY_SCREEN';
  return receipt({
    schema:'naft-p26-maff-midseason-prescreen-receipt/1',
    classification:'BROCHURE_EVIDENCE_SCREEN_NOT_OFFICIAL_AG005_ELIGIBILITY',
    pamphlet_sha256:MAFF_RICE_SHA,reference_pdf_pages:[1,2],
    activity_year:input.activity_year,baseline_years:baselineYears.size,
    longest_documented_baseline_days:longest,
    reported_activity_days:input.reported_drying_days,
    conservative_extension_days:input.reported_drying_days-longest,
    seven_day_conservative_screen_met:threshold&&!safety,
    prescreen_status:status,crop_safety_has_priority:true,
    human_agronomic_review_required:true,official_methodology_version_checked:false,
    field_evidence_digests_are_not_authenticated:true,
    no_30_percent_credit_calculation:true,
    live_jcredit_registry_not_accessed:true,
    input_sha256:sha(input)
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    check(process.argv.length===4,'USAGE_MODE_AND_FILE');
    const raw=readFileSync(process.argv[3]);
    check(raw.length<=65536,'JSON_SIZE_LIMIT');
    const input=JSON.parse(raw.toString('utf8'));
    const out=process.argv[2]==='bdas'?prescreenBdasGreenLaser(input):
      process.argv[2]==='midseason'?prescreenMidseasonEvidence(input):
      rejected('INVALID_MODE');
    process.stdout.write(JSON.stringify(out,null,2)+'\n');
  }catch(err){
    const msg=String(err?.message||'');
    console.error(/^P26_OFFICIAL_PRESCREEN_BLOCKED:[A-Z0-9_]+$/.test(msg)?
      msg:'P26_OFFICIAL_PRESCREEN_BLOCKED:BAD_INPUT');
    process.exitCode=1;
  }
}
