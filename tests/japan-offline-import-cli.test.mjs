import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const SCRIPT='scripts/replay-japan-observation-adapters.mjs';
const ROOT='research/japan-observation-adapters-2026-10-19/';
let assertions=0;
const equal=(a,b)=>{assert.deepEqual(a,b);assertions++;};
const run=(args)=>spawnSync(process.execPath,[SCRIPT,...args],{
 encoding:'utf8',timeout:10000,maxBuffer:1024*1024});
const success=(args)=>{
 const p=run(args);
 assert.equal(p.status,0,p.stderr);assertions++;
 assert.equal(p.stderr,'');assertions++;
 return JSON.parse(p.stdout);
};
const rejected=(args,needle)=>{
 const p=run(args);
 assert.notEqual(p.status,0,'Unexpected success: '+JSON.stringify(args));assertions++;
 assert.match(p.stderr,new RegExp('OBSERVATION_REPLAY_BLOCKED:.*'+needle));assertions++;
 assert.equal(p.stdout,'');assertions++;
};
const folder=mkdtempSync(join(tmpdir(),'naft-japan-replay-'));
try {
 const originalCSV=readFileSync(ROOT+'daily.csv');
 const originalManifest=JSON.parse(readFileSync(ROOT+'daily.manifest.json','utf8'));
 // The new explicit CLI must reproduce the pre-existing fixture path exactly.
 const old=success(['daily']);
 const csv=join(folder,'user observation.csv'),manifest=join(folder,'user manifest.json');
 writeFileSync(csv,originalCSV);
 writeFileSync(manifest,JSON.stringify(originalManifest));
 const external=success(['--csv',csv,'--manifest',manifest]);
 equal(external,old);
 equal(success(['--manifest',manifest,'--csv',csv]),old);
 equal(external.coverage_status,'PARTIAL_OBSERVED');
 equal(external.full_window_total_mg_ch4_m2,null);
 equal(external.certified_tco2e,null);
 equal(external.publisher_bytes_independently_attested,false);
 // A user-supplied file is useful for research without allowing authenticity claims.
 const user={...originalManifest,data_class:'USER_SUPPLIED_UNVERIFIED'};
 writeFileSync(manifest,JSON.stringify(user));
 const userResult=success(['--manifest',manifest,'--csv',csv]);
 equal(userResult.data_class,'USER_SUPPLIED_UNVERIFIED');
 equal(userResult.observed_only_integral_mg_ch4_m2,'1.250000000');
 equal(userResult.full_window_total_mg_ch4_m2,null);
 // SHA mismatch is a mandatory failure even when input data is otherwise syntactically valid.
 writeFileSync(csv,Buffer.concat([originalCSV,Buffer.from('tamper')]));
 rejected(['--csv',csv,'--manifest',manifest],'OBS_SHA256_MISMATCH');
 // A forged digest cannot make unsupported QC or policy admissible.
 const invalid=Buffer.from(originalCSV.toString('utf8').replace(',,MISSING',',42,MISSING'));
 writeFileSync(csv,invalid);
 writeFileSync(manifest,JSON.stringify({...user,csv_sha256:createHash('sha256').update(invalid).digest('hex')}));
 rejected(['--csv',csv,'--manifest',manifest],'OBS_EXCLUDED_ROW_VALUE_MUST_BE_EMPTY');
 // Self-certified input fields are always blocked.
 writeFileSync(csv,originalCSV);
 writeFileSync(manifest,JSON.stringify({...user,original_publisher_bytes_verified:true}));
 rejected(['--csv',csv,'--manifest',manifest],'OBS_ATTESTATION_CANNOT_BE_SELF_ASSERTED');
 // Reject incorrect syntax, duplicate flags, oversized input and non-file paths.
 rejected(['--csv',csv,'--csv',manifest],'USAGE');
 rejected(['--csv',csv,'--manifest'],'USAGE');
 rejected(['--csv',csv,'--manifest',folder],'OBS_INPUT_FILE_SIZE_OR_TYPE');
 writeFileSync(manifest,' '.repeat(50001));
 rejected(['--csv',csv,'--manifest',manifest],'OBS_INPUT_FILE_SIZE_OR_TYPE');
 writeFileSync(manifest,JSON.stringify(user));
 writeFileSync(csv,Buffer.alloc(2000001,97));
 rejected(['--csv',csv,'--manifest',manifest],'OBS_INPUT_FILE_SIZE_OR_TYPE');
 console.log('JAPAN_OFFLINE_IMPORT_CLI_PASS: '+assertions+' assertions (external import, parity, provenance, bounds)');
} finally {
 rmSync(folder,{recursive:true,force:true});
}
