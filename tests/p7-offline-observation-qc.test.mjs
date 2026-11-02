import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stableJson} from '../scripts/lib/research-readiness-report.mjs';
import {CANONICAL_HEADER,loadP7Sources,validateP7Sources,
 evaluateP7ObservationCSV,verifyP7ObservationCSV
} from '../scripts/p7-offline-observation-qc.mjs';
let checked=0;
const eq=(x,y)=>{assert.deepEqual(x,y);checked++};
const bad=(fn,code)=>{assert.throws(fn,new RegExp(code));checked++};
const sources=loadP7Sources();
const bytes=readFileSync('fixtures/p7-synthetic-daily-flux-qc.csv');
eq(validateP7Sources(sources),true);
eq(sources.source_count,7);
eq(sources.unique_new_source_ids,6);
eq(sources.external_files_downloaded_this_change,0);
eq(sources.external_observation_rows_loaded_this_change,0);
eq(sources.source_data_ready_for_institutional_mrv,false);
eq(sources.scientifically_verified_flows,0);
eq(sources.officially_certified_tco2e,null);
eq(sources.sources.filter(x=>x.id==='KR_GIMJE_DAILY_2022_2024').length,1);
eq(sources.sources.find(x=>x.id==='KR_GIMJE_DAILY_2022_2024').artifact.github_public_blob_sha1,
 '55a376b6ce071a22f7676e15d5a88b5fd6c1babe');
eq(sources.sources.find(x=>x.id==='CN_WUHAN_AWD_GHG_2024').artifact.published_md5,
 '8d954606493316fa897d48b8f05f57d4');
eq(sources.sources.find(x=>x.id==='FAO_QCL_RICE_STATS').license,'CC_BY_4_0_OFFICIAL_CATALOG');
eq(sources.sources.find(x=>x.id==='NASA_POWER_AG_DAILY').artifact.independent_sha256,null);
eq(sources.sources.find(x=>x.id==='COPERNICUS_SENTINEL1_GRD').not_allowed.includes('AWD_STATUS_AUTOMATIC_PROOF'),true);
eq(CANONICAL_HEADER.length,8);
const r=evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',bytes);
eq(r.review_status,'RESEARCH_QC_CANDIDATES_NOT_SCIENTIFICALLY_VERIFIED');
eq(r.row_count,8);
eq(r.valid_numeric_candidate_count,5);
eq(r.missing_flux_count,2);
eq(r.invalid_flux_count,2);
eq(r.duplicate_record_id_count,1);
eq(r.multiple_records_same_field_day,1);
eq(r.flagged_by_source_count,1);
eq(r.negative_flux_count,1);
eq(r.high_magnitude_review_count,1);
eq(r.unknown_measurement_or_water_state_count,2);
eq(r.methods_reported,{STATIC_CHAMBER:5,UNKNOWN:1,EDDY_COVARIANCE:2});
eq(r.water_management_reported,{AWD:4,CONTINUOUS_FLOOD:2,UNKNOWN:1,SINGLE_DRAINAGE:1});
eq(r.source_qc_reported,{REPORTED_PASS:4,FLAGGED:1,UNKNOWN:3});
eq(r.input_is_user_supplied_canonical_intermediate,true);
eq(r.input_is_official_native_export_verified,false);
eq(r.source_raw_original_bytes_verified,false);
eq(r.source_original_document_sha256,null);
eq(r.independent_chamber_calibration_review,false);
eq(r.measurement_qc_independently_verified,false);
eq(r.atmospheric_conditions_independently_checked,false);
eq(r.no_data_is_auto_promoted_into_official_rulepacks,true);
eq(r.field_timeseries_integrated,false);
eq(r.imputed_missing_readings,0);
eq(r.validated_co2e_result,null);
eq(r.credit_issuance,null);
eq(r.uploaded_csv_sha256,createHash('sha256').update(bytes).digest('hex'));
const {report_sha256,...unsigned}=r;
eq(report_sha256,createHash('sha256').update(stableJson(unsigned)).digest('hex'));
eq(r,evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',bytes));
eq(verifyP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',bytes,r).status,
 'INPUT_BYTES_AND_QC_CANDIDATES_REPRODUCED');
const cn=evaluateP7ObservationCSV('CN_WUHAN_AWD_GHG_2024',bytes);
eq(cn.row_count,8);
eq(cn.input_is_official_native_export_verified,false);
eq(cn.validated_co2e_result,null);
bad(()=>evaluateP7ObservationCSV('NASA_POWER_AG_DAILY',bytes),'SOURCE_NOT_DAILY_CH4_FLUX_STUDY');
bad(()=>evaluateP7ObservationCSV('FAO_QCL_RICE_STATS',bytes),'SOURCE_NOT_DAILY_CH4_FLUX_STUDY');
bad(()=>evaluateP7ObservationCSV('ES_EBULLITION_ML_2026',bytes),'SOURCE_NOT_DAILY_CH4_FLUX_STUDY');
bad(()=>evaluateP7ObservationCSV('IPCC_2019_RF_VOL4_CH5',bytes),'SOURCE_NOT_DAILY_CH4_FLUX_STUDY');
bad(()=>evaluateP7ObservationCSV('COPERNICUS_SENTINEL1_GRD',bytes),'SOURCE_NOT_DAILY_CH4_FLUX_STUDY');
bad(()=>verifyP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',bytes,{...r,validated_co2e_result:123}),
 'REPLAY_MISMATCH');
bad(()=>verifyP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',Buffer.concat([bytes,Buffer.from('\n')]),r),
 'REPLAY_MISMATCH');
const mutation=JSON.parse(JSON.stringify(sources));
mutation.sources.find(s=>s.id==='NASA_POWER_AG_DAILY').not_allowed=[];
bad(()=>validateP7Sources(mutation),'UNTRUSTWORTHY_SOURCE_OR_INVALID_AUTO_INGEST');
const fakeVerified=JSON.parse(JSON.stringify(sources));
fakeVerified.external_observation_rows_loaded_this_change=1000;
bad(()=>validateP7Sources(fakeVerified),'SOURCE_DISCOVERY_SCOPE');
const fakeLicense=JSON.parse(JSON.stringify(sources));
fakeLicense.sources.find(s=>s.id==='ES_EBULLITION_ML_2026').license='UNRESTRICTED';
bad(()=>validateP7Sources(fakeLicense),'EBULLITION_LICENSE_BOUNDARY');
const fakeSha=JSON.parse(JSON.stringify(sources));
fakeSha.sources[0].artifact.independent_sha256='a'.repeat(64);
bad(()=>validateP7Sources(fakeSha),'UNTRUSTWORTHY_SOURCE_OR_INVALID_AUTO_INGEST');
const modify=(lines,at,value)=>Buffer.from(lines.toString('utf8').split('\n').map((x,i)=>i===at?value:x).join('\n'));
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',modify(bytes,0,'wrong,header')),
 'CSV_CANONICAL_HEADER_REQUIRED');
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',modify(bytes,1,
 'R1,FIELD_A,2024-06-01,0.12,kg_CH4_ha_day,AWD,STATIC_CHAMBER,REPORTED_PASS')),
 'CH4_UNIT_UNSUPPORTED');
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',modify(bytes,1,
 'R1,FIELD_A,2024-06-01,0.12,g_CH4_m2_day,AWD,FAKE_SENSOR,REPORTED_PASS')),
 'METHOD_UNSUPPORTED');
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',modify(bytes,1,
 'R1,FIELD_A,2024-06-01,0.12,g_CH4_m2_day,AWD,STATIC_CHAMBER,PASSED_INDEPENDENT_QC')),
 'QC_FLAG_UNSUPPORTED');
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',modify(bytes,1,
 'R1,FIELD_A,2024-06-01,0.12,g_CH4_m2_day,SATELLITE_PROVED_AWD,STATIC_CHAMBER,REPORTED_PASS')),
 'WATER_STATE_UNSUPPORTED');
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',Buffer.from('\xff\xfe')),
 'CSV_UTF8');
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',Buffer.from('"unclosed')),
 'CSV_UNCLOSED_QUOTES');
