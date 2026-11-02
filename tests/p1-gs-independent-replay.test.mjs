import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadRegistry} from '../scripts/rice-methodology-router.mjs';
import {runIndependentTrainingReplay,verifyIndependentTrainingReceipt}
 from '../scripts/p1-gs-independent-replay.mjs';
const registry=loadRegistry(),program='GS_AWD_TRAINING_2024';
const dir=mkdtempSync(join(tmpdir(),'naft-p1-dual-'));
const requestPath=join(dir,'input.json'),receiptPath=join(dir,'receipt.json');
const cellExamples=[
 ['TIER_1_SIMPLIFIED',{E9:'1.463525166857',E10:'1',E14:'102',E15:'28',E30:'0.15'},'3.552853695062'],
 ['TIER_2_COUNTRY_SPECIFIC',{E8:'18.5891328',E22:'11.38820304',E60:'0.1'},'6.480836784000'],
 ['TIER_3_DIRECT',{E8:'14',E17:'4.52418',E49:'0.1'},'8.528238000000']
];
const make=(lane,values)=>({
 schema:'naft-ieee-gs-worksheet-replay-request-v1',
 route:{schema:'naft-rice-method-route-request-v1',program,requested_lane:lane,
   project_scale:lane==='TIER_1_SIMPLIFIED'?'SMALL':'LARGE',
   measurement_kind:lane==='TIER_3_DIRECT'?'DIRECT_CHAMBER':'REFERENCE_ONLY',
   practices:[],evidence:Object.fromEntries(
     registry.programs[program].lanes[lane].evidence_required.map(k=>[k,true]))},
 operands:values
});
const write=x=>writeFileSync(requestPath,JSON.stringify(x));
let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++;}
function denied(f,fragment){assert.throws(f,new RegExp(fragment));checks++;}
const cli=(...args)=>spawnSync(process.execPath,['scripts/p1-gs-independent-replay.mjs',...args],{
 encoding:'utf8',timeout:30000,maxBuffer:300000
});
try{
 for(const [lane,values,expected] of cellExamples){
  write(make(lane,values));
  const r=runIndependentTrainingReplay(requestPath);
  eq(r.status,'JS_BIGINT_PYTHON_DECIMAL_AGREE_ON_TRAINING_FORMULA');
  eq(r.calculations.javascript_bigint,expected);
  eq(r.calculations.independent_python_decimal,expected);
  eq(r.independent_python_executed_for_this_request,true);
  eq(r.methodology_program,program);
  eq(r.cross_standard_tier_equivalence,false);
  eq(r.gs_vvb_q23_conflict_unresolved,true);
  eq(r.scientifically_approved_field_observations,false);
  eq(r.certified_tco2e,null);
  eq(r.annual_real_world_ch4,null);
  eq(r.formal_validation,false);
  eq(r.original_workbook_publisher_verified,false);
  eq(verifyIndependentTrainingReceipt(requestPath,r).status,'TWO_ENGINES_REEXECUTED_MATCH');
  const fake={...r,certified_tco2e:'12345'};
  denied(()=>verifyIndependentTrainingReceipt(requestPath,fake),'RECEIPT_REPLAY_MISMATCH');
  const c=cli('generate',requestPath);eq(c.status,0);
  eq(JSON.parse(c.stdout),r);
  writeFileSync(receiptPath,c.stdout);
  const v=cli('verify',requestPath,receiptPath);eq(v.status,0);
  eq(JSON.parse(v.stdout).status,'TWO_ENGINES_REEXECUTED_MATCH');
  const forged={...r,independent_python_executed_for_this_request:false};
  writeFileSync(receiptPath,JSON.stringify(forged));
  const blocked=cli('verify',requestPath,receiptPath);
  eq(blocked.status!==0,true);
  eq(blocked.stderr.includes('RECEIPT_REPLAY_MISMATCH'),true);
 }
 const [lane,values]=cellExamples[1];
 let bad=make(lane,values);
 bad.operands.E60='1.01';write(bad);
 denied(()=>runIndependentTrainingReplay(requestPath),'UNCERTAINTY_RATE_OUT_OF_RANGE');
 bad=make(lane,values);bad.route.evidence={};write(bad);
 denied(()=>runIndependentTrainingReplay(requestPath),'NUMERIC_REPLAY_NOT_PERMITTED');
 bad=make(lane,values);bad.route.program='VERRA_VM0051_V1_1_2026';write(bad);
 denied(()=>runIndependentTrainingReplay(requestPath),'GS_EXERCISE_ONLY_NOT_VERRA_OR_JCREDIT');
 bad=make(lane,values);bad.route.program='AG-005';write(bad);
 denied(()=>runIndependentTrainingReplay(requestPath),'GS_EXERCISE_ONLY_NOT_VERRA_OR_JCREDIT');
 bad=make('TIER_3_DIRECT',cellExamples[2][1]);
 bad.route.measurement_kind='EDDY_COVARIANCE_FCH4';write(bad);
 denied(()=>runIndependentTrainingReplay(requestPath),'NUMERIC_REPLAY_NOT_PERMITTED');
 bad=make(lane,values);bad.operands.E8='NaN';write(bad);
 denied(()=>runIndependentTrainingReplay(requestPath),'DECIMAL_LITERAL_INVALID');
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('NAFT_P1_TWO_ENGINE_PASS: '+checks+' checks; Python executed for each allowed worksheet lane, no credits');
