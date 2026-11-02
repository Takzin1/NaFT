#!/usr/bin/env node
/**
 * P1: real two-engine source-bound Gold Standard TRAINING worksheet replay.
 * One invocation independently runs the Node BigInt and Python Decimal engines.
 * It does not verify workbook publisher identity, field science or carbon credits.
 * No wallet, network, formula evaluation, or arbitrary child process arguments.
 */
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {replayWorksheetExercise,digestObject} from './ieee-gs-worksheet-replay.mjs';
import {auditRiceStandardsSources} from './lib/rice-standards-source-gate.mjs';

const ORACLE=fileURLToPath(new URL('./ieee-gs-worksheet-independent-oracle.py',import.meta.url));
const PRIMARY=fileURLToPath(new URL('./ieee-gs-worksheet-replay.mjs',import.meta.url));
const DRIVER=fileURLToPath(import.meta.url);
const REFERENCE=fileURLToPath(new URL('../research/rice-mrv-2026-10-19/standards-and-training-source-manifest.json',import.meta.url));
const HASH=bytes=>createHash('sha256').update(bytes).digest('hex');
function guard(ok,code){if(!ok)throw Error('P1_GS_DUAL_REPLAY_BLOCKED:'+code);}
function canonical(x){
 if(x===null||typeof x!=='object')return JSON.stringify(x);
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
}
function localBytes(path,max){
 const info=statSync(path);
 guard(info.isFile()&&info.size>=2&&info.size<=max,'SOURCE_FILE_SIZE');
 const bytes=readFileSync(path);
 guard(bytes.length>=2&&bytes.length<=max,'SOURCE_BYTES_CHANGED');
 return bytes;
}
export function runIndependentTrainingReplay(requestPath){
 guard(typeof requestPath==='string'&&requestPath.length>0,'REQUEST_PATH_REQUIRED');
 const input=resolve(requestPath);
 const source=localBytes(input,100_000);
 const oracleCode=localBytes(ORACLE,100_000);
 const jsCode=localBytes(PRIMARY,200_000);
 const driverCode=localBytes(DRIVER,100_000);
 const evidence=localBytes(REFERENCE,100_000);
 const manifest=JSON.parse(evidence.toString('utf8'));
 const sourceAudit=auditRiceStandardsSources(manifest);
 guard(sourceAudit.cross_document_tier_number_conflict===true
  &&sourceAudit.official_credit_tco2e===null,'SOURCE_AUDIT_UNSAFE');
 const request=JSON.parse(source.toString('utf8'));
 const js=replayWorksheetExercise(request);
 // A blocked reference route is not a valid independent numeric comparison.
 guard(js.status==='TRAINING_WORKSHEET_ARITHMETIC_ONLY'&&js.exact_value!==null
  &&js.certified_tco2e===null&&js.gs_vvb_q23_conflict_unresolved===true,
  'NUMERIC_REPLAY_NOT_PERMITTED');
 const call=spawnSync('python3',[ORACLE,input],{
   encoding:'utf8',timeout:15000,maxBuffer:120_000,windowsHide:true
 });
 guard(!call.error&&call.status===0,'PYTHON_ORACLE_EXECUTION_FAILED');
 let py;
 try{py=JSON.parse(call.stdout)}catch{throw Error('P1_GS_DUAL_REPLAY_BLOCKED:PYTHON_RESULT_INVALID')}
 guard(py!==null&&!Array.isArray(py)&&typeof py==='object','PYTHON_RESULT_OBJECT');
 guard(py.status==='INDEPENDENT_REPRODUCTION_OF_TRAINING_ARITHMETIC_ONLY'
  &&py.certified_tco2e===null,'PYTHON_SCOPE_INCONSISTENT');
 guard(py.lane===js.lane&&py.worksheet===js.source_formula.sheet
  &&py.cell===js.source_formula.cell&&py.formula===js.source_formula.formula
  &&py.decimal_12_places===js.exact_value.decimal_12_places,
  'INDEPENDENT_ARITHMETIC_DIVERGENCE');
 // Fail closed if any input, engine or source manifest was replaced mid-run.
 for(const [path,b] of [[input,source],[ORACLE,oracleCode],[PRIMARY,jsCode],
   [DRIVER,driverCode],[REFERENCE,evidence]]){
  guard(HASH(localBytes(path,path===input?100_000:200_000))===HASH(b),
   'REPLAY_SOURCE_CHANGED_DURING_EXECUTION');
 }
 const unsigned={
  schema:'naft-p1-gs-two-engine-training-receipt-v1',
  status:'JS_BIGINT_PYTHON_DECIMAL_AGREE_ON_TRAINING_FORMULA',
  methodology_program:'GS_AWD_TRAINING_2024',
  lane:js.lane,
  scope:'EDUCATIONAL_SOURCE_WORKSHEET_ARITHMETIC_ONLY',
  source_manifest_sha256:HASH(evidence),
  original_workbook_sha256:js.original_workbook_sha256,
  original_workbook_publisher_verified:false,
  formula:js.source_formula,
  request_bytes_sha256:HASH(source),
  original_js_receipt_sha256:js.receipt_sha256,
  calculations:{
   javascript_bigint:js.exact_value.decimal_12_places,
   independent_python_decimal:py.decimal_12_places,
   exact_numerator:js.exact_value.numerator,
   exact_denominator:js.exact_value.denominator
  },
  source_programs_sha256:{
   node:HASH(jsCode),python:HASH(oracleCode),driver:HASH(driverCode)
  },
  independent_python_executed_for_this_request:true,
  gs_vvb_q23_conflict_unresolved:true,
  cross_standard_tier_equivalence:false,
  scientifically_approved_field_observations:false,
  method_adoption_currently_verified:false,
  formal_validation:false,
  annual_real_world_ch4:null,
  certified_tco2e:null,
  blockchain_transaction_performed:false
 };
 return {...unsigned,content_sha256:digestObject(unsigned)};
}
export function verifyIndependentTrainingReceipt(requestPath,report){
 guard(report!==null&&typeof report==='object'&&!Array.isArray(report),
  'RECEIPT_OBJECT_REQUIRED');
 const fresh=runIndependentTrainingReplay(requestPath);
 guard(canonical(report)===canonical(fresh),'RECEIPT_REPLAY_MISMATCH');
 return {status:'TWO_ENGINES_REEXECUTED_MATCH',
  content_sha256:fresh.content_sha256,certified_tco2e:null};
}
function main(args){
 guard(args.length===2||args.length===3,'USAGE_generate_REQUEST_or_verify_REQUEST_RECEIPT');
 if(args[0]==='generate'&&args.length===2){
  console.log(JSON.stringify(runIndependentTrainingReplay(args[1]),null,2));return;
 }
 if(args[0]==='verify'&&args.length===3){
  const b=localBytes(resolve(args[2]),150_000);
  console.log(JSON.stringify(verifyIndependentTrainingReceipt(args[1],JSON.parse(b.toString('utf8'))),null,2));return;
 }
 throw Error('P1_GS_DUAL_REPLAY_BLOCKED:USAGE');
}
if(process.argv[1]&&resolve(process.argv[1])===DRIVER){
 try{main(process.argv.slice(2))}
 catch(error){console.error(error.message);process.exitCode=1}
}