const d=modify(bytes,1,'R1,FIELD_A,2024-06-01,0.12,g_CH4_m2_day,AWD,STATIC_CHAMBER,REPORTED_PASS,EXTRA');
bad(()=>evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',d),'CSV_COLUMN_MISMATCH');
const minimal=Buffer.from(CANONICAL_HEADER.join(',')+'\nID1,F1,2024-02-29,"-0.0002",g_CH4_m2_day,AWD,STATIC_CHAMBER,REPORTED_PASS\n');
const leap=evaluateP7ObservationCSV('KR_GIMJE_DAILY_2022_2024',minimal);
eq(leap.row_count,1);
eq(leap.valid_numeric_candidate_count,1);
eq(leap.negative_flux_count,1);
eq(leap.invalid_flux_count,0);
eq(leap.officially_certified_tco2e,undefined);
const temp=mkdtempSync(join(tmpdir(),'naft-p7-'));
const run=(...args)=>spawnSync(process.execPath,['scripts/p7-offline-observation-qc.mjs',...args],
 {encoding:'utf8',timeout:12000,maxBuffer:2*1024*1024});
try{
 const file=join(temp,'input.csv'),report=join(temp,'qc.json'),link=join(temp,'link.csv');
 writeFileSync(file,bytes);
 const created=run('analyze','KR_GIMJE_DAILY_2022_2024',file);
 eq(created.status,0);eq(JSON.parse(created.stdout),r);
 writeFileSync(report,created.stdout);
 const checkedResult=run('verify','KR_GIMJE_DAILY_2022_2024',file,report);
 eq(checkedResult.status,0);eq(JSON.parse(checkedResult.stdout).sha256,r.report_sha256);
 const list=run('sources');eq(list.status,0);eq(JSON.parse(list.stdout),sources);
 writeFileSync(report,JSON.stringify({...r,validated_co2e_result:123}));
 const forged=run('verify','KR_GIMJE_DAILY_2022_2024',file,report);
 eq(forged.status!==0,true);
 symlinkSync(file,link);
 const symlink=run('analyze','KR_GIMJE_DAILY_2022_2024',link);
 eq(symlink.status!==0,true);
 eq(symlink.stderr.includes('INPUT_FILE_UNSAFE'),true);
}finally{rmSync(temp,{recursive:true,force:true})}
console.log('NAFT_P7_OBSERVATION_QC_PASS: '+checked+
 ' checks; 7 source candidates (6 newly discovered), synthetic rows only, no field certification');
