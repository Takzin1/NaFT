import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reconcileObservationAggregate} from '../scripts/lib/japan-aggregate-reconciliation.mjs';

const BASE='research/japan-observation-adapters-2026-10-19/';
const FIXTURE='research/japan-aggregate-reconciliation-2026-10-19/synthetic-interval-reference.json';
const csv=readFileSync(BASE+'interval.csv');
const meta=JSON.parse(readFileSync(BASE+'interval.manifest.json','utf8'));
const reference=JSON.parse(readFileSync(FIXTURE,'utf8'));
let count=0;
function eq(a,b){assert.deepEqual(a,b);count++;}
function reject(fn,code){assert.throws(fn,new RegExp(code));count++;}
const replay=(r=reference,m=meta,data=csv)=>reconcileObservationAggregate(data,m,r);
const valid=replay();
eq(valid.status,'RESEARCH_ARITHMETIC_NOT_SOURCE_VERIFICATION');
eq(valid.replayed_mg_ch4_m2,'2.250000000');
eq(valid.supplied_reported_mg_ch4_m2,'2.250000000');
eq(valid.replayed_minus_reported_mg_ch4_m2,'0.000000000');
eq(valid.absolute_difference_mg_ch4_m2,'0.000000000');
eq(valid.display_resolution_compatible,true);
eq(valid.rounding_cause_verified,false);
eq(valid.reference_content_independently_attested,false);
eq(valid.environmental_conditions_independently_verified,false);
eq(valid.certified_tco2e,null);
eq(valid.uncertainty_interval,null);
eq(valid.causal_attribution,null);
eq(valid.csv_digest_sha256,meta.csv_sha256);
eq(valid.coverage_status,'COMPLETE_OBSERVED');
assert.match(valid.reference_json_sha256,/^[a-f0-9]{64}$/);count++;
eq(JSON.stringify(replay()),JSON.stringify(valid));
// Positive and negative differences are signed; the comparison never invents
// a scientific explanation for numerical compatibility with display precision.
const less=replay({...reference,reported_cumulative_mg_ch4_m2:'2.255'});
eq(less.replayed_minus_reported_mg_ch4_m2,'-0.005000000');
eq(less.display_resolution_compatible,true);
eq(less.rounding_cause_verified,false);
const more=replay({...reference,reported_cumulative_mg_ch4_m2:'2.244'});
eq(more.replayed_minus_reported_mg_ch4_m2,'0.006000000');
eq(more.display_resolution_compatible,false);
const negativeRef=replay({...reference,reported_cumulative_mg_ch4_m2:'-0.25'});
eq(negativeRef.replayed_minus_reported_mg_ch4_m2,'2.500000000');
// Context identity is declared, not independently verified; any mismatch must block.
for(const key of [
 'source_uri','site_id','plot_id','treatment','measurement_method',
 'observation_start_utc','observation_end_utc','country','gas','mass_basis',
 'data_class','source_license_status']){
 reject(()=>replay({...reference,[key]:'INCONSISTENT'}),/RECON_(DATA_CLASS|CONTEXT_MISMATCH)/);
}
for(const k of ['original_publisher_bytes_verified','conditions_independently_matched','official_eligibility_verified']){
 reject(()=>replay({...reference,[k]:true}),/RECON_SELF_ATTESTATION/);
}
reject(()=>replay({...reference,csv_sha256:'0'.repeat(64)}),/RECON_INPUT_DIGEST_MISMATCH/);
reject(()=>replay({...reference,aggregate_unit:'g_CH4_m2'}),/RECON_REFERENCE_SCHEMA_OR_UNIT/);
reject(()=>replay({...reference,window_basis:'ESTIMATED_CROP_SEASON'}),/RECON_REFERENCE_SCHEMA_OR_UNIT/);
reject(()=>replay({...reference,comparison_purpose:'CERTIFICATION'}),/RECON_REFERENCE_SCHEMA_OR_UNIT/);
reject(()=>replay({...reference,aggregate_semantics:'MODELLED_TOTAL'}),/RECON_REFERENCE_SCHEMA_OR_UNIT/);
reject(()=>replay({...reference,reported_cumulative_mg_ch4_m2:'NaN'}),/RECON_REPORTED_DECIMAL/);
reject(()=>replay({...reference,printed_resolution_mg_ch4_m2:'0'}),/RECON_RESOLUTION_NONPOSITIVE/);
reject(()=>replay({...reference,printed_resolution_mg_ch4_m2:'-1'}),/RECON_RESOLUTION_NONPOSITIVE/);
reject(()=>replay({...reference,printed_resolution_mg_ch4_m2:'0.0000000001'}),/RECON_RESOLUTION_INVALID/);
// Integrity must be checked from raw input bytes, not from a caller's displayed replay.
reject(()=>replay(reference,meta,Buffer.concat([csv,Buffer.from('tamper')])),/OBS_SHA256_MISMATCH/);
// Same declared context is insufficient when the observed window is incomplete.
const daily=readFileSync(BASE+'daily.csv'),dailyMeta=JSON.parse(readFileSync(BASE+'daily.manifest.json','utf8'));
const mapped={...reference,...Object.fromEntries([
 'source_uri','site_id','plot_id','treatment','measurement_method',
 'observation_start_utc','observation_end_utc','country','gas','mass_basis',
 'data_class','source_license_status','csv_sha256'].map(k=>[k,dailyMeta[k]]))};
reject(()=>replay(mapped,dailyMeta,daily),/RECON_FULL_OBSERVED_COVERAGE_REQUIRED/);
const carbon=readFileSync(BASE+'carbon.csv'),carbonMeta=JSON.parse(readFileSync(BASE+'carbon.manifest.json','utf8'));
const carbonRef={...mapped,...Object.fromEntries([
 'source_uri','site_id','plot_id','treatment','measurement_method',
 'observation_start_utc','observation_end_utc','country','gas','mass_basis',
 'data_class','source_license_status','csv_sha256'].map(k=>[k,carbonMeta[k]]))};
reject(()=>replay(carbonRef,carbonMeta,carbon),/RECON_INPUT_MASS_BASIS_UNSUPPORTED/);
// Even an attacker who changes both the supplied input and its checksum
// cannot bypass period and QC validation.
const invalid=Buffer.from(csv.toString('utf8').replace('OBSERVED_GOOD','IMPUTED_RESEARCH'));
const fakeMeta={...meta,csv_sha256:createHash('sha256').update(invalid).digest('hex')};
reject(()=>replay({...reference,csv_sha256:fakeMeta.csv_sha256},fakeMeta,invalid),/OBS_EXCLUDED_ROW_VALUE/);
const cli=(args)=>spawnSync(process.execPath,['scripts/reconcile-japan-observation.mjs',...args],{
 encoding:'utf8',timeout:12000,maxBuffer:1048576});
let result=cli(['synthetic-interval']);
eq(result.status,0);
eq(result.stderr,'');
eq(JSON.parse(result.stdout),valid);
const dir=mkdtempSync(join(tmpdir(),'naft-reconcile-'));
try{
 const filename=join(dir,'field readings.csv'),manifestPath=join(dir,'raw.manifest.json'),referencePath=join(dir,'claimed reference.json');
 writeFileSync(filename,csv);writeFileSync(manifestPath,JSON.stringify(meta));writeFileSync(referencePath,JSON.stringify(reference));
 const args=['--reference',referencePath,'--csv',filename,'--manifest',manifestPath];
 const local=cli(args);
 eq(local.status,0);eq(JSON.parse(local.stdout),valid);
 const userRef={...reference,data_class:'USER_SUPPLIED_UNVERIFIED'};
 const userMeta={...meta,data_class:'USER_SUPPLIED_UNVERIFIED'};
 writeFileSync(manifestPath,JSON.stringify(userMeta));
 writeFileSync(referencePath,JSON.stringify(userRef));
 const user=cli(args);
 eq(user.status,0);
 eq(JSON.parse(user.stdout).data_class,'USER_SUPPLIED_UNVERIFIED');
 // Untrusted or malformed sources must not emit a success result to stdout.
 const failures=[
  ['--csv',filename,'--manifest',manifestPath,'--manifest',referencePath],
  ['--csv',filename,'--manifest',manifestPath],
  ['--csv',filename,'--manifest',manifestPath,'--reference',dir]
 ];
 for(const argv of failures){const p=cli(argv);assert.notEqual(p.status,0);count++;eq(p.stdout,'');}
 writeFileSync(filename,Buffer.concat([csv,Buffer.from('X')]));
 result=cli(args);assert.notEqual(result.status,0);count++;assert.match(result.stderr,/OBS_SHA256_MISMATCH/);count++;
 writeFileSync(filename,Buffer.alloc(2000001,65));
 result=cli(args);assert.notEqual(result.status,0);count++;assert.match(result.stderr,/RECON_FILE_SIZE_OR_TYPE/);count++;
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('JP_AGGREGATE_RECONCILIATION_PASS: '+count+' assertions (period/QC/identity/math/provenance/CLI)');
